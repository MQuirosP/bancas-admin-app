// app/ventana/index.tsx
import React from 'react';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { Card } from '@/components/ui'
import { Package, TrendingUp, Users, Clock } from '@tamagui/lucide-icons';
import { useAuthStore } from '../../store/auth.store';

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
            color="$green10"
          />
          <StatCard
            icon={TrendingUp}
            title="Ventas Hoy"
            value="$1,250"
            change="+15%"
            positive
            color="$purple10"
          />
          <StatCard
            icon={Users}
            title="Vendedores Activos"
            value="8"
            change="De 10 totales"
            positive
            color="$yellow10"
          />
          <StatCard
            icon={Clock}
            title="Último Ticket"
            value="5 min"
            change="Hace 5 minutos"
            positive
            color="$indigo10"
          />
        </YStack>

        {/* Quick Actions */}
        <YStack gap="$3">
          <Text fontSize="$6" fontWeight="600" color="$textPrimary">
            Acciones Rápidas
          </Text>
          
          <XStack gap="$3" flexWrap="wrap">
            <QuickActionButton icon={Package} label="Ver Tickets" color="$cyan10" />
            <QuickActionButton icon={Users} label="Vendedores" color="$yellow10" />
            <QuickActionButton icon={TrendingUp} label="Ventas" color="$purple10" />
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
    <Card
      padding="$4"
      backgroundColor="$backgroundStrong"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
      pressStyle={{ scale: 0.98 }}
      hoverStyle={{
        borderColor: color,
        elevation: 4,
        shadowColor: color,
        shadowOpacity: 0.2,
        shadowRadius: 8,
      }}
      cursor="default"
      animation="quick"
    >
      <XStack justifyContent="space-between" alignItems="center">
        <YStack
          width={56}
          height={56}
          backgroundColor={String(color).replace('10', '4') as any}
          borderRadius="$3"
          alignItems="center"
          justifyContent="center"
        >
          <Icon size={28} color={color} />
        </YStack>
        <YStack alignItems="flex-end" gap="$1">
          <Text fontSize="$2" color={positive ? '$success' : '$textTertiary'} fontWeight="600">
            {change}
          </Text>
        </YStack>
      </XStack>
      <YStack gap="$1" mt="$2">
        <Text fontSize="$3" color="$textSecondary">
          {title}
        </Text>
        <Text fontSize="$8" fontWeight="700" color="$textPrimary">
          {value}
        </Text>
      </YStack>
    </Card>
  );
}

// Componente para botones de acciones rápidas
interface QuickActionButtonProps {
  icon: any;
  label: string;
  color?: string; // Tamagui token ej. '$cyan10'
}

function QuickActionButton({ icon: Icon, label, color = '$primary' }: QuickActionButtonProps) {
  const bgSoft = String(color).replace('10', '4') as any
  return (
    <Card
      flex={1}
      minWidth={150}
      padding="$4"
      backgroundColor="$backgroundStrong"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
      alignItems="center"
      gap="$2"
      pressStyle={{ scale: 0.98 }}
      hoverStyle={{
        borderColor: color,
        elevation: 4,
        shadowColor: color,
        shadowOpacity: 0.2,
        shadowRadius: 8,
      }}
      cursor="pointer"
      animation="quick"
    >
      <YStack width={56} height={56} br="$3" ai="center" jc="center" backgroundColor={bgSoft}>
        <Icon size={28} color={color} />
      </YStack>
      <Text fontSize="$4" fontWeight="600" color="$textPrimary">
        {label}
      </Text>
    </Card>
  );
}
