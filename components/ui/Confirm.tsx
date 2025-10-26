// components/ui/Confirm.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Modal, Pressable } from 'react-native'
import { YStack, XStack, Card, Text } from 'tamagui'
import { Button } from './Button'

export type ConfirmOptions = {
  title?: string
  description?: string
  okText?: string
  cancelText?: string
}

type Resolver = (v: boolean) => void

/**
 * Hook imperativo para confirmaciones sin Tamagui.Dialog.
 * Uso:
 *   const { confirm, ConfirmRoot } = useConfirm()
 *   const ok = await confirm({ title, description, okText, cancelText })
 *   return (<><Pantalla /> <ConfirmRoot/></>)
 */
export function useConfirm() {
  const [visible, setVisible] = useState(false)
  const [opts, setOpts] = useState<ConfirmOptions>({
    title: 'Confirmar',
    description: '¿Estás seguro?',
    okText: 'Aceptar',
    cancelText: 'Cancelar',
  })
  const resolverRef = useRef<Resolver | null>(null)

  const confirm = useCallback((o: ConfirmOptions = {}) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
      setOpts((prev) => ({
        title: o.title ?? prev.title,
        description: o.description ?? prev.description,
        okText: o.okText ?? prev.okText,
        cancelText: o.cancelText ?? prev.cancelText,
      }))
      setVisible(true)
    })
  }, [])

  const resolveAndClose = useCallback((result: boolean) => {
    setVisible(false)
    if (resolverRef.current) {
      resolverRef.current(result)
      resolverRef.current = null
    }
  }, [])

  const ConfirmRoot = useMemo(() => {
    const C: React.FC = () => (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => resolveAndClose(false)}>
        {/* Overlay */}
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => resolveAndClose(false)}>
          {/* Centered card */}
          <YStack f={1} jc="center" ai="center" padding="$4">
            <Card
              bordered
              elevate
              backgroundColor="$background"
              borderColor="$borderColor"
              padding="$4"
              width="100%"
              maxWidth={520}
              onPress={(e: any) => e?.stopPropagation?.()}
            >
              <YStack gap="$3">
                {!!opts.title && <Text fontWeight="700" fontSize="$6">{opts.title}</Text>}
                {!!opts.description && (
                  <Text fontSize="$3" color="$textSecondary">
                    {opts.description}
                  </Text>
                )}

                <XStack gap="$2" jc="flex-end" mt="$2" flexWrap="wrap">
                  <Button onPress={() => resolveAndClose(false)}>
                    {opts.cancelText}
                  </Button>
                  <Button onPress={() => resolveAndClose(true)}>
                    {opts.okText}
                  </Button>
                </XStack>
              </YStack>
            </Card>
          </YStack>
        </Pressable>
      </Modal>
    )
    return C
  }, [visible, opts, resolveAndClose])

  return { confirm, ConfirmRoot }
}
