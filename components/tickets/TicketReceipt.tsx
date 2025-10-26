import React, { useMemo } from 'react'
import { YStack, XStack, Text, Card } from 'tamagui'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCurrency } from '@/utils/formatters'

type Jugada = {
  type: 'NUMERO' | 'REVENTADO'
  number?: string
  reventadoNumber?: string
  amount: number
  isWinner?: boolean
  winAmount?: number
}

type Ticket = {
  id: string
  ticketNumber?: string | number
  loteria?: { name?: string }
  sorteo?: { name?: string; scheduledAt?: string }
  vendedor?: { name?: string; code?: string; phone?: string | null }
  clienteNombre?: string | null
  createdAt?: string
  jugadas: Jugadas
  totalAmount?: number
}

type Jugadas = Jugada[]

export type TicketReceiptProps = {
  ticket: Ticket
  widthPx?: number // width similar a 80mm ~ 300px
}

function pad2(n?: string) {
  const s = (n ?? '').replace(/\D/g, '').slice(0, 2)
  return s.length === 2 ? s : s.padStart(2, '0')
}

export default function TicketReceipt({ ticket, widthPx = 300 }: TicketReceiptProps) {
  const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : new Date()
  const scheduledAt = ticket.sorteo?.scheduledAt ? new Date(ticket.sorteo.scheduledAt) : undefined

  const { numeros, reventados, total } = useMemo(() => {
    const nums = (ticket.jugadas || []).filter((j) => j.type === 'NUMERO')
    const revs = (ticket.jugadas || []).filter((j) => j.type === 'REVENTADO')
    const tot = (ticket.totalAmount != null
      ? ticket.totalAmount
      : (ticket.jugadas || []).reduce((s, j) => s + (j.amount || 0), 0))
    return { numeros: nums, reventados: revs, total: tot }
  }, [ticket])

  // Simple barcode placeholder using ticket id blocks
  const barcodeBlocks = useMemo(() => {
    const idStr = String(ticket.ticketNumber ?? (ticket as any).code ?? ticket.id)
    const blocks = idStr.split('').map((ch, i) => (
      <YStack key={i} width={i % 2 === 0 ? 3 : 1} height={30} backgroundColor="$color" />
    ))
    return (
      <XStack gap={2} alignItems="flex-end">{blocks}</XStack>
    )
  }, [ticket])

  const sectionBorder = { borderWidth: 1, borderColor: '$borderColor', borderStyle: 'dashed' as const }

  return (
    <YStack alignSelf="center" width={widthPx} bg="$background">
      <style
        // print-friendly monospace and tight spacing for thermal receipt
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page { size: ${Math.round(widthPx)}px auto; margin: 8px; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `,
        }}
      />
      <Card p="$3" bg="$background" {...sectionBorder}>
        <YStack gap="$2" ai="center">
          <Text fontFamily="monospace" fontSize={16} fontWeight="900">
            TIQUETE # {String(ticket.ticketNumber ?? (ticket as any).code ?? ticket.id)}
          </Text>
          <Text fontFamily="monospace" fontSize={16} fontWeight="900">
            {ticket.loteria?.name ?? 'LOTERIA'} {scheduledAt ? format(scheduledAt, 'h:mm a', { locale: es }).toUpperCase() : ''}
          </Text>
        </YStack>
      </Card>

      <Card mt="$3" p="$3" bg="$background" {...sectionBorder}>
        <YStack gap={2}>
          <Text fontFamily="monospace">VENDEDOR: {ticket.vendedor?.name ?? '—'} {ticket.vendedor?.code ? ` - ${ticket.vendedor.code}` : ''}</Text>
          <Text fontFamily="monospace">TEL.: {ticket.vendedor?.phone ?? '—'}</Text>
          <Text fontFamily="monospace">CLIENTE: {ticket.clienteNombre ?? '—'}</Text>
          <Text fontFamily="monospace">SORTEO: {scheduledAt ? format(scheduledAt, 'dd/MM/yyyy', { locale: es }) : '—'}</Text>
          <Text fontFamily="monospace">IMPRESIÓN: {format(createdAt, 'dd/MM/yyyy hh:mm a', { locale: es })}</Text>
        </YStack>
      </Card>

      <YStack mt="$3" gap="$2" {...sectionBorder} p="$3" bg="$background">
        {numeros.map((j, idx) => (
          <XStack key={idx} jc="space-between">
            <Text fontFamily="monospace">{formatCurrency(j.amount)}</Text>
            <Text fontFamily="monospace">* {pad2(j.number)}</Text>
          </XStack>
        ))}

        {reventados.length > 0 && (
          <>
            <XStack my="$2" jc="center"><Text fontFamily="monospace">********REVENTADOS********</Text></XStack>
            {reventados.map((j, idx) => (
              <XStack key={`r-${idx}`} jc="space-between">
                <Text fontFamily="monospace">{formatCurrency(j.amount)}</Text>
                <Text fontFamily="monospace">* {pad2(j.reventadoNumber ?? j.number)}</Text>
              </XStack>
            ))}
          </>
        )}
      </YStack>

      <Card mt="$3" p="$3" bg="$background" {...sectionBorder}>
        <XStack jc="space-between" ai="center">
          <Text fontFamily="monospace" fontWeight="900">TOTAL</Text>
          <Text fontFamily="monospace" fontWeight="900">{formatCurrency(total)}</Text>
        </XStack>
      </Card>

      <YStack mt="$3" ai="center" gap="$2" {...sectionBorder} p="$3" bg="$background">
        <Text fontFamily="monospace">PAGAMOS</Text>
        {barcodeBlocks}
      </YStack>
    </YStack>
  )
}
