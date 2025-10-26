// components/dashboard/LotteryChart.tsx
import React from 'react';
import { YStack, Text, Card, XStack } from 'tamagui';
import { formatCurrency } from '@/utils/formatters'

interface LotteryChartProps {
  data: Array<{
    lotteryName: string;
    totalSales: number;
    ticketCount: number;
  }>;
}

export const LotteryChart: React.FC<LotteryChartProps> = ({ data }) => {
  const maxSales = Math.max(...data.map((d) => d.totalSales), 1);

  return (
    <Card elevate bordered backgroundColor="$backgroundStrong" padding="$4">
      <YStack gap="$3">
        <Text fontSize="$5" fontWeight="600" color="$textPrimary">
          Top Loterías
        </Text>

        <YStack gap="$2">
          {data.map((item, index) => {
            const widthPercent = (item.totalSales / maxSales) * 100;

            return (
              <YStack key={index} gap="$1">
                <XStack justifyContent="space-between">
                  <Text fontSize="$3" color="$textPrimary" fontWeight="500">
                    {item.lotteryName}
                  </Text>
                  <Text fontSize="$3" color="$textSecondary">
                    {formatCurrency(item.totalSales)}
                  </Text>
                </XStack>

                <XStack gap="$2" alignItems="center">
                  <YStack
                    backgroundColor="$primary"
                    height={24}
                    width={`${widthPercent}%`}
                    borderRadius="$2"
                    justifyContent="center"
                    paddingHorizontal="$2"
                  >
                    <Text fontSize="$2" color="white">
                      {item.ticketCount} tickets
                    </Text>
                  </YStack>
                </XStack>
              </YStack>
            );
          })}
        </YStack>

        {data.length === 0 && (
          <Text fontSize="$3" color="$textTertiary" textAlign="center">
            No hay datos disponibles
          </Text>
        )}
      </YStack>
    </Card>
  );
};

// ============ TICKETS TABLE ============

import { ScrollView } from 'react-native';
import type { Ticket } from '../../types/api.types';
import { formatCurrency as fmt } from '@/utils/formatters'

interface TicketsTableProps {
  tickets: Ticket[];
  onTicketPress?: (ticket: Ticket) => void;
}

export const TicketsTable: React.FC<TicketsTableProps> = ({ tickets, onTicketPress }) => {
  return (
    <Card elevate bordered backgroundColor="$backgroundStrong" padding="$4">
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$5" fontWeight="600" color="$textPrimary">
            Tickets de Hoy
          </Text>
          <Text fontSize="$3" color="$textSecondary">
            {tickets.length} tickets
          </Text>
        </XStack>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <YStack gap="$1" minWidth="100%">
            {/* Header */}
            <XStack
              backgroundColor="$backgroundHover"
              padding="$2"
              borderRadius="$2"
              gap="$3"
            >
              <Text fontSize="$2" fontWeight="600" width={100}>
                # Ticket
              </Text>
              <Text fontSize="$2" fontWeight="600" width={120}>
                Vendedor
              </Text>
              <Text fontSize="$2" fontWeight="600" width={80} textAlign="right">
                Monto
              </Text>
              <Text fontSize="$2" fontWeight="600" width={80}>
                Estado
              </Text>
              <Text fontSize="$2" fontWeight="600" width={100}>
                Hora
              </Text>
            </XStack>

            {/* Rows */}
            {tickets.slice(0, 20).map((ticket) => (
              <XStack
                key={ticket.id}
                padding="$2"
                borderBottomWidth={1}
                borderBottomColor="$borderColor"
                gap="$3"
                onPress={() => onTicketPress?.(ticket)}
                pressStyle={{ backgroundColor: '$backgroundHover' }}
              >
                <Text fontSize="$2" width={100} color="$textPrimary">
                  {ticket.ticketNumber}
                </Text>
                <Text fontSize="$2" width={120} color="$textSecondary">
                  {ticket.user?.name || 'N/A'}
                </Text>
                <Text fontSize="$2" width={80} textAlign="right" color="$textPrimary">
                  {fmt(ticket.totalAmount)}
                </Text>
                <YStack width={80}>
                  <Text
                    fontSize="$1"
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    borderRadius="$2"
                    backgroundColor={
                      ticket.status === 'ACTIVE'
                        ? '$success'
                        : ticket.status === 'EVALUATED'
                        ? '$warning'
                        : '$error'
                    }
                    color="white"
                    textAlign="center"
                  >
                    {ticket.status}
                  </Text>
                </YStack>
                <Text fontSize="$2" width={100} color="$textTertiary">
                  {new Date(ticket.createdAt).toLocaleTimeString()}
                </Text>
              </XStack>
            ))}
          </YStack>
        </ScrollView>

        {tickets.length === 0 && (
          <Text fontSize="$3" color="$textTertiary" textAlign="center" paddingVertical="$4">
            No hay tickets registrados hoy
          </Text>
        )}
      </YStack>
    </Card>
  );
};

// ============ NEXT DRAW WIDGET ============

import type { Sorteo } from '../../types/api.types';

interface NextDrawWidgetProps {
  sorteo: Sorteo | null;
  minutesRemaining: number;
}

export const NextDrawWidget: React.FC<NextDrawWidgetProps> = ({
  sorteo,
  minutesRemaining,
}) => {
  if (!sorteo) {
    return (
      <Card elevate bordered backgroundColor="$backgroundStrong" padding="$4">
        <YStack gap="$2" alignItems="center">
          <Text fontSize="$5" fontWeight="600" color="$textPrimary">
            Próximo Sorteo
          </Text>
          <Text fontSize="$3" color="$textTertiary">
            No hay sorteos programados
          </Text>
        </YStack>
      </Card>
    );
  }

  const isUrgent = minutesRemaining <= 15;
  const hours = Math.floor(minutesRemaining / 60);
  const mins = minutesRemaining % 60;

  return (
    <Card
      elevate
      bordered
      backgroundColor={isUrgent ? '$error' : '$backgroundStrong'}
      padding="$4"
    >
      <YStack gap="$3" alignItems="center">
        <Text
          fontSize="$5"
          fontWeight="600"
          color={isUrgent ? 'white' : '$textPrimary'}
        >
          Próximo Sorteo
        </Text>

        <YStack gap="$1" alignItems="center">
          <Text
            fontSize="$7"
            fontWeight="700"
            color={isUrgent ? 'white' : '$primary'}
          >
            {sorteo.loteria?.name || 'Lotería'}
          </Text>
          <Text fontSize="$4" color={isUrgent ? 'white' : '$textSecondary'}>
            {sorteo.scheduledAt}
          </Text>
        </YStack>

        <YStack
          backgroundColor={isUrgent ? 'rgba(255,255,255,0.2)' : '$backgroundHover'}
          padding="$3"
          borderRadius="$3"
          alignItems="center"
        >
          <Text
            fontSize="$2"
            color={isUrgent ? 'white' : '$textSecondary'}
            marginBottom="$1"
          >
            Tiempo restante
          </Text>
          <Text
            fontSize="$6"
            fontWeight="700"
            color={isUrgent ? 'white' : '$textPrimary'}
          >
            {hours > 0 && `${hours}h `}
            {mins}m
          </Text>
        </YStack>

        {isUrgent && (
          <Text fontSize="$2" color="white" fontWeight="600">
            ⚠️ Cutoff próximo
          </Text>
        )}
      </YStack>
    </Card>
  );
};
