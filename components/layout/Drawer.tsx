import React, { useEffect } from 'react';
import { Pressable, Platform } from 'react-native';
import { YStack, XStack, ScrollView, Text, Button } from 'tamagui';
import {
  Home, Building2, Store, Users, Trophy, Ticket, FileText, Settings,
  X as XIcon, BarChart3, Shield,
} from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { useIsMobile } from '../../hooks/useBreakpoint';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';
import { UserRole } from '../../types/auth.types';

type IconType = React.ComponentType<{ size?: number; color?: string }>;

interface MenuItem {
  label: string;
  icon: IconType;
  href: string;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: Home, href: '/', roles: [UserRole.ADMIN, UserRole.VENTANA, UserRole.VENDEDOR] },
  { label: 'Bancas', icon: Building2, href: '/admin/bancas', roles: [UserRole.ADMIN] },
  { label: 'Ventanas', icon: Store, href: '/admin/ventanas', roles: [UserRole.ADMIN] },
  { label: 'Usuarios', icon: Users, href: '/admin/usuarios', roles: [UserRole.ADMIN] },
  { label: 'Loterías', icon: Trophy, href: '/admin/loterias', roles: [UserRole.ADMIN] },
  { label: 'Sorteos', icon: Trophy, href: '/admin/sorteos', roles: [UserRole.ADMIN] },
  { label: 'Multipliers', icon: BarChart3, href: '/admin/multipliers', roles: [UserRole.ADMIN] },
  { label: 'Restricciones', icon: Shield, href: '/admin/restrictions', roles: [UserRole.ADMIN] },
  { label: 'Tickets', icon: Ticket, href: '/admin/tickets', roles: [UserRole.ADMIN] },
  { label: 'Reportes', icon: FileText, href: '/admin/reportes', roles: [UserRole.ADMIN] },
  { label: 'Configuración', icon: Settings, href: '/admin/configuracion', roles: [UserRole.ADMIN] },
  { label: 'Mis Ventas', icon: FileText, href: '/ventana/ventas', roles: [UserRole.VENTANA] },
  { label: 'Sorteos', icon: Trophy, href: '/ventana/sorteos', roles: [UserRole.VENTANA] },
  { label: 'Tickets', icon: Ticket, href: '/ventana/tickets', roles: [UserRole.VENTANA] },
  { label: 'Restricciones', icon: Shield, href: '/ventana/restrictions', roles: [UserRole.VENTANA] },
  { label: 'Mis Tiquetes', icon: Ticket, href: '/vendedor/tickets', roles: [UserRole.VENDEDOR] },
  { label: 'Nuevo Tiquete', icon: Ticket, href: '/vendedor/tickets/nuevo', roles: [UserRole.VENDEDOR] },
];

export const Drawer: React.FC = () => {
  const { drawerOpen, closeDrawer } = useUIStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const isMobile = useIsMobile();

  const filteredItems = menuItems.filter((item) => !!user && item.roles.includes(user.role));

  useEffect(() => {
    if (Platform.OS !== 'web' || !drawerOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  const drawerWidth = isMobile ? '80%' : 320;

  return (
    <>
      {/* Overlay */}
      <Pressable
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 200,
        }}
        onPress={closeDrawer}
        aria-label="Cerrar menú"
        role="button"
      />

      {/* Drawer Panel */}
      <YStack
        position="absolute"
        top={56}
        left={0}
        bottom={48}
        width={drawerWidth}
        backgroundColor="$background"
        borderRightWidth={1}
        borderRightColor="$borderColor"
        elevation={8}
        zIndex={201}
      >
        <XStack
          paddingHorizontal="$4"
          paddingVertical="$3"
          justifyContent="space-between"
          alignItems="center"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <Text fontSize="$5" fontWeight="600">Menú</Text>
          {/* icon como elemento */}
          <Button
            size="$2"
            chromeless
            icon={<XIcon />}
            onPress={closeDrawer}
            aria-label="Cerrar menú"
            role="button"
          />
        </XStack>

        <ScrollView flex={1} padding="$2">
          <YStack gap="$1">
            {filteredItems.map((item) => (
              <Button
                key={item.href}
                size="$4"
                justifyContent="flex-start"
                // ícono dinámico como elemento
                icon={React.createElement(item.icon)}
                onPress={() => {
                  router.push(item.href as any);
                  closeDrawer();
                }}
                theme="alt1"
                aria-label={item.label}
                role="button"
              >
                {item.label}
              </Button>
            ))}
          </YStack>
        </ScrollView>
      </YStack>
    </>
  );
};
