import React from 'react';
import { Animated, Pressable, StyleSheet, Easing } from 'react-native';
import { YStack, XStack, Text, Button, ScrollView } from 'tamagui';
import {
  Home, Building2, Users, Package, TrendingUp, Settings, X,
} from '@tamagui/lucide-icons';
import { useAuthStore } from '../../store/auth.store';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void; // se llama cuando el usuario toca el overlay o el botón cerrar
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Drawer({ isOpen, onClose }: DrawerProps) {
  const user = useAuthStore((s) => s.user);

  // ---------- Items por rol ----------
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['ADMIN', 'VENTANA', 'VENDEDOR'] },
    { id: 'bancas', label: 'Bancas', icon: Building2, roles: ['ADMIN'] },
    { id: 'ventanas', label: 'Ventanas', icon: Building2, roles: ['ADMIN'] },
    { id: 'usuarios', label: 'Usuarios', icon: Users, roles: ['ADMIN'] },
    { id: 'tickets', label: 'Tickets', icon: Package, roles: ['ADMIN', 'VENTANA', 'VENDEDOR'] },
    { id: 'reportes', label: 'Reportes', icon: TrendingUp, roles: ['ADMIN', 'VENTANA'] },
    { id: 'configuracion', label: 'Configuración', icon: Settings, roles: ['ADMIN'] },
  ];
  const filteredItems = menuItems.filter((it) => user?.role && it.roles.includes(user.role));

  // ---------- Animations ----------
  const [rendered, setRendered] = React.useState(isOpen); // controla si se renderiza (para animar salida)
  const overlayOpacity = React.useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  const panelX = React.useRef(new Animated.Value(isOpen ? 0 : -24)).current;
  const panelOpacity = React.useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  React.useEffect(() => {
    if (isOpen) {
      // Montar si no estaba visible
      if (!rendered) setRendered(true);
      // Animación de entrada
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(panelX,        { toValue: 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(panelOpacity,  { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    } else if (rendered) {
      // Animación de salida; luego desmonta
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(panelX,        { toValue: -12, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(panelOpacity,  { toValue: 0, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
  }, [isOpen, rendered, overlayOpacity, panelX, panelOpacity]);

  if (!rendered) return null;

  return (
    <>
      {/* Overlay con fade IN/OUT */}
      <AnimatedPressable
        onPress={onClose}
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40, opacity: overlayOpacity },
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
          backgroundColor="#1a1a1d"
          borderRightWidth={1}
          borderRightColor="#2a2a2f"
          shadowColor="black"
          shadowRadius={20}
          shadowOpacity={0.35}
        >
          {/* Header */}
          <XStack
            padding="$4"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderBottomColor="#2a2a2f"
            height={64}
          >
            <Text fontSize="$5" fontWeight="700" color="#ffffff">Menú</Text>
            <Button
              size="$3"
              circular
              backgroundColor="rgba(255,255,255,0.1)"
              onPress={onClose}
              pressStyle={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <X size={18} color="#ffffff" />
            </Button>
          </XStack>

          {/* Lista */}
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
                    pressStyle={{ backgroundColor: 'rgba(99,102,241,0.2)' }}
                    hoverStyle={{ backgroundColor: 'rgba(99,102,241,0.1)' }}
                    onPress={() => {
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

          {/* Footer */}
          <YStack padding="$4" borderTopWidth={1} borderTopColor="#2a2a2f" backgroundColor="rgba(0,0,0,0.2)">
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
              <YStack f={1}>
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
      </Animated.View>
    </>
  );
}
