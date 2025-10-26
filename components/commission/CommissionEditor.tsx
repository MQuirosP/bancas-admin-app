import React, { useEffect, useMemo, useState } from 'react'
import { YStack, XStack, Text, Card, TextArea } from 'tamagui'
import { Button, Input, DatePicker } from '@/components/ui'
import type { CommissionPolicyV1 } from '@/types/commission.types'
import { CommissionPolicyV1Schema, EmptyPolicy } from '@/validators/commission.schema'

type Props = {
  value: CommissionPolicyV1 | null
  readOnly?: boolean
  loading?: boolean
  onSave?: (v: CommissionPolicyV1) => void
  onCancel?: () => void
  onReset?: () => void
}

export const CommissionEditor: React.FC<Props> = ({ value, readOnly, loading, onSave, onCancel, onReset }) => {
  const initialText = useMemo(() => (value ? JSON.stringify(value, null, 2) : ''), [value])
  const [text, setText] = useState(initialText)
  const [errors, setErrors] = useState<string[]>([])
  const [quickDefault, setQuickDefault] = useState<string>(() => String(value?.defaultPercent ?? 0))
  const [qFrom, setQFrom] = useState<Date | null>(() => (value?.effectiveFrom ? new Date(value.effectiveFrom) : null))
  const [qTo, setQTo] = useState<Date | null>(() => (value?.effectiveTo ? new Date(value.effectiveTo) : null))

  useEffect(() => { setText(initialText); setErrors([]) }, [initialText])
  useEffect(() => { setQuickDefault(String(value?.defaultPercent ?? 0)); setQFrom(value?.effectiveFrom ? new Date(value.effectiveFrom) : null); setQTo(value?.effectiveTo ? new Date(value.effectiveTo) : null) }, [value])

  const dirty = text !== initialText

  const validate = (): CommissionPolicyV1 | null => {
    try {
      const json = text.trim() === '' ? EmptyPolicy : JSON.parse(text)
      const parsed = CommissionPolicyV1Schema.safeParse(json)
      if (!parsed.success) {
        const msgs = parsed.error.issues.map(i => `${i.path.join('.')} - ${i.message}`)
        setErrors(msgs)
        return null
      }
      setErrors([])
      return parsed.data
    } catch (e: any) {
      setErrors([`JSON inválido: ${e?.message ?? 'Error'}`])
      return null
    }
  }

  const handleSave = () => {
    const v = validate()
    if (!v) return
    onSave?.(v)
  }

  // Quick fields -> sincroniza al JSON del editor
  const syncQuickFields = (next: Partial<CommissionPolicyV1>) => {
    try {
      const base = text.trim() ? JSON.parse(text) : { ...EmptyPolicy }
      const merged = { ...base, ...next }
      const parsed = CommissionPolicyV1Schema.parse(merged)
      setText(JSON.stringify(parsed, null, 2))
      setErrors([])
    } catch {}
  }

  return (
    <Card padding="$3" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
      <YStack gap="$2">
        <Text fontSize="$5" fontWeight="600">Política de comisiones</Text>
        <Text fontSize="$2" color="$textSecondary">Editor avanzado (JSON v1) para casos complejos; usa los campos rápidos para cambios comunes.</Text>
        {readOnly && <Text color="$textSecondary">Solo lectura</Text>}
        {(!value || (Array.isArray(value.rules) && value.rules.length === 0)) && (
          <Text color="$textSecondary">Sin política definida (usa default 0%).</Text>
        )}

        {errors.length > 0 && (
          <Card bg="$red4" bc="$red8" bw={1} p="$2">
            {errors.map((e, i) => (
              <Text key={i} color="$red12" fontSize="$2">• {e}</Text>
            ))}
          </Card>
        )}

        {/* Quick fields (resumen editable) */}
        <Card p="$3" bw={1} bc="$borderColor" bg="$background">
          <XStack gap="$3" flexWrap="wrap" ai="flex-end">
            <YStack minWidth={160} gap="$1">
              <Text fontSize="$3">Default %</Text>
              <Input
                disabled={!!readOnly}
                value={quickDefault}
                onChangeText={(t) => {
                  setQuickDefault(t)
                  const num = Number(t)
                  if (!Number.isNaN(num)) syncQuickFields({ defaultPercent: Math.min(100, Math.max(0, num)) })
                }}
                keyboardType="number-pad"
                placeholder="0..100"
              />
            </YStack>
            <YStack minWidth={200} gap="$1">
              <Text fontSize="$3">Vigencia desde</Text>
              <DatePicker
                value={qFrom}
                onChange={(d) => { if (!readOnly) { setQFrom(d); syncQuickFields({ effectiveFrom: d.toISOString() }) } }}
                placeholder="yyyy-mm-dd"
              />
            </YStack>
            <YStack minWidth={200} gap="$1">
              <Text fontSize="$3">Vigencia hasta</Text>
              <DatePicker
                value={qTo}
                onChange={(d) => { if (!readOnly) { setQTo(d); syncQuickFields({ effectiveTo: d.toISOString() }) } }}
                placeholder="yyyy-mm-dd"
              />
            </YStack>
            <YStack>
              <Button
                variant="secondary"
                onPress={() => { if (!readOnly) { setQuickDefault('0'); setQFrom(null); setQTo(null); syncQuickFields({ defaultPercent: 0, effectiveFrom: null, effectiveTo: null, rules: [] as any }) } }}
                disabled={!!readOnly}
              >
                Usar default (0%)
              </Button>
            </YStack>
          </XStack>
        </Card>

        <TextArea
          rows={12}
          disabled={!!readOnly}
          value={text}
          onChangeText={(t) => setText(t)}
          placeholder={readOnly ? 'Solo lectura' : '{\n  "version": 1,\n  ...\n}'}
        />

        <XStack gap="$2" jc="flex-end" flexWrap="wrap">
          <Button variant="secondary" onPress={onCancel} disabled={loading || !dirty}>Cancelar</Button>
          <Button variant="danger" onPress={onReset} disabled={loading}>Restablecer</Button>
          <Button variant="primary" onPress={handleSave} disabled={!!readOnly || loading || !dirty} loading={!!loading}>Guardar</Button>
        </XStack>
      </YStack>
    </Card>
  )
}

export default CommissionEditor
