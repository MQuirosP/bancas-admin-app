/**
 * Modal unificado para registrar pagos de tickets
 * Reemplaza TicketPaymentModal, PaymentFormModal y modal embebido en PendingTicketsScreen
 * @version 2.0 - Sistema Unificado
 */

import React, { useState, useMemo } from 'react'
import { YStack, XStack, Text, Dialog, Spinner, VisuallyHidden, ScrollView, Card } from 'tamagui'
import { Button, Input, Select } from '@/components/ui'
import { X, Check, ChevronDown } from '@tamagui/lucide-icons'
import { v4 as uuidv4 } from 'uuid'
import { useToast } from '@/hooks/useToast'
import type { PaymentMethod, CreatePaymentInput } from '@/types/payment.types'
import DialogContentWrapper from '@/components/tickets/DialogContentWrapper'

// Utilities y componentes compartidos
import { 
  calculatePaymentTotals, 
  validatePaymentAmount,
  calculatePartialPayment,
  PAYMENT_METHODS,
} from '@/lib/tickets'
import type { TicketForCalculations } from '@/lib/tickets'
import { PaymentAmountsGrid } from './PaymentAmountsGrid'
import { WinningJugadasList } from './WinningJugadasList'
import { WinnerBadge } from './TicketStatusBadge'
import { formatCurrency, formatTicketNumber } from '@/utils/formatters'

export interface PaymentModalProps {
  isOpen: boolean
  ticket?: TicketForCalculations | null
  onClose: () => void
  /**
   * Callback para manejar el submit (modo simple)
   * Si no se proporciona, el modal no hará nada al submit
   */
  onSubmit?: (input: CreatePaymentInput) => Promise<void>
  /**
   * Callback para éxito (opcional)
   * Se llama después de onSubmit exitoso o cuando se usa modo avanzado
   */
  onSuccess?: (payment: any) => void
  /**
   * Loading state externo (opcional)
   * Útil cuando se usa onSubmit que maneja el loading externamente
   */
  isLoading?: boolean
  /**
   * Modo de operación:
   * - 'simple': Usa onSubmit callback
   * - 'advanced': Usa hooks internos (futuro)
   */
  mode?: 'simple' | 'advanced'
  /**
   * Mostrar toast de éxito automáticamente
   */
  showSuccessToast?: boolean
}

/**
 * Modal unificado para registrar pagos de tickets.
 * 
 * Elimina ~1,000 líneas de código duplicado entre:
 * - TicketPaymentModal (478 líneas)
 * - PaymentFormModal (416 líneas)
 * - Modal embebido en PendingTicketsScreen (~170 líneas)
 * 
 * @example
 * ```tsx
 * // Uso simple (desde listas):
 * <PaymentModal
 *   isOpen={open}
 *   ticket={ticket}
 *   onClose={() => setOpen(false)}
 *   onSubmit={async (input) => {
 *     await apiClient.post(`/tickets/${input.ticketId}/pay`, input)
 *   }}
 * />
 * 
 * // Uso con hooks externos:
 * <PaymentModal
 *   isOpen={open}
 *   ticket={ticket}
 *   onClose={() => setOpen(false)}
 *   onSubmit={handlePayment}
 *   isLoading={mutation.isPending}
 * />
 * ```
 */
export function PaymentModal({
  isOpen,
  ticket,
  onClose,
  onSubmit,
  onSuccess,
  isLoading: externalLoading,
  mode = 'simple',
  showSuccessToast = true,
}: PaymentModalProps) {
  const { success, error: showError } = useToast()
  
  // Estado del formulario
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [isFinal, setIsFinal] = useState(false)
  const [internalLoading, setInternalLoading] = useState(false)

  // Loading combinado (externo o interno)
  const loading = externalLoading ?? internalLoading

  // Calcular totales usando utility centralizado
  const totals = useMemo(() => {
    if (!ticket) {
      return {
        totalPayout: 0,
        totalPaid: 0,
        remainingAmount: 0,
        hasWinner: false,
        isFullyPaid: false,
        hasPartialPayment: false,
      }
    }
    return calculatePaymentTotals(ticket)
  }, [ticket])

  // Validar monto
  const amountNum = amount ? parseFloat(amount) : 0
  const validation = ticket ? validatePaymentAmount(amountNum, ticket) : { valid: false }
  
  // Calcular información de pago parcial
  const partialInfo = ticket && amountNum > 0
    ? calculatePartialPayment(amountNum, ticket)
    : { isPartial: false, remainingAfterPayment: 0, percentagePaid: 0 }

  // Handler para submit
  const handleSubmit = async () => {
    if (!validation.valid || !ticket || !onSubmit || loading) return

    try {
      setInternalLoading(true)
      
      const input: CreatePaymentInput = {
        ticketId: ticket.id,
        amountPaid: amountNum,
        method,
        idempotencyKey: uuidv4(),
        isFinal: isFinal && partialInfo.isPartial,
      }

      await onSubmit(input)

      // Toast de éxito
      if (showSuccessToast) {
        success(`Pago de ${formatCurrency(amountNum)} registrado correctamente`)
      }

      // Callback de éxito
      if (onSuccess) {
        onSuccess(input)
      }

      // Limpiar y cerrar
      handleClose()
    } catch (err: any) {
      const errorMsg = err.message || 'Error al registrar pago'
      showError(errorMsg)
    } finally {
      setInternalLoading(false)
    }
  }

  // Handler para cerrar
  const handleClose = () => {
    setAmount('')
    setMethod('cash')
    setIsFinal(false)
    onClose()
  }

  if (!ticket) return null

  const ticketNumber = formatTicketNumber(ticket)

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
          key={`payment-content-${ticketNumber}`}
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
              onPress={handleClose}
              disabled={loading}
              hoverStyle={{ backgroundColor: '$backgroundHover' }}
            />
          </XStack>

          {/* Content */}
          <YStack gap="$3" flex={1} overflow="unset">
            {/* Info del ticket */}
            <Card 
              padding="$3" 
              backgroundColor="$backgroundHover" 
              borderColor="$borderColor" 
              borderWidth={1}
            >
              <YStack gap="$3">
                {/* Header con # de ticket */}
                <XStack jc="space-between" ai="center">
                  <YStack gap="$1">
                    <Text fontSize="$2" color="$textSecondary" fontWeight="600">
                      Ticket
                    </Text>
                    <Text fontSize="$5" fontWeight="700">
                      {ticketNumber}
                    </Text>
                  </YStack>
                  {totals.hasWinner && (
                    <WinnerBadge size="md" />
                  )}
                </XStack>

                {/* Grid de montos usando componente compartido */}
                <PaymentAmountsGrid totals={totals} size="md" showLabels />

                {/* Jugadas ganadoras usando componente compartido */}
                {totals.hasWinner && ticket.jugadas && ticket.jugadas.length > 0 && (
                  <WinningJugadasList 
                    ticket={ticket}
                    maxHeight={200}
                    size="md"
                    showTitle
                    showScrollbar
                  />
                )}
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
                  placeholder={`Máximo: ${formatCurrency(totals.remainingAmount)}`}
                  value={amount}
                  onChangeText={setAmount}
                  inputMode="decimal"
                  disabled={!totals.hasWinner || totals.isFullyPaid || loading}
                />
                
                {/* Validación - altura fija para no redimensionar */}
                <YStack height={24} jc="center" ov="hidden">
                  {!validation.valid && validation.error && amount && validation.error.trim() ? (
                    <Text 
                      fontSize="$2" 
                      color="$red11" 
                      animation="quick" 
                      enterStyle={{ opacity: 0 }} 
                      exitStyle={{ opacity: 0 }}
                    >
                      {validation.error}
                    </Text>
                  ) : !totals.hasWinner ? (
                    <Text 
                      fontSize="$2" 
                      color="$gray10" 
                      animation="quick" 
                      enterStyle={{ opacity: 0 }} 
                      exitStyle={{ opacity: 0 }}
                    >
                      Este ticket no es ganador
                    </Text>
                  ) : totals.hasWinner && totals.isFullyPaid ? (
                    <Text 
                      fontSize="$2" 
                      color="$green10" 
                      animation="quick" 
                      enterStyle={{ opacity: 0 }} 
                      exitStyle={{ opacity: 0 }}
                    >
                      Este ticket ya está completamente pagado
                    </Text>
                  ) : null}
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
                    opacity={loading ? 0.5 : 1}
                  >
                    <Select.Value>
                      {PAYMENT_METHODS.find((m) => m.value === method)?.label || 'Efectivo'}
                    </Select.Value>
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
              <YStack height={partialInfo.isPartial ? 115 : 115} jc="center" ov="hidden">
                {partialInfo.isPartial && (
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
                          {formatCurrency(partialInfo.remainingAfterPayment)}
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
              onPress={handleClose}
              disabled={loading}
            >
              <Text>Cancelar</Text>
            </Button>
            <Button
              size="$3"
              onPress={handleSubmit}
              disabled={
                loading ||
                !validation.valid ||
                !onSubmit
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

