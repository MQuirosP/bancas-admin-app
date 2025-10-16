// components/layout/Header.tsx
import React from 'react';
import { useRouter } from 'expo-router';
import { XStack, YStack, Text, Button } from 'tamagui';
import { Menu, LogOut, Sun, Moon } from '@tamagui/lucide-icons';
import { useUIStore } from '../../store/ui.store';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { toggleDrawer } = useUIStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <XStack
      backgroundColor="$backgroundStrong"
      paddingHorizontal="$4"
      paddingVertical="$3"
      alignItems="center"
      justifyContent="space-between"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      height={64}
      elevation={2}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={4}
    >
      {/* Left: Menu button + Logo */}
      <XStack alignItems="center" gap="$3">
        {/* BOTÓN HAMBURGUESA */}
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

        <XStack alignItems="center" gap="$2">
          <YStack
            width={40}
            height={40}
            backgroundColor="$primary"
            borderRadius="$3"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="$6" fontWeight="bold" color="white">
              B
            </Text>
          </YStack>
          <Text fontSize="$6" fontWeight="600" color="$textPrimary">
            Bancas Admin
          </Text>
        </XStack>
      </XStack>

      {/* Right: Theme toggle + User badge + Logout */}
      <XStack alignItems="center" gap="$3">
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
        <XStack
          alignItems="center"
          gap="$2"
          backgroundColor="$backgroundHover"
          paddingHorizontal="$3"
          paddingVertical="$2"
          borderRadius="$3"
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
          <YStack display="none" $gtSm={{ display: 'flex' }}>
            <Text fontSize="$3" fontWeight="500" color="$textPrimary">
              {user?.name || 'Usuario'}
            </Text>
            <Text fontSize="$1" color="$textTertiary">
              {user?.role || 'ROL'}
            </Text>
          </YStack>
        </XStack>

        {/* Logout Button */}
        <Button
          size="$3"
          chromeless
          icon={<LogOut size={20} color="$red10" />}
          onPress={handleLogout}
          hoverStyle={{ backgroundColor: '$red2' }}
          pressStyle={{ scale: 0.95 }}
          borderRadius="$3"
          padding="$2"
        />
      </XStack>
    </XStack>
  );
};