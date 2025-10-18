import React from 'react';
import { YStack, Text, ScrollView } from 'tamagui';

export default function ReportesScreen() {
  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Reportes
        </Text>
        <Text color="$textSecondary">
          Implementar reportes y estadísticas
        </Text>
      </YStack>
    </ScrollView>
  );
}