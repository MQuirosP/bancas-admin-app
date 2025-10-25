import React from 'react'
import { YStack, Text } from 'tamagui'
import { Card } from './Card'

export type EmptyStateProps = {
  title?: string
  message?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title = 'No results', message = 'Try adjusting filters or add a new item.' }) => (
  <Card padding="$6" ai="center" jc="center" borderColor="$borderColor" borderWidth={1}>
    <Text fontSize="$5" fontWeight="600">{title}</Text>
    <Text color="$textSecondary" mt="$2">{message}</Text>
  </Card>
)

export default EmptyState

