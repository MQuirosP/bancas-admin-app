// app/vendedor/index.tsx
import React from 'react';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { Button, Card } from '@/components/ui';
import { Package, TrendingUp, Plus, Clock } from '@tamagui/lucide-icons';
import { useThemeName } from 'tamagui'
import { useAuthStore } from '../../store/auth.store';
import { useRouter } from 'expo-router';
import { formatCurrency } from '@/utils/formatters'
import { useVentasSummary } from '@/hooks/useVentas'
import { parseISO, formatDistanceToNowStrict } from 'date-fns'
import { es } from 'date-fns/locale'

export default function VendedorDashboard() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const themeName = useThemeName()
  const { data: summary } = useVentasSummary({ scope: 'mine', date: 'today' })

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
            <Plus size={24} color={themeName === 'dark' ? 'white' : 'black'} />
            <Text color="white" fontSize="$6" fontWeight="600">
              Nuevo Ticket
            </Text>
          </XStack>
        </Button>

        {/* Stats Cards - grid 2 columnas responsivo */}
        <YStack gap="$3">
          {(
            [
              { icon: Package, title: 'Mis Tickets Hoy', value: String(summary?.ticketsCount ?? 0), change: '', color: '$yellow10' },
              { icon: TrendingUp, title: 'Total Vendido Hoy', value: formatCurrency(summary?.ventasTotal ?? 0), change: '', color: '$purple10' },
              { icon: Clock, title: 'Último Ticket', value: summary?.lastTicketAt ? formatDistanceToNowStrict(parseISO(summary.lastTicketAt), { locale: es }) : '—', change: '', color: '$indigo10' },
            ] as const
          ).reduce((rows: any[][], card, index) => {
            if (index % 2 === 0) rows.push([card]); else rows[rows.length - 1].push(card); return rows;
          }, []).map((row, rowIndex) => (
            <XStack key={rowIndex} gap="$3" flexWrap="wrap">
              {row.map((c, i) => (
                <YStack key={i} flex={1} minWidth={280} maxWidth="48%" $sm={{ maxWidth: '100%' }}>
                  <StatCard icon={c.icon} title={c.title} value={c.value} change={c.change} positive color={c.color as any} />
                </YStack>
              ))}
            </XStack>
          ))}
        </YStack>

        {/* Quick Actions */}
        <YStack gap="$3">
          <Text fontSize="$6" fontWeight="600" color="$textPrimary">
            Mis Tickets
          </Text>
          
          <XStack gap="$3" flexWrap="wrap">
            <QuickActionButton 
              icon={Package} 
              label="Ver Todos" 
              color="$cyan10" 
              onPress={() => router.push('/vendedor/tickets')}
            />
            <QuickActionButton 
              icon={Clock} 
              label="Pendientes" 
              color="$yellow10"
              onPress={() => router.push('/vendedor/tickets?filter=pendientes')}
            />
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
  onPress?: () => void;
}

function QuickActionButton({ icon: Icon, label, color = '$primary', onPress }: QuickActionButtonProps) {
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
      onPress={onPress}
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
