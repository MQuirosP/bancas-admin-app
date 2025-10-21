// components/sorteos/SorteoForm.tsx
import React, { useMemo, useState, useEffect } from 'react'
import { YStack, XStack, Text, Card, Input, Button, Spinner, Select, Sheet, Adapt } from 'tamagui'
import { z } from 'zod'
import { ChevronDown } from '@tamagui/lucide-icons'
import { useToast } from '@/hooks/useToast'
import { isDirty as isDirtyUtil } from '@/utils/forms/dirty'
import type { Loteria, Sorteo } from '@/types/models.types'

const schema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(100, 'Máximo 100'),
  loteriaId: z.string().uuid('Lotería inválida'),
  scheduledAt: z.string().trim().min(10, 'Fecha/hora requerida (ISO)'),
  // Nota: estos campos no van en create; en edit son opcionales:
  extraMultiplierId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
  extraOutcomeCode: z.string().trim().max(20).optional().or(z.literal('').transform(() => undefined)),
})
export type SorteoFormValues = z.infer<typeof schema>

type Props = {
  mode: 'create' | 'edit'
  initial?: Partial<Sorteo> | null
  loterias: Pick<Loteria, 'id' | 'name'>[]
  submitting?: boolean
  onSubmit: (v: SorteoFormValues) => Promise<void> | void
  onCancel?: () => void
}

export default function SorteoForm({ mode, initial, loterias, submitting, onSubmit, onCancel }: Props) {
  const toast = useToast()
  const isEdit = mode === 'edit'

  const initialUI = useMemo(() => ({
    name: initial?.name ?? '',
    loteriaId: initial?.loteriaId ?? (loterias[0]?.id ?? ''),
    scheduledAt: initial?.scheduledAt ?? '',
    extraMultiplierId: initial?.extraMultiplierId ?? '',
    extraOutcomeCode: initial?.extraOutcomeCode ?? '',
  }), [initial, loterias])

  const [values, setValues] = useState(initialUI)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => { setValues(initialUI); setErrors({}) }, [initialUI])

  const setField = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) =>
    setValues(prev => ({ ...prev, [k]: v }))

  const canSubmit = useMemo(() => {
    if (!values.name.trim()) return false
    if (!values.loteriaId) return false
    if (!values.scheduledAt.trim()) return false
    return true
  }, [values])

  const isDirty = useMemo(() => {
    if (!isEdit) return true
    return isDirtyUtil(values, initialUI, (v) => ({
      name: v.name.trim(),
      loteriaId: v.loteriaId,
      scheduledAt: v.scheduledAt.trim(),
      extraMultiplierId: v.extraMultiplierId || undefined,
      extraOutcomeCode: v.extraOutcomeCode || undefined,
    }))
  }, [values, initialUI, isEdit])

  const handleSubmit = async () => {
    setErrors({})
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      const e: Record<string, string> = {}
      parsed.error.issues.forEach(i => { const k = String(i.path[0]); e[k] = i.message })
      setErrors(e); toast.error('Revisa los campos'); return
    }
    if (isEdit && !isDirty) { toast.info('No hay cambios para guardar'); return }
    await onSubmit(parsed.data)
  }

  return (
    <Card padding="$4">
      <YStack gap="$4">
        <YStack gap="$2">
          <Text fontWeight="600">Nombre *</Text>
          <Input placeholder="Sorteo 7pm" value={values.name} onChangeText={(t) => setField('name', t)} />
          {!!errors.name && <Text color="$error">{errors.name}</Text>}
        </YStack>

        <YStack gap="$2">
          <Text fontWeight="600">Lotería *</Text>
          <Select value={values.loteriaId} onValueChange={(v) => setField('loteriaId', v)}>
            <Select.Trigger bw={1} bc="$borderColor" px="$3" iconAfter={ChevronDown}>
              <Select.Value placeholder="Selecciona lotería" />
            </Select.Trigger>
            <Adapt when="sm">
              <Sheet modal snapPoints={[50]} dismissOnSnapToBottom>
                <Sheet.Frame ai="center" jc="center"><Adapt.Contents /></Sheet.Frame>
                <Sheet.Overlay />
              </Sheet>
            </Adapt>
            <Select.Content zIndex={1_000_000}>
              <Select.ScrollUpButton />
              <Select.Viewport>
                {loterias.map((l, i) => (
                  <Select.Item key={l.id} index={i} value={l.id}>
                    <Select.ItemText>{l.name}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
              <Select.ScrollDownButton />
            </Select.Content>
          </Select>
          {!!errors.loteriaId && <Text color="$error">{errors.loteriaId}</Text>}
        </YStack>

        <YStack gap="$2">
          <Text fontWeight="600">Programado para (ISO) *</Text>
          <Input
            placeholder="2025-10-21T19:00:00Z"
            value={values.scheduledAt}
            onChangeText={(t) => setField('scheduledAt', t)}
            autoCapitalize="none"
          />
          {!!errors.scheduledAt && <Text color="$error">{errors.scheduledAt}</Text>}
          <Text color="$gray11" fontSize="$2">Ej: 2025-10-21T19:00:00-06:00 (zona CR)</Text>
        </YStack>

        {/* Opcionales visibles solo en edición si aplica en tu UX */}
        {isEdit && (
          <XStack gap="$3" flexWrap="wrap">
            <YStack f={1} minWidth={200} gap="$2">
              <Text fontWeight="600">Extra Multiplier (opcional)</Text>
              <Input
                placeholder="UUID"
                value={values.extraMultiplierId}
                onChangeText={(t) => setField('extraMultiplierId', t)}
                autoCapitalize="none"
              />
            </YStack>
            <YStack f={1} minWidth={200} gap="$2">
              <Text fontWeight="600">Código extra (opcional)</Text>
              <Input
                placeholder="REVENTADO-07"
                value={values.extraOutcomeCode}
                onChangeText={(t) => setField('extraOutcomeCode', t)}
                autoCapitalize="characters"
              />
            </YStack>
          </XStack>
        )}

        <XStack jc="flex-end" gap="$2">
          {onCancel && (
            <Button onPress={onCancel} disabled={!!submitting} bg="$gray4" borderColor="$gray8" borderWidth={1}>
              Cancelar
            </Button>
          )}
          <Button onPress={handleSubmit} disabled={!canSubmit || !!submitting}
            bg="$blue4" borderColor="$blue8" borderWidth={1} color="$background">
            {submitting ? <Spinner size="small" /> : 'Guardar'}
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}
