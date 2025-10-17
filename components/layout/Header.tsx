// components/layout/Header.tsx
import React from 'react';
import { useRouter } from 'expo-router';
import { XStack, YStack, Text, Button } from 'tamagui';
import { Menu, LogOut, Sun, Moon } from '@tamagui/lucide-icons';
import { useUIStore } from '../../store/ui.store';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore, UserRole } from '../../store/auth.store';
import { Image } from 'react-native';

// Función para obtener el título según el rol
const getTitleByRole = (role: UserRole | undefined): string => {
  switch (role) {
    case 'ADMIN':
      return 'Administración de Bancas';
    case 'VENTANA':
      return 'Administración de Ventana';
    case 'VENDEDOR':
      return 'Administración de Vendedor';
    default:
      return 'Bancas Admin';
  }
};

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { toggleDrawer } = useUIStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const pageTitle = getTitleByRole(user?.role);

  return (
    <XStack
      backgroundColor="$backgroundStrong"
      paddingHorizontal="$4"
      paddingVertical="$3"
      alignItems="center"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      height={64}
    >
      {/* Left: Menu button */}
      <XStack alignItems="center" width={100}>
        <Button
          size="$3"
          chromeless
          icon={<Menu size={24} color="$textPrimary" />}
          onPress={toggleDrawer}
          hoverStyle={{ backgroundColor: '$backgroundHover' }}
          pressStyle={{ scale: 0.95 }}
          borderRadius="$3"
          padding="$2"
        />
      </XStack>

      {/* Center: Logo + Title */}
      <XStack flex={1} alignItems="center" justifyContent="center" gap="$3">
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 120, height: 120 }}
          resizeMode="contain"
        />
        <Text fontSize="$6" fontWeight="600" color="$textPrimary">
          {pageTitle}
        </Text>
      </XStack>

      {/* Right: Theme toggle + User badge + Logout */}
      <XStack alignItems="center" gap="$3" width={100} justifyContent="flex-end">
        {/* Theme Toggle */}
        <Button
          size="$3"
          chromeless
          icon={
            theme === 'light' ? (
              <Moon size={20} color="$textSecondary" />
            ) : (
              <Sun size={20} color="$textSecondary" />
            )
          }
          onPress={toggleTheme}
          hoverStyle={{ backgroundColor: '$backgroundHover' }}
          pressStyle={{ scale: 0.95 }}
          borderRadius="$3"
          padding="$2"
        />

        {/* User Badge */}
        {/* <XStack
          alignItems="center"
          gap="$2"
          backgroundColor="$backgroundHover"
          paddingHorizontal="$3"
          paddingVertical="$2"
          borderRadius="$3"
          display="none"
          $gtSm={{ display: 'flex' }}
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
          <YStack>
            <Text fontSize="$3" fontWeight="500" color="$textPrimary">
              {user?.name || 'Usuario'}
            </Text>
            <Text fontSize="$1" color="$textTertiary">
              {user?.role || 'ROL'}
            </Text>
          </YStack>
        </XStack> */}

        {/* Logout Button */}
        <Button
          size="$3"
          chromeless
          icon={<LogOut size={20} color="$error" />}
          onPress={handleLogout}
          hoverStyle={{ backgroundColor: '$backgroundHover' }}
          pressStyle={{ scale: 0.95 }}
          borderRadius="$3"
          padding="$2"
        />
      </XStack>
    </XStack>
  );
};