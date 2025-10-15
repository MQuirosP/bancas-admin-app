// app/_layout.tsx
import React, { useEffect } from 'react';
import { Slot, SplashScreen } from 'expo-router';
import { TamaguiProvider, Theme } from 'tamagui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useThemeStore } from '@/store/theme.store';
import config from '@/tamagui.config';

// Prevenir que el splash screen se oculte automáticamente
SplashScreen.preventAutoHideAsync();

// Query client para React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

export default function RootLayout() {
  const isDark = useThemeStore((state) => state.isDark);

  useEffect(() => {
    // Ocultar splash screen después de que todo esté listo
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TamaguiProvider config={config} defaultTheme={isDark ? 'dark' : 'light'}>
          <Theme name={isDark ? 'dark' : 'light'}>
            <QueryClientProvider client={queryClient}>
              <Slot />
            </QueryClientProvider>
          </Theme>
        </TamaguiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}