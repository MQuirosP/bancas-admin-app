// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { TamaguiProvider } from 'tamagui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import tamaguiConfig from '../tamagui.config';
import { useAuthStore } from '@/store/auth.store';

const queryClient = new QueryClient();

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Usuario no autenticado, redirigir a login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Usuario autenticado, redirigir a dashboard
      router.replace('/(dashboard)');
    }
  }, [isAuthenticated, segments, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(dashboard)" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="ventana" />
      <Stack.Screen name="vendedor" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <TamaguiProvider config={tamaguiConfig}>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </TamaguiProvider>
  );
}