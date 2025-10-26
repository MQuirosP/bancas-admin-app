// components/ui/CustomButton.tsx
import React from 'react'
import { Button as UIButton } from './Button'
import { XStack, Text } from 'tamagui'

interface CustomButtonProps extends Omit<React.ComponentProps<typeof UIButton>, 'variant'> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost'
  loading?: boolean
}

export function CustomButton({
  variant = 'primary',
  loading = false,
  children,
  disabled,
  ...props
}: CustomButtonProps) {
  const styles = (() => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '$primary',
          color: '$background',
          hoverStyle: { backgroundColor: '$primaryHover', scale: 1.02 },
          pressStyle: { backgroundColor: '$primaryPress', scale: 0.98 },
        }
      case 'secondary':
        return {
          backgroundColor: '$background',
          color: '$color',
          borderWidth: 1,
          borderColor: '$borderColor',
          hoverStyle: { backgroundColor: '$backgroundHover', scale: 1.02 },
          pressStyle: { backgroundColor: '$backgroundPress', scale: 0.98 },
        }
      case 'success':
        return {
          backgroundColor: '$success',
          color: '$background',
          hoverStyle: { scale: 1.02 },
          pressStyle: { scale: 0.98 },
        }
      case 'danger':
        return {
          backgroundColor: '$error',
          color: '$background',
          hoverStyle: { scale: 1.02 },
          pressStyle: { scale: 0.98 },
        }
      case 'warning':
        return {
          backgroundColor: '$warning',
          color: '$background',
          hoverStyle: { scale: 1.02 },
          pressStyle: { scale: 0.98 },
        }
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: '$color',
          borderWidth: 1,
          borderColor: '$borderColor',
          hoverStyle: { backgroundColor: '$backgroundHover', scale: 1.02 },
          pressStyle: { backgroundColor: '$backgroundPress', scale: 0.98 },
        }
      default:
        return {}
    }
  })()

  // ✅ Si children es texto/numero, envolver en <Text/> para evitar "Unexpected text node"
  const content =
    typeof children === 'string' || typeof children === 'number'
      ? <Text>{children}</Text>
      : children

  return (
    <UIButton
      {...styles as any}
      {...props as any}
      disabled={disabled || loading}
    >
      <XStack ai="center" gap="$2">
        {content}
      </XStack>
    </UIButton>
  )
}
