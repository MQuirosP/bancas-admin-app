/**
 * Time Series Chart para Dashboard
 * Nota: Implementación placeholder - requiere librería de charts (recharts/victory-native)
 */

import React, { useState } from 'react'
import { YStack, XStack, Text, Switch } from 'tamagui'
import { Card, SkeletonChart } from '@/components/ui'
import { formatCurrency } from '@/utils/formatters'
import type { TimeSeriesDataPoint } from '@/types/dashboard.types'

interface DashboardTimeSeriesProps {
  data: TimeSeriesDataPoint[]
  comparison?: TimeSeriesDataPoint[]
  granularity: 'hour' | 'day' | 'week' | 'month'
  isLoading?: boolean
}

export function DashboardTimeSeries({ 
  data, 
  comparison, 
  granularity,
  isLoading 
}: DashboardTimeSeriesProps) {
  const [showComparison, setShowComparison] = useState(false)

  if (isLoading) {
    return <SkeletonChart height={300} />
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card padding="$4" gap="$3">
        <YStack height={300} br="$3" backgroundColor="$backgroundHover" ai="center" jc="center">
          <Text color="$textSecondary">Sin datos disponibles</Text>
        </YStack>
      </Card>
    )
  }

  return (
    <Card padding="$4" gap="$3">
      {/* Header */}
      <XStack jc="space-between" ai="center">
        <Text fontSize="$6" fontWeight="600">
          Tendencia Temporal
        </Text>
        
        {comparison && (
          <XStack ai="center" gap="$2">
            <Text fontSize="$3" color="$textSecondary">
              Comparar período anterior
            </Text>
            <Switch
              size="$2"
              checked={showComparison}
              onCheckedChange={setShowComparison}
            >
              <Switch.Thumb animation="quick" />
            </Switch>
          </XStack>
        )}
      </XStack>

      {/* Chart con barras */}
      <YStack
        height={300}
        br="$3"
        backgroundColor="$backgroundHover"
        padding="$4"
        gap="$2"
      >
        <XStack
          height="100%"
          ai="flex-end"
          jc="space-around"
          gap="$1"
          flexWrap="wrap"
        >
          {data.map((point, idx) => {
            const maxSales = Math.max(...data.map(d => d.sales), 1)
            const chartHeight = 220 // Altura fija del área del gráfico
            const barHeight = Math.max((point.sales / maxSales) * chartHeight, 10)
            const date = new Date(point.timestamp)
            const label = granularity === 'hour' 
              ? date.getHours().toString().padStart(2, '0')
              : granularity === 'day'
              ? date.getDate().toString()
              : granularity === 'week'
              ? `S${Math.ceil(date.getDate() / 7)}`
              : date.getMonth() + 1
            
            return (
              <YStack key={idx} flex={1} ai="center" gap="$1" minWidth={30} height={chartHeight + 30}>
                <YStack
                  width="100%"
                  height={barHeight}
                  backgroundColor="$blue10"
                  br="$2"
                  ai="center"
                  jc="flex-end"
                  paddingBottom="$1"
                  minHeight={10}
                >
                  {barHeight > 40 && (
                    <Text fontSize="$1" color="white" fontWeight="600">
                      {formatCurrency(point.sales).replace(/\s/g, '')}
                    </Text>
                  )}
                </YStack>
                <Text fontSize="$1" color="$textSecondary">
                  {label}
                </Text>
              </YStack>
            )
          })}
        </XStack>
        {showComparison && comparison && (
          <XStack gap="$2" ai="center" mt="$2">
            <YStack width={12} height={12} backgroundColor="$blue10" br="$1" />
            <Text fontSize="$2" color="$textSecondary">Período actual</Text>
            <YStack width={12} height={12} backgroundColor="$orange10" br="$1" ml="$3" />
            <Text fontSize="$2" color="$textSecondary">Período anterior</Text>
          </XStack>
        )}
      </YStack>

      {/* Stats Summary */}
      <XStack gap="$3" flexWrap="wrap" jc="space-around">
        <YStack ai="center">
          <Text fontSize="$2" color="$textSecondary">Ventas</Text>
          <Text fontSize="$5" fontWeight="600" color="$blue10">
            {formatCurrency(data.reduce((sum, d) => sum + d.sales, 0))}
          </Text>
        </YStack>
        <YStack ai="center">
          <Text fontSize="$2" color="$textSecondary">Tickets</Text>
          <Text fontSize="$5" fontWeight="600" color="$green10">
            {data.reduce((sum, d) => sum + d.tickets, 0).toLocaleString()}
          </Text>
        </YStack>
        <YStack ai="center">
          <Text fontSize="$2" color="$textSecondary">Comisiones</Text>
          <Text fontSize="$5" fontWeight="600" color="$purple10">
            {formatCurrency(data.reduce((sum, d) => sum + d.commissions, 0))}
          </Text>
        </YStack>
      </XStack>
    </Card>
  )
}

