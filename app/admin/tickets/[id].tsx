import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import TicketDetailScreen from '@/components/tickets/TicketDetailScreen'

export default function AdminTicketDetail() {
  const { id: raw } = useLocalSearchParams()
  const id = Array.isArray(raw) ? raw[0] : (raw ?? '')
  if (!id) return null

  return (
    <TicketDetailScreen
      scope="admin"
      ticketId={id}
      buildBackPath={() => '/admin/tickets'}
    />
  )
}
