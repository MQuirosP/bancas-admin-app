// components/ui/ActiveBadge.tsx
import React from 'react'
import { XStack, Text, Stack } from 'tamagui'
import { CheckCircle2, XCircle } from '@tamagui/lucide-icons'

type ActiveBadgeProps = {
  active: boolean
  compact?: boolean
}

export function ActiveBadge({ active, compact = false }: ActiveBadgeProps) {
  const bg = active ? '$green4' : '$red4'
  const border = active ? '$green8' : '$red8'
  const fg = active ? '$green11' : '$red11'
  const label = active ? 'ACTIVO' : 'INACTIVO'

  return (
    <XStack
      ai="center"
      gap="$1"
      px={compact ? '$2' : '$3'}
      py={compact ? '$1' : '$1'}
      br="$4"
      bg={bg}
      borderWidth={1}
      borderColor={border}
    >
      <Stack ai="center" jc="center">
        {active ? (
          <CheckCircle2 size={14} color="var(--green11)" />
        ) : (
          <XCircle size={14} color="var(--red11)" />
        )}
      </Stack>
      <Text fontSize="$2" fontWeight="700" color={fg}>
        {label}
      </Text>
    </XStack>
  )
}

export default ActiveBadge
