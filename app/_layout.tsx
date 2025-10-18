// app/_layout.tsx
import React from 'react'
import '../lib/patch-animated'
import { Stack } from 'expo-router'
import { TamaguiProvider, Theme } from 'tamagui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import config from '@/tamagui.config'
import { useThemeStore } from '../store/theme.store'
import { SystemThemeSync } from '../components/theme/SystemThemeSync'
import { MainLayout } from '../components/layout/MainLayout'
import { LogBox } from 'react-native'
import { useAuthStore } from '../store/auth.store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 * 5 },
  },
})

LogBox.ignoreLogs(['Animated: `useNativeDriver` is not supported'])

function RootLayoutContent() {
  const { theme } = useThemeStore()
  const { isAuthenticated } = useAuthStore()

  // Asegura que el tema exista en config.themes
  const safeTheme =
    theme && (theme in (config.themes as Record<string, unknown>))
      ? theme
      : 'light'

  if (!isAuthenticated) {
    return (
      <Theme name={safeTheme}>
        <Stack
          screenOptions={{ headerShown: false }}
          // opcional: fija ruta inicial cuando no hay sesión
          // initialRouteName="(auth)"
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
        </Stack>
      </Theme>
    )
  }

  return (
    <Theme name={safeTheme}>
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
  )
}

export default function RootLayout() {
  const { theme } = useThemeStore()
  const safeTheme =
    theme && (theme in (config.themes as Record<string, unknown>))
      ? theme
      : 'light'

  return (
    <TamaguiProvider config={config} defaultTheme={safeTheme}>
      <QueryClientProvider client={queryClient}>
        <SystemThemeSync />
        <RootLayoutContent />
      </QueryClientProvider>
    </TamaguiProvider>
  )
}
