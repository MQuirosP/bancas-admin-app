import React from 'react';
import { YStack, XStack, Text, Button, ScrollView } from 'tamagui';
import { useRouter } from 'expo-router';
import { Plus } from '@tamagui/lucide-icons';

export default function LoteriasListScreen() {
  const router = useRouter();

  return (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$8" fontWeight="bold" color="$color">
            Loterías
          </Text>
          <Button icon={Plus} onPress={() => router.push('/admin/loterias/nueva')}>
            Nueva Lotería
          </Button>
        </XStack>
        <Text color="$secondary">Implementar CRUD de loterías</Text>
      </YStack>
    </ScrollView>
  );
}