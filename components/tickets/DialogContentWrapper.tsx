import React from 'react'
import { Dialog, DialogProps } from 'tamagui'

interface DialogContentWrapperProps extends React.PropsWithChildren {
  className?: string
  style?: React.CSSProperties
  [key: string]: any
}

/**
 * Wrapper para Dialog.Content que resuelve el error TS2590
 * ("Expression produces a union type that is too complex to represent")
 *
 * Este error ocurre porque Dialog.Content de Tamagui tiene tipos genéricos
 * demasiado complejos para que TypeScript pueda inferir correctamente.
 *
 * Al envolver en este componente, reducimos la complejidad de tipos.
 */
const DialogContentWrapper = React.forwardRef<HTMLDivElement, DialogContentWrapperProps>(
  ({ children, ...props }, ref) => {
    return (
      <Dialog.Content ref={ref} {...props}>
        {children}
      </Dialog.Content>
    )
  }
)

DialogContentWrapper.displayName = 'DialogContentWrapper'

export default DialogContentWrapper
