import React, { useMemo } from 'react'
import { YStack, XStack, Text, Card } from 'tamagui'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCurrency } from '@/utils/formatters'
import { groupJugadasByAmount, formatNumbersList } from '@/utils/ticket.helpers'

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
  widthPx?: number // width for 58mm thermal printer ~ 220px
}

function pad2(n?: string) {
  const s = (n ?? '').replace(/\D/g, '').slice(0, 2)
  return s.length === 2 ? s : s.padStart(2, '0')
}

export default function TicketReceipt({ ticket, widthPx = 220 }: TicketReceiptProps) {
  const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : new Date()
  const scheduledAt = ticket.sorteo?.scheduledAt ? new Date(ticket.sorteo.scheduledAt) : undefined

  const { numeros, reventados, total } = useMemo(() => {
    const grouped = groupJugadasByAmount(ticket.jugadas || [])
    const tot = (ticket.totalAmount != null
      ? ticket.totalAmount
      : (ticket.jugadas || []).reduce((s, j) => s + (j.amount || 0), 0))
    return { numeros: grouped.numeros, reventados: grouped.reventados, total: tot }
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
    <YStack alignSelf="center" width={widthPx} backgroundColor="$background">
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
      <Card p="$2" backgroundColor="$background" {...sectionBorder}>
        <YStack gap="$1" ai="center">
          <Text fontFamily="monospace" fontSize={14} fontWeight="900">
            CODIGO # {String(ticket.ticketNumber ?? (ticket as any).code ?? ticket.id).padStart(2, '0')}
          </Text>
          <Text fontFamily="monospace" fontSize={14} fontWeight="900">
            {ticket.loteria?.name?.toUpperCase() ?? 'TICA'} {scheduledAt ? format(scheduledAt, 'h:mm a', { locale: es }).toUpperCase() : ''}
          </Text>
        </YStack>
      </Card>

      <Card mt="$2" p="$2" backgroundColor="$background" {...sectionBorder}>
        <YStack gap={1}>
          <Text fontFamily="monospace" fontSize={11}>VENDEDOR: {ticket.vendedor?.name ?? 'Nombre Vendedor'} {ticket.vendedor?.code ? ` - ${ticket.vendedor.code}` : ''}</Text>
          <Text fontFamily="monospace" fontSize={11}>TEL.: {ticket.vendedor?.phone ?? '8888-8888'}</Text>
          <Text fontFamily="monospace" fontSize={11}>CLIENTE: {ticket.clienteNombre ?? 'Nombre Cliente'}</Text>
          <Text fontFamily="monospace" fontSize={11}>SORTEO: {scheduledAt ? format(scheduledAt, 'dd/MM/yyyy', { locale: es }) : '—'}</Text>
          <Text fontFamily="monospace" fontSize={11}>IMPRESIÓN: {format(createdAt, 'dd/MM/yyyy hh:mm:ss a', { locale: es }).toUpperCase()}</Text>
        </YStack>
      </Card>

      <YStack mt="$2" gap={2} {...sectionBorder} p="$2" backgroundColor="$background">
        {numeros.map((group, idx) => (
          <XStack key={idx} gap="$2" jc="space-between" flexWrap="nowrap">
            <XStack gap="$2" flexShrink={0}>
              <Text fontFamily="monospace" fontSize={12}>
                {group.amount}
              </Text>
              <Text fontFamily="monospace" fontSize={12}>*</Text>
            </XStack>
            <Text fontFamily="monospace" fontSize={12} ta="right" flexShrink={1}>
              {formatNumbersList(group.numbers)}
            </Text>
          </XStack>
        ))}

        {reventados.length > 0 && (
          <>
            <XStack my={2} jc="center">
              <Text fontFamily="monospace" fontSize={11}>*******REVENTADOS*******</Text>
            </XStack>
            {reventados.map((group, idx) => (
              <XStack key={`r-${idx}`} gap="$2" jc="space-between" flexWrap="nowrap">
                <XStack gap="$2" flexShrink={0}>
                  <Text fontFamily="monospace" fontSize={12}>
                    {group.amount}
                  </Text>
                  <Text fontFamily="monospace" fontSize={12}>*</Text>
                </XStack>
                <Text fontFamily="monospace" fontSize={12} ta="right" flexShrink={1}>
                  {formatNumbersList(group.numbers)}
                </Text>
              </XStack>
            ))}
          </>
        )}
      </YStack>

      <Card mt="$2" p="$2" backgroundColor="$background" {...sectionBorder}>
        <XStack jc="space-between" ai="center">
          <Text fontFamily="monospace" fontSize={14} fontWeight="900">TOTAL</Text>
          <Text fontFamily="monospace" fontSize={14} fontWeight="900">{total}</Text>
        </XStack>
      </Card>

      <YStack mt="$2" ai="center" gap="$1" {...sectionBorder} p="$2" backgroundColor="$background">
        <Text fontFamily="monospace" fontSize={12}>PAGAMOS {total > 0 ? Math.floor(total * 0.0001) : 85}</Text>
        {barcodeBlocks}
      </YStack>
    </YStack>
  )
}
