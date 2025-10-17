// app/(dashboard)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { YStack, XStack, Text, Theme } from 'tamagui';
import { useThemeStore } from '../../store/theme.store';
import { Header } from '../../components/layout/Header';
import Drawer from '../../components/layout/Drawer';
import { useUIStore } from '../../store/ui.store';

export default function DashboardLayout() {
  const { theme } = useThemeStore();
  const { drawerOpen, closeDrawer } = useUIStore();

  return (
    <YStack flex={1}>
      {/* Header - Usa el componente centralizado */}
      <Header />

      {/* Content - Aplica el tema dinámico */}
      <Theme name={theme}>
        <YStack flex={1}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
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