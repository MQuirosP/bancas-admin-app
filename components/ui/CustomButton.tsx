// components/ui/CustomButton.tsx
import React from 'react'
import { Button, ButtonProps, Spinner, XStack, Text } from 'tamagui'

interface CustomButtonProps extends Omit<ButtonProps, 'variant'> {
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
    <Button
      {...styles}
      {...props}
      disabled={disabled || loading}
      borderRadius="$3"
      fontWeight="600"
      shadowColor="$borderColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={4}
      disabledStyle={{ opacity: 0.5, cursor: 'not-allowed' }}
    >
      <XStack ai="center" gap="$2">
        {loading ? <Spinner size="small" color={styles.color as any} /> : null}
        {content}
      </XStack>
    </Button>
  )
}
