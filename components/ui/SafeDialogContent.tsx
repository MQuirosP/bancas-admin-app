// components/ui/SafeDialogContent.tsx
import React from 'react'
import { Dialog } from 'tamagui'

// NO derives tipos desde Dialog.Content para evitar TS2590.
type Props = {
  animation?: readonly unknown[] | string | any
  enterStyle?: any
  exitStyle?: any
  children?: React.ReactNode
} & Record<string, any>

const ContentAny = (Dialog as any).Content as React.ComponentType<any>

const SafeDialogContent = React.forwardRef<any, Props>(
  ({ animation, enterStyle, exitStyle, ...rest }, ref) => {
    return (
      <ContentAny
        ref={ref as any}               // ⬅️ ref en any para cortar la unión
        animation={animation as any}   // ⬅️ casts centralizados
        enterStyle={enterStyle as any}
        exitStyle={exitStyle as any}
        {...(rest as any)}
      />
    )
  }
)

SafeDialogContent.displayName = 'SafeDialogContent'
export default SafeDialogContent
