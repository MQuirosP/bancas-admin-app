import React from 'react';
import { YStack, Text, ScrollView } from 'tamagui';

export default function VentanaSorteosScreen() {
  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Sorteos
        </Text>
        <Text color="$textSecondary">Ver sorteos (permisos limitados)</Text>
      </YStack>
    </ScrollView>
  );
}