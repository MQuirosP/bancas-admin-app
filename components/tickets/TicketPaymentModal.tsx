import React, { useState, useMemo } from 'react'
import { YStack, XStack, Text, Dialog, Spinner, VisuallyHidden, ScrollView } from 'tamagui'
import { Button, Input, Select, Card } from '@/components/ui'
import { X, Check, ChevronDown } from '@tamagui/lucide-icons'
import { formatCurrency } from '@/utils/formatters'
import { v4 as uuidv4 } from 'uuid'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import type { PaymentMethod, CreatePaymentInput } from '@/types/payment.types'
import DialogContentWrapper from './DialogContentWrapper'

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
  { label: 'Efectivo', value: 'cash' },
  { label: 'Cheque', value: 'check' },
  { label: 'Transferencia', value: 'transfer' },
  { label: 'Sinpe Móvil', value: 'system' },
]

/**
 * Modal simplificado para registrar pago de un tiquete
 * Usado en listas de tiquetes (admin, ventana, vendedor)
 */
const TicketPaymentModal = ({
  isOpen,
  ticket,
  onClose,
  onSubmit,
  isLoading,
}: TicketPaymentModalProps) => {
  const { success, error: showError } = useToast()
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [isFinal, setIsFinal] = useState(false)

  // Default isLoading to false if not provided
  const loading = isLoading ?? false

  // Calcular payout pendiente
  // ✅ v2.0: Usar campos unificados si están disponibles, fallback a cálculo manual
  const paymentInfo = useMemo(() => {
    if (!ticket) return { totalPayout: 0, totalPaid: 0, remaining: 0, hasWinner: false }

    // ✅ Priorizar campos unificados del backend (v2.0)
    if (ticket.totalPayout !== undefined && ticket.totalPayout !== null) {
      return {
        totalPayout: ticket.totalPayout || 0,
        totalPaid: ticket.totalPaid || 0,
        remaining: ticket.remainingAmount || 0,
        hasWinner: ticket.isWinner || false,
      }
    }

    // Fallback: calcular manualmente (compatibilidad con backend antiguo)
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
    if (!amount || isNaN(parseFloat(amount))) {
      return false
    }

    const amountNum = parseFloat(amount)
    if (amountNum <= 0) {
      return false
    }
    if (amountNum > paymentInfo.remaining) {
      return false
    }
    if (!method) {
      return false
    }
    if (paymentInfo.remaining === 0) {
      return false
    }

    return true
  }

  // Submit
  const handleSubmit = async () => {
    if (!validate() || !ticket || !onSubmit) return

    try {
      const input: CreatePaymentInput = {
        ticketId: ticket.id,
        amountPaid: parseFloat(amount),
        method,
        idempotencyKey: uuidv4(),
        isFinal: isFinal && parseFloat(amount) < paymentInfo.remaining,
        ...(user?.ventanaId && { ventanaId: user.ventanaId }),
      }

      await onSubmit(input)

      // Mostrar toast de éxito
      success(`Pago de ${formatCurrency(parseFloat(amount))} registrado correctamente`)

      // Limpiar
      setAmount('')
      setMethod('cash')
      setIsFinal(false)
      onClose()
    } catch (err: any) {
      const errorMsg = err.message || 'Error al registrar pago'
      showError(errorMsg)
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
        <DialogContentWrapper
          key={`payment-content-${ticket?.id ?? ticket?.ticketNumber ?? 'temp'}`}
          bordered
          elevate
          width="90%"
          maxWidth={600}
          padding="$4"
          gap="$4"
          backgroundColor="$background"
          maxHeight="90vh"
        >
          {/* Accessible Title */}
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

          {/* Content */}
          <YStack gap="$3" flex={1} overflow="unset">
            {/* Info del tiquete */}
            <Card padding="$3" backgroundColor="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
              <YStack gap="$3">
                {/* Header con # de ticket */}
                <XStack jc="space-between" ai="center">
                  <YStack gap="$1">
                    <Text fontSize="$2" color="$textSecondary" fontWeight="600">
                      Tiquete
                    </Text>
                    <Text fontSize="$5" fontWeight="700">
                      #{ticket.ticketNumber || ticket.id.slice(-8)}
                    </Text>
                  </YStack>
                  {paymentInfo.hasWinner && (
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
                        {formatCurrency(paymentInfo.totalPayout)}
                      </Text>
                    </YStack>
                  </Card>
                  <Card flex={1} minWidth={100} padding="$3" backgroundColor="$blue2" ai="center" jc="center" borderRadius="$3">
                    <YStack ai="center" gap="$1">
                      <Text fontSize="$2" color="$blue11" fontWeight="600">Ya Pagado</Text>
                      <Text fontSize="$6" fontWeight="700" color="$blue11">
                        {formatCurrency(paymentInfo.totalPaid)}
                      </Text>
                    </YStack>
                  </Card>
                  <Card flex={1} minWidth={100} padding="$3" backgroundColor={paymentInfo.remaining > 0 ? '$red2' : '$gray2'} ai="center" jc="center" borderRadius="$3">
                    <YStack ai="center" gap="$1">
                      <Text fontSize="$2" color={paymentInfo.remaining > 0 ? '$red11' : '$gray11'} fontWeight="600">Pendiente</Text>
                      <Text fontSize="$6" fontWeight="700" color={paymentInfo.remaining > 0 ? '$red11' : '$gray11'}>
                        {formatCurrency(paymentInfo.remaining)}
                      </Text>
                    </YStack>
                  </Card>
                </XStack>

                {/* Jugadas Ganadoras */}
                {paymentInfo.hasWinner && ticket.jugadas && ticket.jugadas.length > 0 && (() => {
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
                  disabled={!paymentInfo.hasWinner || paymentInfo.totalPayout <= 0 || loading}
                />
                {/* Validación - altura fija para no redimensionar */}
                <YStack height={24} jc="center" ov="hidden">
                  {Boolean(amount) && amountNum > paymentInfo.remaining && (
                    <Text fontSize="$2" color="$red11" animation="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }}>
                      El monto supera el pendiente
                    </Text>
                  )}
                  {!paymentInfo.hasWinner && (
                    <Text fontSize="$2" color="$gray10" animation="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }}>
                      Este ticket no es ganador
                    </Text>
                  )}
                  {paymentInfo.hasWinner && paymentInfo.remaining <= 0 && (
                    <Text fontSize="$2" color="$green10" animation="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }}>
                      Este ticket ya está completamente pagado
                    </Text>
                  )}
                </YStack>
              </YStack>

              {/* Método de pago */}
              <YStack gap="$1">
                <Text fontSize="$3" fontWeight="600">
                  Método de Pago
                </Text>
                <Select
                  value={method}
                  onValueChange={(v: any) => setMethod(v)}
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
                    opacity={loading ? 0.5 : 1}
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

              {/* Pago Final - altura fija para no redimensionar */}
              <YStack height={isPartialPayment ? 115 : 115} jc="center" ov="hidden">
                {isPartialPayment && (
                  <Card
                    padding="$3"
                    backgroundColor="$yellow2"
                    borderColor="$yellow8"
                    borderWidth={1}
                    animation="quick"
                    enterStyle={{ opacity: 0, y: -15 }}
                    exitStyle={{ opacity: 0, y: -15 }}
                  >
                    <XStack ai="flex-start" gap="$2">
                      <Card
                        width={22}
                        height={22}
                        borderWidth={2}
                        borderColor={isFinal ? '$yellow11' : '$yellow8'}
                        bg={isFinal ? '$yellow9' : 'transparent'}
                        br="$2"
                        ai="center"
                        jc="center"
                        opacity={loading ? 0.5 : 1}
                        onPress={() => !loading && setIsFinal(!isFinal)}
                        cursor={loading ? 'not-allowed' : 'pointer'}
                        animation="quick"
                        enterStyle={{ scale: 0.8 }}
                      >
                        {isFinal && (
                          <Text fontSize="$3" color="white" fontWeight="bold">
                            ✓
                          </Text>
                        )}
                      </Card>
                      <YStack flex={1} gap="$1">
                        <Text fontSize="$3" color="$yellow11" fontWeight="600">
                          Marcar como pago final
                        </Text>
                        <Text fontSize="$2" color="$yellow11">
                          Cliente acepta no recibir el resto:
                        </Text>
                        <Text fontSize="$3" fontWeight="700" color="$yellow11">
                          {formatCurrency(paymentInfo.remaining - amountNum)}
                        </Text>
                      </YStack>
                    </XStack>
                  </Card>
                )}
              </YStack>
            </YStack>
          </YStack>

          {/* Botones */}
          <XStack gap="$2" jc="flex-end">
            <Button
              size="$3"
              variant="secondary"
              onPress={onClose}
              disabled={loading}
            >
              <Text>Cancelar</Text>
            </Button>
            <Button
              size="$3"
              onPress={handleSubmit}
              disabled={
                loading ||
                !amount ||
                !method ||
                !paymentInfo.hasWinner ||
                paymentInfo.totalPayout <= 0 ||
                isNaN(parseFloat(amount)) ||
                amountNum > paymentInfo.remaining ||
                amountNum <= 0
              }
              backgroundColor="$green4"
              borderColor="$green8"
              borderWidth={1}
              pressStyle={{ backgroundColor: '$green6', scale: 0.98 }}
            >
              {loading ? <Spinner size="small" /> : <Text>Registrar Pago</Text>}
            </Button>
          </XStack>
        </DialogContentWrapper>
      </Dialog.Portal>
    </Dialog>
  )
}

export default TicketPaymentModal
