import React from 'react'
import { XStack } from 'tamagui'
import { Button } from '@/components/ui'
import { Eye, CreditCard } from '@tamagui/lucide-icons'

export type Ticket = {
  id: string
  [key: string]: any
}

interface TicketActionButtonsProps {
  ticket: Ticket
  onView: (ticket: Ticket) => void
  onPayment: (ticket: Ticket) => void
}

/**
 * Componente que renderiza botones de acción para tiquetes:
 * - Ver: Abre preview del tiquete (siempre visible)
 * - Status: Abre módulo de pago (solo si es ganador y status = EVALUATED o PAID)
 */
export default function TicketActionButtons({ ticket, onView, onPayment }: TicketActionButtonsProps) {
  // ✅ Solo mostrar botón de pago si el ticket es ganador
  const isWinner = ticket.isWinner === true
  const canPay = isWinner && (ticket.status === 'EVALUATED' || ticket.status === 'PAID')
  
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
    </XStack>
  )
}
