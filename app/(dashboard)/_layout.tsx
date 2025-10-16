// app/(dashboard)/_layout.tsx
import React, { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { YStack, XStack, Text, Button } from 'tamagui';
import { Menu, LogOut, Sun, Moon } from '@tamagui/lucide-icons';
import { useAuthStore } from '@/store/auth.store';
import { useColorScheme } from 'react-native';

export default function DashboardLayout() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    // TODO: Implementar cambio de tema real con Tamagui
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        backgroundColor="$backgroundStrong"
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        alignItems="center"
        justifyContent="space-between"
        height={64}
      >
        {/* Logo y título */}
        <XStack gap="$3" alignItems="center">
          <YStack
            width={40}
            height={40}
            backgroundColor="$primary"
            borderRadius="$3"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize={24}>🎰</Text>
          </YStack>
          <Text fontSize="$6" fontWeight="700" color="$textPrimary">
            Bancas Admin
          </Text>
        </XStack>

        {/* Actions */}
        <XStack gap="$2" alignItems="center">
          {/* Toggle tema */}
          <Button
            size="$3"
            circular
            backgroundColor="$backgroundHover"
            onPress={toggleTheme}
            icon={isDark ? <Sun size={18} color="$textPrimary" /> : <Moon size={18} color="$textPrimary" />}
          />

          {/* User badge */}
          <XStack
            backgroundColor="$backgroundHover"
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$3"
            gap="$2"
            alignItems="center"
          >
            <YStack
              width={32}
              height={32}
              backgroundColor="$primary"
              borderRadius="$2"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="$4" fontWeight="600" color="white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </YStack>
            <Text fontSize="$3" fontWeight="600" color="$textPrimary">
              {user?.name}
            </Text>
          </XStack>

          {/* Logout */}
          <Button
            size="$3"
            circular
            backgroundColor="$backgroundHover"
            onPress={handleLogout}
            icon={<LogOut size={18} color="$error" />}
          />
        </XStack>
      </XStack>

      {/* Content */}
      <YStack flex={1}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </YStack>

      {/* Footer */}
      <XStack
        backgroundColor="$backgroundStrong"
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderTopWidth={1}
        borderTopColor="$borderColor"
        justifyContent="center"
        alignItems="center"
        height={56}
      >
        <Text fontSize="$3" color="$textTertiary">
          © 2025 Bancas Admin - Todos los derechos reservados
        </Text>
      </XStack>
    </YStack>
  );
}