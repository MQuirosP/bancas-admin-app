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
    queryFn: async () => {
      const result = await apiClient.get('/ventas/summary', params)
      console.log('📊 RESPUESTA ACTUALIZADA de /ventas/summary:', result)
      return result
    },
    staleTime: 60_000,
    refetchOnMount: 'always',
  })

  const payload = (data as any)?.data ?? data ?? {}
  
  const totals = {
    tickets: payload?.ticketsCount ?? 0,
    amount: payload?.ventasTotal ?? 0,
    payout: payload?.payoutTotal ?? 0,
    neto: payload?.neto ?? 0,
    commission: payload?.commissionTotal ?? 0,
    netoDespuesComision: payload?.netoDespuesComision ?? 0,
    // ✅ Nuevos campos de pagos
    totalPaid: payload?.totalPaid ?? 0,
    remainingAmount: payload?.remainingAmount ?? 0,
    paidTicketsCount: payload?.paidTicketsCount ?? 0,
    unpaidTicketsCount: payload?.unpaidTicketsCount ?? 0,
  }

  console.log('💰 Totales extraídos:', totals)
  console.log('🏆 Premios - Total:', totals.payout, 'Pagado:', totals.totalPaid, 'Pendiente:', totals.remainingAmount)

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
            {/* Fila 1: Ventas y Tickets */}
            <XStack justifyContent="center" flexWrap="wrap" gap="$3">
              <Card 
                padding="$3" 
                flex={1} 
                minWidth={140} 
                maxWidth={200}
                backgroundColor="$background"
                borderColor="$borderColor"
                borderWidth={1}
              >
                <YStack ai="center" gap="$1">
                  <Text fontSize="$7" fontWeight="bold" color="$green10">{formatCurrency(totals.amount)}</Text>
                  <Text fontSize="$2" color="$textSecondary" textAlign="center">Ventas Totales</Text>
                </YStack>
              </Card>
              <Card 
                padding="$3" 
                flex={1} 
                minWidth={140} 
                maxWidth={200}
                backgroundColor="$background"
                borderColor="$borderColor"
                borderWidth={1}
              >
                <YStack ai="center" gap="$1">
                  <Text fontSize="$7" fontWeight="bold" color="$primary">{totals.tickets}</Text>
                  <Text fontSize="$2" color="$textSecondary" textAlign="center">Tickets</Text>
                </YStack>
              </Card>
            </XStack>

            {/* Neto Destacado - Centro */}
            <Card 
              padding="$4" 
              alignSelf="center"
              minWidth={280}
              maxWidth={400}
              width="90%"
              backgroundColor="$background"
              borderColor={totals.neto >= 0 ? '$green10' : '$red10'}
              borderWidth={2}
            >
              <YStack ai="center" gap="$2">
                <Text 
                  fontSize="$10" 
                  fontWeight="bold" 
                  color={totals.neto >= 0 ? '$green10' : '$red10'}
                >
                  {totals.neto >= 0 ? '+' : ''}{formatCurrency(totals.neto)}
                </Text>
                <Text fontSize="$3" color="$textSecondary" textAlign="center">Neto (Ganancia/Pérdida)</Text>
              </YStack>
            </Card>

            {/* Fila 3: Premios Totales y Comisiones */}
            <XStack justifyContent="center" flexWrap="wrap" gap="$3">
              <Card 
                padding="$3" 
                flex={1} 
                minWidth={140} 
                maxWidth={200}
                backgroundColor="$background"
                borderColor="$borderColor"
                borderWidth={1}
              >
                <YStack ai="center" gap="$1">
                  <Text fontSize="$6" fontWeight="bold" color="$orange10">{formatCurrency(totals.payout)}</Text>
                  <Text fontSize="$2" color="$textSecondary" textAlign="center">Premios Totales</Text>
                </YStack>
              </Card>
              <Card 
                padding="$3" 
                flex={1} 
                minWidth={140} 
                maxWidth={200}
                backgroundColor="$background"
                borderColor="$borderColor"
                borderWidth={1}
              >
                <YStack ai="center" gap="$1">
                  <Text fontSize="$6" fontWeight="bold" color="$blue10">{formatCurrency(totals.commission)}</Text>
                  <Text fontSize="$2" color="$textSecondary" textAlign="center">Comisiones</Text>
                </YStack>
              </Card>
            </XStack>

            {/* Fila 4: Información de Pagos - Solo si hay premios */}
            {totals.payout > 0 && (
              <>
                <XStack justifyContent="center" flexWrap="wrap" gap="$3">
                  <Card 
                    padding="$3" 
                    flex={1} 
                    minWidth={140} 
                    maxWidth={200}
                    backgroundColor="$background"
                    borderColor="$green8"
                    borderWidth={1}
                  >
                    <YStack ai="center" gap="$1">
                      <Text fontSize="$6" fontWeight="bold" color="$green10">{formatCurrency(totals.totalPaid)}</Text>
                      <Text fontSize="$2" color="$textSecondary" textAlign="center">Pagado</Text>
                    </YStack>
                  </Card>
                  <Card 
                    padding="$3" 
                    flex={1} 
                    minWidth={140} 
                    maxWidth={200}
                    backgroundColor="$background"
                    borderColor={totals.remainingAmount > 0 ? '$yellow8' : '$borderColor'}
                    borderWidth={1}
                  >
                    <YStack ai="center" gap="$1">
                      <Text fontSize="$6" fontWeight="bold" color={totals.remainingAmount > 0 ? '$yellow10' : '$textSecondary'}>
                        {formatCurrency(totals.remainingAmount)}
                      </Text>
                      <Text fontSize="$2" color="$textSecondary" textAlign="center">Pendiente</Text>
                    </YStack>
                  </Card>
                </XStack>

                <XStack justifyContent="center" flexWrap="wrap" gap="$3">
                  <Card 
                    padding="$3" 
                    flex={1} 
                    minWidth={140} 
                    maxWidth={200}
                    backgroundColor="$background"
                    borderColor="$borderColor"
                    borderWidth={1}
                  >
                    <YStack ai="center" gap="$1">
                      <Text fontSize="$5" fontWeight="bold" color="$green10">{totals.paidTicketsCount}</Text>
                      <Text fontSize="$2" color="$textSecondary" textAlign="center">Tickets Pagados</Text>
                    </YStack>
                  </Card>
                  <Card 
                    padding="$3" 
                    flex={1} 
                    minWidth={140} 
                    maxWidth={200}
                    backgroundColor="$background"
                    borderColor="$borderColor"
                    borderWidth={1}
                  >
                    <YStack ai="center" gap="$1">
                      <Text fontSize="$5" fontWeight="bold" color={totals.unpaidTicketsCount > 0 ? '$yellow10' : '$textSecondary'}>
                        {totals.unpaidTicketsCount}
                      </Text>
                      <Text fontSize="$2" color="$textSecondary" textAlign="center">Tickets Pendientes</Text>
                    </YStack>
                  </Card>
                </XStack>
              </>
            )}
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  )
}

