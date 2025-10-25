import React from 'react'
import { Button as TButton } from 'tamagui'

type Variant = 'primary' | 'outlined' | 'ghost' | 'danger' | 'secondary'

type TButtonProps = Omit<React.ComponentProps<typeof TButton>, 'variant'>

export type UIButtonProps = TButtonProps & {
  /** Visual style for our UI Button (not Tamagui's built-in variant) */
  variant?: Variant
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
        hoverStyle: { bg: '$red5' },
        pressStyle: { bg: '$red6', scale: 0.98 },
      }
    case 'primary':
    default:
      return {
        bg: '$primary',
        hoverStyle: { bg: '$primaryHover' },
        pressStyle: { bg: '$primaryPress', scale: 0.98 },
      }
  }
}

export const Button: React.FC<UIButtonProps> = ({ variant = 'primary', ...rest }) => {
  const vs = variantStyles(variant)
  // Do NOT pass our custom variant down to Tamagui's Button to avoid type conflicts
  return <TButton {...vs} {...rest} />
}

export default Button
