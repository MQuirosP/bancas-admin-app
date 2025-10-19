// app/_layout.tsx
import React, { useEffect } from 'react'
import '../lib/patch-animated'
import { Slot, useRouter, useSegments } from 'expo-router'
import { TamaguiProvider } from 'tamagui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import config from '@/tamagui.config'
import { useThemeStore } from '@/store/theme.store'
import { SystemThemeSync } from '@/components/theme/SystemThemeSync'
import { LogBox } from 'react-native'
import { useAuthStore } from '@/store/auth.store'
import { ToastProvider } from '@/components/ui/Toast'
import { MainLayout } from '@/components/layout/MainLayout'

LogBox.ignoreLogs(['Animated: `useNativeDriver` is not supported'])

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 * 5 },
  },
})

function AuthGateWrapper() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    const inAuth = segments[0] === '(auth)'
    if (!isAuthenticated && !inAuth) router.replace('/(auth)/login')
    if (isAuthenticated && inAuth) router.replace('/') // tu redirección por rol puede ir aquí si quieres
  }, [isAuthenticated, isLoading, segments])

  // ⚠️ IMPORTANTE:
  // - No hay <Stack/> en root
  // - Cuando estás en (auth) rendereas Slot “pelado”
  // - Cuando estás autenticado, envuelves TODO con MainLayout (una sola vez)
  const inAuth = segments[0] === '(auth)'
  if (inAuth) return <Slot />

  return (
    <MainLayout>
      <Slot />
    </MainLayout>
  )
}

export default function RootLayout() {
  const { theme } = useThemeStore()
  const safeTheme =
    theme && (theme in (config.themes as Record<string, unknown>)) ? theme : 'light'

  return (
    <TamaguiProvider config={config} defaultTheme={safeTheme}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider position="top-right">
          <AuthGateWrapper />
        </ToastProvider>
        <SystemThemeSync />
      </QueryClientProvider>
    </TamaguiProvider>
  )
}
