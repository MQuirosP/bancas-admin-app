// components/bancas/BancaForm.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { YStack, XStack, Text, Button, Input, Card, Switch, Spinner } from 'tamagui'
import { z } from 'zod'
import type { Banca } from '@/types/models.types'
import { ApiErrorClass } from '@/lib/api.client'
import { useToast } from '@/hooks/useToast'

// ✅ Zod con preprocess: acepta string o vacío y lo convierte a number | undefined
const bancaSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es requerido'),
  code: z.string().trim().min(2, 'El código es requerido').transform((v) => v.toUpperCase()),
  isActive: z.boolean().default(true),
  salesCutoffMinutes: z.preprocess(
    (v) => {
      const s = typeof v === 'string' ? v.trim() : v
      if (s === '' || s === undefined || s === null) return undefined
      const n = Number(s)
      return Number.isFinite(n) ? n : NaN
    },
    z.number().int().min(0, 'Debe ser un entero ≥ 0').max(600, 'Máximo 600').optional()
  ),
})
export type BancaFormValues = z.infer<typeof bancaSchema>

// ✅ Estado de UI (todo string salvo boolean)
type BancaFormUI = {
  name: string
  code: string
  isActive: boolean
  salesCutoffMinutes: string // <- string en UI
}

type Props = {
  initial?: Partial<Banca> | null
  submitting?: boolean
  onSubmit: (values: BancaFormValues) => Promise<void> | void
  onCancel?: () => void
}

export const BancaForm: React.FC<Props> = ({ initial, submitting, onSubmit, onCancel }) => {
  const toast = useToast()

  const initialUI: BancaFormUI = useMemo(() => ({
    name: initial?.name ?? '',
    code: (initial?.code ?? '').toString().toUpperCase(),
    isActive: initial?.isActive ?? true,
    salesCutoffMinutes:
      initial?.salesCutoffMinutes !== undefined && initial?.salesCutoffMinutes !== null
        ? String(initial.salesCutoffMinutes)
        : '',
  }), [initial])

  const [values, setValues] = useState<BancaFormUI>(initialUI)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Habilita "Guardar" solo si los campos están OK
  const canSubmit = useMemo(() => {
    if (!values.name || values.name.trim().length < 2) return false
    if (!values.code || values.code.trim().length < 2) return false

    const scm = values.salesCutoffMinutes?.trim()
    if (scm && Number.isNaN(Number(scm))) return false

    return true
  }, [values])

  useEffect(() => {
    setValues(initialUI)
    setErrors({})
  }, [initialUI])

  const setField = <K extends keyof BancaFormUI>(key: K, v: BancaFormUI[K]) => {
    setValues((s) => ({ ...s, [key]: v }))
  }

  const handleSubmit = async () => {
    setErrors({})
    // ✅ Valida con Zod (conversión incluida)
    const parsed = bancaSchema.safeParse(values)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach((i) => {
        const k = i.path[0]?.toString?.()
        if (k) fieldErrors[k] = i.message
      })
      setErrors(fieldErrors)
      toast.error('Revisa los campos marcados')
      return
    }

    try {
      await onSubmit(parsed.data) // parsed.data ya trae number | undefined
    } catch (e) {
      const err = e as ApiErrorClass
      if (err?.details?.length) {
        const fieldErrors: Record<string, string> = {}
        err.details.forEach((d: any) => {
          if (d.field) fieldErrors[d.field] = d.message
        })
        setErrors(fieldErrors)
      }
      toast.error(err?.message || 'No fue posible guardar la banca')
    }
  }

  return (
    <Card padding="$4">
      <YStack gap="$4">
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="500">Nombre *</Text>
          <Input
            size="$4"
            placeholder="Nombre de la banca"
            value={values.name}
            onChangeText={(t) => setField('name', t)}
          />
          {!!errors.name && <Text color="$error" fontSize="$2">{errors.name}</Text>}
        </YStack>

        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="500">Código *</Text>
          <Input
            size="$4"
            placeholder="BCN-001"
            value={values.code}
            autoCapitalize="characters"
            onChangeText={(t) => setField('code', t.toUpperCase())}
          />
          {!!errors.code && <Text color="$error" fontSize="$2">{errors.code}</Text>}
        </YStack>

        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="500">Minutos de Cutoff (opcional)</Text>
          <Input
            size="$4"
            placeholder="5"
            keyboardType="number-pad"
            value={values.salesCutoffMinutes}
            onChangeText={(t) => setField('salesCutoffMinutes', t)} // <- ahora es string
          />
          {!!errors.salesCutoffMinutes && (
            <Text color="$error" fontSize="$2">{errors.salesCutoffMinutes}</Text>
          )}
          {!errors.salesCutoffMinutes && (
            <Text fontSize="$2" color="$gray11">
              Minutos antes del sorteo para bloquear ventas
            </Text>
          )}
        </YStack>

        <XStack gap="$3" alignItems="center">
          <Switch
            size="$2"
            checked={!!values.isActive}
            onCheckedChange={(val) => setField('isActive', !!val)}
            bw={1}
            bc="$borderColor"
            bg={values.isActive ? '$color10' : '$background'}
            hoverStyle={{ bg: values.isActive ? '$color10' : '$backgroundHover' }}
            focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: 'var(--color10)' }}
          >
            <Switch.Thumb
              animation="quick"
              bg="$color12"
              shadowColor="$shadowColor"
              shadowRadius={6}
              shadowOffset={{ width: 0, height: 2 }}
            />
          </Switch>

          <Text fontSize="$4">Activa</Text>
        </XStack>

        <XStack gap="$3" jc='flex-end' flexWrap='wrap' mt="$2">
          {onCancel && (
            <Button
              minWidth={120}
              px={'$4'}
              onPress={onCancel}
              disabled={!!submitting}
              backgroundColor="$gray4"
              borderColor="$gray8"
              color={'$background'}
              borderWidth={1}
              hoverStyle={{ scale: 1.02 }}
              pressStyle={{ scale: 0.98 }}
            >
              <Text>Cancelar</Text>
            </Button>
          )}
          <Button
            minWidth={120}
            px="$4"
            onPress={handleSubmit}
            disabled={!canSubmit || !!submitting}
            backgroundColor="$blue4"
            borderColor="$blue8"
            borderWidth={1}
            color="$background"
            hoverStyle={{ scale: 1.02 }}
            pressStyle={{ scale: 0.98 }}
          >
            {submitting ? <Spinner size="small" /> : <Text>Guardar</Text>}
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}
