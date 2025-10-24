import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import TicketDetailScreen from '@/components/tickets/TicketDetailScreen'

export default function VentanaTicketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return (
    <TicketDetailScreen
      scope="ventana"
      ticketId={id}
      buildBackPath={() => '/ventana/tickets'}
    />
  )
}
