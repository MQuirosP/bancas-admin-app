import React from 'react'
import { XStack } from 'tamagui'
import { Button } from '@/components/ui'
import { Eye, CreditCard, XCircle } from '@tamagui/lucide-icons'

export type Ticket = {
  id: string
  [key: string]: any
}

interface TicketActionButtonsProps {
  ticket: Ticket
  onView: (ticket: Ticket) => void
  onPayment: (ticket: Ticket) => void
  onCancel?: (ticket: Ticket) => void
}

/**
 * Componente que renderiza botones de acción para tiquetes:
 * - Ver: Abre preview del tiquete (siempre visible)
 * - Status: Abre módulo de pago (solo si es ganador y status = EVALUATED o PAID)
 */
export default function TicketActionButtons({ ticket, onView, onPayment, onCancel }: TicketActionButtonsProps) {
  // ✅ Solo mostrar botón de pago si el ticket es ganador
  const isWinner = ticket.isWinner === true
  const canPay = isWinner && (ticket.status === 'EVALUATED' || ticket.status === 'PAID')
  const canCancel = ticket.status !== 'CANCELED' && ticket.status !== 'PAID'
  
  return (
    <XStack gap="$2" flexWrap="nowrap">
      <Button
        size="$2"
        icon={(p: any) => <Eye {...p} size={18} />}
        onPress={() => onView(ticket)}
        backgroundColor="$blue4"
        borderColor="$blue8"
        borderWidth={1}
        hoverStyle={{ backgroundColor: '$blue5' }}
        pressStyle={{ backgroundColor: '$blue6', scale: 0.98 }}
        title="Ver detalles del tiquete"
      >
        Ver
      </Button>

      {canPay && (
        <Button
          size="$2"
          icon={(p: any) => <CreditCard {...p} size={18} />}
          onPress={() => onPayment(ticket)}
          backgroundColor="$green4"
          borderColor="$green8"
          borderWidth={1}
          hoverStyle={{ backgroundColor: '$green5' }}
          pressStyle={{ backgroundColor: '$green6', scale: 0.98 }}
          title="Registrar pago del tiquete"
        >
          Status
        </Button>
      )}

      {onCancel && canCancel && (
        <Button
          size="$2"
          icon={(p: any) => <XCircle {...p} size={18} />}
          onPress={() => onCancel(ticket)}
          backgroundColor="$red4"
          borderColor="$red8"
          borderWidth={1}
          hoverStyle={{ backgroundColor: '$red5' }}
          pressStyle={{ backgroundColor: '$red6', scale: 0.98 }}
          title="Cancelar tiquete"
        >
          Cancelar
        </Button>
      )}
    </XStack>
  )
}
