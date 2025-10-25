import React from 'react'
import { Text } from 'tamagui'
import { Card } from './Card'

export type ErrorCardProps = {
  message?: string
}

export const ErrorCard: React.FC<ErrorCardProps> = ({ message = 'An error occurred.' }) => (
  <Card padding="$4" bg="$backgroundHover" borderColor="$error" borderWidth={1}>
    <Text color="$error">{message}</Text>
  </Card>
)

export default ErrorCard

