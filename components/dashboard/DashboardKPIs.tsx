/**
 * KPI Cards para Dashboard Admin
 * Con comparación de período anterior
 */

import React from 'react'
import { YStack, XStack, Text } from 'tamagui'
import { Card, SkeletonKPI } from '@/components/ui'
import { TrendingUp, TrendingDown, DollarSign, Package, Trophy, Percent } from '@tamagui/lucide-icons'
import { formatCurrency } from '@/utils/formatters'
import type { DashboardKPIs } from '@/types/dashboard.types'

interface DashboardKPIsGridProps {
  data: DashboardKPIs
  isLoading?: boolean
  meta?: {
    range?: { from: string; to: string }
    queryExecutionTime?: number
    totalQueries?: number
  }
}

export function DashboardKPIsGrid({ data, isLoading, meta }: DashboardKPIsGridProps) {
  // Si no hay datos, mostrar loading con skeletons
  if (!data || isLoading) {
    return (
      <XStack gap="$3" flexWrap="wrap">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <YStack key={i} flex={1} minWidth={280} maxWidth="32%" $sm={{ maxWidth: '100%' }}>
            <SkeletonKPI />
          </YStack>
        ))}
      </XStack>
    )
  }

  const kpis = [
    {
      icon: DollarSign,
      label: 'Ventas Totales',
      value: formatCurrency(data.totalSales),
      previous: data.previousPeriod?.totalSales,
      color: '$blue10',
      bgColor: '$blue4',
    },
    {
      icon: Package,
      label: 'Total Tickets',
      value: data.totalTickets.toLocaleString(),
      previous: data.previousPeriod?.totalTickets,
      color: '$green10',
      bgColor: '$green4',
    },
    {
      icon: Trophy,
      label: 'Tickets Ganadores',
      value: data.totalWinners.toLocaleString(),
      previous: data.previousPeriod?.totalWinners,
      color: '$orange10',
      bgColor: '$orange4',
    },
    {
      icon: DollarSign,
      label: 'Comisiones',
      value: formatCurrency(data.totalCommissions),
      previous: data.previousPeriod?.totalCommissions,
      color: '$purple10',
      bgColor: '$purple4',
    },
    {
      icon: Percent,
      label: 'Tasa de Acierto',
      value: `${data.winRate.toFixed(2)}%`,
      previous: data.previousPeriod?.winRate,
      color: '$cyan10',
      bgColor: '$cyan4',
      suffix: '%',
    },
    {
      icon: Percent,
      label: 'Margen',
      value: `${data.margin.toFixed(2)}%`,
      previous: data.previousPeriod?.margin,
      color: data.margin >= 0 ? '$green10' : '$red10',
      bgColor: data.margin >= 0 ? '$green4' : '$red4',
      suffix: '%',
    },
  ]

  return (
    <YStack gap="$3">
      {/* KPI Cards Grid */}
      <XStack gap="$3" flexWrap="wrap">
        {kpis.map((kpi, idx) => (
          <KPICard key={idx} {...kpi} />
        ))}
      </XStack>

      {/* Metadata Footer */}
      {meta && (
        <XStack
          gap="$3"
          padding="$2"
          flexWrap="wrap"
          ai="center"
          jc="space-between"
          opacity={0.6}
        >
          {meta.range && (
            <Text fontSize="$1" color="$textSecondary">
              Período: {new Date(meta.range.from).toLocaleDateString()} - {new Date(meta.range.to).toLocaleDateString()}
            </Text>
          )}
          {meta.queryExecutionTime !== undefined && (
            <Text fontSize="$1" color="$textSecondary">
              Tiempo: {meta.queryExecutionTime}ms
            </Text>
          )}
          {meta.totalQueries !== undefined && (
            <Text fontSize="$1" color="$textSecondary">
              Queries: {meta.totalQueries}
            </Text>
          )}
        </XStack>
      )}
    </YStack>
  )
}

interface KPICardProps {
  icon: any
  label: string
  value: string | number
  previous?: number
  color: string
  bgColor: string
  suffix?: string
}

function KPICard({ icon: Icon, label, value, previous, color, bgColor, suffix }: KPICardProps) {
  // Calcular cambio vs período anterior
  let changePercent: number | null = null
  let isPositive: boolean | null = null

  if (previous !== undefined && previous !== null && previous !== 0) {
    const current = typeof value === 'string' 
      ? parseFloat(value.replace(/[^0-9.-]/g, '')) 
      : value
    changePercent = ((current - previous) / previous) * 100
    isPositive = changePercent >= 0
  }

  return (
    <Card
      flex={1}
      minWidth={280}
      maxWidth="32%"
      padding="$4"
      backgroundColor="$backgroundStrong"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
      hoverStyle={{
        borderColor: color,
        elevation: 4,
        shadowColor: color,
        shadowOpacity: 0.2,
        shadowRadius: 8,
      }}
      cursor="default"
      animation="quick"
    >
      <XStack jc="space-between" ai="flex-start" gap="$3">
        <YStack flex={1} gap="$2">
          {/* Label */}
          <Text fontSize="$3" color="$textSecondary" fontWeight="500">
            {label}
          </Text>

          {/* Valor principal */}
          <Text fontSize="$8" fontWeight="700" color="$textPrimary">
            {value}
          </Text>

          {/* Comparación con período anterior */}
          {changePercent !== null && isPositive !== null && (
            <XStack ai="center" gap="$1">
              {isPositive ? (
                <TrendingUp size={16} color="$green10" />
              ) : (
                <TrendingDown size={16} color="$red10" />
              )}
              <Text
                fontSize="$2"
                fontWeight="600"
                color={isPositive ? '$green10' : '$red10'}
              >
                {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
              </Text>
              <Text fontSize="$2" color="$textSecondary">
                vs anterior
              </Text>
            </XStack>
          )}
        </YStack>

        {/* Icono */}
        <YStack
          width={56}
          height={56}
          backgroundColor={bgColor}
          borderRadius="$3"
          ai="center"
          jc="center"
        >
          <Icon size={28} color={color} />
        </YStack>
      </XStack>
    </Card>
  )
}

