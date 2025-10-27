import React from 'react'
import { XStack, YStack, Text, Select, Card } from 'tamagui'
import { Input, Button } from '@/components/ui'
import { Check, Trash2 } from '@tamagui/lucide-icons'
import { JugadaType } from '@/types/models.types'

export type JugadaForm = {
  type: JugadaType
  number?: string
  reventadoNumber?: string
  amount: string
  amountReventado?: string  // monto de reventado asociado (opcional)
}

export type JugadaErrors = {
  number?: string
  reventadoNumber?: string
  amount?: string
}

type Props = {
  index: number
  value: JugadaForm
  errors?: JugadaErrors
  onChange: (index: number, field: keyof JugadaForm, value: string) => void
  onChangeType: (index: number, nextType: JugadaType) => void
  onRemove: (index: number) => void
}

const sanitizeNumber = (val: string) => val.replace(/\D/g, '').slice(0, 2)

export default function JugadaRow({ index, value, errors, onChange, onChangeType, onRemove }: Props) {
  return (
    <Card padding="$3" backgroundColor="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
      <YStack gap="$2">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$3" fontWeight="600">Jugada {index + 1}</Text>
          <Button size="$3" icon={Trash2} variant="ghost" onPress={() => onRemove(index)}>
            <Text>Eliminar</Text>
          </Button>
        </XStack>

        {/* Tipo */}
        <YStack gap="$1">
          <Select value={value.type} onValueChange={(v: any) => onChangeType(index, v as JugadaType)}>
            <Select.Trigger width="100%" br="$4" bw={1} bc="$borderColor" backgroundColor="$background">
              <Select.Value placeholder="Tipo de jugada" />
            </Select.Trigger>
            <Select.Content zIndex={200000}>
              <Select.Viewport>
                <Select.Group>
                  <Select.Item index={0} value={JugadaType.NUMERO}>
                    <Select.ItemText>NUMERO</Select.ItemText>
                    <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                  </Select.Item>
                  <Select.Item index={1} value={JugadaType.REVENTADO}>
                    <Select.ItemText>REVENTADO</Select.ItemText>
                    <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                  </Select.Item>
                </Select.Group>
              </Select.Viewport>
            </Select.Content>
          </Select>
        </YStack>

        {/* Número / Reventado */}
        {value.type === JugadaType.NUMERO ? (
          <YStack gap="$1">
            <Input
              placeholder="Número (00-99)"
              value={value.number ?? ''}
              onChangeText={(val) => onChange(index, 'number', sanitizeNumber(val))}
              maxLength={2}
              keyboardType="number-pad"
            />
            {errors?.number && (
              <Text color="$error" fontSize="$2">{errors.number}</Text>
            )}
          </YStack>
        ) : (
          <YStack gap="$1">
            <Input
              placeholder="Referencia número NUMERO"
              value={value.reventadoNumber ?? ''}
              onChangeText={(val) => {
                const vv = sanitizeNumber(val)
                onChange(index, 'reventadoNumber', vv)
                onChange(index, 'number', vv)
              }}
              maxLength={2}
              keyboardType="number-pad"
            />
            {errors?.reventadoNumber && (
              <Text color="$error" fontSize="$2">{errors.reventadoNumber}</Text>
            )}
          </YStack>
        )}

        {/* Monto */}
        <YStack gap="$1">
          <Input
            placeholder="Monto"
            value={value.amount}
            onChangeText={(val) => onChange(index, 'amount', val)}
            keyboardType="decimal-pad"
          />
          {errors?.amount && (
            <Text color="$error" fontSize="$2">{errors.amount}</Text>
          )}
        </YStack>
      </YStack>
    </Card>
  )
}

