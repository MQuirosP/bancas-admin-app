import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { YStack, XStack, Text, Spinner, Card } from 'tamagui';
import {
  Ticket as TicketIcon,
  DollarSign,
  Clock,
  Calendar,
  TrendingUp,
  CheckCircle,
} from '@tamagui/lucide-icons';
import { useAuthStore } from '../../../store/auth.store';
import { useVentanaDashboardStats } from '../../../hooks/useDashboardStats';
import { useNextSorteoQuery } from '../../../hooks/useSorteos';
import { useCutoffCalculation } from '../../../hooks/useRestrictionRules';
import { KPICard } from '../../../components/dashboard/KPICard';
import { NextDrawWidget, TicketsTable } from '../../../components/dashboard/LotteryChart';

export default function DashboardVentanaScreen() {
  const { user } = useAuthStore();
  const ventanaId = user?.ventanaId;

  const { stats, isLoading } = useVentanaDashboardStats(ventanaId);
  const { data: nextSorteo } = useNextSorteoQuery();
  const { data: cutoffData } = useCutoffCalculation(
    nextSorteo ? { scheduledAt: nextSorteo.scheduledAt } : null,
    undefined,
    user?.bancaId,
    ventanaId
  );

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
        <Spinner size="large" color="$primary" />
        <Text fontSize="$4" color="$textSecondary" marginTop="$4">
          Cargando dashboard...
        </Text>
      </YStack>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '$background' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <YStack padding="$4" gap="$4">
        {/* Header */}
        <YStack gap="$2">
          <Text fontSize="$8" fontWeight="700" color="$textPrimary">
            Dashboard de Ventana
          </Text>
          <Text fontSize="$4" color="$textSecondary">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </YStack>

        {/* KPIs principales */}
        <XStack gap="$3" flexWrap="wrap">
          <KPICard
            title="Tickets Hoy"
            value={stats.ticketsCountToday}
            subtitle="Total registrados"
            icon={TicketIcon}
            color="$primary"
          />
          
          <KPICard
            title="Ventas Hoy"
            value={`$${stats.totalSalesToday.toLocaleString()}`}
            subtitle="Ingresos del día"
            icon={DollarSign}
            color="$success"
          />
          
          <KPICard
            title="Pendientes Evaluación"
            value={stats.pendingEvaluations}
            subtitle="Tickets activos"
            icon={Clock}
            color="$warning"
          />
          
          <KPICard
            title="Sorteos Activos"
            value={stats.activeSorteos}
            subtitle="Disponibles hoy"
            icon={Calendar}
            color="$error"
          />
        </XStack>

        {/* Próximo sorteo y cutoff */}
        <NextDrawWidget
          sorteo={nextSorteo || null}
          minutesRemaining={cutoffData?.minutesRemaining || 0}
        />

        {/* Ventas por vendedor */}
        {stats.salesByVendor.length > 0 && (
          <Card elevate bordered backgroundColor="$backgroundStrong" padding="$4">
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="600" color="$textPrimary">
                  Ventas por Vendedor
                </Text>
                <TrendingUp size={20} color="$primary" />
              </XStack>

              <YStack gap="$2">
                {stats.salesByVendor.map((vendor) => (
                  <XStack
                    key={vendor.vendedorId}
                    justifyContent="space-between"
                    padding="$3"
                    backgroundColor="$backgroundHover"
                    borderRadius="$3"
                  >
                    <YStack>
                      <Text fontSize="$3" fontWeight="600" color="$textPrimary">
                        {vendor.vendedorName}
                      </Text>
                      <Text fontSize="$2" color="$textSecondary">
                        {vendor.ticketCount} tickets
                      </Text>
                    </YStack>
                    <Text fontSize="$4" fontWeight="700" color="$success">
                      ${vendor.totalSales.toLocaleString()}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            </YStack>
          </Card>
        )}

        {/* Top números vendidos */}
        {stats.topNumbers.length > 0 && (
          <Card elevate bordered backgroundColor="$backgroundStrong" padding="$4">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="600" color="$textPrimary">
                Top 10 Números Vendidos
              </Text>

              <YStack gap="$2">
                {stats.topNumbers.map((item, index) => (
                  <XStack
                    key={item.number}
                    justifyContent="space-between"
                    alignItems="center"
                    padding="$2"
                    borderBottomWidth={index < stats.topNumbers.length - 1 ? 1 : 0}
                    borderBottomColor="$borderColor"
                  >
                    <XStack gap="$3" alignItems="center">
                      <YStack
                        width={32}
                        height={32}
                        backgroundColor="$primary"
                        borderRadius="$2"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize="$3" fontWeight="700" color="white">
                          {index + 1}
                        </Text>
                      </YStack>
                      <Text fontSize="$5" fontWeight="600" color="$textPrimary">
                        {item.number}
                      </Text>
                    </XStack>
                    <YStack alignItems="flex-end">
                      <Text fontSize="$3" color="$textPrimary">
                        {item.count} veces
                      </Text>
                      <Text fontSize="$2" color="$textSecondary">
                        ${item.totalAmount.toFixed(2)}
                      </Text>
                    </YStack>
                  </XStack>
                ))}
              </YStack>
            </YStack>
          </Card>
        )}

        {/* Tabla de tickets del día */}
        <TicketsTable tickets={stats.tickets} />

        {/* Footer */}
        <XStack justifyContent="center" paddingVertical="$4">
          <Text fontSize="$2" color="$textTertiary">
            Última actualización: {new Date().toLocaleTimeString()}
          </Text>
        </XStack>
      </YStack>
    </ScrollView>
  );
}