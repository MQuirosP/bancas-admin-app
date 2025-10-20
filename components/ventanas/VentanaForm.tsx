// components/ventanas/VentanaForm.tsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  YStack, XStack, Text, Input, Card, Switch, Separator,
  Select, Sheet, Adapt, Button, Spinner
} from 'tamagui'
import { ChevronDown } from '@tamagui/lucide-icons'

export type VentanaFormValues = {
  bancaId: string
  name: string
  code: string
  email: string
  phone: string
  address: string
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

const DEFAULTS: VentanaFormValues = {
  bancaId: '',
  name: '',
  code: '',
  email: '',
  phone: '',
  address: '',
  commissionMarginX: null,
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
  // Estado interno estandarizado (como BancaForm)
  const [values, setValues] = useState<VentanaFormValues>({
    ...DEFAULTS,
    ...(initialValues ?? {}),
  })

  const setField = <K extends keyof VentanaFormValues>(key: K, val: VentanaFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: val }))

  const firstBancaId = useMemo(() => (bancas?.[0]?.id ?? ''), [bancas])

  // Autoselección primera banca si no hay valor
  useEffect(() => {
    if (!values.bancaId && firstBancaId && !loadingBancas && !errorBancas) {
      setValues((prev) => ({ ...prev, bancaId: firstBancaId }))
    }
  }, [firstBancaId, loadingBancas, errorBancas])

  // Validación mínima (igual patrón que en pantallas "nueva")
  const canSubmit = useMemo(() => {
    if (!values.bancaId) return false
    if (!values.name || values.name.trim().length < 2) return false
    if (values.commissionMarginX != null && Number.isNaN(Number(values.commissionMarginX))) return false
    return true
  }, [values])

  const handleSubmit = async () => {
    if (!canSubmit) return
    const payload: VentanaFormValues = {
      bancaId: values.bancaId,
      name: values.name.trim(),
      code: values.code?.trim(),
      email: values.email?.trim(),
      phone: values.phone?.trim(),
      address: values.address?.trim(),
      commissionMarginX:
        values.commissionMarginX == null || values.commissionMarginX === ('' as any)
          ? null
          : Number(values.commissionMarginX),
      isActive: !!values.isActive,
    }
    await onSubmit?.(payload)
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
                bg="$background"
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

              {/* Adapt para mobile */}
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
            </YStack>

            <YStack flex={1} minWidth={240} gap="$1">
              <Text fontWeight="600">Margen Comisión X</Text>
              <Input
                placeholder="Ej. 0.15"
                keyboardType="decimal-pad"
                value={values.commissionMarginX == null ? '' : String(values.commissionMarginX)}
                onChangeText={(t) => {
                  const v = t.trim()
                  setField('commissionMarginX', v === '' ? null : (Number(v) as any))
                }}
                editable={!submitting}
              />
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
            </YStack>

            <YStack flex={1} minWidth={240} gap="$1">
              <Text fontWeight="600">Teléfono (opcional)</Text>
              <Input
                placeholder="Teléfono"
                value={values.phone}
                onChangeText={(t) => setField('phone', t)}
                editable={!submitting}
              />
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
          </YStack>
        </YStack>
      </Card>

      {/* Acciones (estándar como BancaForm) */}
      <XStack jc="flex-end" gap="$2" flexWrap="wrap">
        <Button
          bg="$background"
          hoverStyle={{ bg: '$backgroundHover', scale: 1.02 }}
          pressStyle={{ scale: 0.98 }}
          onPress={onCancel}
          disabled={submitting}
        >
          <Text>Cancelar</Text>
        </Button>

        <Button
          bg="$primary"
          color="$background"
          hoverStyle={{ bg: '$primaryHover', scale: 1.02 }}
          pressStyle={{ bg: '$primaryPress', scale: 0.98 }}
          onPress={handleSubmit}
          disabled={!canSubmit || !!submitting}
        >
          {submitting ? <Spinner size="small" /> : <Text>Guardar</Text>}
        </Button>
      </XStack>
    </YStack>
  )
}
