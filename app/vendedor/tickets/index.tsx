import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import TicketsListScreen from '@/components/tickets/TicketsListScreen'

export default function MisTicketsScreen() {
  const params = useLocalSearchParams()
  const filter = params.filter as string | undefined
  
  return <TicketsListScreen scope="vendedor" filterPendientes={filter === 'pendientes'} />
}
