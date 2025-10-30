import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, ScrollView, Spinner } from 'tamagui'
import { Card, Button, Select } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../lib/api.client'
import { formatCurrency } from '../../../utils/formatters'
import { getDateParam, type DateToken } from '../../../lib/dateFormat'
import { ArrowLeft, RefreshCw, TrendingUp, Check, ChevronDown } from '@tamagui/lucide-icons'
import { useTheme } from 'tamagui'
import { safeBack } from '../../../lib/navigation'
import { DEFAULT_TOP } from '../../../lib/constants'
import { useToast } from '../../../hooks/useToast'

export default function VendedoresScreen() {
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
  const [dateToken, setDateToken] = useState<DateToken>('today')
  const { error: showError } = useToast()

  const params = useMemo(() => {
    const dateParams = getDateParam(dateToken)
    return { ...dateParams, scope: 'mine', dimension: 'vendedor', top: DEFAULT_TOP }
  }, [dateToken])

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['vendedores', params],
    queryFn: () => apiClient.get('/ventas/breakdown', params),
    staleTime: 60_000,
    refetchOnMount: 'always',
    onError: (err: any) => {
      // ✅ Manejo del error RBAC_003: Usuario VENTANA sin ventanaId asignado
      if (err?.code === 'RBAC_003') {
        showError('Tu cuenta necesita configuración. Contacta al administrador.')
      }
    },
  })

  // Extraer vendedores del breakdown
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
      vendedores = payload.map((item: any) => {
        const winnerTickets = Number(item.totalWinningTickets ?? item.winnerTickets ?? 0)
        const paidTickets = Number(item.totalPaidTickets ?? item.paidTickets ?? 0)
        const pendingPayment = Math.max(0, winnerTickets - paidTickets)

        return {
          id: item.key ?? item.id,
          name: item.name,
          total: Number(item.ventasTotal ?? item.total ?? 0),
          tickets: Number(item.ticketsCount ?? item.tickets ?? 0),
          payout: Number(item.payoutTotal ?? item.payout ?? 0),
          neto: Number(item.neto ?? 0),
          winnerTickets,
          paidTickets,
          pendingPayment,
        }
      })
    } else if (Array.isArray(payload?.breakdown)) {
      // Breakdown es un array
      vendedores = payload.breakdown.map((item: any) => {
        const winnerTickets = Number(item.totalWinningTickets ?? item.winnerTickets ?? 0)
        const paidTickets = Number(item.totalPaidTickets ?? item.paidTickets ?? 0)
        const pendingPayment = Math.max(0, winnerTickets - paidTickets)

        return {
          id: item.key ?? item.id,
          name: item.name,
          total: Number(item.ventasTotal ?? item.total ?? 0),
          tickets: Number(item.ticketsCount ?? item.tickets ?? 0),
          payout: Number(item.payoutTotal ?? item.payout ?? 0),
          neto: Number(item.neto ?? 0),
          winnerTickets,
          paidTickets,
          pendingPayment,
        }
      })
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
            <YStack gap="$1" minWidth={220}>
              <Text fontSize="$3">Período</Text>
              <Select value={dateToken} onValueChange={(v) => setDateToken(v as DateToken)}>
                <Select.Trigger width={220} height={36} br="$4" bw={1} bc="$borderColor" backgroundColor="$background" iconAfter={ChevronDown}>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content zIndex={200000}>
                  <Select.Viewport>
                    {([
                      { value: 'today', label: 'Hoy' },
                      { value: 'yesterday', label: 'Ayer' },
                      { value: 'week', label: 'Esta Semana' },
                      { value: 'month', label: 'Este Mes' },
                      { value: 'year', label: 'Este Año' },
                    ] as const).map((it, idx) => (
                      <Select.Item key={it.value} value={it.value} index={idx}>
                        <Select.ItemText>{it.label}</Select.ItemText>
                        <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select>
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

        {/* Error de configuración */}
        {error && (
          <Card padding="$6" bg="$red2" borderColor="$red8" borderWidth={2} ai="center" jc="center" gap="$3">
            <Text fontSize="$6" fontWeight="bold" color="$red11">⚠️ Error de Configuración</Text>
            <Text color="$red11" fontSize="$4" ta="center">
              {(error as any)?.code === 'RBAC_003' 
                ? 'Tu cuenta de ventana no tiene asignada una ventana válida. Por favor contacta al administrador del sistema para que configure tu cuenta correctamente.'
                : 'No se pudieron cargar los vendedores. Por favor intenta de nuevo o contacta al administrador.'}
            </Text>
          </Card>
        )}

        {/* Listado de Vendedores - Desempeño Individual */}
        {!error && vendedores?.length ? (
          <>
            <Text fontSize="$5" fontWeight="600" mt="$2">Desempeño Individual</Text>
            <YStack gap="$2">
              {vendedores.map((v, i) => (
                <Card key={v.id || i} padding="$4" hoverStyle={{ backgroundColor: '$backgroundHover' }}>
                  <XStack jc="space-around" ai="center" gap="$2" py="$2">
                    {/* Nombre */}
                    <XStack ai="center" gap="$1.5" minWidth={120}>
                      <TrendingUp size={14} color="$primary" />
                      <Text fontSize="$3" fontWeight="600">{v.name || v.id || '—'}</Text>
                    </XStack>

                    {/* Tiquetes vendidos */}
                    <YStack ai="center" gap="$0.5" minWidth={80}>
                      <Text fontSize="$4" fontWeight="bold" color="$primary">{v.tickets ?? 0}</Text>
                      <Text fontSize="$1.5" color="$textSecondary" ta="center">Tiquetes</Text>
                    </YStack>

                    {/* Tiquetes ganadores */}
                    <YStack ai="center" gap="$0.5" minWidth={80}>
                      <Text fontSize="$4" fontWeight="bold" color="$orange10">{v.winnerTickets ?? 0}</Text>
                      <Text fontSize="$1.5" color="$textSecondary" ta="center">Ganadores</Text>
                    </YStack>

                    {/* Tiquetes pagados */}
                    <YStack ai="center" gap="$0.5" minWidth={80}>
                      <Text fontSize="$4" fontWeight="bold" color="$blue10">{v.paidTickets ?? 0}</Text>
                      <Text fontSize="$1.5" color="$textSecondary" ta="center">Pagados</Text>
                    </YStack>

                    {/* Pendientes de pagar */}
                    <YStack ai="center" gap="$0.5" minWidth={80}>
                      <Text fontSize="$4" fontWeight="bold" color="$yellow10">{v.pendingPayment ?? 0}</Text>
                      <Text fontSize="$1.5" color="$textSecondary" ta="center">Pendientes</Text>
                    </YStack>

                    {/* Total Vendido */}
                    <YStack ai="center" gap="$0.5" minWidth={110}>
                      <Text fontSize="$1.5" color="$textSecondary" ta="center">Total</Text>
                      <Text fontSize="$4" fontWeight="bold" color="$green10">{formatCurrency(v.total ?? 0)}</Text>
                    </YStack>
                  </XStack>
                </Card>
              ))}
            </YStack>
          </>
        ) : !error ? (
          <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} ai="center" jc="center" minHeight={200}>
            <Text color="$textSecondary" fontSize="$4">Sin datos disponibles</Text>
          </Card>
        ) : null}
      </YStack>
    </ScrollView>
  )
}
