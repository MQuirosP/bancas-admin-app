import React from 'react'
import TicketsListScreen from '@/components/tickets/TicketsListScreen'

export default function AdminTicketsIndex() {
  return (
    <TicketsListScreen
      scope="admin"
      buildDetailPath={(id: string) => `/admin/tickets/${id}`}
    />
  )
}
