/**
 * Componente compartido para mostrar la lista de jugadas de un ticket
 * Soporta vista normal y vista agrupada por monto
 * @version 2.0 - Sistema Unificado
 */

import React from 'react'
import { YStack, XStack, Text, Card } from 'tamagui'
import { formatCurrency } from '@/utils/formatters'

export interface JugadasListProps {
  jugadas: any[]
  /**
   * Agrupar jugadas por monto apostado
   * @default false
   */
  grouped?: boolean
  /**
   * Tamaño de los componentes
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Lista de jugadas con opción de agrupamiento
 */
export function JugadasList({ 
  jugadas, 
  grouped = false,
  size = 'md' 
}: JugadasListProps) {
  if (!jugadas || jugadas.length === 0) {
    return (
      <Card padding="$4" ai="center" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
        <Text color="$textSecondary">Este ticket no tiene jugadas</Text>
      </Card>
    )
  }

  if (grouped) {
    return <JugadasListGrouped jugadas={jugadas} size={size} />
  }

  return <JugadasListNormal jugadas={jugadas} size={size} />
}

/**
 * Vista normal - una card por jugada
 */
function JugadasListNormal({ jugadas, size }: { jugadas: any[], size: 'sm' | 'md' | 'lg' }) {
  const fontSize = size === 'sm' ? '$3' : size === 'lg' ? '$6' : '$5'
  const padding = size === 'sm' ? '$2' : size === 'lg' ? '$5' : '$4'

  return (
    <>
      {jugadas.map((jugada: any, idx: number) => {
        const isWinner = jugada.isWinner === true
        const winAmount = jugada.payout ?? jugada.winAmount ?? 0
        
        return (
          <Card
            key={jugada.id || idx}
            padding={padding}
            bg={isWinner ? '$green2' : '$backgroundHover'}
            borderColor={isWinner ? '$green8' : '$borderColor'}
            borderWidth={isWinner ? 2 : 1}
          >
            <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
              <YStack flex={1} gap="$1">
                <XStack ai="center" gap="$2" flexWrap="wrap">
                  <Text fontSize={fontSize} fontWeight="700" color="$blue11">
                    Número: {jugada.number || 'N/A'}
                  </Text>
                  {jugada.type && (
                    <XStack bg="$blue3" px="$2" py="$1" br="$2" bw={1} bc="$blue7">
                      <Text fontSize="$2" fontWeight="600" color="$blue11">
                        {jugada.type === 'REVENTADO' ? 'EXTRA' : jugada.type}
                      </Text>
                    </XStack>
                  )}
                  {isWinner && (
                    <XStack bg="$green4" px="$2" py="$1" br="$2" bw={1} bc="$green8">
                      <Text fontSize="$2" fontWeight="700" color="$green11">GANADOR</Text>
                    </XStack>
                  )}
                </XStack>

                <Text fontSize="$3" color="$textSecondary">
                  <Text fontWeight="600">Monto apostado:</Text> {formatCurrency(jugada.amount)}
                </Text>

                {/* Solo mostrar multiplicador si es mayor a 0 */}
                {jugada.finalMultiplierX && jugada.finalMultiplierX > 0 && (
                  <Text fontSize="$3" color="$textSecondary">
                    <Text fontWeight="600">Multiplicador:</Text> {jugada.finalMultiplierX}x
                  </Text>
                )}

                {jugada.multiplier?.name && (
                  <Text fontSize="$3" color="$textSecondary">
                    <Text fontWeight="600">Multiplicador:</Text> {jugada.multiplier.name}
                  </Text>
                )}
              </YStack>

              {isWinner && winAmount > 0 && (
                <YStack ai="flex-end" gap="$1">
                  <Text fontSize="$2" color="$textSecondary">Ganancia</Text>
                  <Text fontSize="$7" fontWeight="bold" color="$green10">
                    {formatCurrency(winAmount)}
                  </Text>
                </YStack>
              )}
            </XStack>
          </Card>
        )
      })}
    </>
  )
}

/**
 * Vista agrupada - agrupar por monto y tipo
 */
function JugadasListGrouped({ jugadas, size }: { jugadas: any[], size: 'sm' | 'md' | 'lg' }) {
  // Agrupar por amount
  const grouped = jugadas.reduce((acc: any, jugada: any) => {
    const amount = jugada.amount || 0
    if (!acc[amount]) {
      acc[amount] = []
    }
    acc[amount].push(jugada)
    return acc
  }, {})

  // Ordenar montos de mayor a menor
  const amounts = Object.keys(grouped).map(Number).sort((a, b) => b - a)

  return (
    <>
      {amounts.map((amount) => {
        const group = grouped[amount]
        const hasWinner = group.some((j: any) => j.isWinner === true)
        const totalWinnings = group.reduce((sum: number, j: any) => 
          sum + (j.isWinner ? (j.payout ?? j.winAmount ?? 0) : 0), 0
        )

        // Agrupar por tipo dentro del monto
        const byType = group.reduce((acc: any, jugada: any) => {
          const type = jugada.type || 'DIRECTO'
          if (!acc[type]) {
            acc[type] = []
          }
          acc[type].push(jugada)
          return acc
        }, {})

        return (
          <Card
            key={amount}
            padding="$4"
            bg={hasWinner ? '$green2' : '$backgroundHover'}
            borderColor={hasWinner ? '$green8' : '$borderColor'}
            borderWidth={hasWinner ? 2 : 1}
          >
            <YStack gap="$3">
              {/* Header con monto */}
              <XStack jc="space-between" ai="center" flexWrap="wrap" gap="$2">
                <XStack ai="center" gap="$2" flexWrap="wrap">
                  <Text fontSize="$5" fontWeight="700" color="$blue11">
                    Monto: {formatCurrency(amount)}
                  </Text>
                  <XStack bg="$gray3" px="$2" py="$1" br="$2" bw={1} bc="$gray7">
                    <Text fontSize="$2" fontWeight="600" color="$gray11">
                      {group.length} {group.length === 1 ? 'número' : 'números'}
                    </Text>
                  </XStack>
                  {hasWinner && (
                    <XStack bg="$green4" px="$2" py="$1" br="$2" bw={1} bc="$green8">
                      <Text fontSize="$2" fontWeight="700" color="$green11">GANADOR</Text>
                    </XStack>
                  )}
                </XStack>

                {hasWinner && totalWinnings > 0 && (
                  <YStack ai="flex-end" gap="$1">
                    <Text fontSize="$2" color="$textSecondary">Ganancia Total</Text>
                    <Text fontSize="$6" fontWeight="bold" color="$green10">
                      {formatCurrency(totalWinnings)}
                    </Text>
                  </YStack>
                )}
              </XStack>

              {/* Números agrupados por tipo */}
              <YStack gap="$2">
                {Object.keys(byType).map((type) => {
                  const nums = byType[type]
                  const typeLabel = type === 'REVENTADO' ? 'EXTRA' : type
                  
                  return (
                    <YStack key={type} gap="$1">
                      <XStack ai="center" gap="$2" flexWrap="wrap">
                        <XStack bg="$blue3" px="$2" py="$1" br="$2" bw={1} bc="$blue7">
                          <Text fontSize="$2" fontWeight="600" color="$blue11">
                            {typeLabel}
                          </Text>
                        </XStack>
                      </XStack>
                      
                      <XStack gap="$2" flexWrap="wrap">
                        {nums.map((jugada: any, idx: number) => {
                          const isWinner = jugada.isWinner === true
                          return (
                            <XStack
                              key={jugada.id || idx}
                              bg={isWinner ? '$green4' : '$blue2'}
                              px="$3"
                              py="$2"
                              br="$3"
                              bw={isWinner ? 3 : 1}
                              bc={isWinner ? '$green9' : '$blue7'}
                              shadowColor={isWinner ? '$green10' : undefined}
                              shadowOffset={isWinner ? { width: 0, height: 2 } : undefined}
                              shadowOpacity={isWinner ? 0.3 : undefined}
                              shadowRadius={isWinner ? 4 : undefined}
                              animation="quick"
                              scale={isWinner ? 1.05 : 1}
                            >
                              <Text 
                                fontSize="$4" 
                                fontWeight="700" 
                                color={isWinner ? '$green11' : '$blue11'}
                              >
                                {jugada.number || 'N/A'}
                              </Text>
                            </XStack>
                          )
                        })}
                      </XStack>
                    </YStack>
                  )
                })}
              </YStack>

              {/* Multiplicador si existe y es mayor a 0 */}
              {group[0].finalMultiplierX && group[0].finalMultiplierX > 0 && (
                <Text fontSize="$3" color="$textSecondary">
                  <Text fontWeight="600">Multiplicador:</Text> {group[0].finalMultiplierX}x
                </Text>
              )}

              {group[0].multiplier?.name && (
                <Text fontSize="$3" color="$textSecondary">
                  <Text fontWeight="600">Multiplicador:</Text> {group[0].multiplier.name}
                </Text>
              )}
            </YStack>
          </Card>
        )
      })}
    </>
  )
}

