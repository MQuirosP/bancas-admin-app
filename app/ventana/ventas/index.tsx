import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, ScrollView, Spinner } from 'tamagui'
import { Card, Select, Button } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../lib/api.client'
import { formatCurrency } from '../../../utils/formatters'
import { getDateParam, type DateToken } from '../../../lib/dateFormat'
import { Check, ChevronDown, RefreshCw, ArrowLeft } from '@tamagui/lucide-icons'
import { useTheme } from 'tamagui'
import { safeBack } from '../../../lib/navigation'

export default function MisVentasScreen() {
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
  const [dateToken, setDateToken] = useState<DateToken>('today')

  const params = useMemo(() => {
    // ✅ Backend authority: Only send token, let backend calculate
    // ✅ /ventas/summary does NOT support pagination (returns single aggregated record)
    const dateParams = getDateParam(dateToken)
    return { scope: 'mine', ...dateParams }
  }, [dateToken])

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['ventas', params],
    queryFn: () => apiClient.get('/ventas/summary', params),
    staleTime: 60_000,
  })

  const payload = (data as any)?.data ?? data ?? {}
  const totals = {
    tickets: payload?.ticketsCount ?? 0,
    amount: payload?.ventasTotal ?? 0,
    payout: payload?.payoutTotal ?? 0,
    neto: payload?.neto ?? 0,
    commission: payload?.commissionTotal ?? 0,
    netoDespuesComision: payload?.netoDespuesComision ?? 0,
  }

  return (
    <ScrollView flex={1} backgroundColor={'$background'}>
      <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
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
            <Text fontSize="$8" fontWeight="bold" color="$color">Mis Ventas</Text>
          </XStack>
          {isFetching && <Spinner size="small" />}
        </XStack>

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
              <Button height={36} px="$4" icon={(p:any)=> <RefreshCw {...p} color={iconColor} />} onPress={() => refetch()}
                backgroundColor="$green4" borderColor="$green8" borderWidth={1}
                hoverStyle={{ backgroundColor: '$green5' }} pressStyle={{ backgroundColor: '$green6' }}
              >
                Refrescar
              </Button>
            </YStack>
          </XStack>
        </Card>

        {/* Resumen KPI */}
        <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
          <Text fontSize="$5" fontWeight="600" marginBottom="$3">Resumen de Ventas</Text>
          <YStack gap="$3">
            {/* Fila 1: Tickets y Ventas Totales */}
            <XStack justifyContent="space-around" flexWrap="wrap" gap="$4">
              <YStack ai="center" flex={1} minWidth={140}>
                <Text fontSize="$7" fontWeight="bold" color="$primary">{totals.tickets}</Text>
                <Text fontSize="$2" color="$textSecondary">Tickets Vendidos</Text>
              </YStack>
              <YStack ai="center" flex={1} minWidth={140}>
                <Text fontSize="$7" fontWeight="bold" color="$green10">{formatCurrency(totals.amount)}</Text>
                <Text fontSize="$2" color="$textSecondary">Total Vendido</Text>
              </YStack>
            </XStack>

            {/* Fila 2: Premios y Comisiones */}
            <XStack justifyContent="space-around" flexWrap="wrap" gap="$4">
              <YStack ai="center" flex={1} minWidth={140}>
                <Text fontSize="$6" fontWeight="bold" color="$orange10">{formatCurrency(totals.payout)}</Text>
                <Text fontSize="$2" color="$textSecondary">Total en Premios</Text>
              </YStack>
              <YStack ai="center" flex={1} minWidth={140}>
                <Text fontSize="$6" fontWeight="bold" color="$blue10">{formatCurrency(totals.commission)}</Text>
                <Text fontSize="$2" color="$textSecondary">Comisiones</Text>
              </YStack>
            </XStack>

            {/* Fila 3: Neto (Ganancia/Pérdida) */}
            <XStack justifyContent="center" flexWrap="wrap" gap="$4">
              <YStack ai="center" flex={1}>
                <Text
                  fontSize="$7"
                  fontWeight="bold"
                  color={totals.neto >= 0 ? '$green10' : '$red10'}
                >
                  {totals.neto >= 0 ? '+' : ''}{formatCurrency(totals.neto)}
                </Text>
                <Text fontSize="$2" color="$textSecondary">Neto (Ganancia/Pérdida)</Text>
              </YStack>
            </XStack>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  )
}

