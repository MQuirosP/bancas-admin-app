// components/ventanas/VentanaForm.tsx
import React from 'react'
import { YStack, XStack, Text, Input, Card, Switch, Separator, Select, Sheet, Adapt, Button } from 'tamagui'
import { ChevronDown, X as XIcon } from '@tamagui/lucide-icons'

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
  values: VentanaFormValues
  setField: <K extends keyof VentanaFormValues>(key: K, val: VentanaFormValues[K]) => void
  bancas: BancaLite[]
  loadingBancas?: boolean
  errorBancas?: boolean
  onRetryBancas?: () => void
}

export default function VentanaForm({
  values, setField, bancas, loadingBancas, errorBancas, onRetryBancas,
}: Props) {
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
                disabled={!!loadingBancas || !!errorBancas}
              >
                <Select.Value placeholder={loadingBancas ? 'Cargando…' : (errorBancas ? 'Error' : 'Selecciona banca')} />
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
                      value={b.id}
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

            {errorBancas && (
              <Button size="$2" onPress={onRetryBancas} icon={XIcon}><Text>Reintentar</Text></Button>
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
            />
          </YStack>

          <XStack gap="$3" flexWrap="wrap">
            <YStack flex={1} minWidth={240} gap="$1">
              <Text fontWeight="600">Código (opcional)</Text>
              <Input
                placeholder="Código"
                value={values.code}
                onChangeText={(t) => setField('code', t)}
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
                  setField('commissionMarginX', v === '' ? null : Number(v))
                }}
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
              />
            </YStack>

            <YStack flex={1} minWidth={240} gap="$1">
              <Text fontWeight="600">Teléfono (opcional)</Text>
              <Input
                placeholder="Teléfono"
                value={values.phone}
                onChangeText={(t) => setField('phone', t)}
              />
            </YStack>
          </XStack>

          <YStack gap="$1">
            <Text fontWeight="600">Dirección (opcional)</Text>
            <Input
              placeholder="Dirección"
              value={values.address}
              onChangeText={(t) => setField('address', t)}
            />
          </YStack>
        </YStack>
      </Card>
    </YStack>
  )
}
