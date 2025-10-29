import React, { useState } from 'react'
import { YStack, XStack, Text } from 'tamagui'
import { useAuth } from '@/hooks/useAuth'
import { Role } from '@/types/auth.types'
import type { TicketWithPayments, TicketPayment, CreatePaymentInput } from '@/types/payment.types'

import PendingTicketsScreen from '@/components/payments/PendingTicketsScreen'
import { PaymentModal } from '@/components/tickets/shared'
import PaymentHistoryModal from '@/components/payments/PaymentHistoryModal'
import PaymentConfirmationModal from '@/components/payments/PaymentConfirmationModal'
import { useCreatePaymentMutation } from '@/hooks/useTicketPayments'

export default function PagosScreen() {
  const { user } = useAuth()
  const createPaymentMutation = useCreatePaymentMutation()
  const [selectedTicket, setSelectedTicket] = useState<TicketWithPayments | undefined>()
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [lastPayment, setLastPayment] = useState<TicketPayment | undefined>()

  // Validar permisos - Solo VENTANA y ADMIN pueden pagar
  // VENDEDOR y BANCA no tienen acceso a este módulo
  const allowedRoles = [Role.VENTANA, Role.ADMIN]
  if (!user || !allowedRoles.includes(user.role as any)) {
    return (
      <YStack flex={1} ai="center" jc="center" gap="$3" padding="$4">
        <Text fontSize="$5" fontWeight="600">
          Acceso Denegado
        </Text>
        <Text color="$gray10" ta="center">
          Solo administradores y operadores de ventana pueden acceder a la gestión de pagos
        </Text>
      </YStack>
    )
  }

  const handleSelectTicket = (ticket: TicketWithPayments) => {
    setSelectedTicket(ticket)
    setShowPaymentForm(true)
  }

  const handlePaymentSubmit = async (input: CreatePaymentInput) => {
    const result = await createPaymentMutation.mutateAsync(input)
    return result
  }

  const handlePaymentSuccess = (payment: any) => {
    setLastPayment(payment)
    setShowPaymentForm(false)
    setShowConfirmation(true)
  }

  const handleRegisterAnother = () => {
    setShowConfirmation(false)
    setSelectedTicket(undefined)
    setLastPayment(undefined)
  }

  const handlePrintReceipt = () => {
    // TODO: Implementar impresión
    console.log('Print receipt:', lastPayment)
  }

  return (
    <YStack flex={1}>
      {/* Lista de tiquetes pendientes */}
      <PendingTicketsScreen onSelectTicket={handleSelectTicket} />

      {/* Modal de formulario de pago */}
      <PaymentModal
        isOpen={showPaymentForm}
        ticket={selectedTicket}
        onClose={() => setShowPaymentForm(false)}
        onSubmit={handlePaymentSubmit}
        onSuccess={handlePaymentSuccess}
        isLoading={createPaymentMutation.isPending}
        showSuccessToast={false}
      />

      {/* Modal de historial de pagos */}
      <PaymentHistoryModal
        isOpen={showPaymentHistory}
        ticketId={selectedTicket?.id}
        onClose={() => setShowPaymentHistory(false)}
      />

      {/* Modal de confirmación */}
      <PaymentConfirmationModal
        isOpen={showConfirmation}
        payment={lastPayment}
        ticketNumber={selectedTicket?.ticketNumber}
        onClose={() => {
          setShowConfirmation(false)
          setSelectedTicket(undefined)
          setLastPayment(undefined)
        }}
        onPrintReceipt={handlePrintReceipt}
        onRegisterAnother={handleRegisterAnother}
      />
    </YStack>
  )
}
