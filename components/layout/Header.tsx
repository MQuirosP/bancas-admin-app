// components/layout/Header.tsx
import React from 'react';
import { useRouter } from 'expo-router';
import { XStack, YStack, Text, Button } from 'tamagui';
import { Menu, LogOut, User, Sun, Moon } from '@tamagui/lucide-icons';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { useUIStore } from '@/store/ui.store';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { toggleDrawer } = useUIStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <XStack
      backgroundColor="$background"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      paddingHorizontal="$4"
      paddingVertical="$3"
      alignItems="center"
      justifyContent="space-between"
      height={64}
    >
      {/* Left: Menu + Logo */}
      <XStack gap="$3" alignItems="center">
        <Button
          icon={Menu}
          size="$3"
          chromeless
          circular
          onPress={toggleDrawer}
          hoverStyle={{
            backgroundColor: '$backgroundHover',
          }}
          pressStyle={{
            backgroundColor: '$backgroundPress',
          }}
          aria-label="Abrir menú"
        />
        <Text fontSize="$6" fontWeight="700" color="$color">
          Bancas Admin
        </Text>
      </XStack>

      {/* Right: Theme Toggle + User Info + Logout */}
      <XStack gap="$2" alignItems="center">
        {/* Theme Toggle Button */}
        <Button
          icon={isDark ? Sun : Moon}
          size="$3"
          chromeless
          circular
          onPress={toggleTheme}
          backgroundColor="$backgroundHover"
          hoverStyle={{
            backgroundColor: '$backgroundPress',
            scale: 1.05,
          }}
          pressStyle={{
            scale: 0.95,
          }}
          aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        />

        {/* User Badge */}
        <XStack
          gap="$2"
          alignItems="center"
          backgroundColor="$backgroundHover"
          paddingHorizontal="$3"
          paddingVertical="$2"
          borderRadius="$4"
          hoverStyle={{
            backgroundColor: '$backgroundPress',
          }}
        >
          <YStack
            width={32}
            height={32}
            backgroundColor="$blue10"
            borderRadius="$3"
            alignItems="center"
            justifyContent="center"
          >
            {user?.name ? (
              <Text fontSize="$4" fontWeight="700" color="white">
                {user.name.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <User size={16} color="white" />
            )}
          </YStack>
          <YStack display="none" $gtSm={{ display: 'flex' }}>
            <Text fontSize="$3" fontWeight="600" color="$color">
              {user?.name || 'Usuario'}
            </Text>
            <Text fontSize="$1" color="$colorTranslucent">
              {user?.role || 'ROL'}
            </Text>
          </YStack>
        </XStack>

        {/* Logout Button */}
        <Button
          size="$3"
          icon={LogOut}
          onPress={handleLogout}
          backgroundColor="$red9"
          color="white"
          borderRadius="$3"
          hoverStyle={{
            backgroundColor: '$red10',
            scale: 1.05,
          }}
          pressStyle={{
            backgroundColor: '$red8',
            scale: 0.95,
          }}
          fontWeight="600"
          aria-label="Cerrar sesión"
        >
          <Text display="none" $gtSm={{ display: 'flex' }} color="white" fontWeight="600">
            Salir
          </Text>
        </Button>
      </XStack>
    </XStack>
  );
}