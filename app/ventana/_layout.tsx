import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { YStack, Text } from 'tamagui';
import { useAuthStore } from '../../store/auth.store';

export default function VentanaLayout() {
  const { user, isAuthenticated, isHydrating } = useAuthStore();

  if (isHydrating) {
    return (
      <YStack f={1} ai="center" jc="center" bg="$background">
        <Text color="$gray11">Preparando sesión…</Text>
      </YStack>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role !== 'VENTANA') {
    const home = user?.role === 'ADMIN' ? '/admin' : '/vendedor';
    return <Redirect href={home} />;
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
