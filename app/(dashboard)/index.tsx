// app/(dashboard)/index.tsx
import React from 'react';
import { YStack, XStack, Text, Button, ScrollView } from 'tamagui';
import { BarChart3, Users, Package, TrendingUp } from '@tamagui/lucide-icons';
import { useAuthStore } from '@/store/auth.store';

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

        {/* Stats Cards */}
        <YStack gap="$4">
          {user?.role === 'ADMIN' && (
            <>
              <StatCard
                icon={Users}
                title="Usuarios Totales"
                value="48"
                change="+12%"
                positive
              />
              <StatCard
                icon={Package}
                title="Tickets Hoy"
                value="156"
                change="+8%"
                positive
              />
              <StatCard
                icon={TrendingUp}
                title="Ventas del Mes"
                value="$12,450"
                change="+23%"
                positive
              />
            </>
          )}

          {user?.role === 'VENTANA' && (
            <>
              <StatCard
                icon={Package}
                title="Tickets Hoy"
                value="42"
                change="+5%"
                positive
              />
              <StatCard
                icon={TrendingUp}
                title="Ventas Hoy"
                value="$1,250"
                change="+15%"
                positive
              />
            </>
          )}

          {user?.role === 'VENDEDOR' && (
            <>
              <StatCard
                icon={Package}
                title="Mis Tickets Hoy"
                value="12"
                change="+3"
                positive
              />
              <StatCard
                icon={TrendingUp}
                title="Total Vendido"
                value="$450"
                change="+$50"
                positive
              />
            </>
          )}
        </YStack>

        {/* Quick Actions */}
        <YStack gap="$3">
          <Text fontSize="$6" fontWeight="600" color="$textPrimary">
            Acciones Rápidas
          </Text>
          
          {user?.role === 'ADMIN' && (
            <>
              <Button
                size="$5"
                backgroundColor="$primary"
                color="white"
                onPress={() => {}}
                pressStyle={{
                  backgroundColor: '$primaryPress',
                }}
                hoverStyle={{
                  backgroundColor: '$primaryHover',
                }}
              >
                Gestionar Bancas
              </Button>
              <Button
                size="$5"
                backgroundColor="$backgroundHover"
                color="$textPrimary"
                borderWidth={1}
                borderColor="$borderColor"
                onPress={() => {}}
                pressStyle={{
                  backgroundColor: '$backgroundPress',
                }}
                hoverStyle={{
                  backgroundColor: '$backgroundHover',
                }}
              >
                Ver Reportes
              </Button>
            </>
          )}

          {user?.role === 'VENDEDOR' && (
            <Button
              size="$5"
              backgroundColor="$primary"
              color="white"
              onPress={() => {}}
              pressStyle={{
                backgroundColor: '$primaryPress',
              }}
              hoverStyle={{
                backgroundColor: '$primaryHover',
              }}
            >
              Nuevo Ticket
            </Button>
          )}
        </YStack>
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
      pressStyle={{
        backgroundColor: '$backgroundPress',
      }}
      hoverStyle={{
        backgroundColor: '$backgroundFocus',
      }}
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
          <Text
            fontSize="$2"
            color={positive ? '$success' : '$error'}
            fontWeight="600"
          >
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