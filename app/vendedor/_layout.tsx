import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { YStack, Text } from 'tamagui';
import { useAuthStore } from '../../store/auth.store';

export default function VendedorLayout() {
  const { user, isAuthenticated, isHydrating } = useAuthStore();

  if (isHydrating) {
    return (
      <YStack f={1} ai="center" jc="center" backgroundColor="$background">
        <Text color="$gray11">Preparando sesión…</Text>
      </YStack>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role !== 'VENDEDOR') {
    const home = user?.role === 'ADMIN' ? '/admin' : '/ventana';
    return <Redirect href={home} />;
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
