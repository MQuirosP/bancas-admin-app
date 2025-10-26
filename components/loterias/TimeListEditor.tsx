// src/components/loterias/TimeListEditor.tsx
import React, { useState } from 'react'
import { XStack, YStack, Text, Card } from 'tamagui'
import { Button } from '@/components/ui'
import TimeInput from './TimeInput'
import { useUiSettings } from '../../hooks/useUiSettings'

type Props = {
  value?: string[] // "HH:MM"
  onChange: (times: string[]) => void
  format?: '24h'|'12h'
}

export default function TimeListEditor({ value=[], onChange, format='24h' }: Props) {
    const { timeFormat, timePickerMode, minuteStep } = useUiSettings()
  const [pending, setPending] = useState<string>('12:00')

  const add = () => {
    const set = new Set(value)
    set.add(pending)
    onChange(Array.from(set).sort())
  }
  const remove = (t: string) => onChange(value.filter(x => x !== t))

  return (
    <YStack gap="$2">
      <XStack gap="$2" ai="center">
        <TimeInput
          value={pending}
          onChange={setPending}
          format={timeFormat}
          mode={timePickerMode}
          minuteStep={minuteStep}
          w={90}
        />
        <Button bg="$green4" borderColor="$green8" borderWidth={1} onPress={add}>
          <Text>Agregar hora</Text>
        </Button>
      </XStack>

      <XStack gap="$2" fw="wrap">
        {value.length === 0 && <Text color="$gray10">Sin horarios aún</Text>}
        {value.map((t) => (
          <Card key={t} p="$2" px="$3" bw={1} bc="$borderColor" ai="center" fd="row" gap="$2">
            <Text fontWeight="700">{t}</Text>
            <Button size="$2" onPress={() => remove(t)}><Text>Quitar</Text></Button>
          </Card>
        ))}
      </XStack>
    </YStack>
  )
}
