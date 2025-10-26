// components/layout/Drawer.tsx
import React from 'react';
import { Animated, Pressable, StyleSheet, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView, useThemeName } from 'tamagui';
import { Button } from '@/components/ui'
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
  const themeName = useThemeName()
  const iconColor = themeName === 'dark' ? '#ffffff' : '#000000'
  const isDark = themeName === 'dark'
  const panelBg = isDark ? 'rgba(20,20,24,0.75)' : 'rgba(255,255,255,0.75)'
  const hoverBorder = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(120,120,120,0.28)'

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
  const isAdmin = user?.role === 'ADMIN'

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
  const panelY = React.useRef(new Animated.Value(isOpen ? 0 : -40)).current;
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
        Animated.timing(panelY, {
          toValue: 0,
          duration: 220,
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
        Animated.timing(panelY, {
          toValue: -24,
          duration: 180,
          easing: Easing.inOut(Easing.cubic),
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
  }, [isOpen, rendered, overlayOpacity, panelY, panelOpacity]);

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
          width: 300,
          zIndex: 50,
          transform: [{ translateY: panelY }],
          opacity: panelOpacity,
        }}
      >
        <YStack
          backgroundColor={panelBg as any}
          borderRightWidth={1}
          borderRightColor="$borderColor"
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
              <X size={18} color={iconColor} />
            </Button>
          </XStack>

          {/* Lista de items mínima: Dashboard, Panel Administrativo, Configuración + usuario */}
          <YStack padding="$3" gap="$1">
            {isAdmin ? (
              <>
                {/* Dashboard (métricas) */}
                <Button backgroundColor="transparent" justifyContent="flex-start" paddingHorizontal="$4" paddingVertical="$3" borderRadius="$3" bw={1} bc="transparent" animation="quick" style={{ transition: 'all 160ms ease' }} pressStyle={{ backgroundColor: '$backgroundPress' }} hoverStyle={{ backgroundColor: '$backgroundPress', borderColor: hoverBorder, shadowColor: hoverBorder as any, shadowOpacity: 0.35, shadowRadius: 8 }} onPress={() => handleNavigate('/admin/dashboard')}>
                  <XStack gap="$3" alignItems="center" width="100%"><Home size={20} color={iconColor} /><Text fontSize="$4" fontWeight="500" color="$textPrimary">Dashboard</Text></XStack>
                </Button>

                {/* Panel Administrativo (hub) */}
                <Button variant="ghost" justifyContent="flex-start" paddingHorizontal="$4" paddingVertical="$3" borderRadius="$3" bw={1} bc="transparent" animation="quick" style={{ transition: 'all 160ms ease' }} pressStyle={{ backgroundColor: '$backgroundPress' }} hoverStyle={{ backgroundColor: '$backgroundPress', borderColor: hoverBorder, shadowColor: hoverBorder as any, shadowOpacity: 0.35, shadowRadius: 8 }} onPress={() => handleNavigate('/admin')}>
                  <XStack gap="$3" alignItems="center" width="100%"><Store size={20} color={iconColor} /><Text fontSize="$4" fontWeight="500" color="$textPrimary">Panel Administrativo</Text></XStack>
                </Button>

                {/* Configuración */}
                <YStack height={1} backgroundColor="$borderColor" marginVertical="$2" />
                <Button variant="ghost" justifyContent="flex-start" paddingHorizontal="$4" paddingVertical="$3" borderRadius="$3" bw={1} bc="transparent" animation="quick" style={{ transition: 'all 160ms ease' }} pressStyle={{ backgroundColor: '$backgroundPress' }} hoverStyle={{ backgroundColor: '$backgroundPress', borderColor: hoverBorder, shadowColor: hoverBorder as any, shadowOpacity: 0.35, shadowRadius: 8 }} onPress={() => handleNavigate('/admin/configuracion')}>
                  <XStack gap="$3" alignItems="center" width="100%"><Settings size={20} color={iconColor} /><Text fontSize="$4" fontWeight="500" color="$textPrimary">Configuración</Text></XStack>
                </Button>

                {/* Usuario */}
                <YStack height={1} backgroundColor="$borderColor" marginVertical="$2" />
                <XStack gap="$3" alignItems="center" paddingHorizontal="$4" paddingVertical="$3">
                  <YStack width={40} height={40} backgroundColor="$primary" borderRadius="$4" alignItems="center" justifyContent="center">
                    <Text fontSize="$5" fontWeight="600" color="white">{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
                  </YStack>
                  <YStack>
                    <Text fontSize="$4" fontWeight="600" color="$textPrimary" numberOfLines={1}>{user?.name || 'Usuario'}</Text>
                    <Text fontSize="$2" color="$textTertiary">{user?.role || 'ROL'}</Text>
                  </YStack>
                </XStack>
              </>
            ) : (
              menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <React.Fragment key={item.id}>
                    <Button variant="ghost" backgroundColor="transparent" justifyContent="flex-start" paddingHorizontal="$4" paddingVertical="$3" borderRadius="$3" bw={1} bc="transparent" animation="quick" style={{ transition: 'all 160ms ease' }} pressStyle={{ backgroundColor: '$backgroundPress' }} hoverStyle={{ backgroundColor: '$backgroundPress', borderColor: hoverBorder, shadowColor: hoverBorder as any, shadowOpacity: 0.35, shadowRadius: 8 }} onPress={() => handleNavigate(item.route)}>
                      <XStack gap="$3" alignItems="center" width="100%"><Icon size={20} color={iconColor} /><Text fontSize="$4" fontWeight="500" color="$textPrimary">{item.label}</Text></XStack>
                    </Button>
                    {item.dividerAfter && (<YStack height={1} backgroundColor="$borderColor" marginVertical="$2" />)}
                  </React.Fragment>
                )
              })
            )}
          </YStack>

          
        </YStack>
      </Animated.View>
    </>
  );
}
