import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, ScrollView, Spinner } from 'tamagui'
import { Card, Button } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../lib/api.client'
import { formatCurrency } from '../../../utils/formatters'
import { ArrowLeft, RefreshCw, TrendingUp } from '@tamagui/lucide-icons'
import { useTheme } from 'tamagui'
import { safeBack } from '../../../lib/navigation'
import { DEFAULT_TOP } from '../../../lib/constants'

export default function VendedoresScreen() {
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'

  const params = useMemo(() => ({ date: 'today', scope: 'mine', dimension: 'vendedor', top: DEFAULT_TOP }), [])

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['vendedores', params],
    queryFn: () => apiClient.get('/ventas/breakdown', params),
    staleTime: 60_000,
  })

  // Log para debugging
  console.log('Vendedores response:', data)

  // Extraer vendedores del breakdown con estadísticas completas
  let vendedores: Array<{
    id?: string
    name?: string
    total?: number
    tickets?: number
    payout?: number
    neto?: number
    winnerTickets?: number
    paidTickets?: number
    pendingPayment?: number
  }> = []

  if (data) {
    const payload = (data as any)?.data ?? data
    if (Array.isArray(payload)) {
      // Respuesta directa es un array
      vendedores = payload.map((item: any) => ({
        id: item.key ?? item.id,
        name: item.name,
        total: Number(item.ventasTotal ?? item.total ?? 0),
        tickets: Number(item.ticketsCount ?? item.tickets ?? 0),
        payout: Number(item.payoutTotal ?? item.payout ?? 0),
        neto: Number(item.neto ?? 0),
        winnerTickets: Number(item.winnerTickets ?? item.ticketsWithWinners ?? 0),
        paidTickets: Number(item.paidTickets ?? item.ticketsPaid ?? 0),
        pendingPayment: Number(item.pendingPayment ?? item.ticketsPending ?? 0),
      }))
    } else if (Array.isArray(payload?.breakdown)) {
      // Breakdown es un array
      vendedores = payload.breakdown.map((item: any) => ({
        id: item.key ?? item.id,
        name: item.name,
        total: Number(item.ventasTotal ?? item.total ?? 0),
        tickets: Number(item.ticketsCount ?? item.tickets ?? 0),
        payout: Number(item.payoutTotal ?? item.payout ?? 0),
        neto: Number(item.neto ?? 0),
        winnerTickets: Number(item.winnerTickets ?? item.ticketsWithWinners ?? 0),
        paidTickets: Number(item.paidTickets ?? item.ticketsPaid ?? 0),
        pendingPayment: Number(item.pendingPayment ?? item.ticketsPending ?? 0),
      }))
    }
  }

  const stats = useMemo(() => ({
    totalVendedores: vendedores.length,
    totalVentas: vendedores.reduce((sum, v) => sum + (v.total ?? 0), 0),
    totalTickets: vendedores.reduce((sum, v) => sum + (v.tickets ?? 0), 0),
    totalPayout: vendedores.reduce((sum, v) => sum + (v.payout ?? 0), 0),
    totalNeto: vendedores.reduce((sum, v) => sum + (v.neto ?? 0), 0),
    totalWinners: vendedores.reduce((sum, v) => sum + (v.winnerTickets ?? 0), 0),
    totalPaid: vendedores.reduce((sum, v) => sum + (v.paidTickets ?? 0), 0),
    totalPending: vendedores.reduce((sum, v) => sum + (v.pendingPayment ?? 0), 0),
    topVendedor: vendedores.length > 0 ? vendedores[0] : null,
  }), [vendedores])

  return (
    <ScrollView flex={1} backgroundColor={'$background'}>
      <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        {/* Header con botón de volver */}
        <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
          <XStack ai="center" gap="$2">
            <Button
              size="$3"
              icon={(p: any) => <ArrowLeft {...p} size={24} color={iconColor} />}
              onPress={() => safeBack('/ventana')}
              backgroundColor="transparent"
              borderWidth={0}
              hoverStyle={{ backgroundColor: 'transparent' }}
              pressStyle={{ scale: 0.98 }}
            />
            <Text fontSize="$8" fontWeight="bold" color="$color">Vendedores</Text>
          </XStack>
          {isFetching && <Spinner size="small" />}
        </XStack>

        {/* Controls */}
        <Card padding="$3" borderColor="$borderColor" borderWidth={1}>
          <XStack gap="$3" flexWrap="wrap" ai="flex-end">
            <YStack gap="$1" flex={1} minWidth={220}>
              <Text fontSize="$3">Período</Text>
              <Text fontSize="$4" fontWeight="500">Hoy</Text>
            </YStack>
            <YStack gap="$1">
              <Text fontSize="$3" opacity={0}>Acción</Text>
              <Button height={36} px="$4" icon={(p: any) => <RefreshCw {...p} color={iconColor} />} onPress={() => refetch()}
                backgroundColor="$green4" borderColor="$green8" borderWidth={1}
                hoverStyle={{ backgroundColor: '$green5' }} pressStyle={{ backgroundColor: '$green6' }}
              >
                Refrescar
              </Button>
            </YStack>
          </XStack>
        </Card>

        {/* Stats Summary */}
        <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
          <Text fontSize="$5" fontWeight="600" marginBottom="$3">Resumen</Text>
          <XStack justifyContent="space-around" flexWrap="wrap" gap="$4">
            <YStack ai="center">
              <Text fontSize="$7" fontWeight="bold" color="$primary">{stats.totalVendedores}</Text>
              <Text color="$textSecondary">Vendedores Activos</Text>
            </YStack>
            <YStack ai="center">
              <Text fontSize="$7" fontWeight="bold" color="$green10">{stats.totalTickets}</Text>
              <Text color="$textSecondary">Tickets Vendidos</Text>
            </YStack>
            <YStack ai="center">
              <Text fontSize="$7" fontWeight="bold" color="$blue10">{formatCurrency(stats.totalVentas)}</Text>
              <Text color="$textSecondary">Total Vendido</Text>
            </YStack>
          </XStack>
        </Card>

        {/* Listado de Vendedores - Desempeño Individual */}
        {vendedores?.length ? (
          <>
            <Text fontSize="$5" fontWeight="600" mt="$2">Desempeño Individual</Text>
            <YStack gap="$2">
              {vendedores.map((v, i) => (
                <Card key={v.id || i} padding="$4" hoverStyle={{ backgroundColor: '$backgroundHover' }}>
                  <YStack gap="$3">
                    {/* Nombre y total vendido */}
                    <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
                      <XStack ai="center" gap="$2" flex={1} minWidth={150}>
                        <TrendingUp size={16} color="$primary" />
                        <Text fontSize="$4" fontWeight="600">{v.name || v.id || '—'}</Text>
                      </XStack>
                      <Text fontSize="$5" fontWeight="bold" color="$green10">{formatCurrency(v.total ?? 0)}</Text>
                    </XStack>

                    {/* Estadísticas en grid */}
                    <XStack gap="$3" flexWrap="wrap">
                      {/* Tiquetes vendidos */}
                      <YStack gap="$1" flex={1} minWidth={100}>
                        <Text fontSize="$2" color="$textSecondary">Tiquetes Vendidos</Text>
                        <Text fontSize="$4" fontWeight="bold" color="$primary">{v.tickets ?? 0}</Text>
                      </YStack>

                      {/* Tiquetes ganadores */}
                      {(v.winnerTickets ?? 0) > 0 && (
                        <YStack gap="$1" flex={1} minWidth={100}>
                          <Text fontSize="$2" color="$textSecondary">Tiquetes Ganadores</Text>
                          <Text fontSize="$4" fontWeight="bold" color="$orange10">{v.winnerTickets ?? 0}</Text>
                        </YStack>
                      )}

                      {/* Tiquetes pagados */}
                      {(v.paidTickets ?? 0) > 0 && (
                        <YStack gap="$1" flex={1} minWidth={100}>
                          <Text fontSize="$2" color="$textSecondary">Pagados</Text>
                          <Text fontSize="$4" fontWeight="bold" color="$blue10">{v.paidTickets ?? 0}</Text>
                        </YStack>
                      )}

                      {/* Pendientes de pagar */}
                      {(v.pendingPayment ?? 0) > 0 && (
                        <YStack gap="$1" flex={1} minWidth={100}>
                          <Text fontSize="$2" color="$textSecondary">Pendientes</Text>
                          <Text fontSize="$4" fontWeight="bold" color="$yellow10">{v.pendingPayment ?? 0}</Text>
                        </YStack>
                      )}

                      {/* Payout (comisión) */}
                      {(v.payout ?? 0) > 0 && (
                        <YStack gap="$1" flex={1} minWidth={100}>
                          <Text fontSize="$2" color="$textSecondary">Comisión</Text>
                          <Text fontSize="$4" fontWeight="bold" color="$purple10">{formatCurrency(v.payout ?? 0)}</Text>
                        </YStack>
                      )}

                      {/* Neto */}
                      {(v.neto ?? 0) > 0 && (
                        <YStack gap="$1" flex={1} minWidth={100}>
                          <Text fontSize="$2" color="$textSecondary">Neto</Text>
                          <Text fontSize="$4" fontWeight="bold" color="$cyan10">{formatCurrency(v.neto ?? 0)}</Text>
                        </YStack>
                      )}
                    </XStack>
                  </YStack>
                </Card>
              ))}
            </YStack>
          </>
        ) : (
          <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} ai="center" jc="center" minHeight={200}>
            <Text color="$textSecondary" fontSize="$4">Sin datos disponibles</Text>
          </Card>
        )}
      </YStack>
    </ScrollView>
  )
}
