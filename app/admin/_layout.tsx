// app/admin/_layout.tsx
import React, { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, Theme } from 'tamagui';
import { Menu, LogOut, Sun, Moon } from '@tamagui/lucide-icons';
import { useAuthStore } from '../../store/auth.store';

export default function AdminLayout() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Verificar que el usuario tenga rol ADMIN
  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <YStack flex={1} backgroundColor={isDark ? '#121214' : '#ffffff'}>
      {/* Header - SIEMPRE OSCURO */}
      <XStack
        backgroundColor="#1a1a1d"
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderBottomWidth={1}
        borderBottomColor="#2a2a2f"
        alignItems="center"
        height={64}
      >
        {/* Botón hamburguesa */}
        <Button
          size="$3"
          circular
          backgroundColor="rgba(255,255,255,0.1)"
          onPress={() => setMenuOpen(!menuOpen)}
          marginRight="$3"
          pressStyle={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
        >
          <Menu size={20} color="#ffffff" />
        </Button>

        {/* Logo y título - CENTRADO */}
        <XStack flex={1} gap="$3" alignItems="center" justifyContent="center">
          <YStack
            width={40}
            height={40}
            backgroundColor="#6366f1"
            borderRadius="$3"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize={24}>🎰</Text>
          </YStack>
          <Text fontSize="$6" fontWeight="700" color="#ffffff" numberOfLines={1}>
            Administración de Banca
          </Text>
        </XStack>

        {/* Actions */}
        <XStack gap="$2" alignItems="center">
          {/* Toggle tema */}
          <Button
            size="$3"
            circular
            backgroundColor="rgba(255,255,255,0.1)"
            onPress={toggleTheme}
            pressStyle={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            {isDark ? <Sun size={18} color="#ffffff" /> : <Moon size={18} color="#ffffff" />}
          </Button>

          {/* User badge */}
          <XStack
            backgroundColor="rgba(255,255,255,0.1)"
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$3"
            gap="$2"
            alignItems="center"
            display="none"
            $gtXs={{ display: 'flex' }}
          >
            <YStack
              width={32}
              height={32}
              backgroundColor="#6366f1"
              borderRadius="$2"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="$4" fontWeight="600" color="white">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </Text>
            </YStack>
            <YStack>
              <Text fontSize="$3" fontWeight="600" color="#ffffff">
                {user?.name}
              </Text>
              <Text fontSize="$2" color="#a1a1aa">
                ADMIN
              </Text>
            </YStack>
          </XStack>

          {/* Logout */}
          <Button
            size="$3"
            circular
            backgroundColor="rgba(239, 68, 68, 0.2)"
            onPress={handleLogout}
            pressStyle={{ backgroundColor: 'rgba(239, 68, 68, 0.3)' }}
            hoverStyle={{ backgroundColor: 'rgba(239, 68, 68, 0.25)' }}
          >
            <LogOut size={18} color="#f87171" />
          </Button>
        </XStack>
      </XStack>

      {/* Content */}
      <Theme name={isDark ? 'dark' : 'light'}>
        <YStack flex={1}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
          </Stack>
        </YStack>
      </Theme>

      {/* Footer */}
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