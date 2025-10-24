import React from 'react'
import TicketsListScreen from '@/components/tickets/TicketsListScreen'

export default function VentanaTicketsIndex() {
  return (
    <TicketsListScreen
      scope="ventana"
      buildDetailPath={(id: string) => `/ventana/tickets/${id}`}
    />
  )
}
