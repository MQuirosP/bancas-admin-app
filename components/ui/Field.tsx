// components/ui/Field.tsx
import { YStack, Text, styled } from 'tamagui'

export const FieldGroup = styled(YStack, {
  gap: '$2',
  mb: '$2',
})

export const FieldLabel: React.FC<{ children: any; hint?: string }> = ({ children, hint }) => (
  <YStack gap="$1">
    <Text fontWeight="600">{children}</Text>
    {hint ? <Text fontSize="$2" color="$textSecondary">{hint}</Text> : null}
  </YStack>
)

export const FieldError: React.FC<{ message?: string }> = ({ message }) => (
  <Text fontSize="$2" color="$error" minHeight={16} lineHeight={16} opacity={message ? 1 : 0}>
    {message || '\u00A0'}
  </Text>
)
