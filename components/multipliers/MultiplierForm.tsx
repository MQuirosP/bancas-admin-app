// components/multipliers/MultiplierForm.tsx
import React, { useState, useMemo, useEffect } from 'react'
import { YStack, XStack, Text, Select, Switch, Sheet } from 'tamagui'
import { Card, Input, Button } from '@/components/ui'
import { Check, ChevronDown } from '@tamagui/lucide-icons'
import type { Loteria } from '@/types/models.types'
import type { LoteriaMultiplier } from '@/types/api.types'
import { set } from 'date-fns'

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

  useEffect(() => {
    setValues({
      loteriaId: initial?.loteriaId ?? '',
      name: initial?.name ?? '',
      valueX: initial?.valueX != null ? String(initial.valueX) : '',
      kind: (initial?.kind as any) ?? 'NUMERO',
      isActive: initial?.isActive ?? true,
    })
    setErrors({})
  }, [initial])

  useEffect(() => {
  if (!values.loteriaId && loterias.length === 1) {
    setField('loteriaId', loterias[0].id)
  }
}, [loterias])

  const setField = <K extends keyof Values>(k: K, v: Values[K]) =>
    setValues(s => {
      // 3) Limpia error del campo al editar
      if (errors[k as string]) {
        const { [k as string]: _, ...rest } = errors
        setErrors(rest)
      }
      return { ...s, [k]: v }
    })

  // 2) Dirty-check solo en edición
  const initialMemo = useMemo<Values>(() => ({
    loteriaId: initial?.loteriaId ?? '',
    name: initial?.name ?? '',
    valueX: initial?.valueX != null ? String(initial.valueX) : '',
    kind: (initial?.kind as any) ?? 'NUMERO',
    isActive: initial?.isActive ?? true,
  }), [initial])

  const isDirty = useMemo(() => {
    if (mode === 'create') return true
    const norm = (v: Values) => ({
      loteriaId: (v.loteriaId ?? '').trim(),
      name: (v.name ?? '').trim(),
      valueX: (v.valueX ?? '').trim().replace(',', '.'),
      kind: v.kind,
      isActive: !!v.isActive,
    })
    const a = norm(values), b = norm(initialMemo)
    return JSON.stringify(a) !== JSON.stringify(b)
  }, [mode, values, initialMemo])


  const canSubmit =
    !!values.loteriaId &&
    !!values.name.trim() &&
    !!values.valueX &&
    !Number.isNaN(parseFloat(values.valueX.replace(',', '.'))) &&
    parseFloat(values.valueX.replace(',', '.')) > 0 &&
    (mode === 'create' ? true : isDirty)

  const handleSubmit = () => {
    const e: Record<string, string> = {}
    if (!values.loteriaId) e.loteriaId = 'Requerido'
    if (!values.name.trim()) e.name = 'Requerido'
    const vx = values.valueX.trim().replace(',', '.')
    if (!vx || Number.isNaN(parseFloat(vx)) || parseFloat(vx) <= 0) e.valueX = 'Número inválido'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onSubmit(values)
    setErrors({})
  }

  return (
    <Card padding="$4" backgroundColor="$background" borderColor="$borderColor" borderWidth={1}>
      <YStack gap="$4">
        {/* Lotería */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600">Lotería *</Text>
          <Select value={values.loteriaId} onValueChange={(v) => setField('loteriaId', v)}>
            <Select.Trigger
              width="100%"
              iconAfter={ChevronDown}
              br="$3" bw={1} bc="$borderColor" backgroundColor="$background"
              aria-label="Seleccionar lotería"
            >
              <Select.Value placeholder="Seleccione una lotería" />
            </Select.Trigger>
            <Select.Adapt when="sm">
              <Sheet modal dismissOnSnapToBottom animation="quick">
                <Sheet.Frame p="$4">
                  <Select.Adapt.Contents />
                </Sheet.Frame>
                <Sheet.Overlay />
              </Sheet>
            </Select.Adapt>
            <Select.Content zIndex={200000}>
              <Select.ScrollUpButton />
              <Select.Viewport>
                <Select.Group>
                  {loterias.map((l, idx) => (
                    <Select.Item key={l.id} index={idx} value={l.id}>
                      <Select.ItemText>{l.name}</Select.ItemText>
                      <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
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
            placeholder='Ej. Reventado 5X'
            returnKeyType='done'
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
            onChangeText={(t) => setField('valueX', t)}
            onBlur={() => setField('valueX', values.valueX.trim().replace(',', '.'))}
            placeholder="Ej. 2.5"
            returnKeyType="done"
            focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
          />
          {!!errors.valueX && <Text color="$error">{errors.valueX}</Text>}
        </YStack>

        {/* kind */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600">Tipo *</Text>
          <Select value={values.kind} onValueChange={(v) => setField('kind', v as any)}>
            <Select.Trigger width="100%" iconAfter={ChevronDown} br="$3" bw={1} bc="$borderColor" backgroundColor="$background">
              <Select.Value />
            </Select.Trigger>
            <Select.Adapt when="sm">
              <Sheet modal dismissOnSnapToBottom animation="quick">
                <Sheet.Frame p="$4">
                  <Select.Adapt.Contents />
                </Sheet.Frame>
                <Sheet.Overlay />
              </Sheet>
            </Select.Adapt>
            <Select.Content zIndex={200000}>
              <Select.ScrollUpButton />
              <Select.Viewport>
                <Select.Item value="NUMERO" index={0}>
                  <Select.ItemText>NÚMERO</Select.ItemText>
                  <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                </Select.Item>
                <Select.Item value="REVENTADO" index={1}>
                  <Select.ItemText>REVENTADO</Select.ItemText>
                  <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
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
            backgroundColor={'$gray4'}
            borderColor="$gray8"
            borderWidth={1}
            disabled={!!submitting}
            hoverStyle={{ backgroundColor: '$gray5' }}
            pressStyle={{ scale: 0.98 }}
          >
            <Text>Cancelar</Text>
          </Button>
          <Button
            backgroundColor={'$blue4'}
            borderColor={'$blue8'}
            hoverStyle={{ backgroundColor: '$blue5'}}
            disabled={!canSubmit || !!submitting}
            loading={!!submitting}
            onPress={handleSubmit}
          >
            <Text>Guardar</Text>
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}
