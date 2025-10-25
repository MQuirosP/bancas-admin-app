import React from 'react'
import { YStack, XStack, Text } from 'tamagui'

export const Table: React.FC<React.ComponentProps<typeof YStack>> = ({ children, ...rest }) => (
  <YStack bw={1} bc="$borderColor" br="$3" overflow="hidden" {...rest}>
    {children}
  </YStack>
)

export const THead: React.FC<React.ComponentProps<typeof XStack>> = ({ children, ...rest }) => (
  <XStack bg="$backgroundHover" bw={0} px="$3" py="$2" {...rest}>
    {children}
  </XStack>
)

export const TBody: React.FC<React.ComponentProps<typeof YStack>> = ({ children, ...rest }) => (
  <YStack {...rest}>{children}</YStack>
)

export const Tr: React.FC<React.ComponentProps<typeof XStack>> = ({ children, ...rest }) => (
  <XStack bwT={1} bc="$borderColor" px="$3" py="$2" {...rest}>
    {children}
  </XStack>
)

export const Th: React.FC<React.ComponentProps<typeof Text>> = ({ children, ...rest }) => (
  <Text fontWeight="700" color="$textSecondary" {...rest}>{children}</Text>
)

export const Td: React.FC<React.ComponentProps<typeof Text>> = ({ children, ...rest }) => (
  <Text {...rest}>{children}</Text>
)

export default { Table, THead, TBody, Tr, Th, Td }
