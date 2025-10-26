import React from 'react'
import { Button as TButton, Spinner, XStack, Text } from 'tamagui'

type Variant = 'primary' | 'outlined' | 'ghost' | 'danger' | 'secondary'

type TButtonProps = Omit<React.ComponentProps<typeof TButton>, 'variant'>

export type UIButtonProps = TButtonProps & {
  /** Visual style for our UI Button (not Tamagui's built-in variant) */
  variant?: Variant
  /** Show loading spinner and disable button */
  loading?: boolean
  /** Optional loading label when loading is true */
  loadingText?: string
}

const variantStyles = (variant: Variant): Partial<React.ComponentProps<typeof TButton>> => {
  switch (variant) {
    case 'secondary':
      return {
        bg: '$background',
        bw: 1,
        bc: '$borderColor',
        color: '$textSecondary',
        hoverStyle: { bg: '$backgroundHover' },
        pressStyle: { bg: '$backgroundPress', scale: 0.98 },
      }
    case 'outlined':
      return {
        bg: '$background',
        bw: 1,
        bc: '$borderColor',
        color: '$color',
        hoverStyle: { bg: '$backgroundHover' },
        pressStyle: { bg: '$backgroundPress', scale: 0.98 },
      }
    case 'ghost':
      return {
        chromeless: true,
        color: '$color',
        hoverStyle: { bg: '$backgroundHover' },
        pressStyle: { bg: '$backgroundPress' },
      }
    case 'danger':
      return {
        bg: '$red4',
        bc: '$red8',
        bw: 1,
        color: '$background',
        hoverStyle: { bg: '$red5' },
        pressStyle: { bg: '$red6', scale: 0.98 },
      }
    case 'primary':
    default:
      return {
        bg: '$primary',
        color: '$background',
        hoverStyle: { bg: '$primaryHover' },
        pressStyle: { bg: '$primaryPress', scale: 0.98 },
      }
  }
}

export const Button: React.FC<UIButtonProps> = ({
  variant = 'primary',
  loading = false,
  loadingText,
  children,
  disabled,
  ...rest
}) => {
  const vs = variantStyles(variant)
  const isDisabled = disabled || loading
  const content = loading ? (
    <XStack ai="center" gap="$2">
      <Spinner size="small" />
      {typeof loadingText === 'string' ? <Text>{loadingText}</Text> : children}
    </XStack>
  ) : (
    children
  )
  return (
    <TButton {...vs} {...rest} disabled={isDisabled} aria-busy={loading ? true : undefined}>
      {content}
    </TButton>
  )
}

export default Button
