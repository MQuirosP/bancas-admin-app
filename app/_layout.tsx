// app/_layout.tsx
import React from 'react';
import '../lib/patch-animated';
import { Stack } from 'expo-router';
import { TamaguiProvider, Theme } from 'tamagui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import config from '@/tamagui.config';
import { useThemeStore } from '../store/theme.store';
import { SystemThemeSync } from '../components/theme/SystemThemeSync';
import { MainLayout } from '../components/layout/MainLayout';
import { LogBox } from 'react-native';
import { useAuthStore } from '../store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  },
});

LogBox.ignoreLogs([
  'Animated: `useNativeDriver` is not supported',
]);

function RootLayoutContent() {
  const { theme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();

  // Si NO está autenticado, NO mostrar MainLayout (Header/Footer)
  if (!isAuthenticated) {
    return (
      <Theme name={theme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
        </Stack>
      </Theme>
    );
  }

  // Si está autenticado, envolver con MainLayout
  return (
    <Theme name={theme}>
      <MainLayout>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(dashboard)" />
          <Stack.Screen name="admin" />
          <Stack.Screen name="ventana" />
          <Stack.Screen name="vendedor" />
        </Stack>
      </MainLayout>
    </Theme>
  );
}

export default function RootLayout() {
  return (
    <TamaguiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <SystemThemeSync />
        <RootLayoutContent />
      </QueryClientProvider>
    </TamaguiProvider>
  );
}