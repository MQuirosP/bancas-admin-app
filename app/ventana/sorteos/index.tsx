import React from 'react';
import { YStack, Text, ScrollView } from 'tamagui';

export default function VentanaSorteosScreen() {
  return (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Sorteos
        </Text>
        <Text color="$secondary">Ver sorteos (permisos limitados)</Text>
      </YStack>
    </ScrollView>
  );
}