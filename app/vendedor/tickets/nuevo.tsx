// app/vendedor/tickets/nuevo.tsx
import React, { useState, useEffect, useMemo } from 'react'
import { YStack, XStack, Text, Select, ScrollView, Spinner } from 'tamagui'
import { Button, Input, Card } from '@/components/ui'
import { useRouter } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Plus, Trash2, AlertCircle, Check, ChevronDown } from '@tamagui/lucide-icons'
import { apiClient, ApiErrorClass } from '../../../lib/api.client'
import { useAuthStore } from '../../../store/auth.store'
import {
  JugadaType,
  Sorteo,
  SorteoStatus,
  CreateTicketRequest,
  RestrictionRule,
} from '../../../types/models.types'
import { getSalesCutoffMinutes, canCreateTicket } from '../../../utils/cutoff'
import { formatCurrency } from '../../../utils/formatters'
import { validateReventadoReferences } from '../../../utils/validation'
import { useToast } from '../../../hooks/useToast'

type ListResp<T> = T[] | { data: T[]; meta?: any }
function toArray<T>(payload: ListResp<T> | undefined | null): T[] {
  if (!payload) return []
  return Array.isArray(payload) ? payload : Array.isArray((payload as any).data) ? (payload as any).data : []
}

function formatScheduledAtISO(d: any) {
  const dt = new Date(d as any)
  if (isNaN(dt.getTime())) {
    return { dt, label: 'Fecha inválida', dateStr: '', hourStr: '' }
  }
  const label = dt.toLocaleString()
  const dateStr = dt.toISOString().slice(0, 10)
  const hourStr = dt.toTimeString().slice(0, 5)
  return { dt, label, dateStr, hourStr }
}

interface JugadaForm {
  type: JugadaType
  number?: string
  reventadoNumber?: string
  amount: string
}

export default function NuevoTicketScreen() {
  const router = useRouter()
  const { success, error } = useToast()
  const { user } = useAuthStore()

  const safeBack = () => {
    try {
      // @ts-ignore
      if (router.canGoBack?.()) router.back()
      else router.replace('/vendedor')
    } catch {
      router.replace('/vendedor')
    }
  }

  const [sorteoId, setSorteoId] = useState('')
  const [jugadas, setJugadas] = useState<JugadaForm[]>([
    { type: JugadaType.NUMERO, number: '', amount: '' },
  ])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [cutoffError, setCutoffError] = useState<string>('')

  const v = (s?: string) => s ?? ''

  // Sorteos abiertos
  const { data: sorteosResp, isLoading: loadingSorteos } = useQuery<ListResp<Sorteo>>({
    queryKey: ['sorteos', 'open'],
    queryFn: () => apiClient.get<ListResp<Sorteo>>('/sorteos', { status: SorteoStatus.OPEN }),
    staleTime: 60_000,
    placeholderData: { data: [] },
  })
  const sorteos = useMemo(() => toArray<Sorteo>(sorteosResp), [sorteosResp])

  // Restricciones
  const { data: restrictionsResp, isLoading: loadingRestrictions } = useQuery<ListResp<RestrictionRule>>({
    queryKey: ['restrictions'],
    queryFn: async () => {
      try {
        return await apiClient.get<ListResp<RestrictionRule>>('/restrictions')
      } catch {
        return { data: [] }
      }
    },
    staleTime: 60_000,
    placeholderData: { data: [] },
  })
  const restrictions = useMemo(() => toArray<RestrictionRule>(restrictionsResp), [restrictionsResp])

  // Sorteos disponibles (cutoff)
  const availableSorteos = useMemo(() => {
    const now = new Date()
    const cutoffMinutes = getSalesCutoffMinutes(
      restrictions,
      user?.id || '',
      user?.ventanaId || '',
      user?.bancaId || ''
    )
    const ms = cutoffMinutes * 60_000

    return sorteos
      .filter((s) => {
        const { dt } = formatScheduledAtISO(s.scheduledAt)
        if (!dt || isNaN(dt.getTime())) return false
        const salesLimit = new Date(dt.getTime() - ms)
        return now < salesLimit
      })
      .sort((a, b) => new Date(a.scheduledAt as any).getTime() - new Date(b.scheduledAt as any).getTime())
  }, [sorteos, restrictions, user])

  // deseleccionar si ya no está disponible
  useEffect(() => {
    if (!sorteoId) return
    const stillThere = availableSorteos.some((s) => s.id === sorteoId)
    if (!stillThere) {
      setSorteoId('')
      setCutoffError('')
    }
  }, [availableSorteos, sorteoId])

  // validar cutoff al cambiar sorteo
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

    const { dateStr, hourStr } = formatScheduledAtISO(selected.scheduledAt)
    const validation = canCreateTicket(dateStr, hourStr, cutoffMinutes)
    setCutoffError(validation.canCreate ? '' : (validation.message || 'No se puede crear el tiquete'))
  }, [sorteoId, sorteos, restrictions, user])

  // Crear ticket (backend infiere ventanaId por userId)
  const createTicketMutation = useMutation({
    mutationFn: (data: Omit<CreateTicketRequest, 'ventanaId'>) => apiClient.post('/tickets', data),
    onSuccess: (res: any) => {
      // limpiar formulario
      setSorteoId('')
      setJugadas([{ type: JugadaType.NUMERO, number: '', amount: '' }])
      setErrors({})
      setCutoffError('')

      // ✅ usar helpers tipados
      const num = res?.data?.ticketNumber
      success(`Tiquete ${num ? `#${num} ` : ''}creado correctamente`)

      // navegar seguro
      safeBack()
    },
    onError: (err: ApiErrorClass) => {
      const fieldErrors: Record<string, string> = {}
      if (err?.details) {
        err.details.forEach((detail) => {
          if (detail.field) fieldErrors[detail.field] = detail.message
        })
      }
      setErrors(fieldErrors)

      // ✅ usar helpers tipados
      error(err?.message ?? 'No se pudo crear el tiquete')
    },
  })

  // Handlers
  const addJugada = () => {
    setJugadas((s) => [...s, { type: JugadaType.NUMERO, number: '', amount: '' }])
  }

  const removeJugada = (index: number) => {
    setJugadas((s) => s.filter((_, i) => i !== index))
  }

  const updateJugada = (index: number, field: keyof JugadaForm, value: string) => {
    setJugadas((s) => {
      const next = [...s]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const changeType = (index: number, nextType: JugadaType) => {
    setJugadas((prev) => {
      const next = [...prev]
      const j = { ...next[index] }
      j.type = nextType
      if (nextType === JugadaType.NUMERO) {
        j.number = v(j.number)
        j.reventadoNumber = ''
      } else {
        const ref = v(j.reventadoNumber) || v(j.number)
        j.reventadoNumber = ref
        j.number = ref
      }
      next[index] = j
      return next
    })
  }

  const validateAndSubmit = () => {
    setErrors({})
    const newErrors: Record<string, string> = {}

    if (!sorteoId) newErrors.sorteoId = 'Selecciona un sorteo'

    jugadas.forEach((jugada, index) => {
      if (jugada.type === JugadaType.NUMERO && !v(jugada.number)) {
        newErrors[`jugadas.${index}.number`] = 'Ingresa un número'
      }
      if (jugada.type === JugadaType.NUMERO && v(jugada.number) && !/^\d{2}$/.test(v(jugada.number))) {
        newErrors[`jugadas.${index}.number`] = 'Debe ser un número de 2 dígitos (00-99)'
      }
      if (jugada.type === JugadaType.REVENTADO && !v(jugada.reventadoNumber)) {
        newErrors[`jugadas.${index}.reventadoNumber`] = 'Referencia un número'
      }
      if (!v(jugada.amount) || parseFloat(v(jugada.amount)) <= 0) {
        newErrors[`jugadas.${index}.amount`] = 'Monto inválido'
      }
    })

    const mappedJugadas = jugadas.map((j) => ({
      type: j.type,
      number: v(j.number),
      reventadoNumber: v(j.reventadoNumber),
      amount: parseFloat(v(j.amount)) || 0,
    }))
    const reventadoValidation = validateReventadoReferences(mappedJugadas)
    if (!reventadoValidation.valid) {
      reventadoValidation.errors.forEach((msg, i) => {
        newErrors[`reventado_${i}`] = msg
      })
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (cutoffError) {
      setErrors({ cutoff: cutoffError })
      return
    }

    const selected = sorteos.find((s) => s.id === sorteoId)
    if (!selected) return

    const payload: Omit<CreateTicketRequest, 'ventanaId'> = {
      loteriaId: selected.loteriaId,
      sorteoId,
      jugadas: jugadas.map((j) => {
        if (j.type === JugadaType.NUMERO) {
          return {
            type: JugadaType.NUMERO,
            number: v(j.number),
            amount: parseFloat(v(j.amount)),
          }
        }
        const ref = v(j.reventadoNumber)
        return {
          type: JugadaType.REVENTADO,
          number: ref,
          reventadoNumber: ref,
          amount: parseFloat(v(j.amount)),
        }
      }),
    }

    createTicketMutation.mutate(payload)
  }

  const totalAmount = jugadas.reduce((sum, j) => sum + (parseFloat(v(j.amount)) || 0), 0)
  const cutoffMsg = (errors.cutoff || cutoffError) || null

  return (
    <ScrollView flex={1} backgroundColor={'$background'}>
      <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Crear Nuevo Tiquete
        </Text>

        {cutoffMsg ? (
          <Card padding="$3" backgroundColor="$red2" borderWidth={1} borderColor="$red8">
            <XStack gap="$2" alignItems="center">
              <AlertCircle size={20} color="$red10" />
              <Text color="$red10" fontSize="$3" flex={1}>
                {cutoffMsg}
              </Text>
            </XStack>
          </Card>
        ) : null}

        {/* Sorteo */}
        <Card padding="$4" bg="$background" borderColor="$borderColor" borderWidth={1}>
          <YStack gap="$3">
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Sorteo *
              </Text>

              {loadingSorteos ? (
                <Spinner />
              ) : availableSorteos.length === 0 ? (
                <Text color="$textSecondary" fontSize="$3">
                  No hay sorteos disponibles para vender
                </Text>
              ) : (
                <Select value={sorteoId} onValueChange={setSorteoId}>
                  <Select.Trigger
                    width="100%"
                    iconAfter={ChevronDown}
                    br="$4"
                    bw={1}
                    bc="$borderColor"
                    bg="$background"
                  >
                    <Select.Value placeholder="Seleccionar sorteo" />
                  </Select.Trigger>

                  <Select.Adapt when="sm" platform="touch">
                    <Select.Sheet modal dismissOnSnapToBottom>
                      <Select.Sheet.Frame>
                        <Select.Sheet.ScrollView>
                          <Select.Adapt.Contents />
                        </Select.Sheet.ScrollView>
                      </Select.Sheet.Frame>
                      <Select.Sheet.Overlay />
                    </Select.Sheet>
                  </Select.Adapt>

                  <Select.Content zIndex={200000}>
                    <Select.Viewport>
                      <Select.Group>
                        {availableSorteos.map((s, index) => {
                          const { label } = formatScheduledAtISO(s.scheduledAt)
                          return (
                            <Select.Item key={s.id} index={index} value={s.id}>
                              <Select.ItemText>
                                {s?.loteria?.name || 'Lotería'} — {label}
                              </Select.ItemText>
                              <Select.ItemIndicator ml="auto">
                                <Check size={16} />
                              </Select.ItemIndicator>
                            </Select.Item>
                          )
                        })}
                      </Select.Group>
                    </Select.Viewport>
                  </Select.Content>
                </Select>
              )}

              {errors.sorteoId && (
                <Text color="$error" fontSize="$2">
                  {errors.sorteoId}
                </Text>
              )}
            </YStack>
          </YStack>
        </Card>

        {/* Jugadas */}
        <Card padding="$4" bg="$background" borderColor="$borderColor" borderWidth={1}>
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="600">
                Jugadas
              </Text>
              <Button
                size="$3"
                icon={Plus}
                onPress={addJugada}
                bg="$primary"
                hoverStyle={{ scale: 1.02 }}
                pressStyle={{ bg: '$primaryPress', scale: 0.98 }}
              >
                <Text>Agregar</Text>
              </Button>
            </XStack>

            {jugadas.map((jugada, index) => (
              <Card
                key={index}
                padding="$3"
                backgroundColor="$backgroundHover"
                borderColor="$borderColor"
                borderWidth={1}
              >
                <YStack gap="$2">
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="$3" fontWeight="600">
                      Jugada {index + 1}
                    </Text>
                    {jugadas.length > 1 && (
                      <Button
                        size="$2"
                        chromeless
                        icon={Trash2}
                        color="$red10"
                        onPress={() => removeJugada(index)}
                      />
                    )}
                  </XStack>

                  {/* Tipo */}
                  <Select
                    value={jugada.type}
                    onValueChange={(value) => changeType(index, value as JugadaType)}
                  >
                    <Select.Trigger
                      width="100%"
                      iconAfter={ChevronDown}
                      br="$4"
                      bw={1}
                      bc="$borderColor"
                      bg="$background"
                    >
                      <Select.Value />
                    </Select.Trigger>

                    <Select.Adapt when="sm" platform="touch">
                      <Select.Sheet modal dismissOnSnapToBottom>
                        <Select.Sheet.Frame>
                          <Select.Sheet.ScrollView>
                            <Select.Adapt.Contents />
                          </Select.Sheet.ScrollView>
                        </Select.Sheet.Frame>
                        <Select.Sheet.Overlay />
                      </Select.Sheet>
                    </Select.Adapt>

                    <Select.Content zIndex={200000}>
                      <Select.Viewport>
                        <Select.Group>
                          <Select.Item index={0} value={JugadaType.NUMERO}>
                            <Select.ItemText>NUMERO</Select.ItemText>
                            <Select.ItemIndicator ml="auto">
                              <Check size={16} />
                            </Select.ItemIndicator>
                          </Select.Item>
                          <Select.Item index={1} value={JugadaType.REVENTADO}>
                            <Select.ItemText>REVENTADO</Select.ItemText>
                            <Select.ItemIndicator ml="auto">
                              <Check size={16} />
                            </Select.ItemIndicator>
                          </Select.Item>
                        </Select.Group>
                      </Select.Viewport>
                    </Select.Content>
                  </Select>

                  {/* Número / Reventado */}
                  {jugada.type === JugadaType.NUMERO ? (
                    <YStack gap="$1">
                      <Input
                        placeholder="Número (00-99)"
                        value={v(jugada.number)}
                        onChangeText={(value) => updateJugada(index, 'number', value)}
                        maxLength={2}
                        keyboardType="number-pad"
                      />
                      {errors[`jugadas.${index}.number`] && (
                        <Text color="$error" fontSize="$2">
                          {errors[`jugadas.${index}.number`]}
                        </Text>
                      )}
                    </YStack>
                  ) : (
                    <YStack gap="$1">
                      <Input
                        placeholder="Referencia número NUMERO"
                        value={v(jugada.reventadoNumber)}
                        onChangeText={(value) =>
                          setJugadas((prev) => {
                            const next = [...prev]
                            next[index] = { ...next[index], reventadoNumber: value, number: value }
                            return next
                          })
                        }
                        maxLength={2}
                        keyboardType="number-pad"
                      />
                      {errors[`jugadas.${index}.reventadoNumber`] && (
                        <Text color="$error" fontSize="$2">
                          {errors[`jugadas.${index}.reventadoNumber`]}
                        </Text>
                      )}
                    </YStack>
                  )}

                  {/* Monto */}
                  <YStack gap="$1">
                    <Input
                      placeholder="Monto"
                      value={v(jugada.amount)}
                      onChangeText={(value) => updateJugada(index, 'amount', value)}
                      keyboardType="decimal-pad"
                    />
                    {errors[`jugadas.${index}.amount`] && (
                      <Text color="$error" fontSize="$2">
                        {errors[`jugadas.${index}.amount`]}
                      </Text>
                    )}
                  </YStack>
                </YStack>
              </Card>
            ))}

            {/* Errores de referencias REVENTADO */}
            {Object.keys(errors)
              .filter((key) => key.startsWith('reventado_'))
              .map((key) => (
                <Card
                  key={key}
                  padding="$3"
                  backgroundColor="$red2"
                  borderWidth={1}
                  borderColor="$red8"
                >
                  <Text color="$red10" fontSize="$2">
                    {errors[key]}
                  </Text>
                </Card>
              ))}
          </YStack>
        </Card>

        {/* Total */}
        <Card padding="$4" backgroundColor="$blue2" borderColor="$blue8" borderWidth={1}>
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="600">Total:</Text>
            <Text fontSize="$7" fontWeight="bold" color="$info">
              {formatCurrency(totalAmount)}
            </Text>
          </XStack>
        </Card>

        <XStack gap="$3">
          <Button
            flex={1}
            backgroundColor="$red4"
            borderColor="$red8"
            borderWidth={1}
            onPress={safeBack}
          >
            <Text>Cancelar</Text>
          </Button>
          <Button
            flex={1}
            backgroundColor="$blue4"
            borderColor="$blue8"
            borderWidth={1}
            onPress={validateAndSubmit}
            disabled={createTicketMutation.isPending || !!cutoffError || loadingRestrictions}
          >
            <Text>{createTicketMutation.isPending ? 'Creando...' : 'Crear Tiquete'}</Text>
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  )
}
