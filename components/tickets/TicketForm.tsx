import React, { useEffect, useMemo, useState } from 'react'
import { YStack, XStack, Text, Select, Card, Spinner } from 'tamagui'
import { Button } from '@/components/ui'
import JugadaRow, { JugadaForm, JugadaErrors } from './JugadaRow'
import { JugadaType, Sorteo, RestrictionRule, CreateTicketRequest, Usuario } from '@/types/models.types'
import { formatCurrency } from '@/utils/formatters'
import { getSalesCutoffMinutes, canCreateTicket } from '@/utils/cutoff'
import { validateReventadoReferences } from '@/utils/validation'
import { Check, ChevronDown, AlertCircle, Plus } from '@tamagui/lucide-icons'
// vendors are loaded with manual pagination to avoid infiniteQuery edge-cases
import { apiClient } from '@/lib/api.client'
import { usersService } from '@/services/users.service'

type Props = {
  sorteos: Sorteo[]
  restrictions: RestrictionRule[]
  user: Pick<Usuario, 'id' | 'ventanaId' | 'bancaId'> | null | undefined
  restrictionsLoading?: boolean
  loading?: boolean
  onSubmit: (payload: Omit<CreateTicketRequest, 'ventanaId'>) => void
  onCancel: () => void
  vendorMode?: 'none' | 'ventana' | 'admin'
}

const sanitizeNumber = (val: string) => val.replace(/\D/g, '').slice(0, 2)

export default function TicketForm({ sorteos, restrictions, user, restrictionsLoading, loading, onSubmit, onCancel, vendorMode = 'none' }: Props) {
  const [sorteoId, setSorteoId] = useState('')
  const [jugadas, setJugadas] = useState<JugadaForm[]>([{ type: JugadaType.NUMERO, number: '', amount: '' }])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [cutoffError, setCutoffError] = useState('')
  const [vendedorId, setVendedorId] = useState<string>('')

  const v = (s?: string) => s ?? ''

  const availableSorteos = useMemo(() => {
    // Filtra SOLO los sorteos OPEN que no han llegado al umbral de cutoff
    const now = new Date()
    const cutoffMinutes = getSalesCutoffMinutes(
      restrictions,
      user?.id || '',
      user?.ventanaId || '',
      user?.bancaId || ''
    )
    const ms = cutoffMinutes * 60_000
    return (sorteos || [])
      .filter((s) => {
        const dt = new Date(s.scheduledAt as any)
        if (!dt || isNaN(dt.getTime())) return false
        const salesLimit = new Date(dt.getTime() - ms)
        return now < salesLimit
      })
      .sort((a, b) => new Date(a.scheduledAt as any).getTime() - new Date(b.scheduledAt as any).getTime())
  }, [sorteos, restrictions, user])

  useEffect(() => {
    if (!sorteoId) return
    const stillThere = availableSorteos.some((s) => s.id === sorteoId)
    if (!stillThere) {
      setSorteoId('')
      setCutoffError('')
    }
  }, [availableSorteos, sorteoId])

  useEffect(() => {
    if (!sorteoId) return
    const selected = sorteos.find((s) => s.id === sorteoId)
    if (!selected || !user) return
    const cutoffMinutes = getSalesCutoffMinutes(
      restrictions,
      user.id,
      user.ventanaId || '',
      user.bancaId || ''
    )
    const dt = new Date(selected.scheduledAt as any)
    const dateStr = dt.toISOString().slice(0, 10)
    const hourStr = dt.toTimeString().slice(0, 5)
    const validation = canCreateTicket(dateStr, hourStr, cutoffMinutes)
    setCutoffError(validation.canCreate ? '' : (validation.message || 'No se puede crear el tiquete'))
  }, [sorteoId, sorteos, restrictions, user])

  const addJugada = () => setJugadas((s) => [...s, { type: JugadaType.NUMERO, number: '', amount: '' }])
  const removeJugada = (index: number) => setJugadas((s) => s.filter((_, i) => i !== index))
  const updateJugada = (index: number, field: keyof JugadaForm, value: string) => {
    setJugadas((s) => {
      const next = [...s]
      let vv = value
      if (field === 'number' || field === 'reventadoNumber') vv = sanitizeNumber(value)
      next[index] = { ...next[index], [field]: vv }
      return next
    })
  }
  const changeType = (index: number, nextType: JugadaType) => {
    setJugadas((prev) => {
      const next = [...prev]
      const j = { ...next[index] }
      j.type = nextType
      if (nextType === JugadaType.NUMERO) {
        j.number = sanitizeNumber(v(j.number))
        j.reventadoNumber = ''
      } else {
        const ref = sanitizeNumber(v(j.reventadoNumber) || v(j.number))
        j.reventadoNumber = ref
        j.number = ref
      }
      next[index] = j
      return next
    })
  }

  const totalAmount = jugadas.reduce((sum, j) => sum + (parseFloat(v(j.amount)) || 0), 0)
  const cutoffMsg = (errors['cutoff'] || cutoffError) || null

  // Vendor selection (optional)
  const VENDORS_PAGE_SIZE = 50
  const [vendorsPage, setVendorsPage] = useState(1)
  const [vendedoresRaw, setVendedoresRaw] = useState<any[]>([])
  const [loadingVendedores, setLoadingVendedores] = useState(false)
  const [vendorsFetchingMore, setVendorsFetchingMore] = useState(false)
  const [vendorsHasNext, setVendorsHasNext] = useState(true)

  async function fetchVendorsPage(page: number) {
    if (vendorMode === 'none') return
    const params = { page, pageSize: VENDORS_PAGE_SIZE, role: 'VENDEDOR' as const }
    const batch = await usersService.list(params)
    const arr = Array.isArray(batch) ? batch : []
    setVendedoresRaw((prev) => (page === 1 ? arr : [...prev, ...arr]))
    setVendorsHasNext(arr.length >= VENDORS_PAGE_SIZE)
  }

  // Inicial y cuando cambie el modo/ventana, recargar desde página 1
  useEffect(() => {
    if (vendorMode === 'none') return
    setLoadingVendedores(true)
    setVendorsPage(1)
    fetchVendorsPage(1)
      .catch((e) => { console.error('Error loading vendedores:', e); setVendedoresRaw([]); setVendorsHasNext(false) })
      .finally(() => setLoadingVendedores(false))
  }, [vendorMode, user?.ventanaId])

  const vendorsFetchNext = async () => {
    if (!vendorsHasNext || vendorMode === 'none') return
    setVendorsFetchingMore(true)
    const next = vendorsPage + 1
    try {
      await fetchVendorsPage(next)
      setVendorsPage(next)
    } catch (e) {
      console.error('Error loading more vendedores:', e)
    } finally {
      setVendorsFetchingMore(false)
    }
  }
  const vendedores: Array<{ id: string; name?: string; code?: string; ventanaId?: string | null; isActive?: boolean }> = useMemo(() => {
    let list = (vendedoresRaw || []).filter((u: any) => u?.isActive === true)
    if (vendorMode === 'ventana') {
      const myVentanaKey = (user as any)?.ventanaId || (user as any)?.id // fallback por si el usuario-ventana no trae ventanaId
      if (myVentanaKey) {
        list = list.filter((u: any) => (u?.ventanaId ?? u?.ventana?.id) === myVentanaKey)
      }
    }
    return list.map((u: any) => ({ id: u.id, name: u.name, code: u.code, ventanaId: u.ventanaId, isActive: u.isActive }))
  }, [vendedoresRaw, vendorMode, user])

  const submit = () => {
    setErrors({})
    const newErrors: Record<string, string> = {}

    if (!sorteoId) newErrors['sorteoId'] = 'Selecciona un sorteo'

    jugadas.forEach((jugada, index) => {
      if (jugada.type === JugadaType.NUMERO && !v(jugada.number)) newErrors[`jugadas.${index}.number`] = 'Ingresa un número'
      if (jugada.type === JugadaType.NUMERO && v(jugada.number) && !/^\d{2}$/.test(v(jugada.number))) newErrors[`jugadas.${index}.number`] = 'Debe ser de 2 dígitos (00-99)'
      if (jugada.type === JugadaType.REVENTADO && !v(jugada.reventadoNumber)) newErrors[`jugadas.${index}.reventadoNumber`] = 'Referencia un número'
      if (!v(jugada.amount) || parseFloat(v(jugada.amount)) <= 0) newErrors[`jugadas.${index}.amount`] = 'Monto inválido'
    })

    // Duplicados NUMERO
    const seen = new Set<string>()
    jugadas.forEach((j, i) => {
      if (j.type === JugadaType.NUMERO) {
        const key = sanitizeNumber(v(j.number))
        if (key && seen.has(key)) newErrors[`jugadas.${i}.number`] = 'Número duplicado'
        if (key) seen.add(key)
      }
    })

    const mappedJugadas = jugadas.map((j) => ({
      type: j.type,
      number: sanitizeNumber(v(j.number)),
      reventadoNumber: sanitizeNumber(v(j.reventadoNumber)),
      amount: parseFloat(v(j.amount)) || 0,
    }))
    const reventadoValidation = validateReventadoReferences(mappedJugadas as any)
    if (!reventadoValidation.valid) {
      reventadoValidation.errors.forEach((msg, i) => { newErrors[`reventado_${i}`] = msg })
    }

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    if (cutoffError) { setErrors({ cutoff: cutoffError }); return }

    const selected = sorteos.find((s) => s.id === sorteoId)
    if (!selected) return

    const payload: Omit<CreateTicketRequest, 'ventanaId'> = {
      loteriaId: selected.loteriaId,
      sorteoId,
      jugadas: jugadas.map((j) => {
        if (j.type === JugadaType.NUMERO) {
          return { type: JugadaType.NUMERO, number: sanitizeNumber(v(j.number)), amount: parseFloat(v(j.amount)) }
        }
        const ref = sanitizeNumber(v(j.reventadoNumber))
        return { type: JugadaType.REVENTADO, number: ref, reventadoNumber: ref, amount: parseFloat(v(j.amount)) }
      }),
    }
    // Optional vendor impersonation: ADMIN o VENTANA (el backend lo validará)
    if (vendorMode !== 'none' && vendedorId) {
      ;(payload as any).vendedorId = vendedorId
    }
    onSubmit(payload)
  }

  return (
    <YStack gap="$4" width="100%" maxWidth={1200} alignSelf="center">
      <Text fontSize="$8" fontWeight="bold" color="$color">Crear Nuevo Tiquete</Text>

      {cutoffMsg ? (
        <Card padding="$3" backgroundColor="$red2" borderWidth={1} borderColor="$red8">
          <XStack gap="$2" alignItems="center">
            <AlertCircle size={20} color="$red10" />
            <Text color="$red10" fontSize="$3" flex={1}>{cutoffMsg}</Text>
          </XStack>
        </Card>
      ) : null}

      {/* Sorteo */}
      <Card padding="$4" bg="$background" borderColor="$borderColor" borderWidth={1}>
        <YStack gap="$3">
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="500">Sorteo *</Text>
            {restrictionsLoading ? (
              <Spinner />
            ) : availableSorteos.length === 0 ? (
              <Text color="$textSecondary" fontSize="$3">No hay sorteos disponibles para vender</Text>
            ) : (
              <Select value={sorteoId} onValueChange={setSorteoId}>
                <Select.Trigger width="100%" iconAfter={ChevronDown} br="$4" bw={1} bc="$borderColor" bg="$background">
                  <Select.Value placeholder="Seleccionar sorteo" />
                </Select.Trigger>
                <Select.Content zIndex={200000}>
                  <Select.Viewport>
                    <Select.Group>
                      {availableSorteos.map((s, index) => (
                        <Select.Item key={s.id} index={index} value={s.id}>
                          <Select.ItemText>{s?.loteria?.name || 'Lotería'} - {new Date(s.scheduledAt as any).toLocaleString()}</Select.ItemText>
                          <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Group>
                  </Select.Viewport>
                </Select.Content>
              </Select>
            )}
            {errors['sorteoId'] && (<Text color="$error" fontSize="$2">{errors['sorteoId']}</Text>)}
          </YStack>
        </YStack>
      </Card>

      {/* Jugadas */}
      <Card padding="$4" bg="$background" borderColor="$borderColor" borderWidth={1}>
        <YStack gap="$3">
          {vendorMode !== 'none' && (
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">Vendedor *</Text>
              {loadingVendedores ? (
                <Spinner />
              ) : vendedores.length === 0 ? (
                <Text color="$textSecondary" fontSize="$3">No hay vendedores disponibles</Text>
              ) : (
                <Select value={vendedorId} onValueChange={setVendedorId}>
                  <Select.Trigger width="100%" iconAfter={ChevronDown} br="$4" bw={1} bc="$borderColor" bg="$background">
                    <Select.Value placeholder="Seleccionar vendedor" />
                  </Select.Trigger>
                  <Select.Content zIndex={200000}>
                    <Select.Viewport>
                      <Select.Group>
                        {vendedores.map((u, idx) => (
                          <Select.Item key={u.id} index={idx} value={u.id}>
                            <Select.ItemText>{u.name}{u.code ? ` — ${u.code}` : ''}</Select.ItemText>
                            <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Group>
                    </Select.Viewport>
                    {vendorsHasNext && (
                      <YStack ai="center" p="$2">
                        <Button size="$2" onPress={vendorsFetchNext} disabled={vendorsFetchingMore}>
                          {vendorsFetchingMore ? 'Cargando…' : 'Cargar más'}
                        </Button>
                      </YStack>
                    )}
                  </Select.Content>
                </Select>
              )}
              {vendorMode !== 'none' && !vendedorId && (<Text color="$error" fontSize="$2">Selecciona un vendedor</Text>)}
            </YStack>
          )}
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="600">Jugadas</Text>
            <Button size="$3" icon={Plus} onPress={addJugada} bg="$primary" hoverStyle={{ scale: 1.02 }} pressStyle={{ bg: '$primaryPress', scale: 0.98 }}>
              <Text>Agregar</Text>
            </Button>
          </XStack>

          {jugadas.map((j, index) => (
            <JugadaRow
              key={index}
              index={index}
              value={j}
              errors={{
                number: errors[`jugadas.${index}.number`],
                reventadoNumber: errors[`jugadas.${index}.reventadoNumber`],
                amount: errors[`jugadas.${index}.amount`],
              } as JugadaErrors}
              onChange={updateJugada}
              onChangeType={changeType}
              onRemove={removeJugada}
            />
          ))}

          {/* Errores de referencias REVENTADO */}
          {Object.keys(errors)
            .filter((key) => key.startsWith('reventado_'))
            .map((key) => (
              <Card key={key} padding="$3" backgroundColor="$red2" borderWidth={1} borderColor="$red8">
                <Text color="$red10" fontSize="$2">{errors[key]}</Text>
              </Card>
            ))}
        </YStack>
      </Card>

      {/* Total y acciones */}
      <Card padding="$4" backgroundColor="$blue2" borderColor="$blue8" borderWidth={1}>
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$5" fontWeight="600">Total:</Text>
          <Text fontSize="$7" fontWeight="bold" color="$info">{formatCurrency(totalAmount)}</Text>
        </XStack>
      </Card>

      <XStack gap="$3">
        <Button flex={1} backgroundColor="$red4" borderColor="$red8" borderWidth={1} onPress={onCancel}>
          <Text>Cancelar</Text>
        </Button>
        <Button flex={1} backgroundColor="$blue4" borderColor="$blue8" borderWidth={1} onPress={submit} disabled={!!cutoffError || loading || restrictionsLoading || (vendorMode !== 'none' && !vendedorId)}>
          <Text>{loading ? 'Creando...' : 'Crear Tiquete'}</Text>
        </Button>
      </XStack>
    </YStack>
  )
}
