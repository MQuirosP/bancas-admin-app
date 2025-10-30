// app/vendedor/index.tsx
import React from 'react';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { Button, Card } from '@/components/ui';
import { Package, TrendingUp, TrendingDown, Plus, Clock, DollarSign } from '@tamagui/lucide-icons';
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
  const { data: summary, isLoading, error } = useVentasSummary({ scope: 'mine', date: 'today' })
  const { data: yesterday } = useVentasSummary({ scope: 'mine', date: 'yesterday' })

  // Calcular cambios porcentuales
  const calculateChange = (today: number, yesterday: number) => {
    if (yesterday === 0) {
      return today > 0 ? 100 : 0
    }
    return ((today - yesterday) / yesterday) * 100
  }

  const ticketsChange = calculateChange(summary?.ticketsCount ?? 0, yesterday?.ticketsCount ?? 0)
  const ventasChange = calculateChange(summary?.ventasTotal ?? 0, yesterday?.ventasTotal ?? 0)

  // Debug: Verificar datos del vendedor
  React.useEffect(() => {
    if (user) {
      console.log('👤 Usuario vendedor:', {
        id: user.id,
        name: user.name,
        role: user.role,
      })
    }
  }, [user])

  // Debug: Verificar respuesta del summary
  React.useEffect(() => {
    if (summary) {
      console.log('📊 Resumen de ventas del vendedor (hoy):', summary)
    }
    if (yesterday) {
      console.log('📊 Resumen de ventas del vendedor (ayer):', yesterday)
    }
    if (error) {
      console.error('❌ Error al cargar resumen:', error)
    }
  }, [summary, yesterday, error])

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
          {/* Fila 1: Tickets y Ventas */}
          <XStack gap="$3" flexWrap="wrap">
            <YStack flex={1} minWidth={280} maxWidth="48%" $sm={{ maxWidth: '100%' }}>
              <StatCard 
                icon={Package} 
                title="Mis Tickets Hoy" 
                value={String(summary?.ticketsCount ?? 0)} 
                change={Math.abs(ticketsChange).toFixed(1) + '%'}
                positive={ticketsChange >= 0}
                color="$yellow10" 
              />
            </YStack>
            <YStack flex={1} minWidth={280} maxWidth="48%" $sm={{ maxWidth: '100%' }}>
              <StatCard 
                icon={TrendingUp} 
                title="Total Vendido Hoy" 
                value={formatCurrency(summary?.ventasTotal ?? 0)} 
                change={Math.abs(ventasChange).toFixed(1) + '%'}
                positive={ventasChange >= 0}
                color="$purple10" 
              />
            </YStack>
          </XStack>

          {/* Fila 2: Pagado y Último Ticket */}
          <XStack gap="$3" flexWrap="wrap">
            <YStack flex={1} minWidth={280} maxWidth="48%" $sm={{ maxWidth: '100%' }}>
              <StatCard 
                icon={DollarSign} 
                title="Pagado Hoy" 
                value={formatCurrency(summary?.totalPaid ?? 0)} 
                change="" 
                positive 
                color="$green10" 
              />
            </YStack>
            <YStack flex={1} minWidth={280} maxWidth="48%" $sm={{ maxWidth: '100%' }}>
              <StatCard 
                icon={Clock} 
                title="Último Ticket" 
                value={summary?.lastTicketAt ? formatDistanceToNowStrict(parseISO(summary.lastTicketAt), { locale: es }) : '—'} 
                change="" 
                positive 
                color="$indigo10" 
              />
            </YStack>
          </XStack>
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
  const TrendIcon = positive ? TrendingUp : TrendingDown
  const trendColor = positive ? '$green10' : '$red10'
  const showChange = change && change !== '0.0%'
  
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
        {showChange && (
          <YStack alignItems="flex-end" gap="$1">
            <XStack ai="center" gap="$1" backgroundColor={positive ? '$green4' : '$red4'} paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
              <TrendIcon size={14} color={trendColor} />
              <Text fontSize="$2" color={trendColor} fontWeight="700">
                {change}
              </Text>
            </XStack>
            <Text fontSize="$1" color="$textTertiary">vs ayer</Text>
          </YStack>
        )}
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
