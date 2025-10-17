// app/ventana/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { YStack } from 'tamagui';
import { useAuthStore } from '../../store/auth.store';

export default function VentanaLayout() {
  const { user } = useAuthStore();

  // Verificar que el usuario tenga rol VENTANA
  if (user?.role !== 'VENTANA') {
    return null;
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="restrictions/index" />
        <Stack.Screen name="sorteos/index" />
        <Stack.Screen name="tickets/index" />
        <Stack.Screen name="ventas/index" />
      </Stack>
    </YStack>
  );
}