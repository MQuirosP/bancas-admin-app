// components/layout/Drawer.tsx
import React from 'react';
import { Animated, Pressable, StyleSheet, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, ScrollView } from 'tamagui';
import {
  Home,
  Building2,
  Users,
  Package,
  TrendingUp,
  Settings,
  X,
  Store,
  Trophy,
  Shield,
  BarChart3,
  FileText,
  Ticket,
  DollarSign,
  Calendar,
} from '@tamagui/lucide-icons';
import { useAuthStore } from '../../store/auth.store';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  roles: string[];
  route?: string;
  dividerAfter?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Drawer({ isOpen, onClose }: DrawerProps) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // ========== MENÚ POR ROL ==========
  const getMenuItems = (): MenuItem[] => {
    if (user?.role === 'ADMIN') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          roles: ['ADMIN'],
          route: '/admin',
        },
        {
          id: 'bancas',
          label: 'Bancas',
          icon: Building2,
          roles: ['ADMIN'],
          route: '/admin/bancas',
        },
        {
          id: 'ventanas',
          label: 'Ventanas',
          icon: Store,
          roles: ['ADMIN'],
          route: '/admin/ventanas',
        },
        {
          id: 'usuarios',
          label: 'Usuarios',
          icon: Users,
          roles: ['ADMIN'],
          route: '/admin/usuarios',
          dividerAfter: true,
        },
        {
          id: 'loterias',
          label: 'Loterías',
          icon: Trophy,
          roles: ['ADMIN'],
          route: '/admin/loterias',
        },
        {
          id: 'sorteos',
          label: 'Sorteos',
          icon: Calendar,
          roles: ['ADMIN'],
          route: '/admin/sorteos',
        },
        {
          id: 'multipliers',
          label: 'Multiplicadores',
          icon: BarChart3,
          roles: ['ADMIN'],
          route: '/admin/multipliers',
        },
        {
          id: 'restrictions',
          label: 'Restricciones',
          icon: Shield,
          roles: ['ADMIN'],
          route: '/admin/restrictions',
          dividerAfter: true,
        },
        {
          id: 'tickets',
          label: 'Tickets',
          icon: Ticket,
          roles: ['ADMIN'],
          route: '/admin/tickets',
        },
        {
          id: 'reportes',
          label: 'Reportes',
          icon: TrendingUp,
          roles: ['ADMIN'],
          route: '/admin/reportes',
          dividerAfter: true,
        },
        {
          id: 'configuracion',
          label: 'Configuración',
          icon: Settings,
          roles: ['ADMIN'],
          route: '/admin/configuracion',
        },
      ];
    }

    if (user?.role === 'VENTANA') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          roles: ['VENTANA'],
          route: '/ventana',
        },
        {
          id: 'tickets',
          label: 'Tickets',
          icon: Ticket,
          roles: ['VENTANA'],
          route: '/ventana/tickets',
        },
        {
          id: 'ventas',
          label: 'Ventas',
          icon: DollarSign,
          roles: ['VENTANA'],
          route: '/ventana/ventas',
          dividerAfter: true,
        },
        {
          id: 'sorteos',
          label: 'Sorteos',
          icon: Calendar,
          roles: ['VENTANA'],
          route: '/ventana/sorteos',
        },
        {
          id: 'restrictions',
          label: 'Restricciones',
          icon: Shield,
          roles: ['VENTANA'],
          route: '/ventana/restrictions',
        },
      ];
    }

    if (user?.role === 'VENDEDOR') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          roles: ['VENDEDOR'],
          route: '/vendedor',
        },
        {
          id: 'nuevo-ticket',
          label: 'Nuevo Ticket',
          icon: Package,
          roles: ['VENDEDOR'],
          route: '/vendedor/tickets/nuevo',
        },
        {
          id: 'mis-tickets',
          label: 'Mis Tickets',
          icon: Ticket,
          roles: ['VENDEDOR'],
          route: '/vendedor/tickets',
        },
      ];
    }

    return [];
  };

  const menuItems = getMenuItems();

  // ========== NAVEGACIÓN ==========
  const handleNavigate = (route?: string) => {
    if (!route) {
      console.warn('No route defined for this menu item');
      return;
    }

    try {
      router.push(route as any);
      onClose();
    } catch (error) {
      console.error('Error navigating:', error);
    }
  };

  // ========== ANIMACIONES ==========
  const [rendered, setRendered] = React.useState(isOpen);
  const overlayOpacity = React.useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  const panelX = React.useRef(new Animated.Value(isOpen ? 0 : -24)).current;
  const panelOpacity = React.useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  React.useEffect(() => {
    if (isOpen) {
      if (!rendered) setRendered(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(panelX, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(panelOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 160,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(panelX, {
          toValue: -12,
          duration: 160,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(panelOpacity, {
          toValue: 0,
          duration: 160,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
  }, [isOpen, rendered, overlayOpacity, panelX, panelOpacity]);

  if (!rendered) return null;

  // ========== RENDER ==========
  return (
    <>
      {/* Overlay con fade IN/OUT */}
      <AnimatedPressable
        onPress={onClose}
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            opacity: overlayOpacity,
          },
        ]}
      />

      {/* Panel con slide + fade IN/OUT */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 280,
          zIndex: 50,
          transform: [{ translateX: panelX }],
          opacity: panelOpacity,
        }}
      >
        <YStack
          f={1}
          backgroundColor="$backgroundHover"
          borderRightWidth={1}
          borderRightColor="$borderColor"
          shadowColor="$color"
          shadowRadius={20}
          shadowOpacity={0.35}
        >
          {/* Header */}
          <XStack
            padding="$4"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
            height={64}
            backgroundColor="$backgroundStrong"
          >
            <Text fontSize="$5" fontWeight="700" color="$textPrimary">
              Menú
            </Text>
            <Button
              size="$3"
              circular
              backgroundColor="$backgroundPress"
              onPress={onClose}
              pressStyle={{ backgroundColor: '$backgroundFocus' }}
              hoverStyle={{ backgroundColor: '$backgroundPress' }}
            >
              <X size={18} color="$textPrimary" />
            </Button>
          </XStack>

          {/* Lista de items */}
          <ScrollView flex={1}>
            <YStack padding="$3" gap="$1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <React.Fragment key={item.id}>
                    <Button
                      backgroundColor="transparent"
                      color="$textPrimary"
                      justifyContent="flex-start"
                      paddingHorizontal="$4"
                      paddingVertical="$3"
                      borderRadius="$3"
                      pressStyle={{ backgroundColor: '$backgroundPress' }}
                      hoverStyle={{ backgroundColor: '$backgroundPress' }}
                      onPress={() => handleNavigate(item.route)}
                    >
                      <XStack gap="$3" alignItems="center" width="100%">
                        <Icon size={20} color="$textSecondary" />
                        <Text fontSize="$4" fontWeight="500" color="$textPrimary">
                          {item.label}
                        </Text>
                      </XStack>
                    </Button>

                    {/* Separador visual */}
                    {item.dividerAfter && (
                      <YStack
                        height={1}
                        backgroundColor="$borderColor"
                        marginVertical="$2"
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </YStack>
          </ScrollView>

          {/* Footer con info del usuario */}
          <YStack
            padding="$4"
            borderTopWidth={1}
            borderTopColor="$borderColor"
            backgroundColor="$backgroundStrong"
          >
            <XStack gap="$3" alignItems="center">
              <YStack
                width={40}
                height={40}
                backgroundColor="$primary"
                borderRadius="$4"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="$5" fontWeight="600" color="white">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </YStack>
              <YStack f={1}>
                <Text 
                  fontSize="$4" 
                  fontWeight="600" 
                  color="$textPrimary" 
                  numberOfLines={1}
                >
                  {user?.name || 'Usuario'}
                </Text>
                <Text fontSize="$2" color="$textTertiary">
                  {user?.role || 'ROL'}
                </Text>
              </YStack>
            </XStack>
          </YStack>
        </YStack>
      </Animated.View>
    </>
  );
}