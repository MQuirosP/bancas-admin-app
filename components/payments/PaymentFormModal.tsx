import React, { useState, useMemo } from 'react'
import { YStack, XStack, Text, Card, Dialog, ScrollView } from 'tamagui'
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
  { label: 'Efectivo', value: 'cash' as PaymentMethod },
  { label: 'Cheque', value: 'check' as PaymentMethod },
  { label: 'Transferencia Bancaria', value: 'transfer' as PaymentMethod },
  { label: 'Sinpe Móvil', value: 'system' as PaymentMethod },
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
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [isFinal, setIsFinal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')

  // Calcular totales
  // ✅ v2.0: Usar campos unificados si están disponibles, fallback a cálculo manual
  const totals = useMemo(() => {
    const current = ticketDetails || ticket
    if (!current) return { totalPayout: 0, totalPaid: 0, remaining: 0 }

    console.log('[PaymentFormModal] Calculando totales para ticket:', {
      id: current.id,
      ticketNumber: current.ticketNumber,
      isWinner: current.isWinner,
      totalPayout: current.totalPayout,
      totalPaid: current.totalPaid,
      remainingAmount: current.remainingAmount,
      jugadas: current.jugadas?.length,
      payments: current.payments?.length,
    })

    // ✅ Priorizar campos unificados del backend (v2.0)
    // PERO: Si totalPayout es 0 y el ticket es ganador, usar fallback para calcular
    const hasUnifiedFields = current.totalPayout !== undefined && current.totalPayout !== null
    const shouldUseUnified = hasUnifiedFields && (current.totalPayout > 0 || !current.isWinner)
    
    if (shouldUseUnified) {
      const result = {
        totalPayout: current.totalPayout || 0,
        totalPaid: current.totalPaid || 0,
        remaining: current.remainingAmount || 0,
      }
      console.log('[PaymentFormModal] Usando campos unificados:', result)
      return result
    }

    // Fallback: calcular manualmente (compatibilidad con backend antiguo)
    const totalPayout = (current.jugadas || [])
      .filter((j) => j.isWinner)
      .reduce((sum, j) => sum + (j.payout || j.winAmount || 0), 0)

    const payments = current.payments || []
    const totalPaid = payments
      .filter((p) => !p.isReversed)
      .reduce((sum, p) => sum + p.amountPaid, 0)

    const remaining = totalPayout - totalPaid

    const result = { totalPayout, totalPaid, remaining }
    console.log('[PaymentFormModal] Calculado manualmente (fallback):', result)
    return result
  }, [ticketDetails, ticket])

  // Validaciones
  const errors = useMemo(() => {
    const errs: string[] = []
    const amount = parseFloat(amountPaid) || 0

    // Solo validar si hay monto
    if (amountPaid && amount > 0 && amount > totals.remaining) {
      errs.push(`El monto no puede exceder ${formatCurrency(totals.remaining)}`)
    }

    return errs
  }, [amountPaid, totals.remaining])

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
    setMethod('cash')
    setIsFinal(false)
    setSubmitError('')
    onClose()
  }

  if (!ticket) return null

  const isWinner = ticket.isWinner === true
  const isPaid = totals.remaining <= 0
  const isPartialPayment = parseFloat(amountPaid || '0') < totals.remaining && parseFloat(amountPaid || '0') > 0

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

          {/* Información del tiquete - Grid de celdas mejorado */}
          <Card padding="$3" backgroundColor="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
            <YStack gap="$3">
              {/* Header con badge ganador */}
              <XStack jc="space-between" ai="center">
                <Text fontSize="$3" fontWeight="600">Información del Ticket</Text>
                {isWinner && (
                  <XStack bg="$green4" px="$3" py="$2" br="$3" bw={1} bc="$green8">
                    <Text color="$green11" fontSize="$3" fontWeight="700">GANADOR</Text>
                  </XStack>
                )}
              </XStack>

              {/* Grid de montos - MÁS GRANDE */}
              <XStack gap="$2" jc="space-between" flexWrap="wrap">
                <Card flex={1} minWidth={100} padding="$3" backgroundColor="$green2" ai="center" jc="center" borderRadius="$3">
                  <YStack ai="center" gap="$1">
                    <Text fontSize="$2" color="$green11" fontWeight="600">Total Premio</Text>
                    <Text fontSize="$6" fontWeight="700" color="$green11">
                      {formatCurrency(totals.totalPayout)}
                    </Text>
                  </YStack>
                </Card>
                <Card flex={1} minWidth={100} padding="$3" backgroundColor="$blue2" ai="center" jc="center" borderRadius="$3">
                  <YStack ai="center" gap="$1">
                    <Text fontSize="$2" color="$blue11" fontWeight="600">Ya Pagado</Text>
                    <Text fontSize="$6" fontWeight="700" color="$blue11">
                      {formatCurrency(totals.totalPaid)}
                    </Text>
                  </YStack>
                </Card>
                <Card flex={1} minWidth={100} padding="$3" backgroundColor={totals.remaining > 0 ? '$red2' : '$gray2'} ai="center" jc="center" borderRadius="$3">
                  <YStack ai="center" gap="$1">
                    <Text fontSize="$2" color={totals.remaining > 0 ? '$red11' : '$gray11'} fontWeight="600">Pendiente</Text>
                    <Text fontSize="$6" fontWeight="700" color={totals.remaining > 0 ? '$red11' : '$gray11'}>
                      {formatCurrency(totals.remaining)}
                    </Text>
                  </YStack>
                </Card>
              </XStack>

              {/* Jugadas Ganadoras */}
              {isWinner && ticket.jugadas && ticket.jugadas.length > 0 && (() => {
                const winningJugadas = ticket.jugadas.filter((j: any) => j.isWinner)
                return winningJugadas.length > 0 && (
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$textSecondary">
                      Jugadas Ganadoras ({winningJugadas.length})
                    </Text>
                    <ScrollView maxHeight={200} showsVerticalScrollIndicator={true}>
                      <YStack gap="$2">
                        {winningJugadas.map((jugada: any, idx: number) => (
                          <Card key={jugada.id || idx} padding="$2" backgroundColor="$green1" borderColor="$green8" borderWidth={1} borderRadius="$2">
                            <XStack jc="space-between" ai="center" gap="$2" flexWrap="wrap">
                              <XStack gap="$2" ai="center" flex={1} minWidth={180}>
                                <Text fontSize="$5" fontWeight="700" color="$blue11" fontFamily="$mono">
                                  {jugada.number}
                                </Text>
                                {jugada.type && (
                                  <XStack bg="$blue4" px="$2" py="$1" br="$2">
                                    <Text fontSize="$1" fontWeight="600" color="$blue11">
                                      {jugada.type === 'REVENTADO' ? 'EXTRA' : jugada.type}
                                    </Text>
                                  </XStack>
                                )}
                                <Text fontSize="$2" color="$textSecondary">
                                  Apuesta: {formatCurrency(jugada.amount)}
                                </Text>
                                {jugada.finalMultiplierX && (
                                  <Text fontSize="$2" color="$yellow10" fontWeight="600">
                                    {jugada.finalMultiplierX}x
                                  </Text>
                                )}
                              </XStack>
                              <Text fontSize="$4" fontWeight="700" color="$green11">
                                Premio: {formatCurrency(jugada.payout || jugada.winAmount || 0)}
                              </Text>
                            </XStack>
                          </Card>
                        ))}
                      </YStack>
                    </ScrollView>
                  </YStack>
                )
              })()}
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
                editable={isWinner && totals.totalPayout > 0 && !isPaid}
              />
              {!isWinner && (
                <Text fontSize="$2" color="$gray10">
                  Este ticket no es ganador
                </Text>
              )}
              {isWinner && totals.remaining > 0 && (
                <Text fontSize="$2" color="$gray10">
                  Máximo: {formatCurrency(totals.remaining)}
                </Text>
              )}
              {isWinner && isPaid && (
                <Text fontSize="$2" color="$green10">
                  Este ticket ya está completamente pagado
                </Text>
              )}
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
          </YStack>

          {/* Checkbox para marcar como final (altura fija) */}
          <YStack height={isPartialPayment ? 90 : 90} jc="center" ov="hidden">
            {isPartialPayment && (
              <Card
                padding="$3"
                borderColor="$warning"
                borderWidth={2}
                backgroundColor="$warning1"
                gap="$2"
                animation="quick"
                enterStyle={{ opacity: 0, y: -15 }}
                exitStyle={{ opacity: 0, y: -15 }}
              >
                <XStack ai="center" gap="$2">
                  <Card
                    width={22}
                    height={22}
                    br="$2"
                    bw={2}
                    bc={isFinal ? '$warning10' : '$warning8'}
                    bg={isFinal ? '$warning9' : 'transparent'}
                    ai="center"
                    jc="center"
                    cursor="pointer"
                    onPress={() => setIsFinal(!isFinal)}
                    animation="quick"
                    enterStyle={{ scale: 0.8 }}
                  >
                    {isFinal && <Text fontSize="$3" fontWeight="700" color="white">✓</Text>}
                  </Card>
                  <YStack flex={1}>
                    <Text fontWeight="600" fontSize="$4">Marcar como pago final</Text>
                    <Text fontSize="$2" color="$warning11" fontWeight="500">
                      El cliente acepta no recibir los{' '}
                      {formatCurrency(totals.remaining - parseFloat(amountPaid || '0'))} restantes
                    </Text>
                  </YStack>
                </XStack>
              </Card>
            )}
          </YStack>

          {/* Validación - altura fija */}
          <YStack height={70} jc="center" ov="hidden">
            {errors.some((e) => e.includes('no puede exceder')) && (
              <Card
                padding="$3"
                backgroundColor="$error1"
                borderColor="$error8"
                borderWidth={1}
                animation="quick"
                enterStyle={{ opacity: 0, y: -10 }}
                exitStyle={{ opacity: 0, y: -10 }}
              >
                <Text color="$error" fontSize="$2" fontWeight="600">
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
