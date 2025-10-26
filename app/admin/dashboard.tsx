import React from 'react'
import { ScrollView, YStack, Text, Separator, Card } from 'tamagui'

export default function AdminRealDashboard() {
  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="700" color="$textPrimary">Dashboard</Text>
        <Card padding="$4" borderColor="$borderColor" borderWidth={1} bg="$backgroundHover">
          <Text color="$textSecondary">En construcción</Text>
        </Card>
        <Separator />
        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="700" color="$textPrimary">Accesos rápidos</Text>
          <Text color="$textSecondary">Panel administrativo y reportes disponibles desde el menú lateral.</Text>
        </YStack>
      </YStack>
    </ScrollView>
  )
}
