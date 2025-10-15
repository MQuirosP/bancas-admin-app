import React from 'react';
import { YStack, XStack, Text, Button, ScrollView } from 'tamagui';
import { useRouter } from 'expo-router';
import { Plus } from '@tamagui/lucide-icons';

export default function MultipliersListScreen() {
  const router = useRouter();

  return (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$8" fontWeight="bold" color="$color">
            Multipliers
          </Text>
          <Button icon={Plus} onPress={() => router.push('/admin/multipliers/nuevo')}>
            Nuevo Multiplier
          </Button>
        </XStack>
        <Text color="$secondary">Implementar CRUD de multipliers con restore/soft delete</Text>
      </YStack>
    </ScrollView>
  );
}