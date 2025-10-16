// app/(dashboard)/index.tsx
import React from 'react';
import { YStack, XStack, Text, Button, ScrollView } from 'tamagui';
import { Users, Package, TrendingUp } from '@tamagui/lucide-icons';
import { useAuthStore } from '../../store/auth.store';

// Item responsivo: 1 col (mobile), 2 cols (>=sm), 3 cols (>=md)
function GridItem({ children }: { children: React.ReactNode }) {
  return (
    <YStack width="100%" $gtSm={{ width: '48%' }} $gtMd={{ width: '31%' }}>
      {children}
    </YStack>
  );
}

// Recuadro con título arriba-izquierda
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <YStack
      backgroundColor="$backgroundHover"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$4"
      padding="$4"
      gap="$3"
    >
      <Text fontSize="$6" fontWeight="600" color="$textPrimary">
        {title}
      </Text>
      {children}
    </YStack>
  );
}

export default function DashboardScreen() {
  const user = useAuthStore((state) => state.user);

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$6" gap="$6" backgroundColor="$background">
        {/* Header */}
        <YStack gap="$2">
          <Text fontSize="$8" fontWeight="700" color="$textPrimary">
            ¡Bienvenido, {user?.name}!
          </Text>
          <Text fontSize="$5" color="$textSecondary">
            Rol: {user?.role}
          </Text>
        </YStack>

        {/* Stats Cards (responsive grid) */}
        <XStack gap="$3" flexWrap="wrap">
          {user?.role === 'ADMIN' && (
            <>
              <GridItem>
                <StatCard icon={Users} title="Usuarios Totales" value="48" change="+12%" positive />
              </GridItem>
              <GridItem>
                <StatCard icon={Package} title="Tickets Hoy" value="156" change="+8%" positive />
              </GridItem>
              <GridItem>
                <StatCard icon={TrendingUp} title="Ventas del Mes" value="$12,450" change="+23%" positive />
              </GridItem>
            </>
          )}

          {user?.role === 'VENTANA' && (
            <>
              <GridItem>
                <StatCard icon={Package} title="Tickets Hoy" value="42" change="+5%" positive />
              </GridItem>
              <GridItem>
                <StatCard icon={TrendingUp} title="Ventas Hoy" value="$1,250" change="+15%" positive />
              </GridItem>
            </>
          )}

          {user?.role === 'VENDEDOR' && (
            <>
              <GridItem>
                <StatCard icon={Package} title="Mis Tickets Hoy" value="12" change="+3" positive />
              </GridItem>
              <GridItem>
                <StatCard icon={TrendingUp} title="Total Vendido" value="$450" change="+$50" positive />
              </GridItem>
            </>
          )}
        </XStack>

        {/* Quick Actions dentro de un recuadro con título */}
        <SectionCard title="Acciones Rápidas">
          {user?.role === 'ADMIN' && (
            <XStack gap="$3" flexWrap="wrap">
              <Button
                size="$5"
                backgroundColor="$primary"
                color="white"
                onPress={() => {}}
                alignSelf="flex-start"
                width="100%"
                $gtSm={{ width: 'auto' }}
                pressStyle={{ backgroundColor: '$primaryPress' }}
                hoverStyle={{ backgroundColor: '$primaryHover' }}
              >
                Gestionar Bancas
              </Button>

              <Button
                size="$5"
                backgroundColor="$primary"
                color="white"
                onPress={() => {}}
                alignSelf="flex-start"
                width="100%"
                $gtSm={{ width: 'auto' }}
                pressStyle={{ backgroundColor: '$primaryPress' }}
                hoverStyle={{ backgroundColor: '$primaryHover' }}
              >
                Ver Reportes
              </Button>

              {/* Si quieres 3 botones para ADMIN, descomenta este */}
              {
              <Button
                size="$5"
                backgroundColor="$primary"
                color="white"
                onPress={() => {}}
                alignSelf="flex-start"
                width="100%"
                $gtSm={{ width: 'auto' }}
                pressStyle={{ backgroundColor: '$primaryPress' }}
                hoverStyle={{ backgroundColor: '$primaryHover' }}
              >
                Nuevo Ticket
              </Button>
              }
            </XStack>
          )}

          {user?.role === 'VENDEDOR' && (
            <XStack gap="$3" flexWrap="wrap">
              <Button
                size="$5"
                backgroundColor="$primary"
                color="white"
                onPress={() => {}}
                alignSelf="flex-start"
                width="100%"
                $gtSm={{ width: 'auto' }}
                pressStyle={{ backgroundColor: '$primaryPress' }}
                hoverStyle={{ backgroundColor: '$primaryHover' }}
              >
                Nuevo Ticket
              </Button>
            </XStack>
          )}
        </SectionCard>
      </YStack>
    </ScrollView>
  );
}

// Componente auxiliar para las cards de estadísticas
interface StatCardProps {
  icon: any;
  title: string;
  value: string;
  change: string;
  positive?: boolean;
}

function StatCard({ icon: Icon, title, value, change, positive }: StatCardProps) {
  return (
    <YStack
      backgroundColor="$backgroundHover"
      padding="$4"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
      gap="$3"
      hoverStyle={{ backgroundColor: '$backgroundFocus' }}
      pressStyle={{ backgroundColor: '$backgroundPress' }}
    >
      <XStack justifyContent="space-between" alignItems="center">
        <YStack
          width={48}
          height={48}
          backgroundColor="$primary"
          borderRadius="$3"
          alignItems="center"
          justifyContent="center"
        >
          <Icon size={24} color="white" />
        </YStack>
        <YStack alignItems="flex-end" gap="$1">
          <Text fontSize="$2" color={positive ? '$success' : '$error'} fontWeight="600">
            {change}
          </Text>
        </YStack>
      </XStack>

      <YStack gap="$1">
        <Text fontSize="$3" color="$textSecondary">
          {title}
        </Text>
        <Text fontSize="$8" fontWeight="700" color="$textPrimary">
          {value}
        </Text>
      </YStack>
    </YStack>
  );
}
