import React, { useEffect, useMemo, useState } from 'react'
import { YStack, XStack, Text, Card } from 'tamagui'
import { Button, Input, Select, DatePicker } from '@/components/ui'
import { useTheme } from 'tamagui'
import { Trash2 } from '@tamagui/lucide-icons'
import type { CommissionPolicyV1, CommissionRule, BetType } from '@/types/commission.types'
import { CommissionPolicyV1Schema, EmptyPolicy } from '@/validators/commission.schema'
import { useLoterias } from '@/hooks/useLoterias'
import { useActiveMultipliersQuery } from '@/hooks/userMultipliers'

type RuleUI = {
  id?: string
  loteriaId: string
  betType: '' | BetType
  multiplierX: string // UI stores X; serialize as min=max
  percent: string
}

type RuleFieldErrors = {
  loteriaId?: string
  betType?: string
  multiplierX?: string
  percent?: string
}

type Props = {
  value: CommissionPolicyV1 | null
  readOnly?: boolean
  loading?: boolean
  onSave?: (v: CommissionPolicyV1) => void
  onCancel?: () => void
  onReset?: () => void
  onChangePolicy?: (v: CommissionPolicyV1) => void
}

export const CommissionForm: React.FC<Props> = ({ value, readOnly, loading, onSave, onCancel, onReset, onChangePolicy }) => {
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
  const { data: lotResp } = useLoterias({ page: 1, pageSize: 100 })

  const initial = useMemo(() => value ?? EmptyPolicy, [value])
  const [defaultPercent, setDefaultPercent] = useState<string>(String(initial.defaultPercent ?? 0))
  const [from, setFrom] = useState<Date | null>(initial.effectiveFrom ? new Date(initial.effectiveFrom) : null)
  const [to, setTo] = useState<Date | null>(initial.effectiveTo ? new Date(initial.effectiveTo) : null)
  const [rules, setRules] = useState<RuleUI[]>(() =>
    (initial.rules ?? []).map<RuleUI>((r) => ({
      id: r.id,
      loteriaId: r.loteriaId ?? '',
      betType: (r.betType ?? '') as any,
      multiplierX: String(
        r?.multiplierRange?.min != null && r?.multiplierRange?.max != null && r.multiplierRange.min === r.multiplierRange.max
          ? r.multiplierRange.min
          : (r?.multiplierRange?.min ?? r?.multiplierRange?.max ?? '')
      ),
      percent: String(r.percent ?? ''),
    }))
  )
  const [errors, setErrors] = useState<string[]>([])
  const [defaultPercentError, setDefaultPercentError] = useState<string | null>(null)
  const [ruleErrors, setRuleErrors] = useState<Record<number, RuleFieldErrors>>({})
  const [dateRangeError, setDateRangeError] = useState<string | null>(null)

  useEffect(() => {
    setDefaultPercent(String(initial.defaultPercent ?? 0))
    setFrom(initial.effectiveFrom ? new Date(initial.effectiveFrom) : null)
    setTo(initial.effectiveTo ? new Date(initial.effectiveTo) : null)
    setRules((initial.rules ?? []).map<RuleUI>((r) => ({
      id: r.id,
      loteriaId: r.loteriaId ?? '',
      betType: (r.betType ?? '') as any,
      multiplierX: String(
        r?.multiplierRange?.min != null && r?.multiplierRange?.max != null && r.multiplierRange.min === r.multiplierRange.max
          ? r.multiplierRange.min
          : (r?.multiplierRange?.min ?? r?.multiplierRange?.max ?? '')
      ),
      percent: String(r.percent ?? ''),
    })))
    setErrors([])
  }, [initial])

  const dirty = useMemo(() => {
    const current: CommissionPolicyV1 = {
      version: 1,
      effectiveFrom: from ? from.toISOString() : null,
      effectiveTo: to ? to.toISOString() : null,
      defaultPercent: Number(defaultPercent) || 0,
      rules: rules.map((r) => ({
        id: r.id,
        loteriaId: r.loteriaId || null,
        betType: (r.betType || null) as any,
        multiplierRange: { min: Number(r.multiplierX), max: Number(r.multiplierX) },
        percent: Number(r.percent) || 0,
      })),
    }
    return JSON.stringify(current) !== JSON.stringify(initial)
  }, [defaultPercent, from, to, rules, initial])

  const upsertRule = (idx: number, patch: Partial<RuleUI>) => {
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }
  const addRule = () => setRules((prev) => [...prev, { loteriaId: '', betType: '', multiplierX: '', percent: '' }])
  const removeRule = (idx: number) => setRules((prev) => prev.filter((_, i) => i !== idx))
  // (Reordenamiento por botones eliminado según solicitud)

  // Se elimina el "Constructor de reglas" para simplificar el formulario

  const buildPolicy = (): CommissionPolicyV1 => ({
    version: 1,
    effectiveFrom: from ? from.toISOString() : null,
    effectiveTo: to ? to.toISOString() : null,
    defaultPercent: Math.min(100, Math.max(0, Number(defaultPercent) || 0)),
    rules: rules.map<CommissionRule>((r) => ({
      id: r.id,
      loteriaId: r.loteriaId || null,
      betType: (r.betType || null) as any,
      multiplierRange: { min: Number(r.multiplierX), max: Number(r.multiplierX) },
      percent: Math.min(100, Math.max(0, Number(r.percent) || 0)),
    })),
  })

  const handleSave = () => {
    // Revalida reglas campo a campo
    const perRule: Record<number, RuleFieldErrors> = {}
    rules.forEach((r, idx) => {
      const e: RuleFieldErrors = {}
      if (!r.loteriaId) e.loteriaId = 'Selecciona una lotería'
      if (!r.multiplierX) e.multiplierX = 'Selecciona un multiplicador'
      const p = Number(r.percent)
      if (!(r.percent ?? '').toString().trim().length) e.percent = 'Requerido'
      else if (isNaN(p) || p < 0 || p > 100) e.percent = 'Debe estar entre 0 y 100'
      if (Object.keys(e).length) perRule[idx] = e
    })
    setRuleErrors(perRule)
    if (Object.keys(perRule).length) {
      setErrors(['Corrige los campos marcados en rojo'])
      return
    }

    const payload = buildPolicy()
    const parsed = CommissionPolicyV1Schema.safeParse(payload)
    if (!parsed.success) {
      const msgs = parsed.error.issues.map((i) => `${i.path.join('.')} - ${i.message}`)
      setErrors(msgs)
      return
    }
    setErrors([])
    onSave?.(parsed.data)
  }

  // Notificar cambios para que el simulador use el estado actual del formulario
  useEffect(() => {
    const payload = buildPolicy()
    const parsed = CommissionPolicyV1Schema.safeParse(payload)
    if (parsed.success) {
      onChangePolicy?.(parsed.data)
    }
  }, [defaultPercent, from, to, rules])

  // Validación en vivo por campo (mientras edita)
  useEffect(() => {
    const perRule: Record<number, RuleFieldErrors> = {}
    rules.forEach((r, idx) => {
      const e: RuleFieldErrors = {}
      if (!r.loteriaId) e.loteriaId = 'Selecciona una lotería'
      if (!r.multiplierX) e.multiplierX = 'Selecciona un multiplicador'
      const p = Number(r.percent)
      if (!(r.percent ?? '').toString().trim().length) e.percent = 'Requerido'
      else if (isNaN(p) || p < 0 || p > 100) e.percent = 'Debe estar entre 0 y 100'
      if (Object.keys(e).length) perRule[idx] = e
    })
    setRuleErrors(perRule)
  }, [rules])

  useEffect(() => {
    const val = Number(defaultPercent)
    if (!(defaultPercent ?? '').toString().trim().length) setDefaultPercentError('Requerido')
    else if (isNaN(val) || val < 0 || val > 100) setDefaultPercentError('Debe estar entre 0 y 100')
    else setDefaultPercentError(null)
  }, [defaultPercent])

  useEffect(() => {
    if (from && to && from > to) setDateRangeError('La fecha desde debe ser menor o igual a la fecha hasta')
    else setDateRangeError(null)
  }, [from, to])

  return (
    <Card padding="$3" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
      <YStack gap="$3">
        <Text fontSize="$5" fontWeight="600">Política de comisiones</Text>
        {errors.length > 0 && (
          <Card bg="$red4" bc="$red8" bw={1} p="$2">
            {errors.map((e, i) => (
              <Text key={i} color="$red12" fontSize="$2">• {e}</Text>
            ))}
          </Card>
        )}

        {/* Encabezado */}
        <XStack gap="$3" flexWrap="wrap" ai="flex-end">
          <YStack minWidth={160} gap="$1">
            <Text fontSize="$3">Default %</Text>
            <Input
              disabled={!!readOnly}
              value={defaultPercent}
              onChangeText={(t) => setDefaultPercent(t)}
              keyboardType="number-pad"
              placeholder="0..100"
              height={40}
              borderColor={defaultPercentError ? '$red8' : '$borderColor'}
            />
            <Text color="$red10" fontSize="$2" minHeight={14}>{defaultPercentError ?? ''}</Text>
          </YStack>
          <YStack minWidth={220} gap="$1">
            <Text fontSize="$3">Vigencia desde</Text>
            <DatePicker value={from} onChange={(d) => !readOnly && setFrom(d)} placeholder="yyyy-mm-dd" style={{ height: 40 }} />
            <Text color="$red10" fontSize="$2" minHeight={14}>{dateRangeError ? ' ' : ''}</Text>
          </YStack>
          <YStack minWidth={220} gap="$1">
            <Text fontSize="$3">Vigencia hasta</Text>
            <DatePicker value={to} onChange={(d) => !readOnly && setTo(d)} placeholder="yyyy-mm-dd" style={{ height: 40 }} />
            <Text color="$red10" fontSize="$2" minHeight={14}>{dateRangeError ?? ''}</Text>
          </YStack>
        </XStack>

        {/* Sección Constructor de reglas eliminada para evitar duplicidad y simplificar la UX */}

        {/* Reglas */}
        <YStack gap="$2">
          <Text fontWeight="600">Reglas</Text>
          {(rules.length === 0) && (
            <Text color="$textSecondary">Sin reglas. Se usará el Default %.</Text>
          )}
          {rules.map((r, idx) => (
            <RuleRow
              key={idx}
              idx={idx}
              row={r}
              loterias={lotResp?.data ?? []}
              readOnly={!!readOnly}
              onChange={upsertRule}
              onRemove={removeRule}
              errors={ruleErrors[idx]}
            />
          ))}
          <XStack>
            <Button variant="primary" onPress={addRule} disabled={!!readOnly}>Agregar regla</Button>
          </XStack>
        </YStack>

        <XStack gap="$2" jc="flex-end" flexWrap="wrap">
          <Button variant="secondary" onPress={onCancel} disabled={loading || !dirty}>Cancelar</Button>
          <Button variant="danger" onPress={onReset} disabled={loading}>Restablecer</Button>
          <Button variant="primary" onPress={handleSave} disabled={!!readOnly || loading || !dirty} loading={!!loading}>Guardar</Button>
        </XStack>
      </YStack>
    </Card>
  )
}

export default CommissionForm

// === Subcomponente por fila (usa hook de multiplicadores por lotería/tipo) ===
function RuleRow({
  idx,
  row,
  loterias,
  readOnly,
  onChange,
  onRemove,
  errors,
}: {
  idx: number
  row: RuleUI
  loterias: Array<{ id: string; name: string }>
  readOnly: boolean
  onChange: (idx: number, patch: Partial<RuleUI>) => void
  onRemove: (idx: number) => void
  errors?: RuleFieldErrors
}) {
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
  const loteriaId = row.loteriaId || undefined
  const kind = (row.betType || undefined) as any
  const { data: avail } = useActiveMultipliersQuery(loteriaId, kind)
  const items: Array<{ id: string; label: string; value: string }> = (avail ?? []).map((m: any) => ({ id: m.id, label: `${m.name} (${m.valueX}x)`, value: String(m.valueX) }))
  const hasMultiplier = items.some(i => i.value === row.multiplierX)

  return (
    <Card p="$2" bw={1} bc="$borderColor" backgroundColor="$background">
      <XStack gap="$2" flexWrap="wrap" ai="flex-end">
        <YStack minWidth={200} gap="$1">
          <Text fontSize="$3">Lotería</Text>
          <Select value={row.loteriaId} onValueChange={(v)=> onChange(idx, { loteriaId: v, multiplierX: '' })}>
            <Select.Trigger bw={1} bc={errors?.loteriaId ? '$red8' : '$borderColor'} backgroundColor="$background" px="$3">
              <Select.Value placeholder="Selecciona lotería" />
            </Select.Trigger>
            <Select.Content>
              <Select.Viewport>
                {loterias.map((l, i) => (
                  <Select.Item key={l.id} value={l.id} index={i}><Select.ItemText>{l.name}</Select.ItemText></Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select>
          <Text color="$red10" fontSize="$2" minHeight={14}>{errors?.loteriaId ?? ''}</Text>
        </YStack>
        <YStack minWidth={160} gap="$1">
          <Text fontSize="$3">Tipo</Text>
          <Select value={row.betType || ''} onValueChange={(v:any)=> onChange(idx, { betType: v, multiplierX: '' })}>
            <Select.Trigger bw={1} bc="$borderColor" backgroundColor="$background" px="$3">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Viewport>
                {[{v:'',l:'Cualquiera'},{v:'NUMERO',l:'NUMERO'},{v:'REVENTADO',l:'REVENTADO'}].map((o,i)=>(
                  <Select.Item key={o.v} value={o.v} index={i}><Select.ItemText>{o.l}</Select.ItemText></Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select>
          <Text color="$red10" fontSize="$2" minHeight={14}>{errors?.betType ?? ''}</Text>
        </YStack>
        <YStack minWidth={220} gap="$1">
          <Text fontSize="$3">Multiplicador X</Text>
          <Select value={hasMultiplier ? row.multiplierX : ''} onValueChange={(v:any)=> onChange(idx, { multiplierX: v })}>
            <Select.Trigger bw={1} bc={errors?.multiplierX ? '$red8' : '$borderColor'} backgroundColor="$background" px="$3">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Viewport>
                {items.map((it, i) => (
                  <Select.Item key={it.id} value={it.value} index={i}><Select.ItemText>{it.label}</Select.ItemText></Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select>
          <Text color="$red10" fontSize="$2" minHeight={14}>{errors?.multiplierX ?? ''}</Text>
        </YStack>
        <YStack minWidth={140} gap="$1">
          <Text fontSize="$3">%</Text>
          <Input value={row.percent} onChangeText={(t)=> onChange(idx, { percent: t })} keyboardType="number-pad" borderColor={errors?.percent ? '$red8' : '$borderColor'} />
          <Text color="$red10" fontSize="$2" minHeight={14}>{errors?.percent ?? ''}</Text>
        </YStack>
        <YStack>
          <Button
            circular
            onPress={()=> onRemove(idx)}
            backgroundColor="$red4"
            borderColor="$red8"
            borderWidth={1}
            hoverStyle={{ backgroundColor: '$red5' }}
            pressStyle={{ backgroundColor: '$red6', scale: 0.98 }}
            aria-label="Eliminar regla"
          >
            <Trash2 size={16} color={iconColor} />
          </Button>
          <Text color="$red10" fontSize="$2" minHeight={14}>{''}</Text>
        </YStack>
      </XStack>
    </Card>
  )
}
