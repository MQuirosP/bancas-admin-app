import React, { useEffect, useMemo, useState } from 'react'
import { YStack, XStack, Text, Card } from 'tamagui'
import { Button, Input, Select, DatePicker } from '@/components/ui'
import type { CommissionPolicyV1, CommissionRule, BetType } from '@/types/commission.types'
import { CommissionPolicyV1Schema, EmptyPolicy } from '@/validators/commission.schema'
import { useLoterias } from '@/hooks/useLoterias'
import { useActiveMultipliersQuery } from '@/hooks/userMultipliers'
import type { LoteriaMultiplier } from '@/types/api.types'

type RuleUI = {
  id?: string
  loteriaId: string
  betType: '' | BetType
  multiplierX: string // UI stores X; serialize as min=max
  percent: string
}

type Props = {
  value: CommissionPolicyV1 | null
  readOnly?: boolean
  loading?: boolean
  onSave?: (v: CommissionPolicyV1) => void
  onCancel?: () => void
  onReset?: () => void
}

export const CommissionForm: React.FC<Props> = ({ value, readOnly, loading, onSave, onCancel, onReset }) => {
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
  const moveRule = (idx: number, dir: -1 | 1) => setRules((prev) => {
    const next = [...prev]
    const j = idx + dir
    if (j < 0 || j >= next.length) return prev
    const tmp = next[idx]
    next[idx] = next[j]
    next[j] = tmp
    return next
  })

  // Builder state
  const [bLoteriaId, setBLoteriaId] = useState<string>('')
  const [bBetType, setBBetType] = useState<BetType>('NUMERO')
  const [bSelected, setBSelected] = useState<Record<string, boolean>>({})
  const [bPercent, setBPercent] = useState<string>('0')
  const { data: multipliers } = useActiveMultipliersQuery(bLoteriaId || undefined, bBetType)
  const available: LoteriaMultiplier[] = (multipliers as any) ?? []
  const toggleSel = (id: string) => setBSelected((p) => ({ ...p, [id]: !p[id] }))
  const addFromBuilder = () => {
    const selIds = Object.keys(bSelected).filter((k) => bSelected[k])
    if (!bLoteriaId || selIds.length === 0) return
    const percent = Math.min(100, Math.max(0, Number(bPercent) || 0))
    const rows: RuleUI[] = selIds
      .map((id) => available.find((m) => m.id === id))
      .filter((m): m is LoteriaMultiplier => !!m)
      .map((m) => ({ loteriaId: bLoteriaId, betType: bBetType, multiplierX: String(m.valueX), percent: String(percent) }))
    if (rows.length) {
      setRules((prev) => [...prev, ...rows])
      setBSelected({})
    }
  }

  const handleSave = () => {
    const payload: CommissionPolicyV1 = {
      version: 1,
      effectiveFrom: from ? from.toISOString() : null,
      effectiveTo: to ? to.toISOString() : null,
      defaultPercent: Math.min(100, Math.max(0, Number(defaultPercent) || 0)),
      rules: rules.map<CommissionRule>((r) => ({
        id: r.id,
        loteriaId: r.loteriaId || null,
        betType: (r.betType || null) as any,
        multiplierRange: { min: Number(r.min), max: Number(r.max) },
        percent: Math.min(100, Math.max(0, Number(r.percent) || 0)),
      })),
    }
    const parsed = CommissionPolicyV1Schema.safeParse(payload)
    if (!parsed.success) {
      const msgs = parsed.error.issues.map((i) => `${i.path.join('.')} - ${i.message}`)
      setErrors(msgs)
      return
    }
    setErrors([])
    onSave?.(parsed.data)
  }

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
            />
          </YStack>
          <YStack minWidth={220} gap="$1">
            <Text fontSize="$3">Vigencia desde</Text>
            <DatePicker value={from} onChange={(d) => !readOnly && setFrom(d)} placeholder="yyyy-mm-dd" />
          </YStack>
          <YStack minWidth={220} gap="$1">
            <Text fontSize="$3">Vigencia hasta</Text>
            <DatePicker value={to} onChange={(d) => !readOnly && setTo(d)} placeholder="yyyy-mm-dd" />
          </YStack>
        </XStack>

        {/* Constructor de reglas */}
        <Card p="$3" bw={1} bc="$borderColor" bg="$background">
          <YStack gap="$2">
            <Text fontWeight="600">Constructor de reglas</Text>
            <XStack gap="$2" flexWrap="wrap" ai="flex-end">
              <YStack minWidth={200} gap="$1">
                <Text fontSize="$3">Lotería</Text>
                <Select value={bLoteriaId} onValueChange={setBLoteriaId}>
                  <Select.Trigger bw={1} bc="$borderColor" bg="$background" px="$3">
                    <Select.Value placeholder="Selecciona lotería" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Viewport>
                      {(lotResp?.data ?? []).map((l, i) => (
                        <Select.Item key={l.id} value={l.id} index={i}><Select.ItemText>{l.name}</Select.ItemText></Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select>
              </YStack>
              <YStack minWidth={160} gap="$1">
                <Text fontSize="$3">Tipo</Text>
                <Select value={bBetType} onValueChange={(v:any)=> setBBetType(v)}>
                  <Select.Trigger bw={1} bc="$borderColor" bg="$background" px="$3">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Viewport>
                      {(['NUMERO','REVENTADO'] as const).map((o,i)=>(
                        <Select.Item key={o} value={o} index={i}><Select.ItemText>{o}</Select.ItemText></Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select>
              </YStack>
              <YStack minWidth={140} gap="$1">
                <Text fontSize="$3">%</Text>
                <Input value={bPercent} onChangeText={setBPercent} keyboardType="number-pad" placeholder="0..100" />
              </YStack>
            </XStack>
            <YStack gap="$1">
              <Text fontSize="$3" color="$textSecondary">Multiplicadores disponibles</Text>
              <XStack gap="$2" flexWrap="wrap">
                {available.map((m) => (
                  <Button
                    key={m.id}
                    variant={bSelected[m.id] ? 'primary' : 'secondary'}
                    onPress={() => toggleSel(m.id)}
                  >
                    {m.name} ({m.valueX}x)
                  </Button>
                ))}
                {available.length === 0 && <Text color="$textSecondary">No hay multiplicadores activos para esta selección</Text>}
              </XStack>
              <XStack>
                <Button variant="primary" onPress={addFromBuilder} disabled={!bLoteriaId}>Agregar reglas</Button>
              </XStack>
            </YStack>
          </YStack>
        </Card>

        {/* Reglas */}
        <YStack gap="$2">
          <Text fontWeight="600">Reglas</Text>
          {(rules.length === 0) && (
            <Text color="$textSecondary">Sin reglas. Se usará el Default %.</Text>
          )}
          {rules.map((r, idx) => (
            <Card key={idx} p="$2" bw={1} bc="$borderColor" bg="$background">
              <XStack gap="$2" flexWrap="wrap" ai="flex-end">
                <YStack minWidth={200} gap="$1">
                  <Text fontSize="$3">Lotería</Text>
                  <Select value={r.loteriaId} onValueChange={(v)=> upsertRule(idx, { loteriaId: v })}>
                    <Select.Trigger bw={1} bc="$borderColor" bg="$background" px="$3">
                      <Select.Value placeholder="Selecciona lotería" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Viewport>
                        {(lotResp?.data ?? []).map((l, i) => (
                          <Select.Item key={l.id} value={l.id} index={i}><Select.ItemText>{l.name}</Select.ItemText></Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select>
                </YStack>
                <YStack minWidth={160} gap="$1">
                  <Text fontSize="$3">Tipo</Text>
                  <Select value={r.betType || ''} onValueChange={(v:any)=> upsertRule(idx, { betType: v })}>
                    <Select.Trigger bw={1} bc="$borderColor" bg="$background" px="$3">
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
                </YStack>
                <YStack minWidth={140} gap="$1">
                  <Text fontSize="$3">Multiplicador X</Text>
                  <Input value={r.multiplierX} onChangeText={(t)=> upsertRule(idx, { multiplierX: t })} keyboardType="number-pad" />
                </YStack>
                <YStack minWidth={140} gap="$1">
                  <Text fontSize="$3">%</Text>
                  <Input value={r.percent} onChangeText={(t)=> upsertRule(idx, { percent: t })} keyboardType="number-pad" />
                </YStack>
                <YStack>
                  <Button variant="danger" onPress={()=> removeRule(idx)} disabled={!!readOnly}>Eliminar</Button>
                </YStack>
                <YStack>
                  <XStack gap="$1">
                    <Button variant="secondary" onPress={()=> moveRule(idx, -1)} disabled={idx===0}>↑</Button>
                    <Button variant="secondary" onPress={()=> moveRule(idx, 1)} disabled={idx===rules.length-1}>↓</Button>
                  </XStack>
                </YStack>
              </XStack>
            </Card>
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
