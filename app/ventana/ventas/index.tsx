import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, ScrollView, Spinner } from 'tamagui'
import { Card, Select, Button } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../lib/api.client'
import { formatCurrency } from '../../../utils/formatters'
import { Check, ChevronDown, RefreshCw, ArrowLeft } from '@tamagui/lucide-icons'
import { useTheme } from 'tamagui'
import { useRouter } from 'expo-router'

type DateRange = 'today' | 'week' | 'month' | 'range'

export default function MisVentasScreen() {
  const theme = useTheme()
  const router = useRouter()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
  const [dateRange, setDateRange] = useState<DateRange>('today')
  const [page, setPage] = useState(1)

  const params = useMemo(() => ({ page, pageSize: 20, date: dateRange, scope: 'mine' }), [page, dateRange])

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['ventas', params],
    queryFn: () => apiClient.get('/ventas', params),
    staleTime: 60_000,
  })

  const payload = (data as any)?.data ?? data ?? {}
  const totals = {
    tickets: payload?.ticketsCount ?? payload?.totalTickets ?? 0,
    amount: payload?.totalAmount ?? 0,
    active: payload?.activeTickets ?? payload?.ticketsActive ?? 0,
    evaluated: payload?.evaluatedTickets ?? payload?.ticketsEvaluated ?? 0,
    winners: payload?.winnerTickets ?? payload?.ticketsWithWinners ?? 0,
    hasWinners: (payload?.winnerTickets ?? payload?.ticketsWithWinners ?? 0) > 0,
  }
  const perSeller: Array<{ id?: string; name?: string; total?: number; tickets?: number }>
    = Array.isArray(payload?.bySeller) ? payload.bySeller : Array.isArray(payload?.sellers) ? payload.sellers : []

  return (
    <ScrollView flex={1} backgroundColor={'$background'}>
      <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
          <XStack ai="center" gap="$2">
            <Button
              size="$3"
              circular
              backgroundColor="transparent"
              borderWidth={0}
              icon={(p: any) => <ArrowLeft {...p} color={iconColor} size={20} />}
              onPress={() => router.back()}
            />
            <Text fontSize="$8" fontWeight="bold" color="$color">Mis Ventas</Text>
          </XStack>
          {isFetching && <Spinner size="small" />}
        </XStack>

        <Card padding="$3" borderColor="$borderColor" borderWidth={1}>
          <XStack gap="$3" flexWrap="wrap" ai="flex-end">
            <YStack gap="$1" minWidth={220}>
              <Text fontSize="$3">Período</Text>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                <Select.Trigger width={220} height={36} br="$4" bw={1} bc="$borderColor" backgroundColor="$background" iconAfter={ChevronDown}>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content zIndex={200000}>
                  <Select.Viewport>
                    {([
                      { value: 'today', label: 'Hoy' },
                      { value: 'week', label: 'Semana' },
                      { value: 'month', label: 'Mes' },
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
              <Button height={36} px="$4" icon={(p:any)=> <RefreshCw {...p} color={iconColor} />} onPress={() => { setPage(1); refetch() }}
                backgroundColor="$green4" borderColor="$green8" borderWidth={1}
                hoverStyle={{ backgroundColor: '$green5' }} pressStyle={{ backgroundColor: '$green6' }}
              >
                Refrescar
              </Button>
            </YStack>
          </XStack>
        </Card>

        <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
          <Text fontSize="$5" fontWeight="600" marginBottom="$3">Resumen</Text>
          <XStack justifyContent="space-around" flexWrap="wrap" gap="$4">
            <YStack ai="center">
              <Text fontSize="$7" fontWeight="bold" color="$primary">{totals.tickets}</Text>
              <Text color="$textSecondary">Tickets Vendidos</Text>
            </YStack>
            <YStack ai="center">
              <Text fontSize="$7" fontWeight="bold" color="$green10">{formatCurrency(totals.amount)}</Text>
              <Text color="$textSecondary">Total Vendido</Text>
            </YStack>
            <YStack ai="center">
              <Text fontSize="$7" fontWeight="bold" color="$blue10">{totals.active}</Text>
              <Text color="$textSecondary">Activos para Sorteos</Text>
            </YStack>
            <YStack ai="center">
              <Text fontSize="$7" fontWeight="bold" color="$yellow10">{totals.evaluated}</Text>
              <Text color="$textSecondary">Ya Evaluados</Text>
            </YStack>
            <YStack ai="center">
              <Text fontSize="$7" fontWeight="bold" color={totals.hasWinners ? '$orange10' : '$gray9'}>{totals.winners}</Text>
              <Text color="$textSecondary">Tiques Ganadores {totals.hasWinners ? '✓' : ''}</Text>
            </YStack>
          </XStack>
        </Card>

        {perSeller?.length ? (
          <>
            <Text fontSize="$5" fontWeight="600" mt="$2">Vendedores</Text>
            <YStack gap="$2">
              {perSeller.map((s, i) => (
                <Card key={s.id || i} padding="$4">
                  <XStack jc="space-between" ai="center">
                    <YStack>
                      <Text fontSize="$4" fontWeight="600">{s.name || s.id || '—'}</Text>
                      <Text fontSize="$3" color="$textSecondary">{s.tickets ?? '—'} tickets</Text>
                    </YStack>
                    <Text fontSize="$5" fontWeight="bold" color="$primary">{formatCurrency(s.total ?? 0)}</Text>
                  </XStack>
                </Card>
              ))}
            </YStack>
          </>
        ) : null}
      </YStack>
    </ScrollView>
  )
}

