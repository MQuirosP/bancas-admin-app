// components/layout/Header.tsx
import React from 'react';
import { useRouter } from 'expo-router';
import { XStack, YStack, Text, Button } from 'tamagui';
import { Menu, LogOut, Sun, Moon } from '@tamagui/lucide-icons';
import { useUIStore } from '../../store/ui.store';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore, UserRole } from '../../store/auth.store';
import { Image } from 'react-native';
import { useIsMobile } from '../../hooks/useBreakpoint';

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
  const isMobile = useIsMobile();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const pageTitle = getTitleByRole(user?.role);

  return (
    <XStack
      backgroundColor="$headerBg"
      paddingHorizontal="$4"
      paddingVertical="$3"
      alignItems="center"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      height={64}
    >
      {/* Left: Menu button */}
      <XStack alignItems="center" minWidth={72}>
        <Button
          size={isMobile ? "$4" : "$5"}
          circular
          chromeless
          icon={Menu}
          scaleIcon={isMobile ? 1.15 : 1.6}
          onPress={toggleDrawer}
          color="$headerTitle"
          hoverStyle={{ backgroundColor: '$headerHover' }}
          pressStyle={{ backgroundColor: '$headerHover' }}
          borderRadius="$3"
          padding={isMobile ? "$1" : "$2"}
        />
      </XStack>

      {/* Center: Logo + Title */}
      <XStack flex={1} alignItems="center" justifyContent="center" gap="$3">
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 120, height: 120 }}
          resizeMode="contain"
        />
        <Text fontSize={isMobile ? "$5" : "$6"} fontWeight="600" color="$headerTitle">
          {pageTitle}
        </Text>
      </XStack>

      {/* Right: Theme toggle + Logout */}
      <XStack alignItems="center" gap={isMobile ? "$1" : "$2"} minWidth={72} justifyContent="flex-end">
        {/* Theme Toggle */}
        <Button
          size={isMobile ? "$4" : "$5"}
          circular
          chromeless
          icon={theme === 'light' ? Moon : Sun}
          scaleIcon={isMobile ? 1.15 : 1.4}
          onPress={toggleTheme}
          color="$headerTitle"
          hoverStyle={{ backgroundColor: '$headerHover' }}
          pressStyle={{ backgroundColor: '$headerHover' }}
          borderRadius="$3"
          padding={isMobile ? "$1" : "$2"}
        />

        {/* Logout Button */}
        <Button
          size={isMobile ? "$4" : "$5"}
          circular
          chromeless
          icon={LogOut}
          scaleIcon={isMobile ? 1.15 : 1.4}
          onPress={handleLogout}
          color="$red8"
          hoverStyle={{ backgroundColor: '$headerHover' }}
          pressStyle={{ backgroundColor: '$headerHover' }}
          borderRadius="$3"
          padding={isMobile ? "$1" : "$2"}
        />
      </XStack>
    </XStack>
  );
};
