import React from 'react'
import { YStack, XStack, Text, Card, Modal } from 'tamagui'
import { Button } from '@/components/ui'
import type { TicketPayment } from '@/types/payment.types'
import { formatCurrency } from '@/lib/currency'

interface PaymentConfirmationModalProps {
  isOpen: boolean
  payment?: TicketPayment
  ticketNumber?: string
  onClose: () => void
  onPrintReceipt?: () => void
  onRegisterAnother?: () => void
}

export default function PaymentConfirmationModal({
  isOpen,
  payment,
  ticketNumber,
  onClose,
  onPrintReceipt,
  onRegisterAnother,
}: PaymentConfirmationModalProps) {
  if (!payment) return null

  const date = new Date(payment.paymentDate)
  const isPartial = payment.isPartial
  const isFinal = payment.isFinal

  return (
    <Modal visible={isOpen} onOpenChange={onClose}>
      <Modal.Content maxWidth={500} padding="$4" gap="$4">
        <YStack gap="$4" ai="center">
          {/* Icono de éxito */}
          <Card
            width={60}
            height={60}
            br="$4"
            bg="$green10"
            ai="center"
            jc="center"
          >
            <Text fontSize="$8" color="$background">
              ✓
            </Text>
          </Card>

          {/* Encabezado */}
          <YStack ai="center" gap="$1">
            <Text fontSize="$5" fontWeight="700">
              Pago Registrado
            </Text>
            <Text fontSize="$3" color="$gray10">
              Transacción completada exitosamente
            </Text>
          </YStack>

          {/* Detalles del pago */}
          <Card width="100%" padding="$4" backgroundColor="$gray2" gap="$3">
            {/* ID de pago */}
            <YStack gap="$1">
              <Text fontSize="$2" color="$gray10">
                ID de Pago
              </Text>
              <Text fontFamily="monospace" fontSize="$3">
                {payment.id.slice(0, 8)}...
              </Text>
            </YStack>

            <Card height={1} backgroundColor="$borderColor" />

            {/* Tiquete */}
            {ticketNumber && (
              <>
                <XStack jc="space-between">
                  <Text color="$gray10">Tiquete</Text>
                  <Text fontWeight="600">{ticketNumber}</Text>
                </XStack>
              </>
            )}

            {/* Monto */}
            <XStack jc="space-between">
              <Text color="$gray10">Monto Pagado</Text>
              <Text fontWeight="600" fontSize="$4">
                {formatCurrency(payment.amountPaid)}
              </Text>
            </XStack>

            {/* Método */}
            <XStack jc="space-between">
              <Text color="$gray10">Método</Text>
              <Text fontWeight="600">{payment.method || 'No especificado'}</Text>
            </XStack>

            {/* Fecha y hora */}
            <XStack jc="space-between">
              <Text color="$gray10">Fecha y Hora</Text>
              <Text fontWeight="600">
                {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </XStack>

            {/* Estado del pago */}
            {isPartial && (
              <>
                <Card height={1} backgroundColor="$borderColor" />
                <XStack gap="$2" ai="center" backgroundColor="$warning1" padding="$2" br="$2">
                  <Text fontSize="$2" color="$warning">
                    ⚠
                  </Text>
                  <YStack flex={1} gap="$1">
                    <Text fontSize="$2" fontWeight="600">
                      Pago Parcial
                    </Text>
                    <Text fontSize="$2" color="$gray10">
                      Pendiente: {formatCurrency(payment.remainingAmount || 0)}
                    </Text>
                    {isFinal && (
                      <Text fontSize="$2" color="$warning" fontWeight="500">
                        Marcado como pago final
                      </Text>
                    )}
                  </YStack>
                </XStack>
              </>
            )}

            {!isPartial && (
              <>
                <Card height={1} backgroundColor="$borderColor" />
                <XStack gap="$2" ai="center" backgroundColor="$green1" padding="$2" br="$2">
                  <Text fontSize="$2" color="$green10">
                    ✓
                  </Text>
                  <Text fontSize="$2" fontWeight="600" color="$green10">
                    Pago Completo
                  </Text>
                </XStack>
              </>
            )}
          </Card>

          {/* Próximos pasos */}
          <Card width="100%" padding="$3" backgroundColor="$blue1" br="$2">
            <YStack gap="$2">
              <Text fontWeight="600" fontSize="$3">
                Próximos pasos
              </Text>
              <YStack gap="$1" paddingLeft="$2">
                <Text fontSize="$2">
                  1. Entregar comprobante al cliente
                </Text>
                <Text fontSize="$2">
                  2. Registrar en libro de pagos
                </Text>
                {!isPartial && (
                  <Text fontSize="$2">
                    3. Archivo cerrado - fin de ciclo
                  </Text>
                )}
                {isPartial && !isFinal && (
                  <Text fontSize="$2">
                    3. Pendiente de siguiente pago
                  </Text>
                )}
              </YStack>
            </YStack>
          </Card>

          {/* Botones de acción */}
          <XStack gap="$2" width="100%" flexWrap="wrap" jc="center">
            <Button
              onPress={onPrintReceipt}
              variant="ghost"
              flex={1}
              minWidth={120}
            >
              Imprimir
            </Button>
            {onRegisterAnother && (
              <Button
                onPress={onRegisterAnother}
                theme="blue"
                flex={1}
                minWidth={120}
              >
                Registrar Otro
              </Button>
            )}
            <Button
              onPress={onClose}
              theme="green"
              flex={1}
              minWidth={120}
            >
              Cerrar
            </Button>
          </XStack>
        </YStack>
      </Modal.Content>
    </Modal>
  )
}
