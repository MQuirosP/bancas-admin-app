import React, { useState, useMemo } from 'react'
import { YStack, XStack, Text, Card, Dialog } from 'tamagui'
import { Button, Input, Select } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useCreatePaymentMutation } from '@/hooks/useTicketPayments'
import { useTicketDetailsQuery } from '@/hooks/useTicketPayments'
import type { TicketWithPayments, PaymentMethod, CreatePaymentInput } from '@/types/payment.types'
import { formatCurrency } from '@/lib/currency'
import { formatDateTimeYYYYMMDD_HHMM } from '@/lib/dateFormat'
import { formatErrorMessage } from '@/types/error.types'
import { v4 as uuidv4 } from 'uuid'
import DialogContentWrapper from '@/components/tickets/DialogContentWrapper'

interface PaymentFormModalProps {
  isOpen: boolean
  ticket?: TicketWithPayments
  onClose: () => void
  onSuccess: (payment: any) => void
}

const PAYMENT_METHODS: Array<{ label: string; value: PaymentMethod }> = [
  { label: 'Efectivo', value: 'CASH' as PaymentMethod },
  { label: 'Cheque', value: 'CHECK' as PaymentMethod },
  { label: 'Transferencia', value: 'TRANSFER' as PaymentMethod },
  { label: 'Sinpe Móvil', value: 'SINPE' as PaymentMethod },
  { label: 'Sistema', value: 'SYSTEM' as PaymentMethod },
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
  const [submitError, setSubmitError] = useState<string>('')

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
    setSubmitError('')

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
    } catch (error: any) {
      console.error('Payment error:', error)

      // Extract error code from response
      const errorCode = error.response?.data?.error || error.response?.data?.code || 'UNKNOWN'
      const errorMessage = formatErrorMessage(errorCode)

      setSubmitError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setAmountPaid('')
    setMethod('CASH')
    setNotes('')
    setIsFinal(false)
    setSubmitError('')
    onClose()
  }

  if (!ticket) return null

  const isPaid = totals.remaining <= 0
  const isPartialPayment = parseFloat(amountPaid || '0') < totals.remaining

  return (
    <Dialog modal open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="payment-overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <DialogContentWrapper
          key={`payment-content-${ticket?.id}`}
          bordered
          elevate
          width="90%"
          maxWidth={600}
          padding="$4"
          gap="$4"
          backgroundColor="$background"
        >
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

          {/* Información del tiquete - Grid de celdas */}
          <XStack gap="$2" jc="space-between">
            {/* Total Premio */}
            <Card flex={1} padding="$3" backgroundColor="$gray2" ai="center" jc="center" borderRadius="$3">
              <YStack ai="center" gap="$1">
                <Text fontSize="$2" color="$gray10" fontWeight="500">
                  Total Premio
                </Text>
                <Text fontSize="$5" fontWeight="700" color="$blue11">
                  {formatCurrency(totals.totalPayout)}
                </Text>
              </YStack>
            </Card>

            {/* Pagado */}
            <Card flex={1} padding="$3" backgroundColor="$gray2" ai="center" jc="center" borderRadius="$3">
              <YStack ai="center" gap="$1">
                <Text fontSize="$2" color="$gray10" fontWeight="500">
                  Pagado
                </Text>
                <Text fontSize="$5" fontWeight="700" color="$green11">
                  {formatCurrency(totals.totalPaid)}
                </Text>
              </YStack>
            </Card>

            {/* Pendiente */}
            <Card flex={1} padding="$3" backgroundColor="$error1" ai="center" jc="center" borderRadius="$3">
              <YStack ai="center" gap="$1">
                <Text fontSize="$2" color="$error" fontWeight="500">
                  Pendiente
                </Text>
                <Text fontSize="$5" fontWeight="700" color="$error">
                  {formatCurrency(totals.remaining)}
                </Text>
              </YStack>
            </Card>
          </XStack>

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
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Viewport>
                    {PAYMENT_METHODS.map((m, idx) => (
                      <Select.Item key={m.value} value={m.value} index={idx}>
                        <Select.ItemText>{m.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select>
            </YStack>

            {/* Checkbox para marcar como final (siempre reserva espacio con animación) */}
            <YStack minHeight={90} jc="center">
              {isPartialPayment && (
                <Card
                  padding="$2"
                  borderColor="$warning"
                  borderWidth={1}
                  backgroundColor="$warning1"
                  gap="$2"
                  animation="quick"
                  enterStyle={{ opacity: 0, y: -10 }}
                  exitStyle={{ opacity: 0, y: -10 }}
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
                      animation="quick"
                      enterStyle={{ scale: 0.8 }}
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
          </YStack>

          {/* Validación - Solo si supera el pendiente */}
          <YStack minHeight={60} jc="center">
            {errors.some((e) => e.includes('no puede exceder')) && (
              <Card padding="$3" backgroundColor="$error1" gap="$1">
                <Text color="$error" fontSize="$2" fontWeight="500">
                  ⚠️ El monto supera el pendiente
                </Text>
              </Card>
            )}

            {/* Errores de servidor */}
            {submitError && (
              <Card padding="$3" backgroundColor="$error1" gap="$1">
                <Text color="$error" fontSize="$3" fontWeight="600">
                  Error
                </Text>
                <Text color="$error" fontSize="$2">
                  {submitError}
                </Text>
              </Card>
            )}
          </YStack>

          {/* Botones */}
          <XStack gap="$2" jc="flex-end">
            <Button variant="ghost" onPress={handleClose}>
              <Text>Cancelar</Text>
            </Button>
            <Button
              onPress={handleSubmit}
              disabled={!canSubmit}
              backgroundColor="$green4"
              borderColor="$green8"
              borderWidth={1}
              opacity={canSubmit ? 1 : 0.5}
            >
              <Text>Registrar Pago</Text>
            </Button>
          </XStack>
        </YStack>
        </DialogContentWrapper>
      </Dialog.Portal>
    </Dialog>
  )
}
