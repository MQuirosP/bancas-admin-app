// components/ui/FilterSwitch.tsx
import React from 'react'
import { XStack, Text, Switch } from 'tamagui'

type Props = {
  label: string
  checked: boolean
  onCheckedChange: (val: boolean) => void
}

export default function FilterSwitch({ label, checked, onCheckedChange }: Props) {
  return (
    <XStack ai="center" gap="$2">
      <Text fontSize="$3">{label}</Text>
      <Switch
        size="$2"
        checked={!!checked}
        onCheckedChange={(val) => onCheckedChange(!!val)}
        bw={1}
        bc="$borderColor"
        bg={checked ? '$color10' : '$background'}
        hoverStyle={{ bg: checked ? '$color10' : '$backgroundHover' }}
        focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: 'var(--color10)' }}
      >
        <Switch.Thumb
          animation="quick"
          bg="$color12"
          shadowColor="$shadowColor"
          shadowRadius={6}
          shadowOffset={{ width: 0, height: 2 }}
        />
      </Switch>
    </XStack>
  )
}
