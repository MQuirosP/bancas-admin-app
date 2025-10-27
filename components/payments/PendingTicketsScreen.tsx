import React, { useState, useMemo } from 'react'
import { YStack, XStack, Text, ScrollView, Card } from 'tamagui'
import { Button, Input, Select } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { usePendingWinningTicketsQuery } from '@/hooks/useTicketPayments'
import type { TicketWithPayments } from '@/types/payment.types'
import { Role } from '@/types/auth.types'
import { formatCurrency } from '@/lib/currency'

export interface PendingTicketsScreenProps {
  onSelectTicket: (ticket: TicketWithPayments) => void
}

const PAYMENT_METHODS = [
  { label: 'Efectivo', value: 'CASH' },
  { label: 'Cheque', value: 'CHECK' },
  { label: 'Transferencia', value: 'TRANSFER' },
  { label: 'Sistema', value: 'SYSTEM' },
]

export default function PendingTicketsScreen({ onSelectTicket }: PendingTicketsScreenProps) {
  const { user } = useAuth()
  const [searchTicket, setSearchTicket] = useState('')
  const [filterMethod, setFilterMethod] = useState<string>('')
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set())

  // Filtrar por rol: vendedor ve solo sus tiquetes, ventana ve todos sus vendedores
  const params = useMemo(() => {
    if (user?.role === Role.VENDEDOR) {
      return { vendedorId: user.id }
    }
    if (user?.role === Role.VENTANA) {
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

  const handleSelectTicket = (ticket: TicketWithPayments) => {
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
          placeholder="Filtrar método..."
        >
          <Select.Item label="Todos" value="" />
          {PAYMENT_METHODS.map((method) => (
            <Select.Item key={method.value} label={method.label} value={method.value} />
          ))}
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
                onPay={() => onSelectTicket(ticket)}
                showCheckbox={user?.role === Role.VENTANA}
              />
            ))
          )}
        </YStack>
      </ScrollView>

      {/* Botón de pago en lote (solo VENTANA) */}
      {user?.role === Role.VENTANA && selectedTickets.size > 0 && (
        <XStack gap="$2" jc="flex-end">
          <Button
            onPress={() => setSelectedTickets(new Set())}
            variant="ghost"
          >
            Deseleccionar ({selectedTickets.size})
          </Button>
          <Button
            onPress={handlePaySelected}
            theme="green"
          >
            Pagar {selectedTickets.size} tiquete(s)
          </Button>
        </XStack>
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

          <XStack gap="$2" mt="$2" fontSize="$2">
            <Text color="$gray10">Sorteo: {ticket.sorteoId}</Text>
            <Text color="$gray10">•</Text>
            <Text color="$gray10">
              Creado: {new Date(ticket.createdAt).toLocaleDateString()}
            </Text>
          </XStack>
        </YStack>

        {/* Botones de acción */}
        {!isPaid && (
          <Button
            size="$3"
            onPress={onPay}
            disabled={isPaid}
          >
            Pagar
          </Button>
        )}
      </XStack>
    </Card>
  )
}
