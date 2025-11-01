/**
 * Time Series Chart para Dashboard
 * Nota: Implementación placeholder - requiere librería de charts (recharts/victory-native)
 */

import React, { useState, useEffect, useMemo } from 'react'
import { YStack, XStack, Text, Switch } from 'tamagui'
import { Card, SkeletonChart } from '@/components/ui'
import { formatCurrency } from '@/utils/formatters'
import type { TimeSeriesDataPoint } from '@/types/dashboard.types'
import { useDashboardFiltersStore } from '@/store/dashboardFilters.store'

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
  const [animatedComparison, setAnimatedComparison] = useState(false)
  const [barsAnimated, setBarsAnimated] = useState(false) // Para barras actuales
  const [comparisonBarsAnimated, setComparisonBarsAnimated] = useState(false) // Para barras de comparación
  
  // Animar la aparición de comparación con delay
  useEffect(() => {
    if (showComparison) {
      setAnimatedComparison(true)
      // Delay para animar las barras de comparación después de que aparezcan
      const timer = setTimeout(() => setComparisonBarsAnimated(true), 50)
      return () => clearTimeout(timer)
    } else {
      // Primero animar hacia altura 0, luego eliminar del DOM
      setComparisonBarsAnimated(false)
      // Delay para animación de salida (tiempo suficiente para la animación spring)
      const timer = setTimeout(() => {
        setAnimatedComparison(false)
      }, 500) // Aumentado para dar tiempo a la animación spring
      return () => clearTimeout(timer)
    }
  }, [showComparison])
  
  // Animar barras iniciales al montar (solo las actuales)
  useEffect(() => {
    const timer = setTimeout(() => setBarsAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Obtener filtro de fecha para mostrar un texto más descriptivo
  const dateFilter = useDashboardFiltersStore((state) => state.date)
  
  // Texto descriptivo del período de comparación según el filtro seleccionado
  const comparisonLabel = useMemo(() => {
    if (!dateFilter || dateFilter === 'today') {
      return 'Comparar con ayer'
    }
    if (dateFilter === 'yesterday') {
      return 'Comparar con anteayer'
    }
    if (dateFilter === 'week') {
      return 'Comparar con semana anterior'
    }
    if (dateFilter === 'month') {
      return 'Comparar con mes anterior'
    }
    if (dateFilter === 'year') {
      return 'Comparar con año anterior'
    }
    // Para rango personalizado, mostrar texto genérico
    return 'Comparar período anterior'
  }, [dateFilter])

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
              {comparisonLabel}
            </Text>
            <Switch
              size="$2"
              checked={showComparison}
              onCheckedChange={setShowComparison}
              bw={1}
              bc="$borderColor"
              bg={showComparison ? '$color10' : '$background'}
              hoverStyle={{ bg: showComparison ? '$color10' : '$backgroundHover' }}
              focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: 'var(--color10)' }}
            >
              <Switch.Thumb animation="quick" bg="$color12" />
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
        animation="quick"
      >
        <XStack
          height="100%"
          ai="flex-end"
          jc="space-around"
          gap="$1"
          flexWrap="wrap"
        >
          {data.map((point, idx) => {
            // Calcular máximo considerando ambos períodos si están disponibles
            const allSales = [...data.map(d => d.sales)]
            if (showComparison && comparison) {
              allSales.push(...comparison.map(d => d.sales))
            }
            const maxSales = Math.max(...allSales, 1)
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
            
            // Obtener punto de comparación si está disponible
            // Los datos de comparación están alineados por índice (mismo orden)
            const comparisonPoint = showComparison && comparison && comparison[idx]
              ? comparison[idx]
              : null
            
            const comparisonBarHeight = comparisonPoint 
              ? Math.max((comparisonPoint.sales / maxSales) * chartHeight, 10)
              : 0
            
            return (
              <YStack 
                key={idx} 
                flex={1} 
                ai="center" 
                jc="space-between"
                gap="$1" 
                minWidth={showComparison ? 40 : 30} 
                height={chartHeight + 30}
                animation="quick"
              >
                <XStack width="100%" ai="flex-end" jc="center" gap="$1" flex={1}>
                  {/* Barra período actual - siempre visible */}
                  <YStack
                    flex={1}
                    height={barsAnimated ? barHeight : 0}
                    backgroundColor="$blue10"
                    br="$2"
                    ai="center"
                    jc="flex-end"
                    paddingBottom="$1"
                    minHeight={barsAnimated ? 10 : 0}
                    overflow="hidden"
                    animation="bouncy"
                    transition={{
                      type: 'spring',
                      damping: 20,
                      stiffness: 400,
                      mass: 0.5,
                      delay: idx * 15,
                    }}
                  >
                    {barHeight > 40 && barsAnimated && (
                      <Text 
                        fontSize="$1" 
                        color="white" 
                        fontWeight="600"
                        animation="quick"
                        opacity={barsAnimated ? 1 : 0}
                        transition={{ delay: idx * 15 + 200 }}
                      >
                        {formatCurrency(point.sales).replace(/\s/g, '')}
                      </Text>
                    )}
                  </YStack>
                  
                  {/* Barra período anterior */}
                  {animatedComparison && comparisonPoint && (
                    <YStack
                      flex={1}
                      height={showComparison && comparisonBarsAnimated ? comparisonBarHeight : 0}
                      backgroundColor="$orange10"
                      br="$2"
                      ai="center"
                      jc="flex-end"
                      paddingBottom="$1"
                      minHeight={0}
                      maxHeight={showComparison ? comparisonBarHeight : 0}
                      overflow="hidden"
                      animation="bouncy"
                      opacity={showComparison ? 1 : 0}
                      transition={{
                        type: 'spring',
                        damping: 20,
                        stiffness: 400,
                        mass: 0.5,
                        delay: showComparison ? idx * 15 + 50 : 0, // Sin delay al ocultar
                      }}
                    >
                      {comparisonBarHeight > 40 && showComparison && comparisonBarsAnimated && (
                        <Text 
                          fontSize="$1" 
                          color="white" 
                          fontWeight="600"
                          animation="quick"
                          opacity={showComparison ? 1 : 0}
                          transition={{ 
                            delay: showComparison ? idx * 15 + 250 : 0,
                            duration: 200 
                          }}
                        >
                          {formatCurrency(comparisonPoint.sales).replace(/\s/g, '')}
                        </Text>
                      )}
                    </YStack>
                  )}
                </XStack>
                <Text 
                  fontSize="$1" 
                  color="$textSecondary"
                  height={20}
                  lineHeight={20}
                  textAlign="center"
                  width="100%"
                >
                  {label}
                </Text>
              </YStack>
            )
          })}
        </XStack>
        {showComparison && comparison && (
          <XStack 
            gap="$2" 
            ai="center" 
            mt="$2"
            animation="quick"
            enterStyle={{
              opacity: 0,
              y: -10,
            }}
            opacity={1}
            y={0}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 300,
            }}
          >
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

