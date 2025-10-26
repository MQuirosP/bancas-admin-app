import React from 'react'
import { Button as TButton, Spinner, XStack, Text, useThemeName } from 'tamagui'

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
        bg: '$gray10',
        bw: 1,
        bc: '$gray11',
        color: '#fff',
        hoverStyle: { bg: '$gray9' },
        pressStyle: { bg: '$gray8', scale: 0.98 },
      }
    case 'outlined':
      return {
        bg: '$gray10',
        bw: 1,
        bc: '$borderColor',
        color: '#fff',
        hoverStyle: { bg: '$gray9' },
        pressStyle: { bg: '$gray8', scale: 0.98 },
      }
    case 'ghost':
      return {
        chromeless: true,
        color: '#fff',
        hoverStyle: { bg: '$backgroundHover' },
        pressStyle: { bg: '$backgroundPress' },
      }
    case 'danger':
      return {
        bg: '$red4',
        bc: '$red8',
        bw: 1,
        color: '#fff',
        hoverStyle: { bg: '$red5' },
        pressStyle: { bg: '$red6', scale: 0.98 },
      }
    case 'primary':
    default:
      return {
        bg: '$primary',
        color: '#fff',
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
  const themeName = useThemeName()
  const iconColor = '#ffffff'
  const isDisabled = disabled || loading
  const renderChildren = (c: React.ReactNode) => {
    if (typeof c === 'string' || typeof c === 'number') {
      return <Text color="#ffffff">{c}</Text>
    }
    return c
  }
  const content = loading ? (
    <XStack ai="center" gap="$2">
      <Spinner size="small" color="#ffffff" />
      {typeof loadingText === 'string' ? <Text color="#ffffff">{loadingText}</Text> : renderChildren(children)}
    </XStack>
  ) : (
    renderChildren(children)
  )
  // Enforce icon color for built-in icon/iconAfter props
  const anyProps = rest as any
  const OriginalIcon = anyProps.icon as React.ComponentType<any> | undefined
  const OriginalIconAfter = anyProps.iconAfter as React.ComponentType<any> | undefined
  const WrappedIcon = OriginalIcon ? ((p: any) => {
    const I = OriginalIcon as any
    return <I color={iconColor} {...p} />
  }) : undefined
  const WrappedIconAfter = OriginalIconAfter ? ((p: any) => {
    const I = OriginalIconAfter as any
    return <I color={iconColor} {...p} />
  }) : undefined

  return (
    <TButton {...vs} {...rest} icon={WrappedIcon as any} iconAfter={WrappedIconAfter as any} disabled={isDisabled} aria-busy={loading ? true : undefined}>
      {content}
    </TButton>
  )
}

export default Button
