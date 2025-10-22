// components/ui/FilterSwitch.tsx
import React from 'react'
import { XStack, Text, Switch } from 'tamagui'

type Props = {
  label?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export default function FilterSwitch({ label, checked, onCheckedChange, disabled }: Props) {
  return (
    <XStack ai="center" gap="$2" py="$1" px="$1" pointerEvents="auto">
      {label ? (
        <Text
          onPress={() => !disabled && onCheckedChange(!checked)}
          cursor={disabled ? 'not-allowed' : 'pointer'}
          userSelect="none"
        >
          {label}
        </Text>
      ) : null}
      <Switch
        size="$2"
        checked={!!checked}
        disabled={disabled}
        onCheckedChange={(val: any) => onCheckedChange(!!val)}
        bw={1}
        bc="$borderColor"
        bg={checked ? '$color10' : '$background'}
        hoverStyle={{ bg: checked ? '$color10' : '$backgroundHover' }}
        focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: 'var(--color10)' }}
      >
        <Switch.Thumb animation="quick" bg="$color12" />
      </Switch>
    </XStack>
  )
}
