import React from 'react'
import { YStack, XStack, Text, Card, ScrollView, Spinner, Separator } from 'tamagui'
import { Button } from '@/components/ui'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from '@tamagui/lucide-icons'
import { apiClient } from '@/lib/api.client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCurrency } from '@/utils/formatters'
import type { Scope } from '@/types/scope'

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
  const jugadas = ticket.jugadas || []
  const hasWinner = jugadas.some((j: any) => j.isWinner === true)
  const createdAt = ticket.createdAt ? format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A'
  
  // ✅ v2.0: Usar campos unificados si están disponibles, fallback a cálculo manual
  // PERO: Si totalPayout es 0 y el ticket es ganador, calcular desde jugadas
  const hasUnifiedPayout = ticket.totalPayout !== undefined && ticket.totalPayout !== null
  const shouldUseUnified = hasUnifiedPayout && (ticket.totalPayout > 0 || !hasWinner)
  
  const totalWinnings = shouldUseUnified
    ? ticket.totalPayout
    : jugadas.reduce((sum: number, j: any) => sum + (j.isWinner ? (j.payout || j.winAmount || 0) : 0), 0)
  
  const totalPaid = shouldUseUnified ? (ticket.totalPaid || 0) : 0
  const remainingAmount = shouldUseUnified ? (ticket.remainingAmount || 0) : (totalWinnings - totalPaid)
  const hasPayments = ticket.paymentHistory && ticket.paymentHistory.length > 0
  const isPaid = ticket.status === 'PAID'

  const statusBadgeProps = (() => {
    switch (ticket.status) {
      case 'EVALUATED': return { bg: '$yellow4', color: '$yellow11', bc: '$yellow8' }
      case 'ACTIVE':
      case 'OPEN': return { bg: '$green4', color: '$green11', bc: '$green8' }
      case 'PENDING': return { bg: '$blue4', color: '$blue11', bc: '$blue8' }
      case 'CANCELLED': return { bg: '$red4', color: '$red11', bc: '$red8' }
      default: return { bg: '$gray4', color: '$gray11', bc: '$gray8' }
    }
  })()

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
                  {hasWinner && (
                    <XStack bg="$green4" px="$3" py="$1.5" br="$3" bw={1} bc="$green8">
                      <Text color="$green11" fontSize="$3" fontWeight="700">GANADOR</Text>
                    </XStack>
                  )}
                  <XStack px="$3" py="$1.5" br="$3" bw={1} {...statusBadgeProps}>
                    <Text fontSize="$3" fontWeight="700" textTransform="uppercase" color={statusBadgeProps.color}>
                      {ticket.status}
                    </Text>
                  </XStack>
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
                {hasWinner && totalWinnings > 0 && (
                  <>
                    <Separator />
                    <Text fontSize="$2" color="$textSecondary">Monto ganado</Text>
                    <Text fontSize="$8" fontWeight="bold" color="$green10">{formatCurrency(totalWinnings)}</Text>
                  </>
                )}
              </YStack>
            </XStack>
          </YStack>
        </Card>

        {/* ✅ v2.0: Información de Pagos (Sistema Unificado) */}
        {hasWinner && totalWinnings > 0 && (
          <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
            <YStack gap="$3">
              <Text fontSize="$6" fontWeight="bold">Información de Pagos</Text>
              
              {/* Grid de montos */}
              <XStack gap="$3" flexWrap="wrap" jc="space-between">
                <Card flex={1} minWidth={140} padding="$3" backgroundColor="$blue2" ai="center" jc="center" borderRadius="$3">
                  <YStack ai="center" gap="$1">
                    <Text fontSize="$2" color="$blue11" fontWeight="500">Total Premio</Text>
                    <Text fontSize="$6" fontWeight="700" color="$blue11">{formatCurrency(totalWinnings)}</Text>
                  </YStack>
                </Card>

                <Card flex={1} minWidth={140} padding="$3" backgroundColor="$green2" ai="center" jc="center" borderRadius="$3">
                  <YStack ai="center" gap="$1">
                    <Text fontSize="$2" color="$green11" fontWeight="500">Pagado</Text>
                    <Text fontSize="$6" fontWeight="700" color="$green11">{formatCurrency(totalPaid)}</Text>
                  </YStack>
                </Card>

                <Card flex={1} minWidth={140} padding="$3" backgroundColor={remainingAmount > 0 ? '$red2' : '$gray2'} ai="center" jc="center" borderRadius="$3">
                  <YStack ai="center" gap="$1">
                    <Text fontSize="$2" color={remainingAmount > 0 ? '$red11' : '$gray11'} fontWeight="500">Pendiente</Text>
                    <Text fontSize="$6" fontWeight="700" color={remainingAmount > 0 ? '$red11' : '$gray11'}>{formatCurrency(remainingAmount)}</Text>
                  </YStack>
                </Card>
              </XStack>

              {/* Barra de progreso */}
              {totalWinnings > 0 && (
                <YStack gap="$2">
                  <XStack jc="space-between">
                    <Text fontSize="$2" color="$textSecondary">Progreso de pago</Text>
                    <Text fontSize="$2" fontWeight="600" color="$textSecondary">
                      {Math.round((totalPaid / totalWinnings) * 100)}%
                    </Text>
                  </XStack>
                  <XStack height={8} backgroundColor="$gray4" borderRadius="$2" overflow="hidden">
                    <XStack 
                      width={`${Math.min((totalPaid / totalWinnings) * 100, 100)}%`} 
                      backgroundColor={isPaid ? '$green10' : '$blue10'}
                      animation="medium"
                    />
                  </XStack>
                </YStack>
              )}

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
          {jugadas.length === 0 ? (
            <Card padding="$4" ai="center" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
              <Text color="$textSecondary">Este ticket no tiene jugadas</Text>
            </Card>
          ) : (
            jugadas.map((jugada: any, idx: number) => {
              const isWinner = jugada.isWinner === true
              const winAmount = jugada.payout ?? jugada.winAmount ?? 0
              return (
                <Card
                  key={jugada.id || idx}
                  padding="$4"
                  bg={isWinner ? '$green2' : '$backgroundHover'}
                  borderColor={isWinner ? '$green8' : '$borderColor'}
                  borderWidth={isWinner ? 2 : 1}
                >
                  <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
                    <YStack flex={1} gap="$1">
                      <XStack ai="center" gap="$2" flexWrap="wrap">
                        <Text fontSize="$5" fontWeight="700" color="$blue11">Número: {jugada.number || 'N/A'}</Text>
                        {jugada.type && (
                          <XStack bg="$blue3" px="$2" py="$1" br="$2" bw={1} bc="$blue7">
                            <Text fontSize="$2" fontWeight="600" color="$blue11">
                              {jugada.type === 'REVENTADO' ? 'EXTRA' : jugada.type}
                            </Text>
                          </XStack>
                        )}
                        {isWinner && (
                          <XStack bg="$green4" px="$2" py="$1" br="$2" bw={1} bc="$green8">
                            <Text fontSize="$2" fontWeight="700" color="$green11">GANADOR</Text>
                          </XStack>
                        )}
                      </XStack>

                      <Text fontSize="$3" color="$textSecondary">
                        <Text fontWeight="600">Monto apostado:</Text> {formatCurrency(jugada.amount)}
                      </Text>

                      {jugada.finalMultiplierX && (
                        <Text fontSize="$3" color="$textSecondary">
                          <Text fontWeight="600">Multiplicador:</Text> {jugada.finalMultiplierX}x
                        </Text>
                      )}

                      {jugada.multiplier?.name && (
                        <Text fontSize="$3" color="$textSecondary">
                          <Text fontWeight="600">Multiplicador:</Text> {jugada.multiplier.name}
                        </Text>
                      )}
                    </YStack>

                    {isWinner && winAmount > 0 && (
                      <YStack ai="flex-end" gap="$1">
                        <Text fontSize="$2" color="$textSecondary">Ganancia</Text>
                        <Text fontSize="$7" fontWeight="bold" color="$green10">
                          {formatCurrency(winAmount)}
                        </Text>
                      </YStack>
                    )}
                  </XStack>
                </Card>
              )
            })
          )}
        </YStack>
      </YStack>
    </ScrollView>
  )
}
