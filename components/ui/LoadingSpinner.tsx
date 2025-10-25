import React from 'react'
import { Spinner, YStack, Text } from 'tamagui'

export type LoadingSpinnerProps = React.ComponentProps<typeof Spinner> & {
  label?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ label, ...rest }) => (
  <YStack ai="center" jc="center" gap="$2">
    <Spinner {...rest} />
    {!!label && <Text color="$textSecondary">{label}</Text>}
  </YStack>
)

export default LoadingSpinner
