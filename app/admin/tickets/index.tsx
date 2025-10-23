import React from 'react';
import { YStack, XStack, Text, Button, ScrollView } from 'tamagui';
import { useRouter } from 'expo-router';
import { Plus } from '@tamagui/lucide-icons';

export default function TicketsListScreen() {
  const router = useRouter();

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$8" fontWeight="bold" color="$color">
            Tickets
          </Text>
          <Button
            icon={Plus}
            onPress={() => router.push('/admin/tickets/nuevo')}
            bg="$primary"
            hoverStyle={{ scale: 1.02 }}
            pressStyle={{ bg: '$primaryPress', scale: 0.98 }}
          >
            Agregar
          </Button>
        </XStack>
        <Text color="$textSecondary">
          Implementar CRUD de tickets de lotería
        </Text>
      </YStack>
    </ScrollView>
  );
}