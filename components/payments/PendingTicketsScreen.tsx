import React, { useState, useMemo } from 'react'
import { YStack, XStack, Text, ScrollView, Card, Separator } from 'tamagui'
import { Button, Input, Select } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { usePendingWinningTicketsQuery } from '@/hooks/useTicketPayments'
import type { TicketWithPayments } from '@/types/payment.types'
import { UserRole } from '@/types/auth.types'
import { formatCurrency } from '@/lib/currency'
import { Check, ChevronDown, X, CreditCard } from '@tamagui/lucide-icons'

export interface PendingTicketsScreenProps {
  onSelectTicket: (ticket: TicketWithPayments) => void
}

const PAYMENT_METHODS = [
  { label: 'Efectivo', value: 'cash' },
  { label: 'Cheque', value: 'check' },
  { label: 'Transferencia', value: 'transfer' },
  { label: 'Sinpe Móvil', value: 'system' },
]

const PAYMENT_METHOD_LABELS = Object.fromEntries(PAYMENT_METHODS.map(m => [m.value, m.label]))

export default function PendingTicketsScreen({ onSelectTicket }: PendingTicketsScreenProps) {
  const { user } = useAuth()
  const [searchTicket, setSearchTicket] = useState('')
  const [filterMethod, setFilterMethod] = useState<string>('')
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set())
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedForPayment, setSelectedForPayment] = useState<(TicketWithPayments & { totalPayout: number; totalPaid: number; remaining: number }) | null>(null)

  // Filtrar por rol: vendedor ve solo sus tiquetes, ventana ve todos sus vendedores
  const params = useMemo(() => {
    if (user?.role === UserRole.VENDEDOR) {
      return { vendedorId: user.id }
    }
    if (user?.role === UserRole.VENTANA) {
      return { ventanaId: user.ventanaId }
    }
    return {}
  }, [user?.role, user?.id, user?.ventanaId])

  const { data: tickets, isLoading, error } = usePendingWinningTicketsQuery(params)

  // Calcular totales por tiquete
  const ticketsWithTotals = useMemo(() => {
    if (!tickets) return []

    return tickets.map((ticket) => {
      const totalPayout = (ticket.jugadas || [])
        .filter((j) => j.isWinner)
        .reduce((sum, j) => sum + (j.payout || 0), 0)

      const payments = ticket.payments || []
      const totalPaid = payments
        .filter((p) => !p.isReversed)
        .reduce((sum, p) => sum + p.amountPaid, 0)

      const remaining = totalPayout - totalPaid

      return {
        ...ticket,
        totalPayout,
        totalPaid,
        remaining,
      }
    })
  }, [tickets])

  // Aplicar filtros
  const filteredTickets = useMemo(() => {
    return ticketsWithTotals.filter((ticket) => {
      // Filtro por número de tiquete
      if (searchTicket && !ticket.ticketNumber.includes(searchTicket)) {
        return false
      }

      // Filtro por método de pago (si hay pagos previos)
      if (filterMethod && ticket.payments?.length) {
        const hasMethod = ticket.payments.some(
          (p) => !p.isReversed && p.method === filterMethod
        )
        if (!hasMethod) return true // Mostrar si no tiene ese método aún
      }

      return true
    })
  }, [ticketsWithTotals, searchTicket, filterMethod])

  const handleSelectTicket = (ticket: TicketWithPayments & { totalPayout: number; totalPaid: number; remaining: number }) => {
    setSelectedTickets((prev) => {
      const next = new Set(prev)
      if (next.has(ticket.id)) {
        next.delete(ticket.id)
      } else {
        next.add(ticket.id)
      }
      return next
    })
  }

  const handlePaySelected = () => {
    if (selectedTickets.size === 0) return

    // TODO: Abrir modal de pago en lote
    console.log('Pay selected:', Array.from(selectedTickets))
  }

  const handleOpenPaymentModal = (ticket: TicketWithPayments & { totalPayout: number; totalPaid: number; remaining: number }) => {
    setSelectedForPayment(ticket)
    setPaymentModalOpen(true)
  }

  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false)
    setSelectedForPayment(null)
  }

  if (isLoading) {
    return (
      <YStack flex={1} ai="center" jc="center">
        <Text>Cargando tiquetes ganadores...</Text>
      </YStack>
    )
  }

  if (error) {
    return (
      <YStack flex={1} ai="center" jc="center" gap="$3">
        <Text color="$error">Error cargando tiquetes</Text>
        <Text fontSize="$2">{(error as any).message}</Text>
      </YStack>
    )
  }

  return (
    <YStack flex={1} gap="$4" padding="$4">
      {/* Encabezado */}
      <YStack gap="$2">
        <Text fontSize="$5" fontWeight="600">
          Tiquetes Ganadores
        </Text>
        <Text fontSize="$3" color="$gray10">
          {filteredTickets.length} tiquete(s) pendiente(s) de pago
        </Text>
      </YStack>

      {/* Filtros */}
      <XStack gap="$2" flexWrap="wrap">
        <Input
          placeholder="Buscar por # tiquete..."
          value={searchTicket}
          onChangeText={setSearchTicket}
          flex={1}
          minWidth={200}
        />
        <Select
          value={filterMethod}
          onValueChange={setFilterMethod}
        >
          <Select.Trigger
            width={200}
            br="$3"
            bw={1}
            bc="$borderColor"
            backgroundColor="$background"
            px="$3"
            hoverStyle={{ bg: '$backgroundHover' }}
            focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
            iconAfter={ChevronDown}
          >
            <Select.Value>{filterMethod ? PAYMENT_METHOD_LABELS[filterMethod] : 'Filtrar método...'}</Select.Value>
          </Select.Trigger>

          <Select.Content zIndex={1000}>
            <YStack br="$3" bw={1} bc="$borderColor" backgroundColor="$background">
              <Select.Viewport>
                <Select.Item key="all" value="" index={0} pressStyle={{ bg: '$backgroundHover' }} bw={0} px="$3">
                  <Select.ItemText>Todos</Select.ItemText>
                  {!filterMethod && <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>}
                </Select.Item>
                {PAYMENT_METHODS.map((method, idx) => (
                  <Select.Item key={method.value} value={method.value} index={idx + 1} pressStyle={{ bg: '$backgroundHover' }} bw={0} px="$3">
                    <Select.ItemText>{method.label}</Select.ItemText>
                    {filterMethod === method.value && <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>}
                  </Select.Item>
                ))}
              </Select.Viewport>
            </YStack>
          </Select.Content>
        </Select>
      </XStack>

      {/* Lista de tiquetes */}
      <ScrollView flex={1}>
        <YStack gap="$2">
          {filteredTickets.length === 0 ? (
            <Card padding="$4" backgroundColor="$gray2">
              <Text ta="center" color="$gray10">
                No hay tiquetes ganadores pendientes de pago
              </Text>
            </Card>
          ) : (
            filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                isSelected={selectedTickets.has(ticket.id)}
                onSelect={() => handleSelectTicket(ticket)}
                onPay={() => handleOpenPaymentModal(ticket)}
                showCheckbox={user?.role === UserRole.VENTANA}
              />
            ))
          )}
        </YStack>
      </ScrollView>

      {/* Botón de pago en lote (solo VENTANA) */}
      {user?.role === UserRole.VENTANA && selectedTickets.size > 0 && (
        <XStack gap="$2" jc="flex-end">
          <Button
            onPress={() => setSelectedTickets(new Set())}
            variant="ghost"
          >
            Deseleccionar ({selectedTickets.size})
          </Button>
          <Button
            onPress={handlePaySelected}
            backgroundColor="$green4"
            borderColor="$green8"
            borderWidth={1}
            hoverStyle={{ backgroundColor: '$green5' }}
            pressStyle={{ backgroundColor: '$green6', scale: 0.98 }}
          >
            Pagar {selectedTickets.size} tiquete(s)
          </Button>
        </XStack>
      )}

      {/* Payment Modal */}
      {paymentModalOpen && selectedForPayment && (
        <PaymentModal
          ticket={selectedForPayment}
          isOpen={paymentModalOpen}
          onClose={handleClosePaymentModal}
          onSave={(data) => {
            console.log('Payment saved:', data)
            handleClosePaymentModal()
          }}
        />
      )}
    </YStack>
  )
}

interface TicketCardProps {
  ticket: TicketWithPayments & { totalPayout: number; totalPaid: number; remaining: number }
  isSelected: boolean
  onSelect: () => void
  onPay: () => void
  showCheckbox: boolean
}

function TicketCard({
  ticket,
  isSelected,
  onSelect,
  onPay,
  showCheckbox,
}: TicketCardProps) {
  const isPaid = ticket.remaining <= 0

  return (
    <Card
      padding="$3"
      borderColor={isSelected ? '$primary' : '$borderColor'}
      borderWidth={isSelected ? 2 : 1}
      backgroundColor={isPaid ? '$gray2' : '$background'}
      hoverStyle={{ borderColor: '$primary' }}
      pressStyle={{ scale: 0.98 }}
    >
      <XStack gap="$3" ai="center">
        {/* Checkbox (solo ventana) */}
        {showCheckbox && (
          <Card
            width={24}
            height={24}
            br="$2"
            bw={1}
            bc={isSelected ? '$primary' : '$borderColor'}
            bg={isSelected ? '$primary' : 'transparent'}
            ai="center"
            jc="center"
            cursor="pointer"
            onPress={onSelect}
          >
            {isSelected && <Text color="$background">✓</Text>}
          </Card>
        )}

        {/* Información del tiquete */}
        <YStack flex={1} gap="$1">
          <XStack jc="space-between" ai="center">
            <Text fontWeight="600" fontSize="$4">
              {ticket.ticketNumber}
            </Text>
            <Text
              fontSize="$2"
              color={isPaid ? '$gray10' : '$warning'}
              fontWeight="500"
            >
              {isPaid ? 'PAGADO' : 'PENDIENTE'}
            </Text>
          </XStack>

          <XStack gap="$4">
            <YStack gap="$1">
              <Text fontSize="$2" color="$gray10">
                Total Premio
              </Text>
              <Text fontWeight="600" fontSize="$4">
                {formatCurrency(ticket.totalPayout)}
              </Text>
            </YStack>

            <YStack gap="$1">
              <Text fontSize="$2" color="$gray10">
                Pagado
              </Text>
              <Text fontWeight="600" fontSize="$4">
                {formatCurrency(ticket.totalPaid)}
              </Text>
            </YStack>

            <YStack gap="$1">
              <Text fontSize="$2" color="$gray10">
                Pendiente
              </Text>
              <Text
                fontWeight="600"
                fontSize="$4"
                color={isPaid ? '$gray10' : '$error'}
              >
                {formatCurrency(ticket.remaining)}
              </Text>
            </YStack>
          </XStack>

          <XStack gap="$2" mt="$2">
            <Text color="$gray10" fontSize="$2">
              Tiquete #{ticket.ticketNumber}
            </Text>
            <Text color="$gray10" fontSize="$2">
              •
            </Text>
            <Text color="$gray10" fontSize="$2">
              Creado: {new Date(ticket.createdAt).toLocaleDateString()}
            </Text>
          </XStack>
        </YStack>

        {/* Botón de pago discreto y bonito */}
        {!isPaid && (
          <Button
            size="$3"
            onPress={onPay}
            disabled={isPaid}
            icon={(p: any) => <CreditCard {...p} size={16} />}
            backgroundColor="$blue4"
            borderColor="$blue8"
            borderWidth={1}
            hoverStyle={{ backgroundColor: '$blue5' }}
            pressStyle={{ backgroundColor: '$blue6', scale: 0.98 }}
            minWidth={50}
          />
        )}
      </XStack>
    </Card>
  )
}

interface PaymentModalProps {
  ticket: TicketWithPayments & { totalPayout: number; totalPaid: number; remaining: number }
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
}

function PaymentModal({ ticket, isOpen, onClose, onSave }: PaymentModalProps) {
  const [amount, setAmount] = useState(ticket.remaining.toString())
  const [method, setMethod] = useState('CASH')
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0,0,0,0.5)"
      ai="center"
      jc="center"
      zIndex={2000}
      onPress={onClose}
    >
      <Card
        width="90%"
        maxWidth={500}
        padding="$4"
        gap="$4"
        bg="$background"
        onPress={(e: any) => e.stopPropagation()}
      >
        {/* Modal Header - Botón X en la esquina superior derecha */}
        <XStack jc="space-between" ai="center">
          <Text fontSize="$6" fontWeight="bold">
            Registrar Pago
          </Text>
          <Button
            size="$2"
            icon={(p: any) => <X {...p} size={20} />}
            onPress={onClose}
            variant="ghost"
            backgroundColor="transparent"
            borderWidth={0}
          />
        </XStack>

        <Separator />

        {/* Información del tiquete */}
        <YStack gap="$2">
          <Text fontSize="$3" fontWeight="600">
            Tiquete #{ticket.ticketNumber}
          </Text>
          <XStack gap="$4" jc="space-between">
            <YStack gap="$1">
              <Text fontSize="$2" color="$gray10">
                Total Premio
              </Text>
              <Text fontWeight="600" fontSize="$4">
                {formatCurrency(ticket.totalPayout)}
              </Text>
            </YStack>
            <YStack gap="$1">
              <Text fontSize="$2" color="$gray10">
                Ya Pagado
              </Text>
              <Text fontWeight="600" fontSize="$4">
                {formatCurrency(ticket.totalPaid)}
              </Text>
            </YStack>
            <YStack gap="$1">
              <Text fontSize="$2" color="$gray10">
                Pendiente
              </Text>
              <Text fontWeight="600" fontSize="$4" color="$error">
                {formatCurrency(ticket.remaining)}
              </Text>
            </YStack>
          </XStack>
        </YStack>

        <Separator />

        {/* Formulario de pago */}
        <YStack gap="$3">
          {/* Monto */}
          <YStack gap="$1">
            <Text fontSize="$3" fontWeight="600">
              Monto a pagar
            </Text>
            <Input
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
            <Text fontSize="$2" color="$gray10">
              Máximo: {formatCurrency(ticket.remaining)}
            </Text>
          </YStack>

          {/* Método de pago */}
          <YStack gap="$1">
            <Text fontSize="$3" fontWeight="600">
              Método de pago
            </Text>
            <Select value={method} onValueChange={setMethod}>
              <Select.Trigger
                br="$3"
                bw={1}
                bc="$borderColor"
                backgroundColor="$background"
                px="$3"
                hoverStyle={{ bg: '$backgroundHover' }}
                focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
                iconAfter={ChevronDown}
              >
                <Select.Value>{PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS]}</Select.Value>
              </Select.Trigger>

              <Select.Content zIndex={3000}>
                <YStack br="$3" bw={1} bc="$borderColor" backgroundColor="$background">
                  <Select.Viewport>
                    {PAYMENT_METHODS.map((m, idx) => (
                      <Select.Item key={m.value} value={m.value} index={idx} pressStyle={{ bg: '$backgroundHover' }} bw={0} px="$3">
                        <Select.ItemText>{m.label}</Select.ItemText>
                        {method === m.value && <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>}
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
              Notas (opcional)
            </Text>
            <Input
              value={notes}
              onChangeText={setNotes}
              placeholder="Agregar notas sobre el pago..."
              multiline
              numberOfLines={3}
            />
          </YStack>
        </YStack>

        {/* Footer - Botones de acción */}
        <XStack gap="$3" jc="flex-end" mt="$2">
          <Button
            variant="ghost"
            onPress={onClose}
          >
            Cancelar
          </Button>
          <Button
            onPress={() => onSave({ amount: parseFloat(amount), method, notes })}
            backgroundColor="$green4"
            borderColor="$green8"
            borderWidth={1}
            hoverStyle={{ backgroundColor: '$green5' }}
            pressStyle={{ backgroundColor: '$green6', scale: 0.98 }}
          >
            Guardar Pago
          </Button>
        </XStack>
      </Card>
    </YStack>
  )
}
