import React, { useEffect } from 'react';
import { Pressable, Platform } from 'react-native';
import { YStack, XStack, ScrollView, Text, Button } from 'tamagui';
import {
  Home,
  Building2,
  Store,
  Users,
  Trophy,
  Ticket,
  FileText,
  Settings,
  X,
  BarChart3,
  Shield,
} from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { useIsMobile } from '../../hooks/useBreakpoint.js';
import { useAuthStore } from '../../store/auth.store.js';
import { useUIStore } from '../../store/ui.store.js';
import { UserRole } from '../../types/auth.types.js';

interface MenuItem {
  label: string;
  icon: any;
  href: string;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: Home,
    href: '/',
    roles: [UserRole.ADMIN, UserRole.VENTANA, UserRole.VENDEDOR],
  },
  // Admin items
  { label: 'Bancas', icon: Building2, href: '/admin/bancas', roles: [UserRole.ADMIN] },
  { label: 'Ventanas', icon: Store, href: '/admin/ventanas', roles: [UserRole.ADMIN] },
  { label: 'Usuarios', icon: Users, href: '/admin/usuarios', roles: [UserRole.ADMIN] },
  { label: 'Loterías', icon: Trophy, href: '/admin/loterias', roles: [UserRole.ADMIN] },
  { label: 'Sorteos', icon: Trophy, href: '/admin/sorteos', roles: [UserRole.ADMIN] },
  { label: 'Multipliers', icon: BarChart3, href: '/admin/multipliers', roles: [UserRole.ADMIN] },
  {
    label: 'Restricciones',
    icon: Shield,
    href: '/admin/restrictions',
    roles: [UserRole.ADMIN],
  },
  { label: 'Tickets', icon: Ticket, href: '/admin/tickets', roles: [UserRole.ADMIN] },
  { label: 'Reportes', icon: FileText, href: '/admin/reportes', roles: [UserRole.ADMIN] },
  { label: 'Configuración', icon: Settings, href: '/admin/configuracion', roles: [UserRole.ADMIN] },
  // Ventana items
  { label: 'Mis Ventas', icon: FileText, href: '/ventana/ventas', roles: [UserRole.VENTANA] },
  { label: 'Sorteos', icon: Trophy, href: '/ventana/sorteos', roles: [UserRole.VENTANA] },
  { label: 'Tickets', icon: Ticket, href: '/ventana/tickets', roles: [UserRole.VENTANA] },
  {
    label: 'Restricciones',
    icon: Shield,
    href: '/ventana/restrictions',
    roles: [UserRole.VENTANA],
  },
  // Vendedor items
  {
    label: 'Mis Tiquetes',
    icon: Ticket,
    href: '/vendedor/tickets',
    roles: [UserRole.VENDEDOR],
  },
  {
    label: 'Nuevo Tiquete',
    icon: Ticket,
    href: '/vendedor/tickets/nuevo',
    roles: [UserRole.VENDEDOR],
  },
];

export const Drawer: React.FC = () => {
  const { drawerOpen, closeDrawer } = useUIStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const isMobile = useIsMobile();

  const filteredItems = menuItems.filter((item) => user && item.roles.includes(user.role));

  useEffect(() => {
    if (Platform.OS === 'web' && drawerOpen) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeDrawer();
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  const drawerWidth = isMobile ? '80%' : 320;

  return (
    <>
      {/* Overlay */}
      <Pressable
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 200,
        }}
        onPress={closeDrawer}
        accessibilityLabel="Cerrar menú"
        accessibilityRole="button"
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
          <Text fontSize="$5" fontWeight="600">
            Menú
          </Text>
          <Button
            size="$2"
            chromeless
            icon={X}
            onPress={closeDrawer}
            accessibilityLabel="Cerrar menú"
            accessibilityRole="button"
          />
        </XStack>

        <ScrollView flex={1} padding="$2">
          <YStack gap="$1">
            {filteredItems.map((item, index) => (
              <Button
                key={index}
                size="$4"
                justifyContent="flex-start"
                icon={item.icon}
                onPress={() => {
                  router.push(item.href as any);
                  closeDrawer();
                }}
                theme="alt1"
                accessibilityLabel={item.label}
                accessibilityRole="button"
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