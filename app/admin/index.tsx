// app/admin/index.tsx
import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import { Card, Button } from '@/components/ui';
import {
  Users,
  Store,
  Trophy,
  Ticket,
  FileText,
  Settings,
  Shield,
  BarChart3,
  X as CloseIcon,
} from '@tamagui/lucide-icons';
import { useAuthStore } from '../../store/auth.store';
import { useVentasSummary, useVentasBreakdown, useVentasTimeseries } from '@/hooks/useVentas'
import { formatCurrency } from '@/utils/formatters'
import { AnimatePresence } from '@tamagui/animate-presence'
import { useUIStore } from '@/store/ui.store'

interface DashboardCard {
  title: string;
  description: string;
  icon: any;
  href: string;
  color: string;
}

const dashboardCards: DashboardCard[] = [
  {
    title: 'Bancas',
    description: 'Gestionar bancas del sistema',
    icon: Store,
    href: '/admin/bancas',
    color: '$cyan10',
  },
  {
    title: 'Ventanas',
    description: 'Administrar puntos de venta',
    icon: Users,
    href: '/admin/ventanas',
    color: '$green10',
  },
  {
    title: 'Usuarios',
    description: 'Gestionar usuarios y vendedores',
    icon: Users,
    href: '/admin/usuarios',
    color: '$purple10',
  },
  {
    title: 'Loterías',
    description: 'Configurar loterías disponibles',
    icon: Trophy,
    href: '/admin/loterias',
    color: '$orange10',
  },
  {
    title: 'Sorteos',
    description: 'Gestionar y evaluar sorteos',
    icon: Trophy,
    href: '/admin/sorteos',
    color: '$red10',
  },
  {
    title: 'Multipliers',
    description: 'Configurar multiplicadores',
    icon: BarChart3,
    href: '/admin/multipliers',
    color: '$yellow10',
  },
  {
    title: 'Restricciones',
    description: 'Reglas y límites del sistema',
    icon: Shield,
    href: '/admin/restrictions',
    color: '$pink10',
  },
  {
    title: 'Tickets',
    description: 'Consultar todos los tickets',
    icon: Ticket,
    href: '/admin/tickets',
    color: '$cyan10',
  },
  {
    title: 'Reportes',
    description: 'Análisis y estadísticas',
    icon: FileText,
    href: '/admin/reportes',
    color: '$indigo10',
  },
  {
    title: 'Configuración',
    description: 'Variables globales del sistema',
    icon: Settings,
    href: '/admin/configuracion',
    color: '$gray10',
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const compareRange = useUIStore((s) => s.compareRange)

  // Periodos comparables: por defecto hoy vs ayer; opcional last7/last30 vs periodo anterior
  const current = React.useMemo(() => ({ date: 'today' as const }), [])
  const previous = React.useMemo(() => {
    if (compareRange === 'yesterday') return { date: 'yesterday' as const }
    const now = new Date()
    const to = new Date(now)
    const from = new Date(now)
    if (compareRange === 'last7') {
      // Actual 7 días: [now-6d, now]; Anterior 7 días: [now-13d, now-7d]
      const prevTo = new Date(now)
      prevTo.setDate(now.getDate() - 7)
      const prevFrom = new Date(now)
      prevFrom.setDate(now.getDate() - 13)
      return { date: 'range' as const, from: prevFrom.toISOString(), to: prevTo.toISOString() }
    }
    if (compareRange === 'last30') {
      const prevTo = new Date(now)
      prevTo.setDate(now.getDate() - 30)
      const prevFrom = new Date(now)
      prevFrom.setDate(now.getDate() - 59)
      return { date: 'range' as const, from: prevFrom.toISOString(), to: prevTo.toISOString() }
    }
    return { date: 'yesterday' as const }
  }, [compareRange])

  const { data: today } = useVentasSummary(current)
  const { data: prev } = useVentasSummary(previous)
  const { data: ventanasToday } = useVentasBreakdown({ date: 'today', dimension: 'ventana', top: 100 })
  const { data: ventanasYesterday } = useVentasBreakdown({ date: 'yesterday', dimension: 'ventana', top: 100 })

  // Serie de últimos 7 días para tarjeta de tendencia
  const sevenDaysAgo = React.useMemo(() => new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), [])
  const now = React.useMemo(() => new Date(), [])
  const { data: series7d } = useVentasTimeseries({
    date: 'range',
    from: sevenDaysAgo.toISOString(),
    to: now.toISOString(),
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
    // Tendencia 7d para mini-gráfico
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

  // Estado local: stats desplegables por card
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
      <XStack ai="flex-end" gap={4} mt="$2" height={28}>
        {vals.map((v, i) => {
          const h = 8 + Math.round(((v - min) / range) * 20)
          return <YStack key={i} width={6} height={h} bg={color} br="$2" />
        })}
      </XStack>
    )
  }

  const handleCardPress = (href: string) => {
    router.push(href as any);
  };

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4">
        {/* Header */}
        <YStack gap="$2">
          <Text fontSize="$8" fontWeight="bold" color="$textPrimary">
            Panel de Administración
          </Text>
          <Text fontSize="$4" color="$textSecondary">
            Bienvenido, {user?.name || 'Administrador'}
          </Text>
        </YStack>

        {/* Quick Stats (arriba) */}
        {/* Quick Stats en misma grilla (4 columnas) que el panel de abajo */}
        <YStack gap="$3" marginTop="$2">
          {[...Array(Math.ceil(stats.length / 4))].map((_, rowIndex) => {
            const row = stats.slice(rowIndex * 4, rowIndex * 4 + 4)
            return (
              <XStack key={rowIndex} gap="$3" flexWrap="wrap">
                {row.map((s) => {
                  const isOpen = openIds.has(s.key)
                  return (
                    <Card
                      key={s.key}
                      // Sizing consistente con cards de panel (4 columnas)
                      minWidth={220}
                      maxWidth="24%"
                      $md={{ maxWidth: '32%' }}
                      $sm={{ maxWidth: '48%' }}
                      $xs={{ maxWidth: '100%' }}
                      padding="$3"
                      backgroundColor="$backgroundStrong"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor="$borderColor"
                      hoverStyle={{ borderColor: '$borderColorHover' }}
                      pressStyle={{ backgroundColor: '$backgroundHover' }}
                      animation="quick"
                      cursor="pointer"
                      position="relative"
                      onPress={() => toggleStat(s.key)}
                    >
                {/* Close (visible cuando está abierto) */}
                {isOpen && (
                  <Button
                    size="$2"
                    circular
                    variant="secondary"
                    icon={CloseIcon}
                    position="absolute"
                    top="$2"
                    right="$2"
                    onPress={(e: any) => { e?.stopPropagation?.(); toggleStat(s.key) }}
                    aria-label={`Cerrar ${s.title}`}
                  />
                )}

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

                <AnimatePresence>
                  {isOpen && (
                    <YStack
                      gap="$1"
                      mt="$3"
                      animation="medium"
                      enterStyle={{ opacity: 0, y: -4 }}
                      exitStyle={{ opacity: 0, y: -4 }}
                    >
                      <Text color="$textSecondary">
                        Hoy: {s.key === 'payout' ? `${(s.detail.hoy as number).toFixed(2)}%` : formatCurrency(s.detail.hoy as number)}
                      </Text>
                      <Text color="$textSecondary">
                        Ayer: {s.key === 'payout' ? `${(s.detail.ayer as number).toFixed(2)}%` : formatCurrency(s.detail.ayer as number)}
                      </Text>
                      <Text color={s.delta >= 0 ? '$green10' : '$red10'} fontWeight="600">
                        Tendencia: {s.delta >= 0 ? '↑' : '↓'} {Math.abs(s.delta).toFixed(1)}%
                      </Text>
                    </YStack>
                  )}
                </AnimatePresence>
              </Card>
                  )
                })}
              </XStack>
            )
          })}
        </YStack>

        {/* 🔥 CARDS EN 4 COLUMNAS - Grid Responsivo */}
        <YStack gap="$3">
          {/* Agrupar cards de 2 en 2 para crear filas */}
          {dashboardCards.reduce((rows: DashboardCard[][], card, index) => {
            if (index % 4 === 0) {
              rows.push([card]);
            } else {
              rows[rows.length - 1].push(card);
            }
            return rows;
          }, []).map((row, rowIndex) => (
            <XStack key={rowIndex} gap="$3" flexWrap="wrap">
              {row.map((card) => (
                <Card
                  key={card.title}
                  flex={1}
                  minWidth={220}
                  maxWidth="24%"
                  $md={{ maxWidth: '32%' }}
                  $sm={{ maxWidth: '48%' }}
                  $xs={{ maxWidth: '100%' }}
                  padding="$4"
                  backgroundColor="$backgroundStrong"
                  borderRadius="$4"
                  borderWidth={1}
                  borderColor="$borderColor"
                  pressStyle={{ scale: 0.98 }}
                  hoverStyle={{
                    borderColor: card.color,
                    elevation: 4,
                    shadowColor: card.color,
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                  }}
                  cursor="pointer"
                  onPress={() => handleCardPress(card.href)}
                  animation="quick"
                >
                  <YStack gap="$3">
                    {/* Icon */}
                    <YStack
                      width={56}
                      height={56}
                      backgroundColor={`${card.color.replace('10', '3')}`}
                      borderRadius="$3"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <card.icon size={28} color={card.color} />
                    </YStack>

                    {/* Content */}
                    <YStack gap="$2">
                      <Text fontSize="$6" fontWeight="600" color="$textPrimary">
                        {card.title}
                      </Text>
                      <Text fontSize="$3" color="$textSecondary" lineHeight="$1">
                        {card.description}
                      </Text>
                    </YStack>

                    {/* Action Hint */}
                    <Text fontSize="$2" color={card.color} fontWeight="500">
                      Ver más →
                    </Text>
                  </YStack>
                </Card>
              ))}
            </XStack>
          ))}
        </YStack>
      </YStack>
    </ScrollView>
  );
}
