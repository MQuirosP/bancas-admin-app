// app/admin/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { YStack } from 'tamagui';
import { useAuthStore } from '../../store/auth.store';

export default function AdminLayout() {
  const { user } = useAuthStore();

  // Verificar que el usuario tenga rol ADMIN
  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="configuracion" />
        <Stack.Screen name="bancas/index" />
        <Stack.Screen name="bancas/[id]" />
        <Stack.Screen name="bancas/nueva" />
        <Stack.Screen name="loterias/index" />
        <Stack.Screen name="loterias/[id]" />
        <Stack.Screen name="loterias/nueva" />
        <Stack.Screen name="multipliers/index" />
        <Stack.Screen name="multipliers/[id]" />
        <Stack.Screen name="multipliers/nuevo" />
        <Stack.Screen name="reportes/index" />
        <Stack.Screen name="restrictions/index" />
        <Stack.Screen name="restrictions/[id]" />
        <Stack.Screen name="restrictions/nueva" />
        <Stack.Screen name="sorteos/index" />
        <Stack.Screen name="sorteos/[id]" />
        <Stack.Screen name="tickets/index" />
        <Stack.Screen name="usuarios/index" />
        <Stack.Screen name="usuarios/[id]" />
        <Stack.Screen name="usuarios/nuevo" />
        <Stack.Screen name="ventanas/index" />
        <Stack.Screen name="ventanas/[id]" />
        <Stack.Screen name="ventanas/nueva" />
      </Stack>
    </YStack>
  );
}