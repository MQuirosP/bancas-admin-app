// app/ventana/index.tsx
import React from 'react';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { Package, TrendingUp, Users, Clock } from '@tamagui/lucide-icons';
import { useAuthStore } from '@/store/auth.store';

export default function VentanaDashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$6" gap="$6">
        {/* Header */}
        <YStack gap="$2">
          <Text fontSize="$8" fontWeight="700" color="$textPrimary">
            ¡Bienvenido, {user?.name}!
          </Text>
          <Text fontSize="$5" color="$textSecondary">
            Panel de Gestión de Ventana
          </Text>
        </YStack>

        {/* Stats Cards */}
        <YStack gap="$4">
          <StatCard
            icon={Package}
            title="Tickets Hoy"
            value="42"
            change="+5 desde ayer"
            positive
            color="#10b981"
          />
          <StatCard
            icon={TrendingUp}
            title="Ventas Hoy"
            value="$1,250"
            change="+15%"
            positive
            color="#8b5cf6"
          />
          <StatCard
            icon={Users}
            title="Vendedores Activos"
            value="8"
            change="De 10 totales"
            positive
            color="#f59e0b"
          />
          <StatCard
            icon={Clock}
            title="Último Ticket"
            value="5 min"
            change="Hace 5 minutos"
            positive
            color="#6366f1"
          />
        </YStack>

        {/* Quick Actions */}
        <YStack gap="$3">
          <Text fontSize="$6" fontWeight="600" color="$textPrimary">
            Acciones Rápidas
          </Text>
          
          <XStack gap="$3" flexWrap="wrap">
            <QuickActionButton icon={Package} label="Ver Tickets" />
            <QuickActionButton icon={Users} label="Vendedores" />
            <QuickActionButton icon={TrendingUp} label="Ventas" />
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
          backgroundColor={color}
          borderRadius="$3"
          alignItems="center"
          justifyContent="center"
        >
          <Icon size={24} color="white" />
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
      <Icon size={32} color="$primary" />
      <Text fontSize="$4" fontWeight="600" color="$textPrimary">
        {label}
      </Text>
    </YStack>
  );
}