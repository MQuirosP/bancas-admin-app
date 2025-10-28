import React, { useMemo } from 'react'
import { YStack, XStack, Text, Card, ScrollView, Modal } from 'tamagui'
import { Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useTicketQuery } from '@/hooks/useTickets'
import { useReversePaymentMutation } from '@/hooks/useTicketPayments'
import type { PaymentHistoryEntry } from '@/types/api.types'
import { formatCurrency } from '@/lib/currency'
import { Role } from '@/types/auth.types'

interface PaymentHistoryModalProps {
  isOpen: boolean
  ticketId?: string
  onClose: () => void
}

export default function PaymentHistoryModal({
  isOpen,
  ticketId,
  onClose,
}: PaymentHistoryModalProps) {
  const { user } = useAuth()
  // ✅ v2.0: Obtener ticket completo con paymentHistory embebido
  const { data: ticket, isLoading } = useTicketQuery(ticketId || '', !!ticketId)
  const reversePaymentMutation = useReversePaymentMutation()

  const handleReverse = async () => {
    if (!ticketId) return
    if (confirm('¿Revertir el último pago?')) {
      try {
        await reversePaymentMutation.mutateAsync({ ticketId, reason: 'Reversión desde modal' })
        // Toast success
      } catch (error) {
        console.error('Reverse error:', error)
        // Toast error
      }
    }
  }

  // ✅ v2.0: Usar paymentHistory del ticket unificado
  const payments = useMemo(() => {
    return ticket?.paymentHistory || []
  }, [ticket])

  const activePayments = payments.filter((p) => !p.isReversed)
  const reversedPayments = payments.filter((p) => p.isReversed)

  const totalPaid = activePayments.reduce((sum, p) => sum + p.amountPaid, 0)
  const totalReversed = reversedPayments.reduce((sum, p) => sum + p.amountPaid, 0)

  return (
    <Modal visible={isOpen} onOpenChange={onClose}>
      <Modal.Content maxWidth={700} padding="$4" gap="$4">
        <YStack gap="$4" flex={1} maxHeight="80vh">
          {/* Encabezado */}
          <YStack>
            <Text fontSize="$5" fontWeight="600">
              Historial de Pagos
            </Text>
            <Text fontSize="$3" color="$gray10">
              Tiquete {ticketId}
            </Text>
          </YStack>

          {/* Resumen */}
          <XStack gap="$2">
            <Card flex={1} padding="$3" backgroundColor="$gray2">
              <YStack gap="$1">
                <Text fontSize="$2" color="$gray10">
                  Pagado
                </Text>
                <Text fontWeight="600" fontSize="$4" color="$green10">
                  {formatCurrency(totalPaid)}
                </Text>
              </YStack>
            </Card>
            {totalReversed > 0 && (
              <Card flex={1} padding="$3" backgroundColor="$red1">
                <YStack gap="$1">
                  <Text fontSize="$2" color="$gray10">
                    Revertido
                  </Text>
                  <Text fontWeight="600" fontSize="$4" color="$error">
                    {formatCurrency(totalReversed)}
                  </Text>
                </YStack>
              </Card>
            )}
          </XStack>

          {/* Lista de pagos */}
          <ScrollView flex={1}>
            <YStack gap="$2">
              {isLoading ? (
                <Card padding="$4" backgroundColor="$gray2">
                  <Text ta="center">Cargando historial...</Text>
                </Card>
              ) : activePayments.length === 0 && reversedPayments.length === 0 ? (
                <Card padding="$4" backgroundColor="$gray2">
                  <Text ta="center" color="$gray10">
                    Sin registros de pago
                  </Text>
                </Card>
              ) : (
                <>
                  {/* Pagos activos */}
                  {activePayments.length > 0 && (
                    <YStack gap="$2">
                      <Text fontWeight="600" fontSize="$3">
                        Pagos Activos
                      </Text>
                      {activePayments.map((payment) => (
                        <PaymentRow
                          key={payment.id}
                          payment={payment}
                          canReverse={user?.role === Role.ADMIN}
                          onReverse={handleReverse}
                        />
                      ))}
                    </YStack>
                  )}

                  {/* Pagos revertidos */}
                  {reversedPayments.length > 0 && (
                    <YStack gap="$2">
                      <Text fontWeight="600" fontSize="$3" color="$gray10">
                        Pagos Revertidos
                      </Text>
                      {reversedPayments.map((payment) => (
                        <PaymentRow key={payment.id} payment={payment} isReversed />
                      ))}
                    </YStack>
                  )}
                </>
              )}
            </YStack>
          </ScrollView>

          {/* Botón cerrar */}
          <Button onPress={onClose} variant="ghost">
            Cerrar
          </Button>
        </YStack>
      </Modal.Content>
    </Modal>
  )
}

interface PaymentRowProps {
  payment: PaymentHistoryEntry
  isReversed?: boolean
  canReverse?: boolean
  onReverse?: () => void
}

function PaymentRow({ payment, isReversed = false, canReverse = false, onReverse }: PaymentRowProps) {
  // ✅ v2.0: PaymentHistoryEntry usa 'paidAt' en vez de 'paymentDate'
  const date = new Date(payment.paidAt)
  const reversedDate = payment.reversedAt ? new Date(payment.reversedAt) : null

  return (
    <Card
      padding="$3"
      borderColor={isReversed ? '$error' : '$borderColor'}
      backgroundColor={isReversed ? '$error1' : '$background'}
      borderWidth={1}
    >
      <XStack ai="flex-start" jc="space-between" gap="$3">
        {/* Información */}
        <YStack flex={1} gap="$2">
          <XStack jc="space-between" ai="center">
            <YStack gap="$1" flex={1}>
              <Text fontWeight="600" fontSize="$4">
                {formatCurrency(payment.amountPaid)}
              </Text>
              <Text fontSize="$2" color="$gray10">
                {payment.method || 'Sin método'} • {payment.paidByName || 'Usuario desconocido'}
              </Text>
            </YStack>

            <YStack ai="flex-end" gap="$1">
              <Text fontSize="$2" color="$gray10">
                {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>

              {isReversed && reversedDate && (
                <Text fontSize="$2" color="$error">
                  Revertido: {reversedDate.toLocaleDateString()}
                </Text>
              )}

              {payment.isFinal && (
                <Text fontSize="$2" color="$warning">
                  Pago Final
                </Text>
              )}
            </YStack>
          </XStack>

          {/* Notas */}
          {payment.notes && (
            <Text fontSize="$2" color="$gray10" fontStyle="italic">
              "{payment.notes}"
            </Text>
          )}

          {/* Detalles de reversión */}
          {isReversed && payment.reversedBy && (
            <Text fontSize="$2" color="$error">
              Revertido por: {payment.reversedBy}
            </Text>
          )}
        </YStack>

        {/* Botones */}
        {canReverse && !isReversed && (
          <Button
            size="$2"
            variant="ghost"
            onPress={onReverse}
            color="$error"
          >
            Revertir Último
          </Button>
        )}
      </XStack>
    </Card>
  )
}
