import React from 'react';
import { XStack, YStack, Text, Button } from 'tamagui';
import { Menu, LogOut, User } from '@tamagui/lucide-icons';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'expo-router';

export const Header: React.FC = () => {
  const { toggleDrawer } = useUIStore();
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await clearAuth();
    router.replace('/login');
  };

  return (
    <XStack
      backgroundColor="$headerBg"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      paddingHorizontal="$4"
      paddingVertical="$3"
      alignItems="center"
      justifyContent="space-between"
      height={64}
      shadowColor="$shadowColor"
      shadowOpacity={0.1}
      shadowRadius={8}
      elevation={4}
      zIndex="$header"
    >
      {/* Left: Hamburger */}
      <Button
        size="$3"
        chromeless
        icon={Menu}
        onPress={toggleDrawer}
        accessibilityLabel="Abrir menú"
        accessibilityRole="button"
        hoverStyle={{ backgroundColor: '$backgroundHover' }}
        pressStyle={{ backgroundColor: '$backgroundPress' }}
        padding="$2"
        borderRadius="$2"
      />

      {/* Center: Title */}
      <YStack flex={1} alignItems="center">
        <Text 
          fontSize="$7" 
          fontWeight="600" 
          color="$textPrimary"
          letterSpacing={-0.5}
        >
          Bancas Admin
        </Text>
      </YStack>

      {/* Right: User + Logout */}
      <XStack gap="$3" alignItems="center">
        {/* User badge */}
        <XStack
          gap="$2"
          alignItems="center"
          backgroundColor="$backgroundHover"
          paddingHorizontal="$3"
          paddingVertical="$2"
          borderRadius="$3"
        >
          <User size={16} color="$primary" />
          <Text 
            fontSize="$3" 
            color="$textSecondary" 
            fontWeight="500"
          >
            {user?.code || 'USR-0000'}
          </Text>
        </XStack>

        {/* Logout button */}
        <Button
          size="$3"
          icon={LogOut}
          onPress={handleLogout}
          accessibilityLabel="Cerrar sesión"
          accessibilityRole="button"
          backgroundColor="$error"
          color="white"
          borderRadius="$3"
          hoverStyle={{ 
            backgroundColor: '$errorHover',
            scale: 1.05,
          }}
          pressStyle={{ scale: 0.95 }}
        >
          Salir
        </Button>
      </XStack>
    </XStack>
  );
};