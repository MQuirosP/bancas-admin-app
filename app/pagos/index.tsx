import React, { useState } from 'react'
import { YStack, XStack, Text } from 'tamagui'
import { useAuth } from '@/hooks/useAuth'
import { Role } from '@/types/auth.types'
import type { TicketWithPayments, TicketPayment } from '@/types/payment.types'

import PendingTicketsScreen from '@/components/payments/PendingTicketsScreen'
import PaymentFormModal from '@/components/payments/PaymentFormModal'
import PaymentHistoryModal from '@/components/payments/PaymentHistoryModal'
import PaymentConfirmationModal from '@/components/payments/PaymentConfirmationModal'

export default function PagosScreen() {
  const { user } = useAuth()
  const [selectedTicket, setSelectedTicket] = useState<TicketWithPayments | undefined>()
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [lastPayment, setLastPayment] = useState<TicketPayment | undefined>()

  // Validar permisos
  const allowedRoles = [Role.VENDEDOR, Role.VENTANA, Role.ADMIN]
  if (!allowedRoles.includes(user?.role as any)) {
    return (
      <YStack flex={1} ai="center" jc="center">
        <Text>No tienes permiso para acceder a esta sección</Text>
      </YStack>
    )
  }

  const handleSelectTicket = (ticket: TicketWithPayments) => {
    setSelectedTicket(ticket)
    setShowPaymentForm(true)
  }

  const handlePaymentSuccess = (payment: TicketPayment) => {
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
      <PaymentFormModal
        isOpen={showPaymentForm}
        ticket={selectedTicket}
        onClose={() => setShowPaymentForm(false)}
        onSuccess={handlePaymentSuccess}
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
