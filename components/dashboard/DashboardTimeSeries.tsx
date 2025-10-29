/**
 * Time Series Chart para Dashboard
 * Nota: Implementación placeholder - requiere librería de charts (recharts/victory-native)
 */

import React, { useState } from 'react'
import { YStack, XStack, Text, Switch } from 'tamagui'
import { Card } from '@/components/ui'
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

  if (isLoading || !data || data.length === 0) {
    return (
      <Card padding="$4" gap="$3">
        <YStack height={300} br="$3" backgroundColor="$backgroundHover" animation="quick" opacity={0.5} ai="center" jc="center">
          {isLoading ? (
            <Text color="$textSecondary">Cargando series temporales...</Text>
          ) : (
            <Text color="$textSecondary">Sin datos disponibles</Text>
          )}
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

      {/* Chart Placeholder */}
      <YStack
        height={300}
        br="$3"
        backgroundColor="$backgroundHover"
        ai="center"
        jc="center"
        padding="$4"
      >
        <Text color="$textSecondary" ta="center">
          📊 Gráfico de Series Temporales
        </Text>
        <Text color="$textSecondary" ta="center" fontSize="$2" mt="$2">
          {data.length} puntos de datos ({granularity})
        </Text>
        {showComparison && comparison && (
          <Text color="$blue10" ta="center" fontSize="$2" mt="$1">
            + {comparison.length} puntos de comparación
          </Text>
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

