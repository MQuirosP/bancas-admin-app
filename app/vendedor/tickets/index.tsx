import React, { useMemo } from 'react';
import { YStack, XStack, Text, Button, ScrollView, Card, Spinner } from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus, Ticket as TicketIcon } from '@tamagui/lucide-icons';
import { ticketsService } from '../../../services/tickets.service';
import { formatCurrency } from '../../../utils/formatters';

export default function MisTicketsScreen() {
  const router = useRouter();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets', 'mine', 'today'],
    queryFn: () => ticketsService.getMine('today'),
  });

  const totalAmount = useMemo(() => {
    if (!tickets?.length) return 0;
    // si cada ticket ya trae totalAmount, úsalo; si no, suma jugadas
    return tickets.reduce((acc, t) => {
      if (typeof t.totalAmount === 'number') return acc + t.totalAmount;
      const sumJugadas = (t.jugadas ?? []).reduce((s, j) => s + (j.amount ?? 0), 0);
      return acc + sumJugadas;
    }, 0);
  }, [tickets]);

  return (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3">
          <Text fontSize="$8" fontWeight="bold" color="$color">
            Mis Tiquetes de Hoy
          </Text>
          <Button icon={<Plus />} onPress={() => router.push('/vendedor/tickets/nuevo')}>
            Nuevo Tiquete
          </Button>
        </XStack>

        {isLoading ? (
          <YStack padding="$8" alignItems="center">
            <Spinner size="large" />
          </YStack>
        ) : !tickets?.length ? (
          <Card padding="$4">
            <Text color="$secondary">Aún no tienes tiquetes hoy.</Text>
          </Card>
        ) : (
          <>
            <YStack gap="$3">
              {tickets.map((ticket) => (
                <Card key={ticket.id} padding="$4">
                  <XStack justifyContent="space-between" alignItems="flex-start" gap="$3">
                    <YStack flex={1}>
                      <XStack gap="$2" alignItems="center" marginBottom="$2">
                        <TicketIcon size={20} />
                        <Text fontSize="$5" fontWeight="600" color="$color">
                          Tiquete #{ticket.id.slice(0, 8)}
                        </Text>
                      </XStack>

                      <Text fontSize="$3" color="$secondary">
                        Sorteo: {ticket.sorteo?.date} - {ticket.sorteo?.hour}
                      </Text>

                      <Text fontSize="$4" fontWeight="600" color="$primary" marginTop="$2">
                        Total: {formatCurrency(
                          typeof ticket.totalAmount === 'number'
                            ? ticket.totalAmount
                            : (ticket.jugadas ?? []).reduce((s, j) => s + (j.amount ?? 0), 0)
                        )}
                      </Text>
                    </YStack>
                  </XStack>

                  <YStack marginTop="$3" gap="$1">
                    {(ticket.jugadas ?? []).map((jugada, index) => (
                      <XStack key={index} justifyContent="space-between" paddingVertical="$1">
                        <Text fontSize="$3" color="$secondary">
                          {jugada.type === 'NUMERO'
                            ? `Número: ${jugada.number}`
                            : `Reventado: ${jugada.reventadoNumber}`}
                        </Text>
                        <Text fontSize="$3" fontWeight="500">
                          {formatCurrency(jugada.amount ?? 0)}
                        </Text>
                      </XStack>
                    ))}
                  </YStack>
                </Card>
              ))}
            </YStack>

            <Card padding="$4" backgroundColor="$blue2">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="600">
                  Total del día:
                </Text>
                <Text fontSize="$7" fontWeight="bold" color="$blue10">
                  {formatCurrency(totalAmount)}
                </Text>
              </XStack>
            </Card>
          </>
        )}
      </YStack>
    </ScrollView>
  );
}
