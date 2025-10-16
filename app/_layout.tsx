// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { TamaguiProvider } from 'tamagui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import tamaguiConfig from '../tamagui.config';
import { useAuthStore } from '@/store/auth.store';
import { useColorScheme } from 'react-native';

const queryClient = new QueryClient();

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === 'admin';
    const inVentanaGroup = segments[0] === 'ventana';
    const inVendedorGroup = segments[0] === 'vendedor';
    const inDashboard = segments[0] === '(dashboard)';

    console.log('🔍 Navegación:', {
      segments,
      isAuthenticated,
      userRole: user?.role,
      inAuthGroup,
    });

    // Usuario NO autenticado
    if (!isAuthenticated && !inAuthGroup) {
      console.log('➡️ Redirigiendo a login (no autenticado)');
      router.replace('/(auth)/login');
      return;
    }

    // Usuario autenticado
    if (isAuthenticated && user) {
      // Si está en auth, redirigir al dashboard correspondiente
      if (inAuthGroup || inDashboard) {
        const targetRoute = getRoleRoute(user.role);
        console.log(`➡️ Redirigiendo a dashboard de ${user.role}: ${targetRoute}`);
        router.replace(targetRoute as any);
        return;
      }

      // Verificar que está en la ruta correcta según su rol
      const isInCorrectRoute = 
        (user.role === 'ADMIN' && inAdminGroup) ||
        (user.role === 'VENTANA' && inVentanaGroup) ||
        (user.role === 'VENDEDOR' && inVendedorGroup);

      if (!isInCorrectRoute && !inAuthGroup) {
        const targetRoute = getRoleRoute(user.role);
        console.log(`⚠️ Usuario en ruta incorrecta, redirigiendo a: ${targetRoute}`);
        router.replace(targetRoute as any);
      }
    }
  }, [isAuthenticated, segments, isLoading, user]);

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

// Helper para obtener la ruta según el rol
function getRoleRoute(role: 'ADMIN' | 'VENTANA' | 'VENDEDOR'): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'VENTANA':
      return '/ventana';
    case 'VENDEDOR':
      return '/vendedor';
    default:
      return '/(auth)/login';
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme || 'light'}>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </TamaguiProvider>
  );
}