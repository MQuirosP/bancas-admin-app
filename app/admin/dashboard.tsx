import React, { useMemo, useState } from 'react'
import { ScrollView, YStack, XStack, Text, Card } from 'tamagui'
import { useAuthStore } from '@/store/auth.store'
import { useVentasSummary, useVentasBreakdown, useVentasTimeseries } from '@/hooks/useVentas'
import { formatCurrency } from '@/utils/formatters'
import { useUIStore } from '@/store/ui.store'
import { getDateParam, type DateToken } from '@/lib/dateFormat'

export default function AdminRealDashboard() {
  const { user } = useAuthStore()
  const compareRange = useUIStore((s) => s.compareRange)

  // ✅ Backend authority: Periods use tokens, backend calculates using CR timezone
  const current = React.useMemo(() => getDateParam('today'), [])
  const previous = React.useMemo(() => {
    const token: DateToken =
      compareRange === 'yesterday' ? 'yesterday' :
      compareRange === 'last7' ? 'week' :
      compareRange === 'last30' ? 'month' :
      'yesterday'
    return getDateParam(token)
  }, [compareRange])

  const { data: today } = useVentasSummary(current)
  const { data: prev } = useVentasSummary(previous)
  const { data: ventanasToday } = useVentasBreakdown({ date: 'today', dimension: 'ventana', top: 50 })
  const { data: ventanasYesterday } = useVentasBreakdown({ date: 'yesterday', dimension: 'ventana', top: 50 })

  // ✅ Backend authority: Use 'week' token instead of calculating 7 days
  const { data: series7d } = useVentasTimeseries({
    ...(getDateParam('week') as any),
    granularity: 'day',
  })

  const stats = useMemo(() => {
    const vt = today?.ventasTotal ?? 0
    const vy = prev?.ventasTotal ?? 0
    const nt = today?.neto ?? 0
    const ny = prev?.neto ?? 0
    const prt = vt > 0 ? ((today?.payoutTotal ?? 0) / vt) * 100 : 0
    const pry = vy > 0 ? ((prev?.payoutTotal ?? 0) / vy) * 100 : 0
    const wt = (ventanasToday ?? []).length
    const wy = (ventanasYesterday ?? []).length
    const delta = (a: number, b: number) => (b === 0 ? (a > 0 ? 100 : 0) : ((a - b) / b) * 100)
    const serieVals = (series7d ?? []).map((p) => p.ventasTotal)
    const first = serieVals[0] ?? 0
    const last = serieVals[serieVals.length - 1] ?? 0
    const trendDelta = delta(last, first)
    return [
      { key: 'ventas', title: 'Ventas (hoy)', value: formatCurrency(vt), delta: delta(vt, vy), detail: { hoy: vt, ayer: vy } },
      { key: 'neto', title: 'Neto (hoy)', value: formatCurrency(nt), delta: delta(nt, ny), detail: { hoy: nt, ayer: ny } },
      { key: 'payout', title: 'Payout Ratio (hoy)', value: `${prt.toFixed(1)}%`, delta: prt - pry, detail: { hoy: prt, ayer: pry } },
      { key: 'ventanas', title: 'Ventanas Activas', value: String(wt), delta: delta(wt, wy), detail: { hoy: wt, ayer: wy } },
      { key: 'trend', title: 'Tendencia (7d)', value: `${trendDelta >= 0 ? '↑' : '↓'} ${Math.abs(trendDelta).toFixed(1)}%`, delta: trendDelta, detail: { hoy: last, ayer: first }, serie: serieVals },
    ]
  }, [today, prev, ventanasToday, ventanasYesterday, series7d])

  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const toggleStat = (key: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  // Mini gráfico de barras (sparkline sin librerías)
  function MiniBars({ values }: { values: number[] }) {
    const vals = values && values.length ? values : [0]
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const range = max - min || 1
    const color = (vals[vals.length - 1] - vals[0] >= 0) ? '$green10' : '$red10'
    return (
      <XStack ai="flex-end" gap={4} mt="$1" height={20}>
        {vals.map((v, i) => {
          const h = 6 + Math.round(((v - min) / range) * 14)
          return <YStack key={i} width={5} height={h} bg={color} br="$2" />
        })}
      </XStack>
    )
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        {/* Header */}
        <YStack gap="$2">
          <Text fontSize="$8" fontWeight="bold" color="$textPrimary">Dashboard</Text>
          <Text fontSize="$4" color="$textSecondary">
            Bienvenido, {user?.name || 'Administrador'}
          </Text>
        </YStack>

        {/* Quick Stats */}
        <XStack gap="$3" marginTop="$2" jc="center" flexWrap="wrap">
          {stats.map((s) => {
            const isOpen = openIds.has(s.key)
            return (
              <Card
                key={s.key}
                minWidth={160}
                flexBasis="16.3%"
                maxWidth="16.3%"
                $lg={{ flexBasis: '16.3%', maxWidth: '16.3%' }}
                $md={{ flexBasis: '20%', maxWidth: '20%' }}
                $sm={{ flexBasis: '48%', maxWidth: '48%' }}
                $xs={{ flexBasis: '48%', maxWidth: '48%' }}
                minHeight={isOpen ? 95 : 90}
                padding="$2"
                backgroundColor="$backgroundStrong"
                borderRadius="$3"
                borderWidth={1}
                borderColor="$borderColor"
                hoverStyle={{ borderColor: '#39FF14', shadowColor: '#39FF14', shadowOpacity: 0.25, shadowRadius: 10 }}
                pressStyle={{ backgroundColor: '$backgroundHover' }}
                animation="medium"
                cursor="pointer"
                position="relative"
                style={{ transition: 'all 220ms ease' }}
                onPress={() => toggleStat(s.key)}
              >
                <YStack gap="$1">
                  <Text fontSize="$2" color="$textSecondary" fontWeight="500">{s.title}</Text>
                  <XStack ai="baseline" jc="space-between">
                    <Text fontSize="$7" fontWeight="bold" color="$textPrimary">{s.value}</Text>
                    <Text fontSize="$2" color={s.delta >= 0 ? '$green10' : '$red10'} fontWeight="700">
                      {s.delta >= 0 ? '↑' : '↓'} {Math.abs(s.delta).toFixed(1)}%
                    </Text>
                  </XStack>
                  {s.key === 'trend' && Array.isArray((s as any).serie) && (
                    <MiniBars values={(s as any).serie as number[]} />
                  )}
                </YStack>

                {/* Collapsible content */}
                <YStack
                  gap="$1"
                  mt="$2"
                  overflow="hidden"
                  style={{
                    maxHeight: isOpen ? 110 : 0,
                    opacity: isOpen ? 1 : 0,
                    transition: 'max-height 260ms ease, opacity 260ms ease',
                    willChange: 'max-height, opacity',
                  }}
                >
                  <Text color="$textSecondary" fontSize="$2">
                    Hoy: {s.key === 'payout' ? `${(s.detail.hoy as number).toFixed(2)}%` : formatCurrency(s.detail.hoy as number)}
                  </Text>
                  <Text color="$textSecondary" fontSize="$2">
                    Ayer: {s.key === 'payout' ? `${(s.detail.ayer as number).toFixed(2)}%` : formatCurrency(s.detail.ayer as number)}
                  </Text>
                  <Text color={s.delta >= 0 ? '$green10' : '$red10'} fontWeight="600" fontSize="$2">
                    Tendencia: {s.delta >= 0 ? '↑' : '↓'} {Math.abs(s.delta).toFixed(1)}%
                  </Text>
                </YStack>
              </Card>
            )
          })}
        </XStack>

        {/* Placeholder para contenido adicional */}
        <YStack gap="$2" mt="$4">
          <Text fontSize="$5" fontWeight="700" color="$textPrimary">Análisis Detallado</Text>
          <Card padding="$4" borderColor="$borderColor" borderWidth={1} bg="$backgroundHover">
            <Text color="$textSecondary">Gráficos y análisis detallados próximamente...</Text>
          </Card>
        </YStack>
      </YStack>
    </ScrollView>
  )
}
