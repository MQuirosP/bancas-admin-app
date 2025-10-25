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
import { ErrorBoundary } from '@/components/ErrorBoundary' // importamos el boundary
import { installGlobalErrorHooks } from '../lib/global-error-hooks'

installGlobalErrorHooks()

LogBox.ignoreLogs(['Animated: `useNativeDriver` is not supported'])

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 * 5 },
  },
})

function AuthGateWrapper() {  
  const { isAuthenticated, isHydrating } = useAuthStore();  
  const segments = useSegments();  
  
  // ELIMINADO TODO EL useEffect  
  // Ya no se necesita este useEffect porque:  
  // 1. app/index.tsx ya maneja la redirección inicial  
  // 2. Los layouts de rol ya manejan la protección  
  
  const inAuth = segments[0] === '(auth)';  
  
  if (inAuth) {  
    return (  
      <ErrorBoundary>  
        <Slot />  
      </ErrorBoundary>  
    );  
  }  
  
  return (  
    <ErrorBoundary>  
      <MainLayout>  
        <Slot />  
      </MainLayout>  
    </ErrorBoundary>  
  );  
}

export default function RootLayout() {
  const { theme } = useThemeStore()
  const safeTheme = theme && (theme in (config.themes as Record<string, unknown>)) ? theme : 'light'

  return (
    <TamaguiProvider config={config} defaultTheme={safeTheme}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider position="top-right">
          {/* el ErrorBoundary vive aquí adentro, no fuera, para que use Tamagui/Toast */}
          <AuthGateWrapper />
        </ToastProvider>
        <SystemThemeSync />
      </QueryClientProvider>
    </TamaguiProvider>
  )
}
