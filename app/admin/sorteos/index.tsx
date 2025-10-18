import React from 'react';
import { YStack, XStack, Text, Button, ScrollView } from 'tamagui';
import { useRouter } from 'expo-router';
import { Plus } from '@tamagui/lucide-icons';

export default function SorteosListScreen() {
  const router = useRouter();

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$8" fontWeight="bold" color="$color">
            Sorteos
          </Text>
          <Button icon={Plus} onPress={() => router.push('/admin/sorteos/nuevo')}>
            Nuevo Sorteo
          </Button>
        </XStack>
        <Text color="$textSecondary">
          Implementar CRUD de sorteos
        </Text>
      </YStack>
    </ScrollView>
  );
}