import React from 'react';
import { YStack, Text, ScrollView } from 'tamagui';

export default function AdminTicketsScreen() {
  return (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Tickets Globales
        </Text>
        <Text color="$textSecondary">
          Implementar consulta global con filtros por banca/ventana/fecha/estado
        </Text>
      </YStack>
    </ScrollView>
  );
}