import React from 'react'
import { Input as TInput } from 'tamagui'

export type UIInputProps = React.ComponentProps<typeof TInput> & {
  error?: boolean
}

export const Input: React.FC<UIInputProps> = ({ error, focusStyle, ...rest }) => {
  const fs = focusStyle ?? {
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: '$outlineColor',
  }
  return (
    <TInput
      bw={1}
      bc={error ? '$red8' : '$borderColor'}
      backgroundColor="$background"
      focusStyle={fs}
      {...rest}
    />
  )
}

export default Input
