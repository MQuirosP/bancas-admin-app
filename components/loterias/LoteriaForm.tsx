// components/loterias/LoteriaForm.tsx
import React, { useMemo, useEffect, useState } from 'react'
import { YStack, XStack, Text, Card, Input, Switch } from 'tamagui'
import { z } from 'zod'
import { useToast } from '@/hooks/useToast'
import { CustomButton } from '@/components/ui/CustomButton'
import { FieldGroup, FieldLabel, FieldError } from '@/components/ui/Field'

const createSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es requerido'),
  isActive: z.boolean().optional(),
})
const editSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es requerido').optional(),
  isActive: z.boolean().optional(),
})

type FormValues = z.input<typeof createSchema> | z.input<typeof editSchema>

type Props = {
  mode: 'create' | 'edit'
  initial?: Partial<{ id: string; name: string; isActive: boolean }> | null
  submitting?: boolean
  onSubmit: (values: FormValues) => void | Promise<void>
  onCancel?: () => void
}

export default function LoteriaForm({ mode, initial, submitting, onSubmit, onCancel }: Props) {
  const toast = useToast()
  const initialUI = useMemo(() => ({
    name: initial?.name ?? '',
    isActive: initial?.isActive ?? true,
  }), [initial])

  const [values, setValues] = useState(initialUI)
  const [errors, setErrors] = useState<Record<string,string>>({})

  useEffect(() => { setValues(initialUI); setErrors({}) }, [initialUI])

  const setField = (k: keyof typeof values, v: any) => setValues((s) => ({ ...s, [k]: v }))

  const handleSubmit = () => {
    setErrors({})
    const raw = mode === 'create'
      ? { name: values.name, isActive: values.isActive }
      : { name: values.name || undefined, isActive: values.isActive }
    const parsed = (mode === 'create' ? createSchema : editSchema).safeParse(raw)
    if (!parsed.success) {
      const fieldErrors: Record<string,string> = {}
      parsed.error.issues.forEach(i => { const k = i.path[0]?.toString?.(); if (k) fieldErrors[k] = i.message })
      setErrors(fieldErrors)
      toast.error('Revisa los campos marcados')
      return
    }
    onSubmit(parsed.data)
  }

  return (
    <YStack gap="$4">
      <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} elevate>
        <YStack gap="$3">
          <FieldGroup>
            <FieldLabel>Nombre</FieldLabel>
            <Input
              value={values.name}
              onChangeText={(v) => setField('name', v)}
              placeholder="Nombre de la lotería"
              focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
            />
            <FieldError message={errors.name} />
          </FieldGroup>

          <XStack gap="$3" ai="center">
            <Switch
              size="$2"
              checked={!!values.isActive}
              onCheckedChange={(val) => setField('isActive', !!val)}
              bw={1}
              bc="$borderColor"
              bg={values.isActive ? '$color10' : '$background'}
              hoverStyle={{ bg: values.isActive ? '$color10' : '$backgroundHover' }}
              focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: 'var(--color10)' }}
              aria-label="Activa"
            >
              <Switch.Thumb animation="quick" bg="$color12" />
            </Switch>
            <Text fontSize="$4">Activa</Text>
          </XStack>
        </YStack>
      </Card>

      <XStack gap="$2" jc="flex-end" flexWrap="wrap">
        <CustomButton variant="ghost" onPress={onCancel}>Cancelar</CustomButton>
        <CustomButton
          variant="primary"
          onPress={handleSubmit}
          loading={!!submitting}
          disabled={!!submitting}
        >
          Guardar
        </CustomButton>
      </XStack>
    </YStack>
  )
}
