// app/admin/index.tsx
import React from 'react';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { BarChart3, Users, Package, TrendingUp, Building2, Ticket } from '@tamagui/lucide-icons';
import { useAuthStore } from '@/store/auth.store';

export default function AdminDashboard() {
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
            Panel de Administración de Banca
          </Text>
        </YStack>

        {/* Stats Cards */}
        <YStack gap="$4">
          <StatCard
            icon={Building2}
            title="Bancas Totales"
            value="12"
            change="+2 este mes"
            positive
            color="#6366f1"
          />
          <StatCard
            icon={Users}
            title="Usuarios Activos"
            value="48"
            change="+12%"
            positive
            color="#10b981"
          />
          <StatCard
            icon={Ticket}
            title="Tickets Hoy"
            value="156"
            change="+8%"
            positive
            color="#f59e0b"
          />
          <StatCard
            icon={TrendingUp}
            title="Ventas del Mes"
            value="$12,450"
            change="+23%"
            positive
            color="#8b5cf6"
          />
        </YStack>

        {/* Quick Actions */}
        <YStack gap="$3">
          <Text fontSize="$6" fontWeight="600" color="$textPrimary">
            Gestión Principal
          </Text>
          
          <XStack gap="$3" flexWrap="wrap">
            <QuickActionButton icon={Building2} label="Bancas" />
            <QuickActionButton icon={Users} label="Usuarios" />
            <QuickActionButton icon={Package} label="Sorteos" />
            <QuickActionButton icon={BarChart3} label="Reportes" />
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