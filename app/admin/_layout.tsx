// app/admin/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { YStack, XStack, Text, Theme } from 'tamagui';
import { useThemeStore } from '../../store/theme.store';
import { Header } from '../../components/layout/Header';
import Drawer from '../../components/layout/Drawer';
import { useUIStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';

export default function AdminLayout() {
  const { theme } = useThemeStore();
  const { drawerOpen, closeDrawer } = useUIStore();
  const { user } = useAuthStore();

  // Verificar que el usuario tenga rol ADMIN
  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <YStack flex={1}>
      {/* Header - Usa el componente centralizado con imagen */}
      <Header />

      {/* Content - Aplica el tema dinámico */}
      <Theme name={theme}>
        <YStack flex={1}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="configuracion" />
            <Stack.Screen name="bancas/index" />
            <Stack.Screen name="bancas/[id]" />
            <Stack.Screen name="bancas/nueva" />
            <Stack.Screen name="loterias/index" />
            <Stack.Screen name="loterias/[id]" />
            <Stack.Screen name="loterias/nueva" />
            <Stack.Screen name="multipliers/index" />
            <Stack.Screen name="multipliers/[id]" />
            <Stack.Screen name="multipliers/nuevo" />
            <Stack.Screen name="reportes/index" />
            <Stack.Screen name="restrictions/index" />
            <Stack.Screen name="restrictions/[id]" />
            <Stack.Screen name="restrictions/nueva" />
            <Stack.Screen name="sorteos/index" />
            <Stack.Screen name="sorteos/[id]" />
            <Stack.Screen name="tickets/index" />
            <Stack.Screen name="usuarios/index" />
            <Stack.Screen name="usuarios/[id]" />
            <Stack.Screen name="usuarios/nuevo" />
            <Stack.Screen name="ventanas/index" />
            <Stack.Screen name="ventanas/[id]" />
            <Stack.Screen name="ventanas/nueva" />
          </Stack>
        </YStack>
      </Theme>

      {/* Drawer superpuesto */}
      <Drawer isOpen={drawerOpen} onClose={closeDrawer} />

      {/* Footer - SIEMPRE OSCURO */}
      <XStack
        backgroundColor="#1a1a1d"
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderTopWidth={1}
        borderTopColor="#2a2a2f"
        justifyContent="center"
        alignItems="center"
        height={56}
      >
        <Text fontSize="$3" color="#a1a1aa">
          © 2025 Bancas Admin - Todos los derechos reservados
        </Text>
      </XStack>
    </YStack>
  );
}