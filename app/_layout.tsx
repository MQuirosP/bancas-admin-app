// app/_layout.tsx
import React, { useEffect } from 'react';
import '../lib/patch-animated'; // ✅ Primera línea después de imports de React
import { Slot } from 'expo-router';
import { Stack } from 'expo-router';
import { TamaguiProvider, Theme } from 'tamagui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import config from '@/tamagui.config';
import { useThemeStore } from '../store/theme.store';
import { SystemThemeSync } from '../components/theme/SystemThemeSync';
import { LogBox } from "react-native";

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

  return (
    <Theme name={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(dashboard)" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="ventana" />
        <Stack.Screen name="vendedor" />
      </Stack>
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