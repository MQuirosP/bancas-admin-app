import React from 'react';
import { YStack, Text, ScrollView } from 'tamagui';

export default function VentanaTicketsScreen() {
  return (
    <ScrollView flex={1} backgroundColor={'$background'}>
      <YStack padding="$4" gap="$4">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Tickets de la Ventana
        </Text>
        <Text color="$textSecondary">Implementar lista de tickets de la ventana</Text>
      </YStack>
    </ScrollView>
  );
}