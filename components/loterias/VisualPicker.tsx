// components/loterias/VisualPicker.tsx
import React from 'react'
import { YStack, XStack, Text, Input, Card, Button, Label } from 'tamagui'

const PALETTE = ['#D32F2F','#C2185B','#7B1FA2','#512DA8','#303F9F','#1976D2','#0288D1','#00796B','#388E3C','#689F38','#FBC02D','#FFA000','#F57C00','#E64A19'] as const

type Display = {
  color?: string
  icon?: string
  description?: string
  featured?: boolean
}

type Props = {
  value?: Display
  onChange: (v: Display) => void
}

export default function VisualPicker({ value, onChange }: Props) {
  const set = (k: keyof Display, v: any) => onChange({ ...(value ?? {}), [k]: v })

  return (
    <YStack gap="$3">
      <Text fontWeight="700">Visual</Text>

      <YStack gap="$2">
        <Label>Color</Label>
        <XStack gap="$2" fw="wrap">
          {PALETTE.map(c => (
            <Button
              key={c}
              onPress={() => set('color', c)}
              bg={c as any}
              w={32}
              h={32}
              br={999}
              borderWidth={value?.color === c ? 2 : 1}
              borderColor={value?.color === c ? '$color12' : '$borderColor'}
            />
          ))}
          <Input
            placeholder="Otro color (#RRGGBB)"
            value={value?.color ?? ''}
            onChangeText={(t) => set('color', t)}
            w={180}
          />
        </XStack>
      </YStack>

      <YStack gap="$2">
        <Label>Ícono</Label>
        <XStack gap="$2" fw="wrap">
          {[
            { key: 'red-ball', label: 'Bolita roja', preview: '🔴' },
            { key: 'green-ball', label: 'Bolita verde', preview: '🟢' },
            { key: 'both-balls', label: 'Roja + Verde', preview: '🔴🟢' },
          ].map(opt => (
            <Card
              key={opt.key}
              p="$2"
              px="$3"
              bw={1}
              bc={value?.icon === opt.key ? '$green8' : '$borderColor'}
              onPress={() => set('icon', opt.key)}
            >
              <XStack gap="$2" ai="center">
                <Text>{opt.preview}</Text>
                <Text>{opt.label}</Text>
              </XStack>
            </Card>
          ))}
        </XStack>
      </YStack>

      <YStack gap="$2">
        <Label>Descripción</Label>
        <Input value={value?.description ?? ''} onChangeText={(t) => set('description', t)} />
      </YStack>

      <XStack ai="center" gap="$2">
        <Label>Destacada</Label>
        <Button
          size="$2"
          bg={value?.featured ? '$green5' : '$background'}
          borderColor="$borderColor"
          borderWidth={1}
          onPress={() => set('featured', !value?.featured)}
        >
          <Text>{value?.featured ? 'Sí' : 'No'}</Text>
        </Button>
      </XStack>
    </YStack>
  )
}
