// components/loterias/WeekdaySelector.tsx
import React from 'react'
import { XStack, Button, Text, useThemeName } from 'tamagui'
import type { Weekday } from '@/types/loteriaRules'

const DAYS = ['D','L','M','X','J','V','S'] as const

type Props = {
  value?: Weekday[]
  onChange: (days: Weekday[]) => void
}

export default function WeekdaySelector({ value = [], onChange }: Props) {
  const theme = useThemeName()
  const set = new Set<number>(value ?? [])

  const toggle = (d: number) => {
    if (set.has(d)) set.delete(d); else set.add(d)
    onChange(Array.from(set).sort() as Weekday[])
  }

  const textColor = theme === 'dark' ? '$color0' : '$color12' // blanco/negro

  return (
    <XStack gap="$2" ai="center" fw="wrap">
      <Text>Días:</Text>
      {DAYS.map((d, i) => {
        const selected = set.has(i)
        return (
          <Button
            key={d}
            size="$2"
            height={30}
            width={30}
            onPress={() => toggle(i)}
            backgroundColor={selected ? '$green5' : '$background'}
            // color={textColor}
            borderWidth={1}
            borderColor="$borderColor"
          >
            {d}
          </Button>
        )
      })}
    </XStack>
  )
}
