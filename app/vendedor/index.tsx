// app/vendedor/index.tsx
import React from 'react';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { Button } from '@/components/ui';
import { Package, TrendingUp, Plus, Clock } from '@tamagui/lucide-icons';
import { useAuthStore } from '../../store/auth.store';
import { useRouter } from 'expo-router';

export default function VendedorDashboard() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$6" gap="$6">
        {/* Header */}
        <YStack gap="$2">
          <Text fontSize="$8" fontWeight="700" color="$textPrimary">
            ¡Bienvenido, {user?.name}!
          </Text>
          <Text fontSize="$5" color="$textSecondary">
            Panel de Vendedor
          </Text>
        </YStack>

        {/* Botón destacado para nuevo ticket */}
        <Button
          size="$6"
          backgroundColor="$primary"
          color="white"
          fontWeight="600"
          borderRadius="$4"
          pressStyle={{
            backgroundColor: '$primaryPress',
            scale: 0.98,
          }}
          hoverStyle={{
            backgroundColor: '$primaryHover',
          }}
          onPress={() => router.push('/vendedor/tickets/nuevo')}
        >
          <XStack gap="$2" alignItems="center">
            <Plus size={24} color="white" />
            <Text color="white" fontSize="$6" fontWeight="600">
              Nuevo Ticket
            </Text>
          </XStack>
        </Button>

        {/* Stats Cards */}
        <YStack gap="$4">
          <StatCard
            icon={Package}
            title="Mis Tickets Hoy"
            value="12"
            change="+3 desde ayer"
            positive
            color="$yellow10"
          />
          <StatCard
            icon={TrendingUp}
            title="Total Vendido Hoy"
            value="$450"
            change="+$50"
            positive
            color="$purple10"
          />
          <StatCard
            icon={Clock}
            title="Último Ticket"
            value="10 min"
            change="Hace 10 minutos"
            positive
            color="$indigo10"
          />
        </YStack>

        {/* Quick Actions */}
        <YStack gap="$3">
          <Text fontSize="$6" fontWeight="600" color="$textPrimary">
            Mis Tickets
          </Text>
          
          <XStack gap="$3" flexWrap="wrap">
            <QuickActionButton icon={Package} label="Ver Todos" />
            <QuickActionButton icon={Clock} label="Pendientes" />
          </XStack>
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
  color: string;
}

function StatCard({ icon: Icon, title, value, change, positive, color }: StatCardProps) {
  return (
    <YStack
      backgroundColor="$backgroundHover"
      padding="$4"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
      gap="$3"
    >
      <XStack justifyContent="space-between" alignItems="center">
        <YStack
          width={48}
          height={48}
          backgroundColor={String(color).replace('10', '4') as any}
          borderRadius="$3"
          alignItems="center"
          justifyContent="center"
        >
          <Icon size={24} color={color} />
        </YStack>
        <YStack alignItems="flex-end" gap="$1">
          <Text
            fontSize="$2"
            color={positive ? '$success' : '$textTertiary'}
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

// Componente para botones de acciones rápidas
interface QuickActionButtonProps {
  icon: any;
  label: string;
}

function QuickActionButton({ icon: Icon, label }: QuickActionButtonProps) {
  return (
    <YStack
      flex={1}
      minWidth={150}
      backgroundColor="$backgroundHover"
      padding="$4"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
      alignItems="center"
      gap="$2"
      pressStyle={{
        backgroundColor: '$backgroundPress',
        scale: 0.98,
      }}
      hoverStyle={{
        backgroundColor: '$backgroundPress',
      }}
    >
      <Icon size={32} color={"$primary"} />
      <Text fontSize="$4" fontWeight="600" color="$textPrimary">
        {label}
      </Text>
    </YStack>
  );
}
