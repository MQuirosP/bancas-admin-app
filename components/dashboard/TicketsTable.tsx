import React from 'react';
import { ScrollView } from 'react-native';
import { YStack, XStack, Text, Card } from 'tamagui';
import type { Ticket } from '../../types/api.types';

interface TicketsTableProps {
  tickets: Ticket[];
  onTicketPress?: (ticket: Ticket) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return '$primary';
    case 'EVALUATED':
      return '$success';
    case 'CANCELLED':
      return '$error';
    case 'RESTORED':
      return '$warning';
    default:
      return '$textSecondary';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'Activo';
    case 'EVALUATED':
      return 'Evaluado';
    case 'CANCELLED':
      return 'Cancelado';
    case 'RESTORED':
      return 'Restaurado';
    default:
      return status;
  }
};

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
              <Text fontSize="$2" fontWeight="600" width={80}>
                # Ticket
              </Text>
              <Text fontSize="$2" fontWeight="600" width={120}>
                Vendedor
              </Text>
              <Text fontSize="$2" fontWeight="600" width={120}>
                Lotería
              </Text>
              <Text fontSize="$2" fontWeight="600" width={80} textAlign="right">
                Monto
              </Text>
              <Text fontSize="$2" fontWeight="600" width={100}>
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
                <Text fontSize="$2" width={80} color="$textPrimary" fontWeight="600">
                  #{ticket.ticketNumber}
                </Text>
                <Text fontSize="$2" width={120} color="$textSecondary">
                  {ticket.vendedor?.name || 'N/A'}
                </Text>
                <Text fontSize="$2" width={120} color="$textSecondary">
                  {ticket.loteria?.name || 'N/A'}
                </Text>
                <Text fontSize="$2" width={80} textAlign="right" color="$textPrimary">
                  ${ticket.totalAmount.toFixed(2)}
                </Text>
                <YStack width={100}>
                  <Text
                    fontSize="$1"
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    borderRadius="$2"
                    backgroundColor={getStatusColor(ticket.status)}
                    color="white"
                    textAlign="center"
                  >
                    {getStatusLabel(ticket.status)}
                  </Text>
                  {ticket.isWinner && (
                    <Text fontSize="$1" color="$success" marginTop="$1">
                      🏆 Ganador
                    </Text>
                  )}
                </YStack>
                <Text fontSize="$2" width={100} color="$textTertiary">
                  {new Date(ticket.createdAt).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
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

        {tickets.length > 20 && (
          <Text fontSize="$2" color="$textTertiary" textAlign="center">
            Mostrando 20 de {tickets.length} tickets
          </Text>
        )}
      </YStack>
    </Card>
  );
};