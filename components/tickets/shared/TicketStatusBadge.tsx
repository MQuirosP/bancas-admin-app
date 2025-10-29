/**
 * Badge de estado de ticket unificado
 * Reemplaza código duplicado en TicketDetailScreen, TicketsListScreen, TicketPreviewModal
 * @version 2.0 - Sistema Unificado
 */

import React from 'react'
import { XStack, Text } from 'tamagui'
import { getStatusBadgeStyles } from '@/lib/tickets'

export interface TicketStatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
  uppercase?: boolean
}

/**
 * Badge reutilizable para mostrar el estado de un ticket
 * con colores y estilos consistentes en toda la aplicación.
 * 
 * @example
 * ```tsx
 * <TicketStatusBadge status="EVALUATED" size="md" />
 * <TicketStatusBadge status="PAID" size="lg" uppercase />
 * ```
 */
export function TicketStatusBadge({ 
  status, 
  size = 'md',
  uppercase = true 
}: TicketStatusBadgeProps) {
  const styles = getStatusBadgeStyles(status)
  
  // Configuración de tamaños
  const sizeConfig = {
    sm: { px: '$2', py: '$1', fontSize: '$2', br: '$2' },
    md: { px: '$3', py: '$1.5', fontSize: '$3', br: '$3' },
    lg: { px: '$3', py: '$2', fontSize: '$4', br: '$3' },
  }
  
  const config = sizeConfig[size]
  
  return (
    <XStack
      px={config.px}
      py={config.py}
      br={config.br}
      bw={1}
      backgroundColor={styles.bg}
      borderColor={styles.bc}
      ai="center"
      jc="center"
    >
      <Text 
        fontSize={config.fontSize}
        fontWeight="700"
        textTransform={uppercase ? 'uppercase' : 'none'}
        color={styles.color}
      >
        {status}
      </Text>
    </XStack>
  )
}

/**
 * Badge especial para tickets ganadores
 */
export function WinnerBadge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeConfig = {
    sm: { px: '$2', py: '$1', fontSize: '$2', br: '$2' },
    md: { px: '$3', py: '$1.5', fontSize: '$3', br: '$3' },
    lg: { px: '$3', py: '$2', fontSize: '$4', br: '$3' },
  }
  
  const config = sizeConfig[size]
  
  return (
    <XStack
      bg="$green4"
      px={config.px}
      py={config.py}
      br={config.br}
      bw={1}
      bc="$green8"
      ai="center"
      jc="center"
    >
      <Text 
        color="$green11" 
        fontSize={config.fontSize}
        fontWeight="700"
      >
        GANADOR
      </Text>
    </XStack>
  )
}

/**
 * Badge para estado de pago
 */
export interface PaymentStatusBadgeProps {
  status: 'paid' | 'partial' | 'unpaid'
  size?: 'sm' | 'md' | 'lg'
  amounts?: {
    paid?: number
    remaining?: number
  }
  showAmounts?: boolean
}

export function PaymentStatusBadge({ 
  status, 
  size = 'md',
  amounts,
  showAmounts = false
}: PaymentStatusBadgeProps) {
  const sizeConfig = {
    sm: { px: '$2', py: '$1', fontSize: '$2', br: '$2' },
    md: { px: '$2', py: '$1', fontSize: '$2', br: '$2' },
    lg: { px: '$3', py: '$1.5', fontSize: '$3', br: '$3' },
  }
  
  const config = sizeConfig[size]
  
  const statusConfig = {
    paid: {
      bg: '$green4',
      bc: '$green8',
      color: '$green11',
      label: '✓ PAGADO',
    },
    partial: {
      bg: '$yellow4',
      bc: '$yellow8',
      color: '$yellow11',
      label: 'PAGO PARCIAL',
    },
    unpaid: {
      bg: '$red4',
      bc: '$red8',
      color: '$red11',
      label: 'SIN PAGAR',
    },
  }
  
  const styles = statusConfig[status]
  
  return (
    <XStack
      bg={styles.bg}
      px={config.px}
      py={config.py}
      br={config.br}
      bw={1}
      bc={styles.bc}
      gap="$1"
      ai="center"
      jc="center"
    >
      <Text 
        color={styles.color}
        fontSize={config.fontSize}
        fontWeight="700"
      >
        {styles.label}
      </Text>
    </XStack>
  )
}

