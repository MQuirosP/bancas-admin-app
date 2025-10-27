import React from 'react'
import { Button as TButton, Spinner, XStack, Text, useTheme } from 'tamagui'

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
        backgroundColor: '$gray10',
        borderWidth: 1,
        borderColor: '$gray11',
        color: '#fff',
        hoverStyle: { backgroundColor: '$gray9' },
        pressStyle: { backgroundColor: '$gray8', scale: 0.98 },
      }
    case 'outlined':
      return {
        backgroundColor: '$gray10',
        borderWidth: 1,
        borderColor: '$borderColor',
        color: '#fff',
        hoverStyle: { backgroundColor: '$gray9' },
        pressStyle: { backgroundColor: '$gray8', scale: 0.98 },
      }
    case 'ghost':
      return {
        chromeless: true,
        color: '#fff',
        hoverStyle: { backgroundColor: '$backgroundHover' },
        pressStyle: { backgroundColor: '$backgroundPress' },
      }
    case 'danger':
      return {
        backgroundColor: '$red4',
        borderColor: '$red8',
        borderWidth: 1,
        color: '#fff',
        hoverStyle: { backgroundColor: '$red5' },
        pressStyle: { backgroundColor: '$red6', scale: 0.98 },
      }
    case 'primary':
    default:
      return {
        backgroundColor: '$primary',
        color: '#fff',
        hoverStyle: { backgroundColor: '$primaryHover' },
        pressStyle: { backgroundColor: '$primaryPress', scale: 0.98 },
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
  // Resolve current theme color to a concrete value (light: black, dark: white)
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000000'
  const isDisabled = disabled || loading
  const renderChildren = (c: React.ReactNode) => {
    if (typeof c === 'string' || typeof c === 'number') {
      return <Text color={iconColor}>{c}</Text>
    }
    return c
  }
  const content = loading ? (
    <XStack ai="center" gap="$2">
      <Spinner size="small" color={iconColor} />
      {typeof loadingText === 'string' ? <Text color={iconColor}>{loadingText}</Text> : renderChildren(children)}
    </XStack>
  ) : (
    renderChildren(children)
  )

  // Ensure nested icon elements inside children also adopt theme color
  const colorize = (node: React.ReactNode): React.ReactNode => {
    return React.Children.map(node as any, (child: any) => {
      if (!React.isValidElement(child)) return child
      const props = child.props || {}
      const isIconLike = 'size' in props && !('children' in props)
      const shouldColorText = child.type === Text || typeof props.children === 'string'
      if ((isIconLike || shouldColorText) && props.color === undefined) {
        return React.cloneElement(child, { color: iconColor, children: colorize(props.children) })
      }
      if (props.children) {
        return React.cloneElement(child, { children: colorize(props.children) })
      }
      return child
    })
  }
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
      {colorize(content)}
    </TButton>
  )
}

export default Button
