import React from 'react'
import { Modal as RNModal, Pressable } from 'react-native'
import { YStack, Card } from 'tamagui'

export type ModalProps = {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

export const Modal: React.FC<ModalProps> = ({ visible, onClose, children }) => (
  <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose}>
      <YStack f={1} jc="center" ai="center" p="$4">
        <Card
          bordered
          elevate
          bg="$background"
          bc="$borderColor"
          p="$4"
          w="100%"
          maw={560}
          onPress={(e: any) => e?.stopPropagation?.()}
        >
          {children}
        </Card>
      </YStack>
    </Pressable>
  </RNModal>
)

export default Modal
