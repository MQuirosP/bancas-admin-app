import React, { useState, useMemo } from 'react'
import { YStack, XStack, Text, Dialog, Spinner, VisuallyHidden, TextArea } from 'tamagui'
import { Button, Input, Select, Card } from '@/components/ui'
import { X, Check, ChevronDown } from '@tamagui/lucide-icons'
import { formatCurrency } from '@/utils/formatters'
import { v4 as uuidv4 } from 'uuid'
import { useToast } from '@/hooks/useToast'
import type { PaymentMethod, CreatePaymentInput } from '@/types/payment.types'

export type TicketForPayment = {
  id: string
  ticketNumber?: string
  status: string
  jugadas?: any[]
  payments?: any[]
  [key: string]: any
}

interface TicketPaymentModalProps {
  isOpen: boolean
  ticket?: TicketForPayment | null
  onClose: () => void
  onSubmit?: (input: CreatePaymentInput) => Promise<void>
  isLoading?: boolean
}

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: 'Efectivo', value: 'CASH' },
  { label: 'Cheque', value: 'CHECK' },
  { label: 'Transferencia', value: 'TRANSFER' },
  { label: 'Sistema', value: 'SYSTEM' },
]

/**
 * Modal simplificado para registrar pago de un tiquete
 * Usado en listas de tiquetes (admin, ventana, vendedor)
 */
const TicketPaymentModalComponent = ({
  isOpen,
  ticket,
  onClose,
  onSubmit,
  isLoading,
}: TicketPaymentModalProps) => {
  const { success, error: showError } = useToast()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [notes, setNotes] = useState('')
  const [isFinal, setIsFinal] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Default isLoading to false if not provided
  const loading = isLoading ?? false

  // Calcular payout pendiente
  const paymentInfo = useMemo(() => {
    if (!ticket) return { totalPayout: 0, totalPaid: 0, remaining: 0, hasWinner: false }

    const jugadas = ticket.jugadas || []
    const totalPayout = jugadas
      .filter((j: any) => j.isWinner)
      .reduce((sum: number, j: any) => sum + (j.payout || j.winAmount || 0), 0)

    const payments = ticket.payments || []
    const totalPaid = payments
      .filter((p: any) => !p.isReversed)
      .reduce((sum: number, p: any) => sum + p.amountPaid, 0)

    const remaining = totalPayout - totalPaid
    const hasWinner = jugadas.some((j: any) => j.isWinner === true)

    return { totalPayout, totalPaid, remaining, hasWinner }
  }, [ticket])

  // Validar
  const validate = () => {
    const newErrors: string[] = []

    if (!amount || isNaN(parseFloat(amount))) {
      newErrors.push('Debes ingresar un monto válido')
    } else {
      const amountNum = parseFloat(amount)
      if (amountNum <= 0) {
        newErrors.push('El monto debe ser mayor a 0')
      }
      if (amountNum > paymentInfo.remaining) {
        newErrors.push(`El monto no puede exceder ${formatCurrency(paymentInfo.remaining)}`)
      }
    }

    if (!method) {
      newErrors.push('Selecciona un método de pago')
    }

    if (paymentInfo.remaining === 0) {
      newErrors.push('Este tiquete ya está totalmente pagado')
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  // Submit
  const handleSubmit = async () => {
    if (!validate() || !ticket || !onSubmit) return

    try {
      const input: CreatePaymentInput = {
        ticketId: ticket.id,
        amountPaid: parseFloat(amount),
        method,
        notes: notes || undefined,
        idempotencyKey: uuidv4(),
        isFinal: isFinal && parseFloat(amount) < paymentInfo.remaining,
      }

      await onSubmit(input)

      // Mostrar toast de éxito
      success(`Pago de ${formatCurrency(parseFloat(amount))} registrado correctamente`)

      // Limpiar
      setAmount('')
      setMethod('CASH')
      setNotes('')
      setIsFinal(false)
      setErrors([])
      onClose()
    } catch (err: any) {
      const errorMsg = err.message || 'Error al registrar pago'
      showError(errorMsg)
      setErrors([errorMsg])
    }
  }

  if (!ticket) return null

  const amountNum = amount ? parseFloat(amount) : 0
  const isPartialPayment = amountNum > 0 && amountNum < paymentInfo.remaining

  return (
    <Dialog modal open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="payment-overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          key={`payment-content-${ticket?.id ?? ticket?.ticketNumber ?? 'temp'}`}
          bordered
          elevate
          width="90%"
          maxWidth={500}
          padding="$4"
          gap="$4"
          backgroundColor="$background"
        >
          {/* Accessible Title - Hidden visually */}
          <Dialog.Title asChild>
            <VisuallyHidden>
              <Text>Registrar Pago</Text>
            </VisuallyHidden>
          </Dialog.Title>

          {/* Header */}
          <XStack jc="space-between" ai="center" gap="$2">
            <Text fontSize="$6" fontWeight="bold">
              Registrar Pago
            </Text>
            <Button
              size="$2"
              circular
              icon={X}
              backgroundColor="transparent"
              borderWidth={0}
              onPress={onClose}
              hoverStyle={{ backgroundColor: '$backgroundHover' }}
            />
          </XStack>

          {/* Info del tiquete */}
          <Card padding="$3" backgroundColor="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600">
                Tiquete #{ticket.ticketNumber || ticket.id.slice(-8)}
              </Text>
              <XStack gap="$4" jc="space-between" flexWrap="wrap">
                <YStack gap="$1">
                  <Text fontSize="$2" color="$textSecondary" fontWeight="600">
                    Total Premio
                  </Text>
                  <Text fontSize="$4" fontWeight="700" color="$green11">
                    {formatCurrency(paymentInfo.totalPayout)}
                  </Text>
                </YStack>
                <YStack gap="$1">
                  <Text fontSize="$2" color="$textSecondary" fontWeight="600">
                    Ya Pagado
                  </Text>
                  <Text fontSize="$4" fontWeight="700" color="$blue11">
                    {formatCurrency(paymentInfo.totalPaid)}
                  </Text>
                </YStack>
                <YStack gap="$1">
                  <Text fontSize="$2" color="$textSecondary" fontWeight="600">
                    Pendiente
                  </Text>
                  <Text
                    fontSize="$4"
                    fontWeight="700"
                    color={paymentInfo.remaining > 0 ? '$red11' : '$gray11'}
                  >
                    {formatCurrency(paymentInfo.remaining)}
                  </Text>
                </YStack>
              </XStack>
            </YStack>
          </Card>


          {/* Formulario */}
          <YStack gap="$3">
            {/* Monto a pagar */}
            <YStack gap="$1">
              <Text fontSize="$3" fontWeight="600">
                Monto a Pagar
              </Text>
              <Input
                placeholder={`Máximo: ${formatCurrency(paymentInfo.remaining)}`}
                value={amount}
                onChangeText={setAmount}
                inputMode="decimal"
                disabled={paymentInfo.remaining <= 0 || loading}
              />
              {amount && amountNum > 0 && amountNum <= paymentInfo.remaining && (
                <Text fontSize="$2" color="$green11">
                  ✓ Monto válido
                </Text>
              )}
            </YStack>

            {/* Método de pago */}
            <YStack gap="$1">
              <Text fontSize="$3" fontWeight="600">
                Método de Pago
              </Text>
              <Select
                value={method}
                onValueChange={(v: any) => setMethod(v)}
                disabled={loading}
              >
                <Select.Trigger
                  width="100%"
                  br="$3"
                  bw={1}
                  bc="$borderColor"
                  backgroundColor="$background"
                  px="$3"
                  py="$2"
                  hoverStyle={{ bg: '$backgroundHover' }}
                  focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
                  iconAfter={ChevronDown}
                >
                  <Select.Value>{PAYMENT_METHODS.find((m) => m.value === method)?.label}</Select.Value>
                </Select.Trigger>

                <Select.Content zIndex={1000}>
                  <YStack br="$3" bw={1} bc="$borderColor" backgroundColor="$background">
                    <Select.Viewport>
                      {PAYMENT_METHODS.map((m, idx) => (
                        <Select.Item
                          key={m.value}
                          value={m.value}
                          index={idx}
                          pressStyle={{ bg: '$backgroundHover' }}
                          bw={0}
                          px="$3"
                        >
                          <Select.ItemText>{m.label}</Select.ItemText>
                          <Select.ItemIndicator ml="auto">
                            <Check size={16} />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </YStack>
                </Select.Content>
              </Select>
            </YStack>

            {/* Notas */}
            <YStack gap="$1">
              <Text fontSize="$3" fontWeight="600">
                Notas (Opcional)
              </Text>
              <TextArea
                placeholder="Observaciones sobre el pago..."
                value={notes}
                onChangeText={setNotes}
                disabled={loading}
                minHeight={60}
              />
            </YStack>

            {/* Pago Final - solo si es parcial */}
            {isPartialPayment && (
              <Card
                padding="$3"
                backgroundColor="$yellow2"
                borderColor="$yellow8"
                borderWidth={1}
                gap="$2"
              >
                <XStack ai="center" gap="$2">
                  <Input
                    type="checkbox"
                    checked={isFinal}
                    onCheckedChange={(checked) => setIsFinal(checked as boolean)}
                    disabled={loading}
                    width={20}
                    height={20}
                  />
                  <Text fontSize="$2" color="$yellow11" flex={1}>
                    Marcar como pago final (cliente acepta no recibir el resto: {formatCurrency(paymentInfo.remaining - amountNum)})
                  </Text>
                </XStack>
              </Card>
            )}
          </YStack>

          {/* Botones */}
          <XStack gap="$2" jc="flex-end">
            <Button
              size="$3"
              variant="secondary"
              onPress={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              size="$3"
              onPress={handleSubmit}
              disabled={
                loading ||
                !amount ||
                !method ||
                paymentInfo.remaining <= 0 ||
                isNaN(parseFloat(amount))
              }
              backgroundColor="$green4"
              borderColor="$green8"
              borderWidth={1}
              pressStyle={{ backgroundColor: '$green6', scale: 0.98 }}
            >
              {loading ? <Spinner size="small" /> : 'Registrar Pago'}
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default TicketPaymentModalComponent
