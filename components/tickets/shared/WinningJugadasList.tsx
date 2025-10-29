/**
 * Lista de jugadas ganadoras reutilizable
 * Reemplaza código duplicado en TicketPaymentModal y PaymentFormModal
 * @version 2.0 - Sistema Unificado
 */

import React from 'react'
import { YStack, XStack, Text, Card, ScrollView } from 'tamagui'
import { formatCurrency, formatJugadaType, formatMultiplier } from '@/utils/formatters'
import { getWinningJugadas } from '@/lib/tickets'
import type { TicketForCalculations } from '@/lib/tickets'

export interface WinningJugadasListProps {
  ticket: TicketForCalculations
  maxHeight?: number
  showScrollbar?: boolean
  size?: 'sm' | 'md' | 'lg'
  showTitle?: boolean
}

/**
 * Lista reutilizable para mostrar jugadas ganadoras con detalles
 * (número, tipo, apuesta, multiplicador, premio).
 * 
 * Elimina ~80 líneas de código duplicado en 2 modales.
 * 
 * @example
 * ```tsx
 * <WinningJugadasList 
 *   ticket={ticket} 
 *   maxHeight={200}
 *   size="md"
 * />
 * ```
 */
export function WinningJugadasList({ 
  ticket, 
  maxHeight = 200,
  showScrollbar = true,
  size = 'md',
  showTitle = true
}: WinningJugadasListProps) {
  const winningJugadas = getWinningJugadas(ticket)
  
  if (winningJugadas.length === 0) {
    return null
  }

  // Configuración de tamaños
  const sizeConfig = {
    sm: { 
      padding: '$2', 
      numberSize: '$4',
      typeSize: '$1',
      detailSize: '$2',
      prizeSize: '$3',
      gap: '$1'
    },
    md: { 
      padding: '$2', 
      numberSize: '$5',
      typeSize: '$1',
      detailSize: '$2',
      prizeSize: '$4',
      gap: '$2'
    },
    lg: { 
      padding: '$3', 
      numberSize: '$6',
      typeSize: '$2',
      detailSize: '$3',
      prizeSize: '$5',
      gap: '$2'
    },
  }
  
  const config = sizeConfig[size]

  return (
    <YStack gap={config.gap}>
      {showTitle && (
        <Text fontSize="$3" fontWeight="600" color="$textSecondary">
          Jugadas Ganadoras ({winningJugadas.length})
        </Text>
      )}
      <ScrollView maxHeight={maxHeight} showsVerticalScrollIndicator={showScrollbar}>
        <YStack gap={config.gap}>
          {winningJugadas.map((jugada, idx) => (
            <WinningJugadaCard 
              key={jugada.id || idx}
              jugada={jugada}
              size={size}
              config={config}
            />
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  )
}

/**
 * Card individual para una jugada ganadora
 */
function WinningJugadaCard({ 
  jugada, 
  size,
  config
}: { 
  jugada: any
  size: 'sm' | 'md' | 'lg'
  config: any
}) {
  return (
    <Card 
      padding={config.padding}
      backgroundColor="$green1" 
      borderColor="$green8" 
      borderWidth={1} 
      borderRadius="$2"
    >
      <XStack jc="space-between" ai="center" gap={config.gap} flexWrap="wrap">
        {/* Detalles de la jugada */}
        <XStack gap={config.gap} ai="center" flex={1} minWidth={180}>
          {/* Número */}
          <Text 
            fontSize={config.numberSize}
            fontWeight="700"
            color="$blue11"
            fontFamily="$mono"
          >
            {jugada.number}
          </Text>
          
          {/* Tipo de jugada */}
          {jugada.type && (
            <XStack bg="$blue4" px="$2" py="$1" br="$2">
              <Text 
                fontSize={config.typeSize}
                fontWeight="600"
                color="$blue11"
              >
                {formatJugadaType(jugada.type)}
              </Text>
            </XStack>
          )}
          
          {/* Apuesta */}
          <Text fontSize={config.detailSize} color="$textSecondary">
            Apuesta: {formatCurrency(jugada.amount)}
          </Text>
          
          {/* Multiplicador */}
          {jugada.finalMultiplierX && jugada.finalMultiplierX > 1 && (
            <Text 
              fontSize={config.detailSize}
              color="$yellow10"
              fontWeight="600"
            >
              {formatMultiplier(jugada.finalMultiplierX)}
            </Text>
          )}
        </XStack>
        
        {/* Premio */}
        <Text 
          fontSize={config.prizeSize}
          fontWeight="700"
          color="$green11"
        >
          Premio: {formatCurrency(jugada.winAmount)}
        </Text>
      </XStack>
    </Card>
  )
}

/**
 * Versión compacta sin scroll, muestra solo las primeras N jugadas
 */
export function WinningJugadasCompact({ 
  ticket,
  maxItems = 3,
  size = 'sm'
}: {
  ticket: TicketForCalculations
  maxItems?: number
  size?: 'sm' | 'md'
}) {
  const winningJugadas = getWinningJugadas(ticket).slice(0, maxItems)
  
  if (winningJugadas.length === 0) {
    return null
  }
  
  const total = getWinningJugadas(ticket).length
  const hasMore = total > maxItems

  return (
    <YStack gap="$1">
      <Text fontSize="$2" fontWeight="600" color="$textSecondary">
        Jugadas Ganadoras ({total})
      </Text>
      <YStack gap="$1">
        {winningJugadas.map((jugada, idx) => (
          <XStack 
            key={jugada.id || idx}
            gap="$2" 
            ai="center"
            px="$2"
            py="$1"
            bg="$green1"
            br="$2"
          >
            <Text 
              fontSize={size === 'sm' ? '$3' : '$4'}
              fontWeight="700"
              color="$blue11"
              fontFamily="$mono"
            >
              {jugada.number}
            </Text>
            {jugada.type && (
              <Text fontSize="$2" color="$textSecondary">
                {formatJugadaType(jugada.type)}
              </Text>
            )}
            <Text 
              fontSize={size === 'sm' ? '$2' : '$3'}
              fontWeight="600"
              color="$green11"
              ml="auto"
            >
              {formatCurrency(jugada.winAmount)}
            </Text>
          </XStack>
        ))}
        {hasMore && (
          <Text fontSize="$2" color="$textSecondary" ta="center">
            + {total - maxItems} más
          </Text>
        )}
      </YStack>
    </YStack>
  )
}

/**
 * Resumen simple de jugadas ganadoras (solo contador y total)
 */
export function WinningJugadasSummary({ 
  ticket 
}: { 
  ticket: TicketForCalculations 
}) {
  const winningJugadas = getWinningJugadas(ticket)
  
  if (winningJugadas.length === 0) {
    return null
  }
  
  const totalPrize = winningJugadas.reduce((sum, j) => sum + j.winAmount, 0)
  
  return (
    <XStack 
      gap="$2" 
      ai="center"
      px="$3"
      py="$2"
      bg="$green2"
      br="$3"
      bw={1}
      bc="$green8"
    >
      <Text fontSize="$3" fontWeight="600" color="$green11">
        {winningJugadas.length} {winningJugadas.length === 1 ? 'jugada' : 'jugadas'} ganadora{winningJugadas.length === 1 ? '' : 's'}
      </Text>
      <Text fontSize="$1" color="$textSecondary">•</Text>
      <Text fontSize="$4" fontWeight="700" color="$green11">
        {formatCurrency(totalPrize)}
      </Text>
    </XStack>
  )
}

