import React, { useMemo } from 'react';
import { YStack, XStack, Text, ScrollView, Spinner } from 'tamagui';
import { Button, Card } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus, Ticket as TicketIcon } from '@tamagui/lucide-icons';
import { ticketsService } from '../../../services/tickets.service';
import { formatCurrency } from '../../../utils/formatters';

type ListResp<T> = T[] | { data: T[]; meta?: any };
function toArray<T>(payload: ListResp<T> | undefined | null): T[] {
  if (!payload) return [];
  return Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
}

function formatScheduledAtISO(d: any) {
  if (!d) return { label: '' };
  const dt = new Date(d as any);
  return { label: dt.toLocaleString() };
}

export default function MisTicketsScreen() {
  const router = useRouter();

  const { data: ticketsResp, isLoading } = useQuery({
    queryKey: ['tickets', 'mine', 'today'],
    queryFn: () => ticketsService.getMine('today') as Promise<ListResp<any>>,
    staleTime: 60_000,
  });

  const tickets = useMemo(() => toArray<any>(ticketsResp), [ticketsResp]);

  const totalAmount = useMemo(() => {
    if (!tickets.length) return 0;
    return tickets.reduce((acc, t) => {
      if (typeof t.totalAmount === 'number') return acc + t.totalAmount;
      const sumJugadas = (t.jugadas ?? []).reduce((s: number, j: any) => s + (j.amount ?? 0), 0);
      return acc + sumJugadas;
    }, 0);
  }, [tickets]);

  return (
    <ScrollView flex={1} backgroundColor={'$background'}>
      <YStack padding="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3">
          <Text fontSize="$8" fontWeight="bold" color="$color">
            Mis Tiquetes de Hoy
          </Text>
          <Button
            icon={Plus}
            onPress={() => router.push('/vendedor/tickets/nuevo')}
            bg="$primary"
            hoverStyle={{ scale: 1.02 }}
            pressStyle={{ bg: '$primaryPress', scale: 0.98 }}
          >
            <Text>Agregar</Text>
          </Button>
        </XStack>

        {isLoading ? (
          <YStack padding="$8" alignItems="center">
            <Spinner size="large" />
          </YStack>
        ) : tickets.length === 0 ? (
          <Card padding="$4">
            <Text color="$textSecondary">Aún no tienes tiquetes hoy.</Text>
          </Card>
        ) : (
          <>
            <YStack gap="$3">
              {tickets.map((ticket: any) => {
                const loteriaName = ticket?.sorteo?.loteria?.name ?? ticket?.sorteo?.loteriaId ?? 'Lotería';
                const { label } = formatScheduledAtISO(ticket?.sorteo?.scheduledAt);

                const ticketTotal =
                  typeof ticket.totalAmount === 'number'
                    ? ticket.totalAmount
                    : (ticket.jugadas ?? []).reduce((s: number, j: any) => s + (j.amount ?? 0), 0);

                return (
                  <Card key={ticket.id} padding="$4">
                    <XStack justifyContent="space-between" alignItems="flex-start" gap="$3">
                      <YStack flex={1}>
                        <XStack gap="$2" alignItems="center" marginBottom="$2">
                          <TicketIcon size={20} />
                          <Text fontSize="$5" fontWeight="600" color="$color">
                            Tiquete #{String(ticket.id).slice(0, 8)}
                          </Text>
                        </XStack>

                        <Text fontSize="$3" color="$textSecondary">
                          Sorteo: {loteriaName} — {label}
                        </Text>

                        <Text fontSize="$4" fontWeight="600" color="$primary" marginTop="$2">
                          Total: {formatCurrency(ticketTotal)}
                        </Text>
                      </YStack>
                    </XStack>

                    <YStack marginTop="$3" gap="$1">
                      {(ticket.jugadas ?? []).map((jugada: any, index: number) => (
                        <XStack key={index} justifyContent="space-between" paddingVertical="$1">
                          <Text fontSize="$3" color="$textSecondary">
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
                );
              })}
            </YStack>

            <Card padding="$4" backgroundColor="$blue2">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="600">
                  Total del día:
                </Text>
                <Text fontSize="$7" fontWeight="bold" color="$info">
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
