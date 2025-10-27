import React, { useState, useMemo } from 'react'
import { YStack, XStack, Text, Card, Modal } from 'tamagui'
import { Button, Input, Select } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useCreatePaymentMutation } from '@/hooks/useTicketPayments'
import { useTicketDetailsQuery } from '@/hooks/useTicketPayments'
import type { TicketWithPayments, PaymentMethod, CreatePaymentInput } from '@/types/payment.types'
import { formatCurrency } from '@/lib/currency'
import { v4 as uuidv4 } from 'uuid'
import { Role } from '@/types/auth.types'

interface PaymentFormModalProps {
  isOpen: boolean
  ticket?: TicketWithPayments
  onClose: () => void
  onSuccess: (payment: any) => void
}

const PAYMENT_METHODS: Array<{ label: string; value: PaymentMethod }> = [
  { label: 'Efectivo', value: 'CASH' },
  { label: 'Cheque', value: 'CHECK' },
  { label: 'Transferencia', value: 'TRANSFER' },
  { label: 'Sistema', value: 'SYSTEM' },
]

export default function PaymentFormModal({
  isOpen,
  ticket,
  onClose,
  onSuccess,
}: PaymentFormModalProps) {
  const { user } = useAuth()
  const { data: ticketDetails } = useTicketDetailsQuery(ticket?.id)
  const createPaymentMutation = useCreatePaymentMutation()

  const [amountPaid, setAmountPaid] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [notes, setNotes] = useState('')
  const [isFinal, setIsFinal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calcular totales
  const totals = useMemo(() => {
    const current = ticketDetails || ticket
    if (!current) return { totalPayout: 0, totalPaid: 0, remaining: 0 }

    const totalPayout = (current.jugadas || [])
      .filter((j) => j.isWinner)
      .reduce((sum, j) => sum + (j.payout || 0), 0)

    const payments = current.payments || []
    const totalPaid = payments
      .filter((p) => !p.isReversed)
      .reduce((sum, p) => sum + p.amountPaid, 0)

    const remaining = totalPayout - totalPaid

    return { totalPayout, totalPaid, remaining }
  }, [ticketDetails, ticket])

  // Validaciones
  const errors = useMemo(() => {
    const errs: string[] = []
    const amount = parseFloat(amountPaid) || 0

    if (!amountPaid) {
      errs.push('Ingresa el monto')
    } else if (amount <= 0) {
      errs.push('El monto debe ser mayor a 0')
    } else if (amount > totals.remaining) {
      errs.push(`El monto no puede exceder ${formatCurrency(totals.remaining)}`)
    }

    if (!method) {
      errs.push('Selecciona método de pago')
    }

    return errs
  }, [amountPaid, method, totals.remaining])

  const canSubmit = errors.length === 0 && !isSubmitting

  const handleSubmit = async () => {
    if (!canSubmit || !ticket) return

    setIsSubmitting(true)
    try {
      const input: CreatePaymentInput = {
        ticketId: ticket.id,
        amountPaid: parseFloat(amountPaid),
        method,
        notes: notes || undefined,
        idempotencyKey: uuidv4(),
        isFinal,
      }

      const result = await createPaymentMutation.mutateAsync(input)
      onSuccess(result)
      handleClose()
    } catch (error) {
      console.error('Payment error:', error)
      // TODO: mostrar error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setAmountPaid('')
    setMethod('CASH')
    setNotes('')
    setIsFinal(false)
    onClose()
  }

  if (!ticket) return null

  const isPaid = totals.remaining <= 0
  const isPartialPayment = parseFloat(amountPaid || '0') < totals.remaining

  return (
    <Modal visible={isOpen} onOpenChange={handleClose}>
      <Modal.Content maxWidth={600} padding="$4" gap="$4">
        <YStack gap="$4">
          {/* Encabezado */}
          <YStack>
            <Text fontSize="$5" fontWeight="600">
              Registrar Pago
            </Text>
            <Text fontSize="$3" color="$gray10">
              {ticket.ticketNumber}
            </Text>
          </YStack>

          {/* Información del tiquete */}
          <Card padding="$3" backgroundColor="$gray2">
            <YStack gap="$2">
              <XStack jc="space-between">
                <Text color="$gray10">Total Premio</Text>
                <Text fontWeight="600">{formatCurrency(totals.totalPayout)}</Text>
              </XStack>
              <XStack jc="space-between">
                <Text color="$gray10">Pagado</Text>
                <Text fontWeight="600">{formatCurrency(totals.totalPaid)}</Text>
              </XStack>
              <XStack jc="space-between" borderTopWidth={1} borderTopColor="$borderColor" pt="$2">
                <Text color="$gray10" fontWeight="600">
                  Pendiente
                </Text>
                <Text fontWeight="700" fontSize="$5" color="$error">
                  {formatCurrency(totals.remaining)}
                </Text>
              </XStack>
            </YStack>
          </Card>

          {/* Formulario */}
          <YStack gap="$3">
            {/* Monto */}
            <YStack gap="$1">
              <Text fontWeight="500">Monto a Pagar</Text>
              <Input
                placeholder="0.00"
                value={amountPaid}
                onChangeText={setAmountPaid}
                keyboardType="decimal-pad"
                editable={!isPaid}
              />
              <Text fontSize="$2" color="$gray10">
                Máximo: {formatCurrency(totals.remaining)}
              </Text>
            </YStack>

            {/* Método */}
            <YStack gap="$1">
              <Text fontWeight="500">Método de Pago</Text>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                {PAYMENT_METHODS.map((m) => (
                  <Select.Item key={m.value} label={m.label} value={m.value} />
                ))}
              </Select>
            </YStack>

            {/* Notas */}
            <YStack gap="$1">
              <Text fontWeight="500">Notas (opcional)</Text>
              <Input
                placeholder="Agregar observaciones..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </YStack>

            {/* Checkbox para marcar como final (si es pago parcial) */}
            {isPartialPayment && (
              <Card
                padding="$2"
                borderColor="$warning"
                borderWidth={1}
                backgroundColor="$warning1"
                gap="$2"
              >
                <XStack ai="center" gap="$2">
                  <Card
                    width={20}
                    height={20}
                    br="$2"
                    bw={1}
                    bc={isFinal ? '$warning' : '$borderColor'}
                    bg={isFinal ? '$warning' : 'transparent'}
                    ai="center"
                    jc="center"
                    cursor="pointer"
                    onPress={() => setIsFinal(!isFinal)}
                  >
                    {isFinal && <Text fontSize="$2">✓</Text>}
                  </Card>
                  <YStack flex={1}>
                    <Text fontWeight="500">Marcar como pago final</Text>
                    <Text fontSize="$2" color="$gray10">
                      El cliente acepta no recibir los{' '}
                      {formatCurrency(totals.remaining - parseFloat(amountPaid || '0'))} restantes
                    </Text>
                  </YStack>
                </XStack>
              </Card>
            )}
          </YStack>

          {/* Errores */}
          {errors.length > 0 && (
            <Card padding="$3" backgroundColor="$error1" gap="$1">
              {errors.map((error, idx) => (
                <Text key={idx} color="$error" fontSize="$2">
                  • {error}
                </Text>
              ))}
            </Card>
          )}

          {/* Botones */}
          <XStack gap="$2" jc="flex-end">
            <Button variant="ghost" onPress={handleClose}>
              Cancelar
            </Button>
            <Button
              onPress={handleSubmit}
              disabled={!canSubmit}
              theme="green"
              opacity={canSubmit ? 1 : 0.5}
            >
              Registrar Pago
            </Button>
          </XStack>
        </YStack>
      </Modal.Content>
    </Modal>
  )
}
