import React, { useEffect, useMemo, useState } from 'react'
import { YStack, XStack, Text, Card, TextArea } from 'tamagui'
import { Button } from '@/components/ui'
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

  useEffect(() => { setText(initialText); setErrors([]) }, [initialText])

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

  return (
    <Card padding="$3" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
      <YStack gap="$2">
        <Text fontSize="$5" fontWeight="600">Política de comisiones</Text>
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

        <TextArea
          rows={12}
          disabled={!!readOnly}
          value={text}
          onChangeText={(t) => setText(t)}
          placeholder={readOnly ? 'Solo lectura' : '{\n  "version": 1,\n  ...\n}'}
        />

        <XStack gap="$2" jc="flex-end" flexWrap="wrap">
          <Button variant="secondary" onPress={onCancel} disabled={loading || !dirty}>Cancelar</Button>
          <Button variant="secondary" onPress={onReset} disabled={loading}>Restablecer</Button>
          <Button onPress={handleSave} disabled={!!readOnly || loading || !dirty} loading={!!loading}>Guardar</Button>
        </XStack>
      </YStack>
    </Card>
  )
}

export default CommissionEditor

