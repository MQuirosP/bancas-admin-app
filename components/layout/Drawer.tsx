// components/layout/Drawer.tsx
import React from 'react';
import { YStack, XStack, Text, Button, ScrollView } from 'tamagui';
import { 
  Home, 
  Building2, 
  Users, 
  Package, 
  TrendingUp, 
  Settings,
  X 
} from '@tamagui/lucide-icons';
import { useAuthStore } from '@/store/auth.store';
import { Pressable } from 'react-native';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Drawer({ isOpen, onClose }: DrawerProps) {
  const user = useAuthStore((state) => state.user);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['ADMIN', 'VENTANA', 'VENDEDOR'] },
    { id: 'bancas', label: 'Bancas', icon: Building2, roles: ['ADMIN'] },
    { id: 'ventanas', label: 'Ventanas', icon: Building2, roles: ['ADMIN'] },
    { id: 'usuarios', label: 'Usuarios', icon: Users, roles: ['ADMIN'] },
    { id: 'tickets', label: 'Tickets', icon: Package, roles: ['ADMIN', 'VENTANA', 'VENDEDOR'] },
    { id: 'reportes', label: 'Reportes', icon: TrendingUp, roles: ['ADMIN', 'VENTANA'] },
    { id: 'configuracion', label: 'Configuración', icon: Settings, roles: ['ADMIN'] },
  ];

  // Filtrar items según rol del usuario
  const filteredItems = menuItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <Pressable
        onPress={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 40,
        }}
      />

      {/* Drawer */}
      <YStack
        position="absolute"
        top={0}
        left={0}
        bottom={0}
        width={280}
        backgroundColor="#1a1a1d"
        zIndex={50}
        borderRightWidth={1}
        borderRightColor="#2a2a2f"
      >
        {/* Header del drawer */}
        <XStack
          padding="$4"
          alignItems="center"
          justifyContent="space-between"
          borderBottomWidth={1}
          borderBottomColor="#2a2a2f"
          height={64}
        >
          <Text fontSize="$5" fontWeight="700" color="#ffffff">
            Menú
          </Text>
          <Button
            size="$3"
            circular
            backgroundColor="rgba(255,255,255,0.1)"
            onPress={onClose}
            pressStyle={{
              backgroundColor: 'rgba(255,255,255,0.2)',
            }}
          >
            <X size={18} color="#ffffff" />
          </Button>
        </XStack>

        {/* Lista de menú */}
        <ScrollView flex={1}>
          <YStack padding="$3" gap="$2">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  backgroundColor="transparent"
                  color="#ffffff"
                  justifyContent="flex-start"
                  paddingHorizontal="$4"
                  paddingVertical="$3"
                  borderRadius="$3"
                  pressStyle={{
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  }}
                  hoverStyle={{
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  }}
                  onPress={() => {
                    // TODO: Navegar a la ruta correspondiente
                    console.log('Navegar a:', item.id);
                    onClose();
                  }}
                >
                  <XStack gap="$3" alignItems="center" width="100%">
                    <Icon size={20} color="#ffffff" />
                    <Text fontSize="$4" fontWeight="500" color="#ffffff">
                      {item.label}
                    </Text>
                  </XStack>
                </Button>
              );
            })}
          </YStack>
        </ScrollView>

        {/* Footer del drawer con info del usuario */}
        <YStack
          padding="$4"
          borderTopWidth={1}
          borderTopColor="#2a2a2f"
          backgroundColor="rgba(0,0,0,0.2)"
        >
          <XStack gap="$3" alignItems="center">
            <YStack
              width={40}
              height={40}
              backgroundColor="#6366f1"
              borderRadius="$4"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="$5" fontWeight="600" color="white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </YStack>
            <YStack flex={1}>
              <Text fontSize="$4" fontWeight="600" color="#ffffff">
                {user?.name || 'Usuario'}
              </Text>
              <Text fontSize="$2" color="#a1a1aa">
                {user?.role || 'ROL'}
              </Text>
            </YStack>
          </XStack>
        </YStack>
      </YStack>
    </>
  );
}