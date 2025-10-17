import React from 'react';
import { YStack, XStack, Text, Button, ScrollView } from 'tamagui';
import { useRouter } from 'expo-router';
import { Plus } from '@tamagui/lucide-icons';

export default function RestrictionsListScreen() {
  const router = useRouter();

  return (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$8" fontWeight="bold" color="$color">
            Reglas de Restricción
          </Text>
          <Button icon={Plus} onPress={() => router.push('/admin/restrictions/nueva')}>
            Nueva Regla
          </Button>
        </XStack>
        <Text color="$textSecondary">
          Implementar CRUD de restriction rules (number, maxAmount, maxTotal, salesCutoffMinutes, etc.)
        </Text>
      </YStack>
    </ScrollView>
  );
}