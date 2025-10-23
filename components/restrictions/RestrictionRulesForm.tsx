// components/restrictions/RestrictionRulesForm.tsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  YStack, XStack, Text, Input, Button, Card, Select, Separator, Spinner,
} from 'tamagui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown } from '@tamagui/lucide-icons'
import { apiClient } from '@/lib/api.client'
import { useToast } from '@/hooks/useToast'
import {
  createRestriction,
  updateRestriction,
} from '@/lib/api.restrictions'
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

function toDateInputValue(d?: string | Date | null) {
  if (!d) return ''
  const dt = typeof d === 'string' ? new Date(d) : d
  if (isNaN(dt.getTime())) return ''
  return dt.toISOString().slice(0, 10)
}

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
      setBancaId('')
      setVentanaId('')
      setUserId('')
      setNumber('')
      setMaxAmount('')
      setMaxTotal('')
      setSalesCutoffMinutes('')
      setAppliesToDate('')
      setAppliesToHour('')
      setErrors({})
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
      if (!isEmpty(number)) e['number'] = 'Para cutoff, number debe omitirse.'
      if (!isEmpty(maxAmount)) e['maxAmount'] = 'Para cutoff, no use montos.'
      if (!isEmpty(maxTotal)) e['maxTotal'] = 'Para cutoff, no use montos.'
      const vInt = parseInt(salesCutoffMinutes || '', 10)
      if (isNaN(vInt) || vInt < 0 || vInt > 30)
        e['salesCutoffMinutes'] = 'Ingrese minutos (0-30).'
    } else {
      if (isEmpty(maxAmount) && isEmpty(maxTotal)) {
        e['(root)'] = 'Defina al menos maxAmount o maxTotal.'
      } else {
        if (!isEmpty(maxAmount) && Number(maxAmount) <= 0) e['maxAmount'] = 'Debe ser > 0'
        if (!isEmpty(maxTotal) && Number(maxTotal) <= 0) e['maxTotal'] = 'Debe ser > 0'
      }
      if (!isEmpty(number) && !/^\d{1,3}$/.test(number)) {
        e['number'] = 'number debe ser 0..999 (1-3 dígitos).'
      }
      if (!isEmpty(salesCutoffMinutes)) e['salesCutoffMinutes'] = 'No puede enviar cutoff con montos.'
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

  // UI helpers para “toggle” de tipo sin usar variant="default"
  const amtActive = ruleType === 'amount'
  const cutActive = ruleType === 'cutoff'

  return (
    <YStack gap="$4" maxWidth={640} alignSelf="center" width="100%">
      <Card padding="$4" borderColor="$borderColor" borderWidth={1}>
        <YStack gap="$4">
          <Text fontSize="$6" fontWeight="700">
            {mode === 'create' ? 'Nueva Restricción' : 'Editar Restricción'}
          </Text>

          {/* Alcance */}
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="600">Alcance (al menos uno)</Text>

            <XStack gap="$3" flexWrap="wrap">
              <YStack gap="$2" minWidth={220}>
                <Text fontWeight="500">Banca</Text>
                <Select value={bancaId} onValueChange={setBancaId}>
                  <Select.Trigger iconAfter={ChevronDown} width={220} br="$4" bw={1} bc="$borderColor" bg="$background">
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

              <YStack gap="$2" minWidth={220}>
                <Text fontWeight="500">Ventana</Text>
                <Select value={ventanaId} onValueChange={setVentanaId}>
                  <Select.Trigger iconAfter={ChevronDown} width={220} br="$4" bw={1} bc="$borderColor" bg="$background">
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

              <YStack gap="$2" minWidth={260}>
                <Text fontWeight="500">Usuario</Text>
                <Select value={userId} onValueChange={setUserId}>
                  <Select.Trigger iconAfter={ChevronDown} width={260} br="$4" bw={1} bc="$borderColor" bg="$background">
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

          {/* Tipo de regla (toggle estilado) */}
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="600">Tipo de Regla</Text>
            <XStack gap="$2" flexWrap="wrap">
              <Button
                size="$3"
                onPress={() => switchType('amount')}
                backgroundColor={amtActive ? '$primary' : '$background'}
                color={amtActive ? '$background' : '$color'}
                borderWidth={1}
                borderColor={amtActive ? '$primaryHover' : '$borderColor'}
              >
                Montos
              </Button>
              <Button
                size="$3"
                onPress={() => switchType('cutoff')}
                backgroundColor={cutActive ? '$primary' : '$background'}
                color={cutActive ? '$background' : '$color'}
                borderWidth={1}
                borderColor={cutActive ? '$primaryHover' : '$borderColor'}
              >
                Cutoff
              </Button>
            </XStack>
          </YStack>

          {/* Campos según tipo */}
          {ruleType === 'amount' ? (
            <YStack gap="$3">
              <YStack gap="$2">
                <Text fontWeight="500">Número (0..999, opcional)</Text>
                <Input
                  value={number}
                  onChangeText={setNumber}
                  placeholder="23"
                  maxLength={3}
                  keyboardType="number-pad"
                />
                {errors.number && <Text color="$error" fontSize="$2">{errors.number}</Text>}
              </YStack>

              <XStack gap="$3" flexWrap="wrap">
                <YStack gap="$2" minWidth={220}>
                  <Text fontWeight="500">Monto Máximo por Jugada</Text>
                  <Input
                    value={maxAmount}
                    onChangeText={setMaxAmount}
                    placeholder="1000"
                    keyboardType="decimal-pad"
                  />
                  {errors.maxAmount && <Text color="$error" fontSize="$2">{errors.maxAmount}</Text>}
                </YStack>

                <YStack gap="$2" minWidth={220}>
                  <Text fontWeight="500">Monto Máximo Total</Text>
                  <Input
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
            <YStack gap="$3">
              <YStack gap="$2" maxWidth={220}>
                <Text fontWeight="500">Minutos de Cutoff (0-30)</Text>
                <Input
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

          {/* Ventana temporal (opcional) */}
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="600">Ventana Temporal (opcional)</Text>

            <XStack gap="$3" flexWrap="wrap">
              <YStack gap="$2" minWidth={220}>
                <Text fontWeight="500">Fecha (YYYY-MM-DD)</Text>
                <Input
                  value={appliesToDate}
                  onChangeText={setAppliesToDate}
                  placeholder="2025-05-20"
                />
              </YStack>

              <YStack gap="$2" minWidth={220}>
                <Text fontWeight="500">Hora (0..23)</Text>
                <Input
                  value={appliesToHour}
                  onChangeText={setAppliesToHour}
                  placeholder="13"
                  keyboardType="number-pad"
                  maxLength={2}
                />
                {errors.appliesToHour && (
                  <Text color="$error" fontSize="$2">{errors.appliesToHour}</Text>
                )}
              </YStack>
            </XStack>
          </YStack>
        </YStack>
      </Card>

      <XStack gap="$3" ai="center">
        <Button
          flex={1}
          backgroundColor="$red4"
          borderColor="$red8"
          borderWidth={1}
          onPress={onCancel}
        >
          Cancelar
        </Button>
        <Button
          flex={1}
          backgroundColor="$blue4"
          borderColor="$blue8"
          borderWidth={1}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : (submitLabel ?? (mode === 'create' ? 'Crear Restricción' : 'Guardar Cambios'))}
        </Button>
      </XStack>
    </YStack>
  )
}
