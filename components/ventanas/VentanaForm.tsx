// components/ventanas/VentanaForm.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { YStack, XStack, Text, Switch, Separator, Sheet, Adapt, Spinner } from 'tamagui'
import { Button, Input, Card, Select } from '@/components/ui'
import { ChevronDown } from '@tamagui/lucide-icons'
import { z } from 'zod'
import { formatPhoneCR } from '@/utils/format/phone'
import { toNumberOrUndef } from '@/utils/number'

export type VentanaFormValues = {
  bancaId: string
  name: string
  code?: string
  email?: string
  phone?: string
  address?: string
  commissionMarginX: number | null
  isActive: boolean
}

type BancaLite = { id: string; name: string }

type Props = {
  onSubmit: (values: VentanaFormValues) => Promise<void> | void
  submitting?: boolean
  onCancel?: () => void
  bancas: BancaLite[]
  loadingBancas?: boolean
  errorBancas?: boolean
  onRetryBancas?: () => void | Promise<void>
  /** Opcional: precargar valores (por ejemplo, para "duplicar") */
  initialValues?: Partial<VentanaFormValues>
}

// Zod alineado al patrón de BancaForm (strings opcionales '' -> undefined)
const ventanaSchema = z.object({
  bancaId: z.string().min(1, 'Selecciona una banca'),
  name: z.string().trim().min(2, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  code: z.string().trim().max(20, 'Máximo 20 caracteres').optional().or(z.literal(''))
    .transform(v => (v?.trim() ? v : undefined)),
  email: z.string().trim().toLowerCase().email('Email inválido').optional().or(z.literal(''))
    .transform(v => (v?.trim() ? v : undefined)),
  phone: z.string().trim().max(20, 'Máximo 20 caracteres').optional().or(z.literal(''))
    .transform(v => (v?.trim() ? v : undefined))
    .refine(v => !v || /^\(\d{3}\)\s?\d{4}-\d{4}$/.test(v), 'Formato de teléfono inválido'),
  address: z.string().trim().max(200, 'Máximo 200 caracteres').optional().or(z.literal(''))
    .transform(v => (v?.trim() ? v : undefined)),
  commissionMarginX: z.preprocess(
    toNumberOrUndef,
    // acepta 0..1 (e.g. 0.15). Si quieres quitar límite superior, quita .max(1)
    z.number().min(0, 'Debe ser ≥ 0').max(1, 'Máximo 1.00').optional()
  ),
  isActive: z.boolean().default(true),
})

// ---------- UI state (igual patrón que BancaForm) ----------
type VentanaFormUI = {
  bancaId: string
  name: string
  code: string
  email: string
  phone: string
  address: string
  commissionMarginX: string // string en UI
  isActive: boolean
}

const DEFAULTS_UI: VentanaFormUI = {
  bancaId: '',
  name: '',
  code: '',
  email: '',
  phone: '',
  address: '',
  commissionMarginX: '',
  isActive: true,
}

export default function VentanaForm({
  onSubmit,
  submitting,
  onCancel,
  bancas,
  loadingBancas,
  errorBancas,
  onRetryBancas,
  initialValues,
}: Props) {
  const initialUI: VentanaFormUI = useMemo(() => ({
    ...DEFAULTS_UI,
    bancaId: initialValues?.bancaId ?? '',
    name: initialValues?.name ?? '',
    code: initialValues?.code ?? '',
    email: initialValues?.email ?? '',
    phone: initialValues?.phone ?? '',
    address: initialValues?.address ?? '',
    commissionMarginX:
      initialValues?.commissionMarginX != null ? String(initialValues.commissionMarginX) : '',
    isActive: initialValues?.isActive ?? true,
  }), [initialValues])

  const [values, setValues] = useState<VentanaFormUI>(initialUI)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setField = <K extends keyof VentanaFormUI>(key: K, val: VentanaFormUI[K]) =>
    setValues((prev) => ({ ...prev, [key]: val }))

  const firstBancaId = useMemo(() => (bancas?.[0]?.id ?? ''), [bancas])

  // Autoselección primera banca si no hay valor
  useEffect(() => {
    if (!values.bancaId && firstBancaId && !loadingBancas && !errorBancas) {
      setValues((prev) => ({ ...prev, bancaId: firstBancaId }))
    }
  }, [firstBancaId, loadingBancas, errorBancas])

  // Validación mínima para habilitar botón (igual que BancaForm)
  const canSubmit = useMemo(() => {
    if (!values.bancaId) return false
    if (!values.name || values.name.trim().length < 2) return false
    if (values.commissionMarginX && Number.isNaN(Number(values.commissionMarginX))) return false
    return true
  }, [values])

  const handleSubmit = async () => {
    setErrors({})

    // Validación con Zod (y normalizaciones incluidas)
    const parsed = ventanaSchema.safeParse({
      ...values,
      email: values.email.toLowerCase(),
    })

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach((i) => {
        const k = i.path[0]?.toString?.()
        if (k) fieldErrors[k] = i.message
      })
      setErrors(fieldErrors)
      return
    }

    // Armar payload final según tu VentanaFormValues (commissionMarginX: number|null)
    const data = parsed.data
    const payload: VentanaFormValues = {
      bancaId: data.bancaId,
      name: data.name,
      code: data.code,
      email: data.email,
      phone: data.phone,
      address: data.address,
      commissionMarginX:
        data.commissionMarginX == null ? null : Number(data.commissionMarginX),
      isActive: data.isActive,
    }

    try {
      await onSubmit?.(payload)
    } catch {
      // puedes mapear errores de API a setErrors aquí si tu backend devuelve details
    }
  }

  return (
    <YStack gap="$4">
      {/* Estado + Banca */}
      <Card padding="$3" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
        <XStack gap="$4" ai="center" flexWrap="wrap">
          <XStack ai="center" gap="$2">
            <Text fontSize="$3" color="$textSecondary">Activa:</Text>
            <Switch
              size="$2"
              checked={!!values.isActive}
              onCheckedChange={(val) => setField('isActive', !!val)}
              bw={1}
              bc="$borderColor"
              bg={values.isActive ? '$color10' : '$background'}
              hoverStyle={{ bg: values.isActive ? '$color10' : '$backgroundHover' }}
              focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: 'var(--color10)' }}
              disabled={submitting}
            >
              <Switch.Thumb
                animation="quick"
                bg="$color12"
                shadowColor="$shadowColor"
                shadowRadius={6}
                shadowOffset={{ width: 0, height: 2 }}
              />
            </Switch>
          </XStack>

          <Separator vertical />

          <XStack ai="center" gap="$2" flexWrap="wrap">
            <Text fontSize="$3" color="$textSecondary">Banca:</Text>
            <Select
              value={values.bancaId}
              onValueChange={(val) => setField('bancaId', val)}
            >
              <Select.Trigger
                bw={1}
                bc="$borderColor"
                backgroundColor="$background"
                px="$3"
                iconAfter={ChevronDown}
                disabled={!!loadingBancas || !!errorBancas || submitting}
              >
                <Select.Value
                  placeholder={
                    loadingBancas
                      ? 'Cargando…'
                      : errorBancas
                        ? 'Error al cargar'
                        : (bancas.length ? 'Selecciona banca' : 'No hay bancas')
                  }
                />
              </Select.Trigger>

              <Adapt when="sm">
                <Sheet modal snapPoints={[50]} dismissOnSnapToBottom>
                  <Sheet.Frame ai="center" jc="center">
                    <Adapt.Contents />
                  </Sheet.Frame>
                  <Sheet.Overlay />
                </Sheet>
              </Adapt>

              <Select.Content zIndex={1_000_000}>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  {bancas.map((b, index) => (
                    <Select.Item
                      key={b.id}
                      index={index}
                      value={String(b.id)}
                      pressStyle={{ bg: '$backgroundHover' }}
                      bw={0}
                      px="$3"
                    >
                      <Select.ItemText>{b.name}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select>

            {loadingBancas && <Spinner size="small" />}
            {errorBancas && (
              <Button size="$2" onPress={onRetryBancas} disabled={submitting}>
                <Text>Reintentar</Text>
              </Button>
            )}
          </XStack>
        </XStack>
      </Card>

      {/* Campos */}
      <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
        <YStack gap="$3">
          <YStack gap="$1">
            <Text fontWeight="600">Nombre *</Text>
            <Input
              placeholder="Nombre de la ventana"
              value={values.name}
              onChangeText={(t) => setField('name', t)}
              editable={!submitting}
            />
            {!!errors.name && <Text color="$error" fontSize="$2">{errors.name}</Text>}
          </YStack>

          <XStack gap="$3" flexWrap="wrap">
            <YStack flex={1} minWidth={240} gap="$1">
              <Text fontWeight="600">Código (opcional)</Text>
              <Input
                placeholder="Código"
                value={values.code}
                onChangeText={(t) => setField('code', t)}
                editable={!submitting}
              />
              {!!errors.code && <Text color="$error" fontSize="$2">{errors.code}</Text>}
            </YStack>

            <YStack flex={1} minWidth={240} gap="$1">
              <Text fontWeight="600">Margen Comisión X</Text>
              <Input
                placeholder="Ej. 0.15"
                keyboardType="decimal-pad"
                value={values.commissionMarginX}
                onChangeText={(t) => setField('commissionMarginX', t)}
                editable={!submitting}
              />
              {!!errors.commissionMarginX && (
                <Text color="$error" fontSize="$2">{errors.commissionMarginX}</Text>
              )}
            </YStack>
          </XStack>

          <XStack gap="$3" flexWrap="wrap">
            <YStack flex={1} minWidth={240} gap="$1">
              <Text fontWeight="600">Email (opcional)</Text>
              <Input
                placeholder="correo@ejemplo.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={values.email}
                onChangeText={(t) => setField('email', t)}
                editable={!submitting}
              />
              {!!errors.email && <Text color="$error" fontSize="$2">{errors.email}</Text>}
            </YStack>

            <YStack flex={1} minWidth={240} gap="$1">
              <Text fontWeight="600">Teléfono (opcional)</Text>
              <Input
                placeholder="(506) 8888-8888"
                keyboardType="phone-pad"
                value={values.phone}
                onChangeText={(t) => setField('phone', formatPhoneCR(t))}
                editable={!submitting}
              />
              {!!errors.phone && <Text color="$error" fontSize="$2">{errors.phone}</Text>}
            </YStack>
          </XStack>

          <YStack gap="$1">
            <Text fontWeight="600">Dirección (opcional)</Text>
            <Input
              placeholder="Dirección"
              value={values.address}
              onChangeText={(t) => setField('address', t)}
              editable={!submitting}
            />
            {!!errors.address && <Text color="$error" fontSize="$2">{errors.address}</Text>}
          </YStack>
        </YStack>
      </Card>

      {/* Acciones */}
      <XStack jc="flex-end" gap="$2" flexWrap="wrap">
        <Button
          minWidth={120}
          px="$4"
          onPress={onCancel}
          disabled={!!submitting}
          backgroundColor="$gray4"
          borderColor="$gray8"
          color="$background"
          borderWidth={1}
          hoverStyle={{ scale: 1.02 }}
          pressStyle={{ scale: 0.98 }}
        >
          <Text>Cancelar</Text>
        </Button>

        <Button
          minWidth={120}
          px="$4"
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={!!submitting}
          backgroundColor={"$blue4"}
          borderColor="$blue8"
          borderWidth={1}
          color="$background"
          hoverStyle={{ scale: 1.02 }}
          pressStyle={{ scale: 0.98 }}
        >
          Guardar
        </Button>
      </XStack>
    </YStack>
  )
}
