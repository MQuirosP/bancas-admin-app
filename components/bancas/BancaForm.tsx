// components/bancas/BancaForm.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { YStack, XStack, Text, Input, Card, Switch, Spinner, TextArea } from 'tamagui'
import { z } from 'zod'
import type { Banca } from '@/types/models.types'
import { ApiErrorClass } from '@/lib/api.client'
import { useToast } from '@/hooks/useToast'
import { isDirty as isDirtyUtil } from '@/utils/forms/dirty'
import { formatPhoneCR } from "@/utils/format/phone";
import { Button } from '@/components/ui'
import { toNumberOrUndef } from '@/utils/number'

// Zod alineado al backend
const bancaSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  code: z.string().trim().min(2, 'El código es requerido').max(20, 'Máximo 20')
    .transform((v) => v.toUpperCase()),
  email: z.string().trim().toLowerCase().email('Email inválido').optional()
    .or(z.literal('')).transform(v => v || undefined),
  address: z.string().trim().max(200, 'Máximo 200 caracteres').optional()
    .or(z.literal('')).transform(v => v || undefined),
  phone: z.string().trim().max(20, 'Máximo 20 caracteres').optional()
    .or(z.literal(''))
    .transform(v => (v?.trim() ? v : undefined))
    .refine(v => !v || /^\(\d{3}\)\s?\d{4}-\d{4}$/.test(v), 'Formato de teléfono inválido'),
  isActive: z.boolean().default(true),
  defaultMinBet: z.preprocess(toNumberOrUndef,
    z.number().positive('Debe ser > 0').min(1, 'Mínimo 1').optional()
  ),
  globalMaxPerNumber: z.preprocess(toNumberOrUndef,
    z.number().positive('Debe ser > 0').min(1, 'Mínimo 1').optional()
  ),
  salesCutoffMinutes: z.preprocess(toNumberOrUndef,
    z.number().int('Debe ser entero').positive('Debe ser > 0').min(1, 'Mínimo 1').optional()
  ),
})
export type BancaFormValues = z.infer<typeof bancaSchema>

// Strings en UI salvo boolean
type BancaFormUI = {
  name: string
  code: string
  email: string
  address: string
  phone: string
  isActive: boolean
  defaultMinBet: string
  globalMaxPerNumber: string
  salesCutoffMinutes: string
}

type Props = {
  initial?: Partial<Banca> | null
  submitting?: boolean
  onSubmit: (values: BancaFormValues) => Promise<void> | void
  onCancel?: () => void
}

export const BancaForm: React.FC<Props> = ({ initial, submitting, onSubmit, onCancel }) => {
  const toast = useToast()
  const isEditMode = !!initial?.id

  const initialUI: BancaFormUI = useMemo(() => ({
    name: initial?.name ?? '',
    code: (initial?.code ?? '').toString().toUpperCase(),
    email: (initial as any)?.email ?? '',
    address: (initial as any)?.address ?? '',
    phone: (initial as any)?.phone ?? '',
    isActive: initial?.isActive ?? true,
    defaultMinBet: (initial as any)?.defaultMinBet != null ? String((initial as any).defaultMinBet) : '',
    globalMaxPerNumber: (initial as any)?.globalMaxPerNumber != null ? String((initial as any).globalMaxPerNumber) : '',
    salesCutoffMinutes: initial?.salesCutoffMinutes != null ? String(initial.salesCutoffMinutes) : '',
  }), [initial])

  const [values, setValues] = useState<BancaFormUI>(initialUI)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Normalización comparable a payload final (para dirty-check)
  const initialComparable = useMemo(() => ({
    name: initialUI.name.trim(),
    code: initialUI.code.trim().toUpperCase(),
    email: initialUI.email.trim().toLowerCase() || undefined,
    address: initialUI.address.trim() || undefined,
    phone: initialUI.phone.trim() || undefined,
    isActive: initialUI.isActive,
    defaultMinBet: initialUI.defaultMinBet ? Number(initialUI.defaultMinBet) : undefined,
    globalMaxPerNumber: initialUI.globalMaxPerNumber ? Number(initialUI.globalMaxPerNumber) : undefined,
    salesCutoffMinutes: initialUI.salesCutoffMinutes ? Number(initialUI.salesCutoffMinutes) : undefined,
  }), [initialUI])

  const canSubmit = useMemo(() => {
    if (!values.name || values.name.trim().length < 2) return false
    if (!values.code || values.code.trim().length < 2) return false

    const nums = [values.defaultMinBet, values.globalMaxPerNumber, values.salesCutoffMinutes]

    for (const s of nums) {
      if (s && Number.isNaN(Number(s))) return false
    }
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

    const parsed = bancaSchema.safeParse({
      ...values,
      code: values.code.toUpperCase(),
      email: values.email.toLowerCase(),
    })
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

    if (isEditMode) {
      const currentComparable = {
        name: parsed.data.name,
        code: parsed.data.code,
        email: parsed.data.email,
        address: parsed.data.address,
        phone: parsed.data.phone,
        isActive: parsed.data.isActive,
        defaultMinBet: parsed.data.defaultMinBet,
        globalMaxPerNumber: parsed.data.globalMaxPerNumber,
        salesCutoffMinutes: parsed.data.salesCutoffMinutes,
      }
      if (!isDirtyUtil(initialComparable, currentComparable)) {
        toast.info('No hay cambios para guardar')
        return
      }
    }

    try {
      await onSubmit(parsed.data)
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
        {/* Nombre */}
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

        {/* Código */}
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

        {/* Email */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="500">Email (opcional)</Text>
          <Input
            size="$4"
            placeholder="banca@dominio.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={values.email}
            onChangeText={(t) => setField('email', t)}
          />
          {!!errors.email && <Text color="$error" fontSize="$2">{errors.email}</Text>}
        </YStack>

        {/* Dirección */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="500">Dirección (opcional)</Text>
          <TextArea
            size="$4"
            rows={3}
            placeholder="Dirección fiscal o comercial"
            value={values.address}
            onChangeText={(t) => setField('address', t)}
          />
          {!!errors.address && <Text color="$error" fontSize="$2">{errors.address}</Text>}
        </YStack>

        {/* Teléfono */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="500">Teléfono (opcional)</Text>
          <Input
            size="$4"
            placeholder="(506) 8888-8888"
            keyboardType="phone-pad"
            value={values.phone}
            onFocus={() => {
              // si está vacío, “siembra” el prefijo 506 editable
              if (!values.phone?.trim()) {
                setField('phone', '(506) ')
              }
            }}
            onChangeText={(t) => setField('phone', formatPhoneCR(t))}
            editable={!submitting}
          />
          {!!errors.phone && <Text color="$error" fontSize="$2">{errors.phone}</Text>}
        </YStack>

        {/* Números */}
        <XStack gap="$3" flexWrap="wrap">
          <YStack f={1} minWidth={160} gap="$2">
            <Text fontSize="$4" fontWeight="500">Apuesta mínima (opcional)</Text>
            <Input
              size="$4"
              placeholder="1"
              keyboardType="number-pad"
              value={values.defaultMinBet}
              onChangeText={(t) => setField('defaultMinBet', t)}
            />
            {!!errors.defaultMinBet && <Text color="$error" fontSize="$2">{errors.defaultMinBet}</Text>}
          </YStack>

          <YStack f={1} minWidth={160} gap="$2">
            <Text fontSize="$4" fontWeight="500">Máximo por número (opcional)</Text>
            <Input
              size="$4"
              placeholder="1000"
              keyboardType="number-pad"
              value={values.globalMaxPerNumber}
              onChangeText={(t) => setField('globalMaxPerNumber', t)}
            />
            {!!errors.globalMaxPerNumber && <Text color="$error" fontSize="$2">{errors.globalMaxPerNumber}</Text>}
          </YStack>

          <YStack f={1} minWidth={160} gap="$2">
            <Text fontSize="$4" fontWeight="500">Minutos de Cutoff (opcional)</Text>
            <Input
              size="$4"
              placeholder="5"
              keyboardType="number-pad"
              value={values.salesCutoffMinutes}
              onChangeText={(t) => setField('salesCutoffMinutes', t)}
            />
            {!!errors.salesCutoffMinutes && (
              <Text color="$error" fontSize="$2">{errors.salesCutoffMinutes}</Text>
            )}
            {!errors.salesCutoffMinutes && (
              <Text fontSize="$2" color="$gray11">
                Minutos antes del sorteo para bloquear ventas (entero &gt; 0)
              </Text>
            )}
          </YStack>
        </XStack>

        {/* Switch isActive */}
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

        {/* Acciones */}
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
            disabled={!canSubmit}
            loading={!!submitting}
            backgroundColor="$blue4"
            borderColor="$blue8"
            borderWidth={1}
            color="$background"
            hoverStyle={{ scale: 1.02 }}
            pressStyle={{ scale: 0.98 }}
          >
            <Text>Guardar</Text>
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}
