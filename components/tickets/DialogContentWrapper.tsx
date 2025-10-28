import React from 'react'
import { Dialog } from 'tamagui'

/**
 * Wrapper para Dialog.Content que evita el error TS2590
 * ("Expression produces a union type that is too complex to represent")
 *
 * Dialog.Content de Tamagui tiene tipos genéricos tan complejos que
 * TypeScript no puede inferirlos. Este wrapper usa any para permitir
 * que el componente se pase a través sin que TypeScript explote.
 *
 * Es seguro porque Dialog.Content es un componente controlado de Tamagui.
 */

const DialogContentWrapper = React.forwardRef<any, any>(
  function DialogContentWrapper(props, ref) {
    // @ts-expect-error: Dialog.Content tiene generics demasiado complejos; safe passthrough
    return <Dialog.Content ref={ref} {...props} />
  }
)

DialogContentWrapper.displayName = 'DialogContentWrapper'

export default DialogContentWrapper
