import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { YStack, XStack, Text, Spinner } from 'tamagui';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Shield,
  CheckCircle,
  Clock,
} from '@tamagui/lucide-icons';
import { useAuthStore } from '../../../store/auth.store';
import { useBancaDashboardStats } from '../../../hooks/useDashboardStats';
import { useNextSorteoQuery } from '../../../hooks/useSorteos';
import { useCutoffCalculation } from '../../../hooks/useRestrictionRules';
import { KPICard } from '../../../components/dashboard/KPICard';
import { LotteryChart, NextDrawWidget } from '../../../components/dashboard/LotteryChart';
import { HourlyChart } from '../../../components/dashboard/HourlyChart';

export default function DashboardBancaScreen() {
  const { user } = useAuthStore();
  const bancaId = user?.bancaId;

  const { stats, isLoading } = useBancaDashboardStats(bancaId);
  const { data: nextSorteo } = useNextSorteoQuery();
  const { data: cutoffData } = useCutoffCalculation(
    nextSorteo ? { scheduledAt: nextSorteo.scheduledAt } : null,
    undefined,
    bancaId
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
            Dashboard de Banca
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
            title="Ventas Hoy"
            value={`$${stats.totalSalesToday.toLocaleString()}`}
            subtitle="Total del día"
            icon={DollarSign}
            color="$success"
          />

          <KPICard
            title="Tickets Activos"
            value={stats.activeTicketsCount}
            subtitle="Esperando sorteo"
            icon={Clock}
            color="$primary"
          />

          <KPICard
            title="Tickets Evaluados"
            value={stats.evaluatedTicketsCount}
            subtitle="Sorteos realizados"
            icon={CheckCircle}
            color="$success"
          />

          <KPICard
            title="Sorteos Activos"
            value={stats.activeSorteos}
            subtitle="Programados/Abiertos"
            icon={Calendar}
            color="$warning"
          />

          <KPICard
            title="Reglas Activas"
            value={stats.activeRules}
            subtitle="Restricciones vigentes"
            icon={Shield}
            color="$error"
          />
        </XStack>

        {/* Próximo sorteo */}
        <NextDrawWidget
          sorteo={nextSorteo || null}
          minutesRemaining={cutoffData?.minutesRemaining || 0}
        />

        {/* Gráfico de ventas por hora */}
        <HourlyChart data={stats.salesByHour} />

        {/* Top loterías */}
        <LotteryChart
          data={stats.topLoterias.map(({ loteriaName, totalSales, ticketCount }) => ({
            lotteryName: loteriaName,   // ⬅️ renombre aquí
            totalSales,
            ticketCount,
          }))}
        />

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