// components/multipliers/MultiplierForm.tsx
import React, { useState } from 'react'
import { YStack, XStack, Text, Card, Input, Button, Select, Switch } from 'tamagui'
import { Check, ChevronDown } from '@tamagui/lucide-icons'
import type { Loteria } from '@/types/models.types'
import type { LoteriaMultiplier } from '@/types/api.types'

type Values = {
  loteriaId: string
  name: string
  valueX: string
  kind: 'NUMERO' | 'REVENTADO'
  isActive: boolean
}

export default function MultiplierForm({
  mode,
  initial,
  loterias,
  submitting,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initial?: Partial<LoteriaMultiplier>
  loterias: Loteria[]
  submitting?: boolean
  onSubmit: (values: Values) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<Values>({
    loteriaId: initial?.loteriaId ?? '',
    name: initial?.name ?? '',
    valueX: initial?.valueX != null ? String(initial.valueX) : '',
    kind: (initial?.kind as any) ?? 'NUMERO',
    isActive: initial?.isActive ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setField = <K extends keyof Values>(k: K, v: Values[K]) =>
    setValues(s => ({ ...s, [k]: v }))

  const canSubmit =
    !!values.loteriaId &&
    !!values.name.trim() &&
    !!values.valueX &&
    !Number.isNaN(parseFloat(values.valueX))

  const handleSubmit = () => {
    const e: Record<string, string> = {}
    if (!values.loteriaId) e.loteriaId = 'Requerido'
    if (!values.name.trim()) e.name = 'Requerido'
    if (!values.valueX || Number.isNaN(parseFloat(values.valueX))) e.valueX = 'Número inválido'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onSubmit(values)
  }

  return (
    <Card padding="$4" bg="$background" borderColor="$borderColor" borderWidth={1}>
      <YStack gap="$4">
        {/* Lotería */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600">Lotería *</Text>
          <Select value={values.loteriaId} onValueChange={(v) => setField('loteriaId', v)}>
            <Select.Trigger width="100%" iconAfter={ChevronDown} br="$3" bw={1} bc="$borderColor" bg="$background">
              <Select.Value placeholder="Seleccione una lotería" />
            </Select.Trigger>
            <Select.Content zIndex={200000}>
              <Select.ScrollUpButton />
              <Select.Viewport>
                <Select.Group>
                  {loterias.map((l, idx) => (
                    <Select.Item key={l.id} index={idx} value={l.id}>
                      <Select.ItemText>{l.name}</Select.ItemText>
                      <Select.ItemIndicator ml="auto"><Check size={16}/></Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Viewport>
              <Select.ScrollDownButton />
            </Select.Content>
          </Select>
          {!!errors.loteriaId && <Text color="$error">{errors.loteriaId}</Text>}
        </YStack>

        {/* Nombre */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600">Nombre *</Text>
          <Input
            value={values.name}
            onChangeText={(t) => setField('name', t)}
            focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
          />
          {!!errors.name && <Text color="$error">{errors.name}</Text>}
        </YStack>

        {/* valueX */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600">Multiplicador X *</Text>
          <Input
            keyboardType="decimal-pad"
            value={values.valueX}
            onChangeText={(t) => setField('valueX', t.replace(',', '.'))}
            focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
          />
          {!!errors.valueX && <Text color="$error">{errors.valueX}</Text>}
        </YStack>

        {/* kind */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600">Tipo *</Text>
          <Select value={values.kind} onValueChange={(v) => setField('kind', v as any)}>
            <Select.Trigger width="100%" iconAfter={ChevronDown} br="$3" bw={1} bc="$borderColor" bg="$background">
              <Select.Value />
            </Select.Trigger>
            <Select.Content zIndex={200000}>
              <Select.ScrollUpButton />
              <Select.Viewport>
                <Select.Item value="NUMERO" index={0}>
                  <Select.ItemText>NÚMERO</Select.ItemText>
                  <Select.ItemIndicator ml="auto"><Check size={16}/></Select.ItemIndicator>
                </Select.Item>
                <Select.Item value="REVENTADO" index={1}>
                  <Select.ItemText>REVENTADO</Select.ItemText>
                  <Select.ItemIndicator ml="auto"><Check size={16}/></Select.ItemIndicator>
                </Select.Item>
              </Select.Viewport>
              <Select.ScrollDownButton />
            </Select.Content>
          </Select>
        </YStack>

        {/* isActive – mismo estilo que LoteriaForm */}
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
            aria-label="Activo"
          >
            <Switch.Thumb animation="quick" bg="$color12" />
          </Switch>
          <Text fontSize="$4">Activo</Text>
        </XStack>

        <XStack jc="flex-end" gap="$2" fw="wrap">
          <Button
            onPress={onCancel}
            bg="$background"
            borderColor="$borderColor"
            borderWidth={1}
            disabled={!!submitting}
            hoverStyle={{ scale: 1.02 }}
            pressStyle={{ scale: 0.98 }}
          >
            <Text>Cancelar</Text>
          </Button>
          <Button disabled={!canSubmit || !!submitting} onPress={handleSubmit}>
            <Text>{mode === 'create' ? 'Crear' : 'Guardar'}</Text>
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}
