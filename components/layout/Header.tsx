import React from 'react';
import { XStack, YStack, Text, Button } from 'tamagui';
import { Menu, LogOut } from '@tamagui/lucide-icons';
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
      backgroundColor="$background"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      paddingHorizontal="$4"
      paddingVertical="$3"
      alignItems="center"
      justifyContent="space-between"
      height={56}
      elevation={2}
      zIndex={100}
    >
      {/* Left: Hamburger */}
      <Button
        size="$3"
        chromeless
        icon={Menu}
        onPress={toggleDrawer}
        accessibilityLabel="Abrir menú"
        accessibilityRole="button"
      />

      {/* Center: Title */}
      <YStack flex={1} alignItems="center">
        <Text fontSize="$6" fontWeight="600" color="$color">
          Administración de banca
        </Text>
      </YStack>

      {/* Right: User code + Logout */}
      <XStack gap="$3" alignItems="center">
        <Text fontSize="$3" color="$secondary" fontWeight="500">
          {user?.code || 'USR-0000'}
        </Text>
        <Button
          size="$3"
          theme="red"
          icon={LogOut}
          onPress={handleLogout}
          accessibilityLabel="Cerrar sesión"
          accessibilityRole="button"
        >
          Salir
        </Button>
      </XStack>
    </XStack>
  );
};