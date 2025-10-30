import React from 'react'
import { YStack, styled } from 'tamagui'

const SkeletonBase = styled(YStack, {
  backgroundColor: '$gray4',
  borderRadius: '$3',
  '$theme-dark': {
    backgroundColor: '$gray6',
  },
} as const)

interface SkeletonProps {
  width?: number | string
  height?: number | string
  borderRadius?: number | string
  marginBottom?: number | string
  marginTop?: number | string
  marginLeft?: number | string
  marginRight?: number | string
  animated?: boolean
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = '$3',
  marginBottom,
  marginTop,
  marginLeft,
  marginRight,
  animated = true,
}: SkeletonProps) {
  const [opacity, setOpacity] = React.useState(1)
  
  React.useEffect(() => {
    if (!animated) return
    
    const interval = setInterval(() => {
      setOpacity((prev) => (prev === 1 ? 0.5 : 1))
    }, 800)
    
    return () => clearInterval(interval)
  }, [animated])
  
  return (
    <SkeletonBase
      width={width}
      height={height}
      borderRadius={borderRadius}
      marginBottom={marginBottom}
      marginTop={marginTop}
      marginLeft={marginLeft}
      marginRight={marginRight}
      opacity={animated ? opacity : 1}
      animation={animated ? 'lazy' : undefined}
    />
  )
}

// Variante para texto
export function SkeletonText({
  lines = 1,
  gap = '$2',
  lastLineWidth = '60%',
}: {
  lines?: number
  gap?: string | number
  lastLineWidth?: string | number
}) {
  return (
    <YStack gap={gap}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? lastLineWidth : '100%'}
          height={16}
        />
      ))}
    </YStack>
  )
}

// Variante para cards de métricas (KPIs)
export function SkeletonKPI() {
  return (
    <YStack
      padding="$4"
      backgroundColor="$backgroundStrong"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
      gap="$3"
    >
      {/* Header con icono y badge */}
      <YStack gap="$2">
        <Skeleton width={120} height={24} />
        <Skeleton width={80} height={20} />
      </YStack>
      
      {/* Valor principal */}
      <Skeleton width="60%" height={36} />
      
      {/* Texto adicional */}
      <Skeleton width="80%" height={16} />
    </YStack>
  )
}

// Variante para gráficos
export function SkeletonChart({ height = 300 }: { height?: number }) {
  return (
    <YStack
      padding="$4"
      backgroundColor="$backgroundStrong"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
      gap="$3"
    >
      {/* Título */}
      <Skeleton width={200} height={24} marginBottom="$3" />
      
      {/* Área del gráfico */}
      <Skeleton width="100%" height={height} />
    </YStack>
  )
}

