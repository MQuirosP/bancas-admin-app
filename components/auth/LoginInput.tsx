import React, { useState } from 'react'
import { TextInput, TextInputProps } from 'react-native'
import { XStack, YStack, Text, useTheme } from 'tamagui'
import type { LucideIcon } from '@tamagui/lucide-icons'

interface LoginInputProps extends Omit<TextInputProps, 'style'> {
  label: string
  icon: LucideIcon
  error?: string
}

export function LoginInput({ 
  label, 
  icon: Icon, 
  error,
  ...textInputProps 
}: LoginInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const theme = useTheme()

  // Obtener colores del tema
  const textPrimary = (theme.textPrimary as any)?.get?.() || '#000'
  const textTertiary = (theme.textTertiary as any)?.get?.() || '#999'
  const backgroundHover = (theme.backgroundHover as any)?.get?.() || '#f5f5f5'
  const borderColor = (theme.borderColor as any)?.get?.() || '#ddd'
  const cyan8 = (theme.cyan8 as any)?.get?.() || '#0891b2'
  const cyan9 = (theme.cyan9 as any)?.get?.() || '#0e7490'
  const cyan10 = (theme.cyan10 as any)?.get?.() || '#155e75'
  const red10 = (theme.red10 as any)?.get?.() || '#dc2626'

  return (
    <YStack gap="$2">
      <Text fontSize="$4" fontWeight="600" color="$textPrimary">
        {label}
      </Text>
      <XStack
        backgroundColor="$backgroundHover"
        borderRadius="$4"
        borderWidth={2}
        borderColor={
          error 
            ? '$red10' 
            : isFocused 
            ? '$cyan8' 
            : '$borderColor'
        }
        alignItems="center"
        paddingHorizontal="$4"
        minHeight={56}
        animation="quick"
        shadowColor={isFocused ? '$cyan10' : 'transparent'}
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={isFocused ? 0.2 : 0}
        shadowRadius={4}
      >
        <Icon size={20} color={isFocused ? cyan9 : cyan10} />
        <TextInput
          {...textInputProps}
          onFocus={(e) => {
            setIsFocused(true)
            textInputProps.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            textInputProps.onBlur?.(e)
          }}
          placeholderTextColor={textTertiary}
          style={{
            flex: 1,
            height: 48,
            fontSize: 16,
            color: textPrimary,
            backgroundColor: 'transparent',
            paddingHorizontal: 12,
            outline: 'none',
            border: 'none',
          }}
        />
      </XStack>
      {error && (
        <Text fontSize="$3" color="$red10">
          {error}
        </Text>
      )}
    </YStack>
  )
}

