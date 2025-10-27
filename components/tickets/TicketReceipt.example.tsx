/**
 * Example/Demo component for TicketReceipt with sample data
 * This demonstrates the optimized 58mm thermal printer format
 * with grouped jugadas similar to the reference image
 */

import React from 'react'
import { YStack, ScrollView } from 'tamagui'
import TicketReceipt from './TicketReceipt'

// Sample ticket matching the reference image format
const sampleTicket = {
  id: '123',
  ticketNumber: '00',
  loteria: { name: 'TICA' },
  sorteo: {
    name: 'TICA 7:00 PM',
    scheduledAt: '2025-10-25T19:00:00'
  },
  vendedor: {
    name: 'Yorleny',
    code: 'YV-698',
    phone: '8888-8888'
  },
  clienteNombre: 'Nombre Cliente',
  createdAt: '2025-10-25T11:28:00',
  jugadas: [
    // Números regulares
    { type: 'NUMERO' as const, number: '34', amount: 200000 },
    { type: 'NUMERO' as const, number: '38', amount: 50800 },
    { type: 'NUMERO' as const, number: '32', amount: 8400 },
    { type: 'NUMERO' as const, number: '74', amount: 1100 },
    { type: 'NUMERO' as const, number: '99', amount: 200 },
    { type: 'NUMERO' as const, number: '55', amount: 200 },
    { type: 'NUMERO' as const, number: '44', amount: 200 },
    // Reventados
    { type: 'REVENTADO' as const, reventadoNumber: '74', amount: 600 }
  ],
  totalAmount: 261500
}

/**
 * Example with multiple numbers at same amount (grouped format)
 */
const sampleTicketGrouped = {
  id: '124',
  ticketNumber: '01',
  loteria: { name: 'NUEVA' },
  sorteo: {
    name: 'NUEVA 2:00 PM',
    scheduledAt: '2025-10-25T14:00:00'
  },
  vendedor: {
    name: 'Juan Pérez',
    code: 'JP-123',
    phone: '8888-7777'
  },
  clienteNombre: 'María González',
  createdAt: new Date().toISOString(),
  jugadas: [
    // Multiple numbers with same amount - will be grouped
    { type: 'NUMERO' as const, number: '12', amount: 5000 },
    { type: 'NUMERO' as const, number: '23', amount: 5000 },
    { type: 'NUMERO' as const, number: '34', amount: 5000 },
    { type: 'NUMERO' as const, number: '45', amount: 2000 },
    { type: 'NUMERO' as const, number: '56', amount: 2000 },
    { type: 'NUMERO' as const, number: '67', amount: 1000 },
    // Reventados with same amount
    { type: 'REVENTADO' as const, reventadoNumber: '12', amount: 500 },
    { type: 'REVENTADO' as const, reventadoNumber: '23', amount: 500 },
  ],
  totalAmount: 21000
}

export default function TicketReceiptExample() {
  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack p="$4" gap="$6" ai="center">
        <YStack gap="$2" ai="center">
          <TicketReceipt ticket={sampleTicket} />
        </YStack>

        <YStack width="100%" height={2} backgroundColor="$borderColor" my="$4" />

        <YStack gap="$2" ai="center">
          <TicketReceipt ticket={sampleTicketGrouped} />
        </YStack>
      </YStack>
    </ScrollView>
  )
}

/**
 * Expected output format for sampleTicketGrouped (with grouping):
 *
 * 5000 * 12, 23, 34
 * 2000 * 45, 56
 * 1000 * 67
 * *******REVENTADOS*******
 * 500 * 12, 23
 *
 * This saves significant space compared to the old format:
 * 5000 * 12
 * 5000 * 23
 * 5000 * 34
 * ... etc
 */
