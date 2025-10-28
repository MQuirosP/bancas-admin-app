import React, { useMemo, useState } from 'react';
import { YStack, XStack, Text, ScrollView, Card, Spinner } from 'tamagui';
import { Button, Input, Select, DatePicker } from '@/components/ui'
import { Check, ChevronDown, RefreshCw } from '@tamagui/lucide-icons'
import { useVentasSummary, useVentasBreakdown, useVentasTimeseries } from '@/hooks/useVentas'
import { formatCurrency } from '@/utils/formatters'
import { getDateParam, type DateToken, formatDateYYYYMMDD } from '@/lib/dateFormat'
import type { VentasListQuery } from '@/lib/api.ventas'

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'range'

interface BreakdownItem {
  key: string
  name?: string | null
  ventasTotal: number
}

interface TimeseriesPoint {
  ts: string
  ventasTotal: number
}

type SelectOption = { value: string; label: string }
type DimensionOption = 'vendedor' | 'ventana' | 'loteria' | 'sorteo'

export default function VentasReportScreen() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [dimension, setDimension] = useState<'ventana'|'vendedor'|'loteria'|'sorteo'>('vendedor')
  const [from, setFrom] = useState<Date | null>(null)
  const [to, setTo] = useState<Date | null>(null)

  const base = useMemo((): Omit<VentasListQuery, 'page' | 'pageSize'> => {
    // ✅ Backend authority: Only send tokens, backend handles date calculations
    if (dateFilter === 'range' && from && to) {
      return getDateParam('range', formatDateYYYYMMDD(from), formatDateYYYYMMDD(to)) as any
    }
    // All other filters use single token
    const token: DateToken = (dateFilter === 'today' || dateFilter === 'yesterday' || dateFilter === 'week' || dateFilter === 'month')
      ? dateFilter
      : 'today'
    return getDateParam(token) as any
  }, [dateFilter, from, to])

  const { data: summary, isFetching: fetchingSummary } = useVentasSummary(base)
  const { data: breakdown, isFetching: fetchingBreak } = useVentasBreakdown({ ...base, dimension, top: 10 })
  const { data: series, isFetching: fetchingSeries } = useVentasTimeseries({ ...base, granularity: 'day' })

  const loading = fetchingSummary || fetchingBreak || fetchingSeries

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold" color="$color">Reporte de Ventas</Text>

        {/* Filtros */}
        <Card padding="$3" borderColor="$borderColor" borderWidth={1}>
          <XStack gap="$3" ai="flex-end" flexWrap="wrap">
            <YStack gap="$1">
              <Text fontSize="$3">Fecha</Text>
              <Select value={dateFilter} onValueChange={(v:any)=>setDateFilter(v)}>
                <Select.Trigger iconAfter={ChevronDown} width={200} br="$3" bw={1} bc="$borderColor" backgroundColor="$background">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Viewport>
                    {([
                      {value:'today',label:'Hoy'},
                      {value:'yesterday',label:'Ayer'},
                      {value:'week',label:'Esta Semana'},
                      {value:'month',label:'Este Mes'},
                      {value:'range',label:'Rango personalizado'},
                    ] as const).map((it: SelectOption, idx: number) => (
                      <Select.Item key={it.value} value={it.value} index={idx}><Select.ItemText>{it.label}</Select.ItemText><Select.ItemIndicator ml="auto"><Check size={16}/></Select.ItemIndicator></Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select>
            </YStack>

            {dateFilter==='range' && (
              <>
                <YStack gap="$1">
                  <Text fontSize="$3">Desde</Text>
                  <DatePicker
                    value={from}
                    onChange={(d)=>{
                      const today = new Date()
                      today.setHours(23, 59, 59, 999)
                      if (d <= today) setFrom(d)
                    }}
                    placeholder="dd/mm/aaaa"
                  />
                </YStack>
                <YStack gap="$1">
                  <Text fontSize="$3">Hasta</Text>
                  <DatePicker
                    value={to}
                    onChange={(d)=>{
                      const today = new Date()
                      today.setHours(23, 59, 59, 999)
                      if (d <= today) setTo(d)
                    }}
                    placeholder="dd/mm/aaaa"
                  />
                </YStack>
              </>
            )}

            <YStack gap="$1">
              <Text fontSize="$3">Dimensión</Text>
              <Select value={dimension} onValueChange={(v:any)=>setDimension(v)}>
                <Select.Trigger iconAfter={ChevronDown} width={220} br="$3" bw={1} bc="$borderColor" backgroundColor="$background">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Viewport>
                    {(['vendedor','ventana','loteria','sorteo'] as const).map((d: DimensionOption, idx: number) => (
                      <Select.Item key={d} value={d} index={idx}><Select.ItemText>{d}</Select.ItemText><Select.ItemIndicator ml="auto"><Check size={16}/></Select.ItemIndicator></Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select>
            </YStack>

            <YStack gap="$1">
              <Text fontSize="$3" opacity={0}>Acción</Text>
              <Button icon={RefreshCw} onPress={()=>{ /* queries usan base en deps */ }} loading={loading}>
                Actualizar
              </Button>
            </YStack>
          </XStack>
        </Card>

        {/* KPIs */}
        <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
          <Text fontSize="$5" fontWeight="600" marginBottom="$3">Resumen de Ventas</Text>
          <YStack gap="$3">
            {/* Fila 1: Ventas y Tickets */}
            <XStack justifyContent="space-around" flexWrap="wrap" gap="$4">
              <YStack ai="center" flex={1} minWidth={140}>
                <Text fontSize="$7" fontWeight="bold" color="$green10">{formatCurrency(summary?.ventasTotal??0)}</Text>
                <Text fontSize="$2" color="$textSecondary">Ventas Totales</Text>
              </YStack>
              <YStack ai="center" flex={1} minWidth={140}>
                <Text fontSize="$7" fontWeight="bold" color="$primary">{summary?.ticketsCount ?? 0}</Text>
                <Text fontSize="$2" color="$textSecondary">Tickets</Text>
              </YStack>
            </XStack>

            {/* Fila 2: Jugadas y Payout */}
            <XStack justifyContent="space-around" flexWrap="wrap" gap="$4">
              <YStack ai="center" flex={1} minWidth={140}>
                <Text fontSize="$6" fontWeight="bold" color="$blue10">{summary?.jugadasCount ?? 0}</Text>
                <Text fontSize="$2" color="$textSecondary">Jugadas</Text>
              </YStack>
              <YStack ai="center" flex={1} minWidth={140}>
                <Text fontSize="$6" fontWeight="bold" color="$orange10">{formatCurrency(summary?.payoutTotal??0)}</Text>
                <Text fontSize="$2" color="$textSecondary">Payout</Text>
              </YStack>
            </XStack>

            {/* Neto Destacado */}
            <YStack 
              ai="center" 
              marginTop="$4" 
              paddingTop="$4" 
              borderTopWidth={1} 
              borderTopColor="$borderColor"
            >
              <Text 
                fontSize="$10" 
                fontWeight="bold" 
                color={(summary?.neto ?? 0) >= 0 ? '$green10' : '$red10'}
              >
                {(summary?.neto ?? 0) >= 0 ? '+' : ''}{formatCurrency(summary?.neto??0)}
              </Text>
              <Text fontSize="$3" color="$textSecondary" marginTop="$1">Neto (Ganancia/Pérdida)</Text>
            </YStack>
          </YStack>
        </Card>

        {/* Breakdown */}
        <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
          <Text fontSize="$5" fontWeight="600" mb="$3" color="$textPrimary">
            Top {dimension.charAt(0).toUpperCase() + dimension.slice(1)}es
          </Text>
          {fetchingBreak ? (
            <XStack jc="center" py="$4">
              <Spinner />
            </XStack>
          ) : (
            <YStack gap="$2">
              {(breakdown ?? []).map((it: BreakdownItem, i: number) => (
                <XStack 
                  key={it.key} 
                  jc="space-between" 
                  ai="center" 
                  borderBottomWidth={i < (breakdown?.length ?? 0) - 1 ? 1 : 0} 
                  borderBottomColor="$borderColor" 
                  py="$2"
                  px="$2"
                  br="$2"
                  hoverStyle={{ backgroundColor: '$backgroundPress' }}
                >
                  <XStack ai="center" gap="$2" flex={1}>
                    <Text fontSize="$3" fontWeight="700" color="$primary" minWidth={24}>#{i+1}</Text>
                    <Text fontSize="$4" fontWeight="600" color="$textPrimary">{it.name ?? it.key}</Text>
                  </XStack>
                  <Text fontSize="$5" fontWeight="bold" color="$green10">{formatCurrency(it.ventasTotal)}</Text>
                </XStack>
              ))}
              {(breakdown ?? []).length===0 && (
                <YStack ai="center" py="$4">
                  <Text color="$textSecondary">Sin datos disponibles</Text>
                </YStack>
              )}
            </YStack>
          )}
        </Card>

        {/* Series (simple list) */}
        <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
          <Text fontSize="$5" fontWeight="600" mb="$3" color="$textPrimary">Serie Temporal (por día)</Text>
          {fetchingSeries ? (
            <XStack jc="center" py="$4">
              <Spinner />
            </XStack>
          ) : (
            <YStack gap="$2">
              {(series ?? []).map((p: TimeseriesPoint, idx: number) => (
                <XStack 
                  key={p.ts} 
                  jc="space-between" 
                  ai="center"
                  borderBottomWidth={idx < (series?.length ?? 0) - 1 ? 1 : 0}
                  borderBottomColor="$borderColor"
                  py="$2"
                  px="$2"
                  br="$2"
                  hoverStyle={{ backgroundColor: '$backgroundPress' }}
                >
                  <Text fontSize="$4" fontWeight="500" color="$textPrimary">
                    {new Date(p.ts).toLocaleDateString('es-CR', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                  <Text fontSize="$5" fontWeight="bold" color="$blue10">{formatCurrency(p.ventasTotal)}</Text>
                </XStack>
              ))}
              {(series ?? []).length===0 && (
                <YStack ai="center" py="$4">
                  <Text color="$textSecondary">Sin datos disponibles</Text>
                </YStack>
              )}
            </YStack>
          )}
        </Card>
      </YStack>
    </ScrollView>
  );
}

