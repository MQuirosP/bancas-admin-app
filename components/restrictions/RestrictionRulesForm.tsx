// components/restrictions/RestrictionRulesForm.tsx
import React, { useEffect, useRef, useState } from 'react'
import { YStack, XStack, Text, Select, Separator } from 'tamagui'
import { Input, Button, Card } from '@/components/ui'
import { Platform } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown } from '@tamagui/lucide-icons'
import { apiClient } from '@/lib/api.client'
import { useToast } from '@/hooks/useToast'
import { createRestriction, updateRestriction } from '@/lib/api.restrictions'
import { safeBack } from '@/lib/navigation'
import type { RestrictionRule, Banca, Ventana, Usuario } from '@/types/models.types'

type RuleType = 'amount' | 'cutoff'

export type RestrictionRulesFormProps = {
  mode: 'create' | 'edit'
  id?: string
  initial?: Partial<RestrictionRule>
  onCancel?: () => void
  onSuccess?: (rule: RestrictionRule) => void
  submitLabel?: string
}

type FieldErrors = Record<string, string>

const v = (s?: string | number | null) => (s == null ? '' : String(s))
const isEmpty = (s?: string) => !s || s.trim() === ''
const pad = (n: number) => String(n).padStart(2, '0')

function toDateInputValue(d?: string | Date | null) {
  if (!d) return ''
  const dt = typeof d === 'string' ? new Date(d) : d
  if (isNaN(dt.getTime())) return ''
  return dt.toISOString().slice(0, 10)
}

// RN DateTimePicker solo en nativo
const RNDateTimePicker =
  Platform.OS !== 'web'
    ? require('@react-native-community/datetimepicker').default
    : null

const toYMD = (d: Date) =>
  new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10)

const clampHour = (h: number) => Math.max(0, Math.min(23, Math.floor(h)))

/* ====================== Botón Fecha (web/nativo) ====================== */
function DateButtonField({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
}: { value: string; onChange: (s: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false)
  const webInputRef = useRef<HTMLInputElement | null>(null)

  if (Platform.OS === 'web') {
    return (
      <YStack gap="$1" width="100%">
        {/* input oculto para invocar picker nativo */}
        <input
          ref={webInputRef}
          type="date"
          value={value}
          onChange={(e) => onChange((e.target as HTMLInputElement).value)}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        />
        <Button
          height={36}
          px="$3"
          backgroundColor="$background"
          bw={1}
          bc="$borderColor"
          hoverStyle={{ bg: '$backgroundHover' }}
          onPress={() => {
            const el = webInputRef.current
            // Algunos navegadores soportan showPicker()
            // @ts-ignore
            if (el?.showPicker) { /* eslint-disable-line */
              // @ts-ignore
              el.showPicker()
            } else {
              el?.click()
              el?.focus()
            }
          }}
        >
          <Text>Fecha</Text>
        </Button>
        <Text fontSize="$2" color="$textSecondary">
          {value || placeholder}
        </Text>
      </YStack>
    )
  }

  const current = value ? new Date(value + 'T00:00:00.000Z') : new Date()
  return (
    <YStack gap="$1" width="100%">
      <Button
        height={36}
        px="$3"
        backgroundColor="$background"
        bw={1}
        bc="$borderColor"
        hoverStyle={{ bg: '$backgroundHover' }}
        onPress={() => setShow(true)}
      >
        <Text>Fecha</Text>
      </Button>
      <Text fontSize="$2" color="$textSecondary">
        {value || placeholder}
      </Text>

      {show && RNDateTimePicker && (
        <RNDateTimePicker
          value={current}
          mode="date"
          display="default"
          onChange={(_e: any, selected?: Date) => {
            setShow(false)
            if (selected) onChange(toYMD(selected))
          }}
        />
      )}
    </YStack>
  )
}

/* ====================== Botón Hora (web/nativo) ====================== */
function TimeButtonField({
  value,         // HH (string 0..23)
  onChange,      // recibe HH (string 0..23)
  placeholder = 'Seleccionar hora',
}: { value: string; onChange: (s: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false)
  const webInputRef = useRef<HTMLInputElement | null>(null)

  if (Platform.OS === 'web') {
    // guardamos HH:MM local sólo para mostrar; al padre se le pasa sólo HH
    const [local, setLocal] = useState<string>(value !== '' ? `${pad(clampHour(Number(value)))}:00` : '')

    useEffect(() => {
      setLocal(value !== '' ? `${pad(clampHour(Number(value)))}:00` : '')
    }, [value])

    return (
      <YStack gap="$1" width="100%">
        {/* input oculto para invocar picker nativo */}
        <input
          ref={webInputRef}
          type="time"
          step={3600} // seleccionar por horas
          value={local}
          onChange={(e) => {
            const raw = (e.target as HTMLInputElement).value // "HH:MM"
            setLocal(raw)
            const hh = (raw?.split?.(':')?.[0] ?? '').trim()
            if (!hh) onChange('')
            else onChange(String(clampHour(Number(hh))))
          }}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        />
        <Button
          height={36}
          px="$3"
          backgroundColor="$background"
          bw={1}
          bc="$borderColor"
          hoverStyle={{ bg: '$backgroundHover' }}
          onPress={() => {
            const el = webInputRef.current
            // @ts-ignore
            if (el?.showPicker) { /* eslint-disable-line */
              // @ts-ignore
              el.showPicker()
            } else {
              el?.click()
              el?.focus()
            }
          }}
        >
          <Text>Hora</Text>
        </Button>
        <Text fontSize="$2" color="$textSecondary">
          {local || placeholder}
        </Text>
      </YStack>
    )
  }

  // Nativo
  const now = new Date()
  const base = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    value ? clampHour(Number(value)) : now.getHours(),
    0,
    0
  )

  return (
    <YStack gap="$1" width="100%">
      <Button
        height={36}
        px="$3"
        backgroundColor="$background"
        bw={1}
        bc="$borderColor"
        hoverStyle={{ bg: '$backgroundHover' }}
        onPress={() => setShow(true)}
      >
        <Text>Hora</Text>
      </Button>
      <Text fontSize="$2" color="$textSecondary">
        {value !== '' ? `${pad(clampHour(Number(value)))}:00` : placeholder}
      </Text>

      {show && RNDateTimePicker && (
        <RNDateTimePicker
          value={base}
          mode="time"
          is24Hour
          display="default"
          onChange={(_e: any, selected?: Date) => {
            setShow(false)
            if (selected) onChange(String(clampHour(selected.getHours())))
          }}
        />
      )}
    </YStack>
  )
}

/* ============================ Componente ============================ */

export default function RestrictionRulesForm({
  mode,
  id,
  initial,
  onCancel,
  onSuccess,
  submitLabel,
}: RestrictionRulesFormProps) {
  const toast = useToast()
  const qc = useQueryClient()

  // Catálogos
  const { data: bancasResp } = useQuery({
    queryKey: ['bancas'],
    queryFn: () => apiClient.get<{ data: Banca[] }>('/bancas'),
    staleTime: 60_000,
  })
  const { data: ventanasResp } = useQuery({
    queryKey: ['ventanas'],
    queryFn: () => apiClient.get<{ data: Ventana[] }>('/ventanas'),
    staleTime: 60_000,
  })
  const { data: usersResp } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get<{ data: Usuario[] }>('/users'),
    staleTime: 60_000,
  })

  const bancas = bancasResp?.data ?? []
  const ventanas = ventanasResp?.data ?? []
  const users = usersResp?.data ?? []

  // Estado
  const initialRuleType: RuleType =
    initial?.salesCutoffMinutes != null ? 'cutoff' : 'amount'

  const [ruleType, setRuleType] = useState<RuleType>(initialRuleType)
  const [bancaId, setBancaId] = useState(v(initial?.bancaId))
  const [ventanaId, setVentanaId] = useState(v(initial?.ventanaId))
  const [userId, setUserId] = useState(v(initial?.userId))

  const [number, setNumber] = useState(v(initial?.number))
  const [maxAmount, setMaxAmount] = useState(v(initial?.maxAmount))
  const [maxTotal, setMaxTotal] = useState(v(initial?.maxTotal))
  const [salesCutoffMinutes, setSalesCutoffMinutes] = useState(v(initial?.salesCutoffMinutes))

  const [appliesToDate, setAppliesToDate] = useState(toDateInputValue(initial?.appliesToDate as any))
  const [appliesToHour, setAppliesToHour] = useState(v(initial?.appliesToHour))

  const [errors, setErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (!initial) return
    setRuleType(initial?.salesCutoffMinutes != null ? 'cutoff' : 'amount')
    setBancaId(v(initial?.bancaId))
    setVentanaId(v(initial?.ventanaId))
    setUserId(v(initial?.userId))
    setNumber(v(initial?.number))
    setMaxAmount(v(initial?.maxAmount))
    setMaxTotal(v(initial?.maxTotal))
    setSalesCutoffMinutes(v(initial?.salesCutoffMinutes))
    setAppliesToDate(toDateInputValue(initial?.appliesToDate as any))
    setAppliesToHour(v(initial?.appliesToHour))
    setErrors({})
  }, [initial])

  const switchType = (t: RuleType) => {
    setRuleType(t)
    setErrors({})
    if (t === 'cutoff') {
      setNumber('')
      setMaxAmount('')
      setMaxTotal('')
    } else {
      setSalesCutoffMinutes('')
    }
  }

  // Mutations
  const createMut = useMutation({
    mutationFn: (payload: Partial<RestrictionRule>) => createRestriction(payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['restrictions'] })
      toast.success('Restricción creada')
      onSuccess?.(res.data as unknown as RestrictionRule)
      // reset
      setBancaId(''); setVentanaId(''); setUserId('')
      setNumber(''); setMaxAmount(''); setMaxTotal(''); setSalesCutoffMinutes('')
      setAppliesToDate(''); setAppliesToHour(''); setErrors({})
    },
    onError: (err: any) => {
      const fieldErrors: FieldErrors = {}
      const details = err?.details || err?.response?.data?.details
      if (Array.isArray(details)) {
        details.forEach((d: any) => {
          if (d.field) fieldErrors[d.field] = d.message
          else fieldErrors['(root)'] = d.message
        })
      }
      setErrors(fieldErrors)
      toast.error(err?.message ?? 'Error al crear')
    },
  })

  const updateMut = useMutation({
    mutationFn: (payload: Partial<RestrictionRule>) => updateRestriction(id!, payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['restrictions'] })
      qc.invalidateQueries({ queryKey: ['restriction', id] })
      toast.success('Restricción actualizada')
      onSuccess?.(res.data as unknown as RestrictionRule)
    },
    onError: (err: any) => {
      const fieldErrors: FieldErrors = {}
      const details = err?.details || err?.response?.data?.details
      if (Array.isArray(details)) {
        details.forEach((d: any) => {
          if (d.field) fieldErrors[d.field] = d.message
          else fieldErrors['(root)'] = d.message
        })
      }
      setErrors(fieldErrors)
      toast.error(err?.message ?? 'Error al actualizar')
    },
  })

  const isSubmitting = createMut.isPending || updateMut.isPending

  // Validación local
  const validate = (): boolean => {
    const e: FieldErrors = {}

    if (!bancaId && !ventanaId && !userId) {
      e['(root)'] = 'Debe indicar bancaId, ventanaId o userId (al menos uno).'
    }

    if (ruleType === 'cutoff') {
      if (!isEmpty(number)) e['number'] = 'Para corte, number debe omitirse.'
      if (!isEmpty(maxAmount)) e['maxAmount'] = 'Para corte, no use montos.'
      if (!isEmpty(maxTotal)) e['maxTotal'] = 'Para corte, no use montos.'
      const vInt = parseInt(salesCutoffMinutes || '', 10)
      if (isNaN(vInt) || vInt < 0 || vInt > 30)
        e['salesCutoffMinutes'] = 'Ingrese minutos (0-30).'
    } else {
      if (isEmpty(maxAmount) && isEmpty(maxTotal)) {
        e['(root)'] = 'Defina al menos Monto por jugada o Monto total.'
      } else {
        if (!isEmpty(maxAmount) && Number(maxAmount) <= 0) e['maxAmount'] = 'Debe ser > 0'
        if (!isEmpty(maxTotal) && Number(maxTotal) <= 0) e['maxTotal'] = 'Debe ser > 0'
      }
      if (!isEmpty(number) && !/^\d{1,3}$/.test(number)) {
        e['number'] = 'number debe ser 0..999 (1-3 dígitos).'
      }
      if (!isEmpty(salesCutoffMinutes)) e['salesCutoffMinutes'] = 'No puede enviar corte con montos.'
    }

    if (!isEmpty(appliesToHour)) {
      const h = Number(appliesToHour)
      if (isNaN(h) || h < 0 || h > 23) e['appliesToHour'] = 'Hora 0..23'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    const payload: any = {}
    if (bancaId) payload.bancaId = bancaId
    if (ventanaId) payload.ventanaId = ventanaId
    if (userId) payload.userId = userId

    if (ruleType === 'cutoff') {
      payload.salesCutoffMinutes = parseInt(salesCutoffMinutes, 10)
      payload.number = undefined
      payload.maxAmount = undefined
      payload.maxTotal = undefined
    } else {
      if (!isEmpty(number)) payload.number = number
      if (!isEmpty(maxAmount)) payload.maxAmount = parseFloat(maxAmount)
      if (!isEmpty(maxTotal)) payload.maxTotal = parseFloat(maxTotal)
      payload.salesCutoffMinutes = undefined
    }

    if (!isEmpty(appliesToDate)) payload.appliesToDate = appliesToDate
    if (!isEmpty(appliesToHour)) payload.appliesToHour = parseInt(appliesToHour, 10)

    if (mode === 'create') createMut.mutate(payload)
    else updateMut.mutate(payload)
  }

  const amtActive = ruleType === 'amount'
  const cutActive = ruleType === 'cutoff'

  const handleCancel = () => {
    if (onCancel) onCancel()
    else safeBack('/admin/restrictions')
  }

  return (
    <YStack gap="$3" maxWidth={640} alignSelf="center" width="100%">
      <Card padding="$3" borderColor="$borderColor" borderWidth={1}>
        <YStack gap="$3">
          <Text fontSize="$6" fontWeight="700">
            {mode === 'create' ? 'Nueva Restricción' : 'Editar Restricción'}
          </Text>

          {/* Alcance */}
          <YStack gap="$2">
            <Text fontSize="$5" fontWeight="600">Alcance (al menos uno)</Text>

            <XStack gap="$2" flexWrap="wrap" ai="flex-end">
              <YStack gap="$1" minWidth={220} maxWidth={240} width="100%">
                <Text fontWeight="500">Banca</Text>
                <Select value={bancaId} onValueChange={setBancaId}>
                  <Select.Trigger iconAfter={ChevronDown} width="100%" height={34} br="$3" bw={1} bc="$borderColor" backgroundColor="$background">
                    <Select.Value placeholder="(Ninguna)" />
                  </Select.Trigger>
                  <Select.Content zIndex={200000}>
                    <Select.Viewport>
                      <Select.Group>
                        <Select.Item value="" index={0}>
                          <Select.ItemText>(Ninguna)</Select.ItemText>
                          <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                        </Select.Item>
                        {bancas.map((b, i) => (
                          <Select.Item key={b.id} value={b.id} index={i + 1}>
                            <Select.ItemText>{b.name}</Select.ItemText>
                            <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Group>
                    </Select.Viewport>
                  </Select.Content>
                </Select>
              </YStack>

              <YStack gap="$1" minWidth={220} maxWidth={240} width="100%">
                <Text fontWeight="500">Ventana</Text>
                <Select value={ventanaId} onValueChange={setVentanaId}>
                  <Select.Trigger iconAfter={ChevronDown} width="100%" height={34} br="$3" bw={1} bc="$borderColor" backgroundColor="$background">
                    <Select.Value placeholder="(Ninguna)" />
                  </Select.Trigger>
                  <Select.Content zIndex={200000}>
                    <Select.Viewport>
                      <Select.Group>
                        <Select.Item value="" index={0}>
                          <Select.ItemText>(Ninguna)</Select.ItemText>
                          <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                        </Select.Item>
                        {ventanas.map((v, i) => (
                          <Select.Item key={v.id} value={v.id} index={i + 1}>
                            <Select.ItemText>{v.name}</Select.ItemText>
                            <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Group>
                    </Select.Viewport>
                  </Select.Content>
                </Select>
              </YStack>

              <YStack gap="$1" minWidth={260} maxWidth={300} width="100%">
                <Text fontWeight="500">Usuario</Text>
                <Select value={userId} onValueChange={setUserId}>
                  <Select.Trigger iconAfter={ChevronDown} width="100%" height={34} br="$3" bw={1} bc="$borderColor" backgroundColor="$background">
                    <Select.Value placeholder="(Ninguno)" />
                  </Select.Trigger>
                  <Select.Content zIndex={200000}>
                    <Select.Viewport>
                      <Select.Group>
                        <Select.Item value="" index={0}>
                          <Select.ItemText>(Ninguno)</Select.ItemText>
                          <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                        </Select.Item>
                        {users.map((u, i) => (
                          <Select.Item key={u.id} value={u.id} index={i + 1}>
                            <Select.ItemText>{u.name} ({u.username})</Select.ItemText>
                            <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Group>
                    </Select.Viewport>
                  </Select.Content>
                </Select>
              </YStack>
            </XStack>

            {errors['(root)'] && (
              <Text color="$error" fontSize="$2">{errors['(root)']}</Text>
            )}
          </YStack>

          <Separator />

          {/* Tipo */}
          <YStack gap="$2">
            <Text fontSize="$5" fontWeight="600">Tipo de Regla</Text>
            <XStack gap="$2" flexWrap="wrap">
              <Button
                size="$2"
                height={34}
                onPress={() => switchType('amount')}
                backgroundColor={ruleType === 'amount' ? '$primary' : '$background'}
                color={ruleType === 'amount' ? '$background' : '$color'}
                borderWidth={1}
                borderColor={ruleType === 'amount' ? '$primaryHover' : '$borderColor'}
              >
                Montos
              </Button>
              <Button
                size="$2"
                height={34}
                onPress={() => switchType('cutoff')}
                backgroundColor={ruleType === 'cutoff' ? '$primary' : '$background'}
                color={ruleType === 'cutoff' ? '$background' : '$color'}
                borderWidth={1}
                borderColor={ruleType === 'cutoff' ? '$primaryHover' : '$borderColor'}
              >
                Corte
              </Button>
            </XStack>
          </YStack>

          {/* Campos según tipo */}
          {ruleType === 'amount' ? (
            <YStack gap="$2">
              <YStack gap="$1" minWidth={200} maxWidth={220} width="100%">
                <Text fontWeight="500">Número (0..999, opcional)</Text>
                <Input
                  height={34}
                  value={number}
                  onChangeText={setNumber}
                  placeholder="23"
                  maxLength={3}
                  keyboardType="number-pad"
                />
                {errors.number && <Text color="$error" fontSize="$2">{errors.number}</Text>}
              </YStack>

              <XStack gap="$2" flexWrap="wrap">
                <YStack gap="$1" minWidth={200} maxWidth={220} width="100%">
                  <Text fontWeight="500">Monto Máximo por Jugada</Text>
                  <Input
                    height={34}
                    value={maxAmount}
                    onChangeText={setMaxAmount}
                    placeholder="1000"
                    keyboardType="decimal-pad"
                  />
                  {errors.maxAmount && <Text color="$error" fontSize="$2">{errors.maxAmount}</Text>}
                </YStack>

                <YStack gap="$1" minWidth={200} maxWidth={220} width="100%">
                  <Text fontWeight="500">Monto Máximo Total</Text>
                  <Input
                    height={34}
                    value={maxTotal}
                    onChangeText={setMaxTotal}
                    placeholder="5000"
                    keyboardType="decimal-pad"
                  />
                  {errors.maxTotal && <Text color="$error" fontSize="$2">{errors.maxTotal}</Text>}
                </YStack>
              </XStack>
            </YStack>
          ) : (
            <YStack gap="$2">
              <YStack gap="$1" minWidth={200} maxWidth={220} width="100%">
                <Text fontWeight="500">Minutos para Corte (0-30)</Text>
                <Input
                  height={34}
                  value={salesCutoffMinutes}
                  onChangeText={setSalesCutoffMinutes}
                  placeholder="5"
                  keyboardType="number-pad"
                  maxLength={2}
                />
                {errors.salesCutoffMinutes && (
                  <Text color="$error" fontSize="$2">{errors.salesCutoffMinutes}</Text>
                )}
              </YStack>
            </YStack>
          )}

          <Separator />

          {/* Ventana temporal */}
          <YStack gap="$2">
            <Text fontSize="$5" fontWeight="600">Ventana Temporal (opcional)</Text>

            <XStack gap="$6" flexWrap="wrap" ai="flex-start">
              <YStack gap="$1" minWidth={140} maxWidth={160} width="100%">
                <Text fontWeight="500">Fecha</Text>
                <DateButtonField
                  value={appliesToDate}
                  onChange={setAppliesToDate}
                />
              </YStack>

              <YStack gap="$1" minWidth={140} maxWidth={160} width="100%">
                <Text fontWeight="500">Hora</Text>
                <TimeButtonField
                  value={appliesToHour}
                  onChange={setAppliesToHour}
                />
              </YStack>
            </XStack>

            {/* Resumen compacto debajo */}
            <Text fontSize="$2" color="$textSecondary">
              Seleccionado: {appliesToDate || '—'} {appliesToHour !== '' ? `${pad(clampHour(Number(appliesToHour)))}:00` : ''}
            </Text>

            {errors.appliesToHour && (
              <Text color="$error" fontSize="$2">{errors.appliesToHour}</Text>
            )}
          </YStack>
        </YStack>
      </Card>

      <XStack gap="$2" ai="center" jc="flex-end">
        <Button
          height={36}
          px="$4"
          minWidth={120}
          backgroundColor="$red4"
          hoverStyle={{ backgroundColor: '$red5' }}
          pressStyle={{ scale: 0.98 }}
          borderColor="$red8"
          borderWidth={1}
          onPress={handleCancel}
        >
          Cancelar
        </Button>
        <Button
          height={36}
          px="$4"
          minWidth={120}
          backgroundColor="$blue4"
          hoverStyle={{ backgroundColor: '$blue5' }}
          pressStyle={{ scale: 0.98 }}
          borderColor="$blue8"
          borderWidth={1}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : (submitLabel ?? (mode === 'create' ? 'Guardar' : 'Guardar Cambios'))}
        </Button>
      </XStack>
    </YStack>
  )
}
