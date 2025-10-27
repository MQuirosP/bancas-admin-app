import React, { useMemo, useState } from 'react';
import { YStack, XStack, Text, ScrollView, Card, Spinner } from 'tamagui';
import { Button, Input, Select, DatePicker } from '@/components/ui'
import { Check, ChevronDown, RefreshCw } from '@tamagui/lucide-icons'
import { useVentasSummary, useVentasBreakdown, useVentasTimeseries } from '@/hooks/useVentas'
import { formatCurrency } from '@/utils/formatters'
import { getDateParam, type DateToken, formatDateYYYYMMDD } from '@/lib/dateFormat'

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

  const base = useMemo(() => {
    // ✅ Backend authority: Only send tokens, backend handles date calculations
    if (dateFilter === 'today' || dateFilter === 'yesterday') {
      return getDateParam(dateFilter as DateToken)
    }
    if (dateFilter === 'week' || dateFilter === 'month') {
      return getDateParam(dateFilter as DateToken)
    }
    // ✅ For custom date range, convert Date to YYYY-MM-DD format
    if (dateFilter === 'range' && from && to) {
      return getDateParam('range', formatDateYYYYMMDD(from), formatDateYYYYMMDD(to))
    }
    return getDateParam('today')
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
        <XStack gap="$3" flexWrap="wrap">
          <Card padding="$4" flex={1} minWidth={220}><Text fontSize="$2" color="$textSecondary">Ventas Totales</Text><Text fontSize="$7" fontWeight="700">{formatCurrency(summary?.ventasTotal??0)}</Text></Card>
          <Card padding="$4" flex={1} minWidth={220}><Text fontSize="$2" color="$textSecondary">Tickets</Text><Text fontSize="$7" fontWeight="700">{summary?.ticketsCount ?? 0}</Text></Card>
          <Card padding="$4" flex={1} minWidth={220}><Text fontSize="$2" color="$textSecondary">Jugadas</Text><Text fontSize="$7" fontWeight="700">{summary?.jugadasCount ?? 0}</Text></Card>
          <Card padding="$4" flex={1} minWidth={220}><Text fontSize="$2" color="$textSecondary">Payout</Text><Text fontSize="$7" fontWeight="700">{formatCurrency(summary?.payoutTotal??0)}</Text></Card>
          <Card padding="$4" flex={1} minWidth={220}><Text fontSize="$2" color="$textSecondary">Neto</Text><Text fontSize="$7" fontWeight="700">{formatCurrency(summary?.neto??0)}</Text></Card>
        </XStack>

        {/* Breakdown */}
        <Card padding="$4" borderColor="$borderColor" borderWidth={1}>
          <Text fontSize="$5" fontWeight="600" mb="$2">Top {dimension}</Text>
          {fetchingBreak ? (
            <Spinner />
          ) : (
            <YStack gap="$2">
              {(breakdown ?? []).map((it: BreakdownItem, i: number) => (
                <XStack key={it.key} jc="space-between" ai="center" borderBottomWidth={1} borderBottomColor="$borderColor" py="$2">
                  <Text fontWeight="600">{i+1}. {it.name ?? it.key}</Text>
                  <Text>{formatCurrency(it.ventasTotal)}</Text>
                </XStack>
              ))}
              {(breakdown ?? []).length===0 && <Text color="$textSecondary">Sin datos</Text>}
            </YStack>
          )}
        </Card>

        {/* Series (simple list) */}
        <Card padding="$4" borderColor="$borderColor" borderWidth={1}>
          <Text fontSize="$5" fontWeight="600" mb="$2">Serie (día)</Text>
          {fetchingSeries ? (
            <Spinner />
          ) : (
            <YStack gap="$1">
              {(series ?? []).map((p: TimeseriesPoint) => (
                <XStack key={p.ts} jc="space-between">
                  <Text>{new Date(p.ts).toLocaleDateString()}</Text>
                  <Text>{formatCurrency(p.ventasTotal)}</Text>
                </XStack>
              ))}
              {(series ?? []).length===0 && <Text color="$textSecondary">Sin datos</Text>}
            </YStack>
          )}
        </Card>
      </YStack>
    </ScrollView>
  );
}

