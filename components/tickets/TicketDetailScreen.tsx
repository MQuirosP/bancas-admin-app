import React from 'react'
import { YStack, XStack, Text, Card, ScrollView, Spinner, Separator } from 'tamagui'
import { Button } from '@/components/ui'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from '@tamagui/lucide-icons'
import { apiClient } from '@/lib/api.client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCurrency, formatTicketDate } from '@/utils/formatters'
import type { Scope } from '@/types/scope'
import { calculatePaymentTotals } from '@/lib/tickets'
import { 
  TicketStatusBadge,
  WinnerBadge,
  PaymentAmountsGrid,
  PaymentProgressBar,
  WinningJugadasList,
  JugadasList
} from './shared'

type Props = {
  scope: Scope
  ticketId: string
  buildBackPath: () => string
}

async function fetchTicketDetail(id: string) {
  const res = await apiClient.get<any>(`/tickets/${id}`)
  return res?.data ?? res
}

export default function TicketDetailScreen({ scope, ticketId, buildBackPath }: Props) {
  const router = useRouter()

  const { data: ticket, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['tickets', 'detail', scope, ticketId],
    queryFn: () => fetchTicketDetail(ticketId),
    enabled: !!ticketId,
    staleTime: 30_000,
  })

  if (isLoading) {
    return (
      <YStack flex={1} ai="center" jc="center" backgroundColor="$background">
        <Spinner size="large" />
        <Text mt="$4">Cargando ticket...</Text>
      </YStack>
    )
  }

  if (isError || !ticket) {
    return (
      <YStack flex={1} ai="center" jc="center" backgroundColor="$background" p="$4">
        <Text fontSize="$6" fontWeight="bold" color="$error">Error al cargar ticket</Text>
        <Button mt="$4" onPress={() => refetch()}>
          Reintentar
        </Button>
        <Button mt="$2" variant="outlined" onPress={() => router.push(buildBackPath() as any)}>
          ← Volver
        </Button>
      </YStack>
    )
  }

  const vendorName = ticket.vendedor?.name || 'N/A'
  const ventanaName = ticket.ventana?.name || ticket.ventana?.code || 'N/A'
  const loteriaName = ticket.loteria?.name || 'N/A'
  const sorteoName = ticket.sorteo?.name || 'N/A'
  const createdAt = ticket.createdAt ? formatTicketDate(ticket.createdAt) : 'N/A'
  const jugadas = ticket.jugadas || []
  
  // ✅ v2.0: Usar utility centralizado para cálculos
  const totals = calculatePaymentTotals(ticket)
  const hasPayments = ticket.paymentHistory && ticket.paymentHistory.length > 0

  const title = scope === 'admin' ? 'Detalle del Ticket (Admin)' : 'Detalle del Ticket (Ventana)'

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={1000} alignSelf="center" width="100%">
        <XStack ai="center" gap="$3">
          <Button
            size="$3"
            icon={ArrowLeft}
            onPress={() => router.push(buildBackPath() as any)}
            backgroundColor="$background"
            borderColor="$borderColor"
            borderWidth={1}
            hoverStyle={{ bg: '$backgroundHover' }}
            pressStyle={{ bg: '$backgroundPress' }}
            circular
          />
          <Text fontSize="$8" fontWeight="bold">{title}</Text>
          {isFetching && <Spinner size="small" ml="$2" />}
        </XStack>

        <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
          <YStack gap="$3">
            <XStack jc="space-between" ai="flex-start" gap="$3" flexWrap="wrap">
              <YStack flex={1} gap="$2">
                <XStack ai="center" gap="$2" flexWrap="wrap">
                  <Text fontSize="$7" fontWeight="bold">#{ticket.id}</Text>
                  {totals.hasWinner && <WinnerBadge size="md" />}
                  <TicketStatusBadge status={ticket.status} size="md" />
                </XStack>

                <Text fontSize="$4" color="$textSecondary"><Text fontWeight="600">Lotería:</Text> {loteriaName}</Text>
                <Text fontSize="$4" color="$textSecondary"><Text fontWeight="600">Sorteo:</Text> {sorteoName}</Text>
                <Text fontSize="$4" color="$textSecondary"><Text fontWeight="600">Vendedor:</Text> {vendorName}</Text>
                <Text fontSize="$4" color="$textSecondary"><Text fontWeight="600">Ventana:</Text> {ventanaName}</Text>
                <Text fontSize="$4" color="$textSecondary"><Text fontWeight="600">Creado:</Text> {createdAt}</Text>
              </YStack>

              <YStack ai="flex-end" gap="$2">
                <Text fontSize="$2" color="$textSecondary">Monto total</Text>
                <Text fontSize="$9" fontWeight="bold" color="$blue11">{formatCurrency(ticket.totalAmount)}</Text>
                {totals.hasWinner && totals.totalPayout > 0 && (
                  <>
                    <Separator />
                    <Text fontSize="$2" color="$textSecondary">Monto ganado</Text>
                    <Text fontSize="$8" fontWeight="bold" color="$green10">{formatCurrency(totals.totalPayout)}</Text>
                  </>
                )}
              </YStack>
            </XStack>
          </YStack>
        </Card>

        {/* ✅ v2.0: Información de Pagos (Sistema Unificado) - Usando componentes compartidos */}
        {totals.hasWinner && totals.totalPayout > 0 && (
          <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
            <YStack gap="$3">
              <Text fontSize="$6" fontWeight="bold">Información de Pagos</Text>
              
              {/* Grid de montos - Componente compartido */}
              <PaymentAmountsGrid totals={totals} size="lg" showLabels />

              {/* Barra de progreso - Componente compartido */}
              <PaymentProgressBar totals={totals} showPercentage />

              {/* Historial de Pagos */}
              {hasPayments && (
                <YStack gap="$2" mt="$2">
                  <Text fontSize="$5" fontWeight="600">Historial de Pagos</Text>
                  <YStack gap="$2">
                    {ticket.paymentHistory.map((payment: any, idx: number) => (
                      <Card 
                        key={payment.id || idx}
                        padding="$3"
                        backgroundColor={payment.isReversed ? '$red1' : '$background'}
                        borderColor={payment.isReversed ? '$red8' : '$borderColor'}
                        borderWidth={1}
                      >
                        <XStack jc="space-between" ai="flex-start" gap="$3" flexWrap="wrap">
                          <YStack flex={1} gap="$1">
                            <XStack ai="center" gap="$2" flexWrap="wrap">
                              <Text fontSize="$5" fontWeight="700" color={payment.isReversed ? '$red11' : '$green11'}>
                                {formatCurrency(payment.amountPaid)}
                              </Text>
                              {payment.isReversed && (
                                <XStack bg="$red4" px="$2" py="$1" br="$2" bw={1} bc="$red8">
                                  <Text fontSize="$2" fontWeight="700" color="$red11">REVERTIDO</Text>
                                </XStack>
                              )}
                              {payment.isFinal && !payment.isReversed && (
                                <XStack bg="$yellow4" px="$2" py="$1" br="$2" bw={1} bc="$yellow8">
                                  <Text fontSize="$2" fontWeight="700" color="$yellow11">FINAL</Text>
                                </XStack>
                              )}
                            </XStack>
                            <Text fontSize="$3" color="$textSecondary">
                              <Text fontWeight="600">Método:</Text> {payment.method || 'N/A'} • <Text fontWeight="600">Pagado por:</Text> {payment.paidByName || 'N/A'}
                            </Text>
                            <Text fontSize="$2" color="$textSecondary">
                              {payment.paidAt ? format(new Date(payment.paidAt), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A'}
                            </Text>
                            {payment.notes && (
                              <Text fontSize="$2" color="$textSecondary" fontStyle="italic">"{payment.notes}"</Text>
                            )}
                          </YStack>
                        </XStack>
                      </Card>
                    ))}
                  </YStack>
                </YStack>
              )}

              {/* Información adicional */}
              {ticket.lastPaymentAt && (
                <YStack gap="$1" mt="$2" padding="$2" backgroundColor="$gray2" borderRadius="$2">
                  <Text fontSize="$2" color="$textSecondary">
                    <Text fontWeight="600">Último pago:</Text> {format(new Date(ticket.lastPaymentAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </Text>
                  {ticket.paymentMethod && (
                    <Text fontSize="$2" color="$textSecondary">
                      <Text fontWeight="600">Método:</Text> {ticket.paymentMethod}
                    </Text>
                  )}
                </YStack>
              )}
            </YStack>
          </Card>
        )}

        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="bold">Jugadas ({jugadas.length})</Text>
          <JugadasList 
            jugadas={jugadas} 
            grouped={true}
            size="md" 
          />
        </YStack>
      </YStack>
    </ScrollView>
  )
}
