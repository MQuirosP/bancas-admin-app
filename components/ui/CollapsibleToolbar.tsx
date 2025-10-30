/**
 * CollapsibleToolbar - Toolbar colapsable con búsqueda integrada
 * Diseñado para mantener la UI limpia mostrando solo búsqueda por defecto
 */

import React, { useState } from 'react'
import { YStack, XStack, styled } from 'tamagui'
import { ChevronDown, Search } from '@tamagui/lucide-icons'
import { Card } from './Card'

// Botón animado para el toggle
const ToggleButton = styled(YStack, {
  animation: '300ms',
  cursor: 'pointer',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: '$2',
  backgroundColor: '$background',
  borderTopWidth: 1,
  borderColor: '$borderColor',
  hoverStyle: {
    backgroundColor: '$backgroundHover',
  },
  pressStyle: {
    backgroundColor: '$backgroundPress',
  },
} as const)

// Contenedor animado para el icono
const ChevronContainer = styled(YStack, {
  animation: '300ms',
  alignItems: 'center',
  justifyContent: 'center',
} as const)

interface CollapsibleToolbarProps {
  /** Contenido de la fila de búsqueda (siempre visible) */
  searchContent: React.ReactNode
  /** Contenido de los filtros adicionales (colapsable) */
  filtersContent?: React.ReactNode
  /** Contenido de las acciones (colapsable) */
  actionsContent?: React.ReactNode
  /** Estado inicial (expandido o colapsado) */
  defaultExpanded?: boolean
}

export function CollapsibleToolbar({
  searchContent,
  filtersContent,
  actionsContent,
  defaultExpanded = false,
}: CollapsibleToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Si no hay filtros ni acciones, no mostrar el botón de colapsar
  const hasCollapsibleContent = filtersContent || actionsContent

  return (
    <Card padding="$0" borderColor="$borderColor" borderWidth={1} overflow="hidden">
      <YStack>
        {/* Búsqueda - Siempre visible */}
        <YStack padding="$4" paddingBottom={hasCollapsibleContent ? "$3" : "$4"}>
          {searchContent}
        </YStack>

        {/* Contenido Colapsable */}
        {hasCollapsibleContent && (
          <YStack
            animation="200ms"
            opacity={isExpanded ? 1 : 0}
            maxHeight={isExpanded ? 1000 : 0}
            paddingHorizontal={isExpanded ? "$4" : "$0"}
            paddingTop={isExpanded ? "$0" : "$0"}
            paddingBottom={isExpanded ? "$3" : "$0"}
          >
            <YStack gap="$3">
              {/* Filtros */}
              {filtersContent && (
                <YStack>
                  {filtersContent}
                </YStack>
              )}

              {/* Acciones */}
              {actionsContent && (
                <YStack>
                  {actionsContent}
                </YStack>
              )}
            </YStack>
          </YStack>
        )}

        {/* Botón Toggle en el borde inferior central */}
        {hasCollapsibleContent && (
          <ToggleButton onPress={() => setIsExpanded(!isExpanded)}>
            <ChevronContainer rotate={isExpanded ? '180deg' : '0deg'}>
              <ChevronDown size={20} color="$textPrimary" />
            </ChevronContainer>
          </ToggleButton>
        )}
      </YStack>
    </Card>
  )
}

