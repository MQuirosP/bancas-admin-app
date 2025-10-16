// components/layout/UserDropdown.tsx
import React from 'react';
import { YStack, Text, Button, XStack } from 'tamagui';
import { KeyRound, UserCircle, LogOut } from '@tamagui/lucide-icons';
import { Pressable } from 'react-native';

interface UserDropdownProps {
  onClose: () => void;
  onChangePassword: () => void;
  onEditProfile: () => void;
}

export default function UserDropdown({
  onClose,
  onChangePassword,
  onEditProfile,
}: UserDropdownProps) {
  return (
    <>
      {/* Overlay invisible para cerrar el menú */}
      <Pressable
        onPress={onClose}
        style={{
          position: 'static',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 98,
        }}
      />

      {/* Dropdown Menu */}
      <YStack
        position="absolute"
        top={50}
        right={0}
        width={220}
        backgroundColor="#1a1a1d"
        borderRadius="$3"
        borderWidth={1}
        borderColor="#2a2a2f"
        padding="$2"
        zIndex={99}
        shadowColor="rgba(0,0,0,0.5)"
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={0.3}
        shadowRadius={8}
        elevation={8}
      >
        {/* Cambiar Contraseña */}
        <Button
          backgroundColor="transparent"
          color="#ffffff"
          justifyContent="flex-start"
          paddingHorizontal="$3"
          paddingVertical="$3"
          borderRadius="$2"
          onPress={onChangePassword}
          pressStyle={{
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
          }}
          hoverStyle={{
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
          }}
        >
          <XStack gap="$3" alignItems="center" width="100%">
            <KeyRound size={18} color="#ffffff" />
            <Text fontSize="$3" fontWeight="500" color="#ffffff">
              Cambiar Contraseña
            </Text>
          </XStack>
        </Button>

        {/* Editar Perfil */}
        <Button
          backgroundColor="transparent"
          color="#ffffff"
          justifyContent="flex-start"
          paddingHorizontal="$3"
          paddingVertical="$3"
          borderRadius="$2"
          onPress={onEditProfile}
          pressStyle={{
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
          }}
          hoverStyle={{
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
          }}
        >
          <XStack gap="$3" alignItems="center" width="100%">
            <UserCircle size={18} color="#ffffff" />
            <Text fontSize="$3" fontWeight="500" color="#ffffff">
              Información Personal
            </Text>
          </XStack>
        </Button>
      </YStack>
    </>
  );
}