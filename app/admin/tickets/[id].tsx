import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import TicketDetailScreen from '@/components/tickets/TicketDetailScreen'

export default function AdminTicketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return (
    <TicketDetailScreen
      scope="admin"
      ticketId={id}
      buildBackPath={() => '/admin/tickets'}
    />
  )
}
