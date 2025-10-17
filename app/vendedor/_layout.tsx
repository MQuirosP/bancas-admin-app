// app/vendedor/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { YStack } from 'tamagui';
import { useAuthStore } from '../../store/auth.store';

export default function VendedorLayout() {
  const { user } = useAuthStore();

  // Verificar que el usuario tenga rol VENDEDOR
  if (user?.role !== 'VENDEDOR') {
    return null;
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="tickets/index" />
        <Stack.Screen name="tickets/nuevo" />
      </Stack>
    </YStack>
  );
}