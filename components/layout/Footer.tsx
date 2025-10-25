// components/layout/Footer.tsx
import React from 'react'
import { XStack, Text } from 'tamagui'

export const Footer: React.FC = () => {
  return (
    <XStack
      backgroundColor="$headerBg"
      borderTopWidth={1}
      borderTopColor="$borderColor"
      paddingHorizontal="$4"
      paddingVertical="$3"
      justifyContent="center"
      alignItems="center"
      height={56}
    >
      <Text fontSize="$3" color="$textSecondary" fontWeight="400">
        © 2025 Bancas Admin - Todos los derechos reservados
      </Text>
    </XStack>
  )
}
