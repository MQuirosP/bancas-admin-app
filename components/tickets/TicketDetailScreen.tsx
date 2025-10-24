// app/admin/tickets/[id].tsx
import React from 'react'
import { YStack, XStack, Text, Card, ScrollView, Spinner, Button, Separator } from 'tamagui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api.client'
import { formatCurrency } from '@/utils/formatters'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft } from '@tamagui/lucide-icons'
import { safeBack } from '@/lib/navigation'
import { Scope } from '../../types/scope'

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
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: ['tickets', 'detail', id],
    queryFn: () => fetchTicketDetail(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <YStack flex={1} ai="center" jc="center" bg="$background">
        <Spinner size="large" />
        <Text mt="$4">Cargando ticket...</Text>
      </YStack>
    )
  }

  if (isError || !ticket) {
    return (
      <YStack flex={1} ai="center" jc="center" bg="$background" p="$4">
        <Text fontSize="$6" fontWeight="bold" color="$error">Error al cargar ticket</Text>
        <Button mt="$4" onPress={() => safeBack('/admin/tickets')}>
          Volver a tickets
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

  // Calcular monto ganado total
  const totalWinnings = jugadas.reduce((sum: number, j: any) => {
    return sum + (j.isWinner ? (j.winAmount || 0) : 0)
  }, 0)

  // Badge styling para status
  const statusBadgeProps = (() => {
    switch (ticket.status) {
      case 'EVALUATED':
        return { bg: '$yellow4', color: '$yellow11', bc: '$yellow8' }
      case 'OPEN':
        return { bg: '$green4', color: '$green11', bc: '$green8' }
      case 'PENDING':
        return { bg: '$blue4', color: '$blue11', bc: '$blue8' }
      case 'CANCELLED':
        return { bg: '$red4', color: '$red11', bc: '$red8' }
      default:
        return { bg: '$gray4', color: '$gray11', bc: '$gray8' }
    }
  })()

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={1000} alignSelf="center" width="100%">
        {/* Header con botón volver */}
        <XStack ai="center" gap="$3">
          <Button
            size="$3"
            icon={ArrowLeft}
            onPress={() => safeBack('/admin/tickets')}
            bg="$background"
            borderColor="$borderColor"
            borderWidth={1}
            hoverStyle={{ bg: '$backgroundHover' }}
            pressStyle={{ bg: '$backgroundPress' }}
            circular
          />
          <Text fontSize="$8" fontWeight="bold">Detalle del Ticket</Text>
        </XStack>

        {/* Info general del ticket */}
        <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
          <YStack gap="$3">
            <XStack jc="space-between" ai="flex-start" gap="$3" flexWrap="wrap">
              <YStack flex={1} gap="$2">
                <XStack ai="center" gap="$2" flexWrap="wrap">
                  <Text fontSize="$7" fontWeight="bold">#{ticket.id}</Text>
                  {hasWinner && (
                    <XStack
                      bg="$green4"
                      px="$3"
                      py="$1.5"
                      br="$3"
                      bw={1}
                      bc="$green8"
                    >
                      <Text color="$green11" fontSize="$3" fontWeight="700">
                        GANADOR
                      </Text>
                    </XStack>
                  )}
                  <XStack
                    px="$3"
                    py="$1.5"
                    br="$3"
                    bw={1}
                    {...statusBadgeProps}
                  >
                    <Text
                      fontSize="$3"
                      fontWeight="700"
                      textTransform="uppercase"
                      color={statusBadgeProps.color}
                    >
                      {ticket.status}
                    </Text>
                  </XStack>
                </XStack>

                <Text fontSize="$4" color="$textSecondary">
                  <Text fontWeight="600">Lotería:</Text> {loteriaName}
                </Text>
                <Text fontSize="$4" color="$textSecondary">
                  <Text fontWeight="600">Sorteo:</Text> {sorteoName}
                </Text>
                <Text fontSize="$4" color="$textSecondary">
                  <Text fontWeight="600">Vendedor:</Text> {vendorName}
                </Text>
                <Text fontSize="$4" color="$textSecondary">
                  <Text fontWeight="600">Ventana:</Text> {ventanaName}
                </Text>
                <Text fontSize="$4" color="$textSecondary">
                  <Text fontWeight="600">Creado:</Text> {createdAt}
                </Text>
              </YStack>

              <YStack ai="flex-end" gap="$2">
                <Text fontSize="$2" color="$textSecondary">Monto total</Text>
                <Text fontSize="$9" fontWeight="bold" color="$blue11">
                  {formatCurrency(ticket.totalAmount)}
                </Text>
                {hasWinner && totalWinnings > 0 && (
                  <>
                    <Separator />
                    <Text fontSize="$2" color="$textSecondary">Monto ganado</Text>
                    <Text fontSize="$8" fontWeight="bold" color="$green10">
                      {formatCurrency(totalWinnings)}
                    </Text>
                  </>
                )}
              </YStack>
            </XStack>
          </YStack>
        </Card>

        {/* Lista de jugadas */}
        <YStack gap="$2">
          <Text fontSize="$6" fontWeight="bold">
            Jugadas ({jugadas.length})
          </Text>

          {jugadas.length === 0 ? (
            <Card padding="$4" ai="center" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
              <Text color="$textSecondary">Este ticket no tiene jugadas</Text>
            </Card>
          ) : (
            jugadas.map((jugada: any, idx: number) => {
              const isWinner = jugada.isWinner === true
              const winAmount = jugada.payout || 0

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
                        <Text fontSize="$5" fontWeight="700" color="$blue11">
                          Número: {jugada.number || 'N/A'}
                        </Text>
                        {jugada.type && (
                          <XStack
                            bg="$blue3"
                            px="$2"
                            py="$1"
                            br="$2"
                            bw={1}
                            bc="$blue7"
                          >
                            <Text fontSize="$2" fontWeight="600" color="$blue11">
                              {jugada.type === 'REVENTADO' ? 'EXTRA' : jugada.type}
                            </Text>
                          </XStack>
                        )}
                        {isWinner && (
                          <XStack
                            bg="$green4"
                            px="$2"
                            py="$1"
                            br="$2"
                            bw={1}
                            bc="$green8"
                          >
                            <Text fontSize="$2" fontWeight="700" color="$green11">
                              GANADOR
                            </Text>
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
