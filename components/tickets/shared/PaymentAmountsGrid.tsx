/**
 * Grid de montos de pago reutilizable
 * Reemplaza código duplicado en TicketDetailScreen, TicketPaymentModal,
 * PaymentFormModal, PendingTicketsScreen
 * @version 2.0 - Sistema Unificado
 */

import React from 'react'
import { XStack, YStack, Text, Card } from 'tamagui'
import { formatCurrency } from '@/utils/formatters'
import type { PaymentTotals } from '@/lib/tickets'

export interface PaymentAmountsGridProps {
  totals: PaymentTotals
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  orientation?: 'horizontal' | 'vertical'
}

/**
 * Grid reutilizable para mostrar montos de pago (Total Premio, Ya Pagado, Pendiente)
 * con colores consistentes y tamaños configurables.
 * 
 * Elimina ~100 líneas de código duplicado en 4 archivos.
 * 
 * @example
 * ```tsx
 * import { calculatePaymentTotals } from '@/lib/tickets'
 * 
 * const totals = calculatePaymentTotals(ticket)
 * <PaymentAmountsGrid totals={totals} size="md" />
 * ```
 */
export function PaymentAmountsGrid({ 
  totals, 
  size = 'md',
  showLabels = true,
  orientation = 'horizontal'
}: PaymentAmountsGridProps) {
  // Configuración de tamaños
  const sizeConfig = {
    sm: { 
      minWidth: 80, 
      padding: '$2', 
      labelSize: '$1', 
      valueSize: '$4',
      gap: '$1'
    },
    md: { 
      minWidth: 100, 
      padding: '$3', 
      labelSize: '$2', 
      valueSize: '$6',
      gap: '$1'
    },
    lg: { 
      minWidth: 140, 
      padding: '$4', 
      labelSize: '$3', 
      valueSize: '$8',
      gap: '$2'
    },
  }
  
  const config = sizeConfig[size]
  
  const items = [
    {
      label: 'Total Premio',
      value: totals.totalPayout,
      bg: '$green2',
      color: '$green11',
    },
    {
      label: 'Ya Pagado',
      value: totals.totalPaid,
      bg: '$blue2',
      color: '$blue11',
    },
    {
      label: 'Pendiente',
      value: totals.remainingAmount,
      bg: totals.remainingAmount > 0 ? '$red2' : '$gray2',
      color: totals.remainingAmount > 0 ? '$red11' : '$gray11',
    },
  ]
  
  const Container = orientation === 'horizontal' ? XStack : YStack
  
  return (
    <Container 
      gap="$2" 
      jc="space-between" 
      flexWrap={orientation === 'horizontal' ? 'wrap' : 'nowrap'}
      width="100%"
    >
      {items.map((item, index) => (
        <Card 
          key={index}
          flex={1} 
          minWidth={config.minWidth}
          padding={config.padding}
          backgroundColor={item.bg}
          ai="center" 
          jc="center" 
          borderRadius="$3"
        >
          <YStack ai="center" gap={config.gap}>
            {showLabels && (
              <Text 
                fontSize={config.labelSize}
                color={item.color}
                fontWeight="600"
                ta="center"
              >
                {item.label}
              </Text>
            )}
            <Text 
              fontSize={config.valueSize}
              fontWeight="700"
              color={item.color}
            >
              {formatCurrency(item.value)}
            </Text>
          </YStack>
        </Card>
      ))}
    </Container>
  )
}

/**
 * Versión compacta con solo el total y pendiente
 */
export function PaymentAmountsCompact({ 
  totals, 
  size = 'sm'
}: { 
  totals: PaymentTotals
  size?: 'sm' | 'md'
}) {
  const sizeConfig = {
    sm: { fontSize: '$3', gap: '$2' },
    md: { fontSize: '$4', gap: '$3' },
  }
  
  const config = sizeConfig[size]
  
  return (
    <XStack gap={config.gap} ai="center" flexWrap="wrap">
      <YStack ai="flex-start">
        <Text fontSize="$2" color="$textSecondary">Total Premio</Text>
        <Text fontSize={config.fontSize} fontWeight="700" color="$green11">
          {formatCurrency(totals.totalPayout)}
        </Text>
      </YStack>
      
      {totals.totalPaid > 0 && (
        <YStack ai="flex-start">
          <Text fontSize="$2" color="$textSecondary">Pagado</Text>
          <Text fontSize={config.fontSize} fontWeight="600" color="$blue11">
            {formatCurrency(totals.totalPaid)}
          </Text>
        </YStack>
      )}
      
      {totals.remainingAmount > 0 && (
        <YStack ai="flex-start">
          <Text fontSize="$2" color="$textSecondary">Pendiente</Text>
          <Text fontSize={config.fontSize} fontWeight="600" color="$red11">
            {formatCurrency(totals.remainingAmount)}
          </Text>
        </YStack>
      )}
    </XStack>
  )
}

/**
 * Barra de progreso de pago
 */
export function PaymentProgressBar({ 
  totals,
  showPercentage = true
}: { 
  totals: PaymentTotals
  showPercentage?: boolean
}) {
  const percentage = totals.totalPayout > 0 
    ? Math.round((totals.totalPaid / totals.totalPayout) * 100) 
    : 0
  
  return (
    <YStack gap="$2">
      {showPercentage && (
        <XStack jc="space-between">
          <Text fontSize="$2" color="$textSecondary">Progreso de pago</Text>
          <Text fontSize="$2" fontWeight="600" color="$textSecondary">
            {percentage}%
          </Text>
        </XStack>
      )}
      <XStack 
        height={8} 
        backgroundColor="$gray4" 
        borderRadius="$2" 
        overflow="hidden"
      >
        <XStack 
          width={`${Math.min(percentage, 100)}%`}
          backgroundColor={totals.isFullyPaid ? '$green10' : '$blue10'}
          animation="medium"
        />
      </XStack>
    </YStack>
  )
}

