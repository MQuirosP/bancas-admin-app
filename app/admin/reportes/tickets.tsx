import React from 'react'
import { ScrollView, YStack, Text, Card } from 'tamagui'

export default function ReporteTickets() {
  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold">Reporte de Tickets</Text>
        <Card padding="$4" borderColor="$borderColor" borderWidth={1}>
          <Text color="$textSecondary">Próximamente…</Text>
        </Card>
      </YStack>
    </ScrollView>
  )
}
