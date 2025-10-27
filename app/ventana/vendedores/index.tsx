import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, ScrollView, Spinner } from 'tamagui'
import { Card, Button } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../lib/api.client'
import { formatCurrency } from '../../../utils/formatters'
import { ArrowLeft, RefreshCw, TrendingUp } from '@tamagui/lucide-icons'
import { useTheme } from 'tamagui'
import { safeBack } from '../../../lib/navigation'

export default function VendedoresScreen() {
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'

  const params = useMemo(() => ({ date: 'today', scope: 'mine', dimension: 'vendedor', top: 100 }), [])

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['vendedores', params],
    queryFn: () => apiClient.get('/ventas/breakdown', params),
    staleTime: 60_000,
  })

  const payload = (data as any)?.data ?? data ?? {}
  const vendedores: Array<{ id?: string; name?: string; total?: number; tickets?: number }>
    = Array.isArray(payload?.breakdown) ? payload.breakdown : Array.isArray(payload) ? payload : []

  const stats = useMemo(() => ({
    totalVendedores: vendedores.length,
    totalVentas: vendedores.reduce((sum, v) => sum + (v.total ?? 0), 0),
    totalTickets: vendedores.reduce((sum, v) => sum + (v.tickets ?? 0), 0),
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
              circular
              backgroundColor="transparent"
              borderWidth={0}
              icon={(p: any) => <ArrowLeft {...p} color={iconColor} size={20} />}
              onPress={() => safeBack('/ventana')}
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

        {/* Listado de Vendedores */}
        {vendedores?.length ? (
          <>
            <Text fontSize="$5" fontWeight="600" mt="$2">Desempeño Individual</Text>
            <YStack gap="$2">
              {vendedores.map((v, i) => (
                <Card key={v.id || i} padding="$4" hoverStyle={{ backgroundColor: '$backgroundHover' }}>
                  <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
                    <YStack flex={1} minWidth={150}>
                      <XStack ai="center" gap="$2">
                        <TrendingUp size={16} color="$primary" />
                        <Text fontSize="$4" fontWeight="600">{v.name || v.id || '—'}</Text>
                      </XStack>
                      <Text fontSize="$3" color="$textSecondary" mt="$1">{v.tickets ?? 0} tickets · {formatCurrency(v.total ?? 0)}</Text>
                    </YStack>
                  </XStack>
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
