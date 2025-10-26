import React, { useCallback, useMemo } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { YStack, XStack, Text, ScrollView } from 'tamagui'
import { Button } from '@/components/ui'
import { apiClient } from '@/lib/api.client'
import TicketReceipt from '@/components/tickets/TicketReceipt'
import { Share } from 'react-native'

async function fetchTicketDetail(id: string) {
  const res = await apiClient.get<any>(`/tickets/${id}`)
  return res?.data ?? res
}

export default function VendedorTicketPreview() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { data: ticket, isLoading, isError, refetch } = useQuery({
    queryKey: ['tickets', 'detail', 'vendedor', id],
    queryFn: () => fetchTicketDetail(String(id)),
    enabled: !!id,
    staleTime: 30_000,
  })

  const shareText = useMemo(() => {
    if (!ticket) return ''
    const tn = ticket.ticketNumber ?? (ticket as any).code ?? ticket.id
    const head = `Tiquete #${tn} — ${ticket?.loteria?.name ?? ''}`
    const lines = (ticket?.jugadas ?? []).map((j: any) =>
      `${j.amount} * ${j.type === 'REVENTADO' ? (j.reventadoNumber ?? j.number) : j.number}`
    )
    return `${head}\n${lines.join('\n')}\nTotal: ${ticket.totalAmount ?? ''}`
  }, [ticket])

  const onShare = useCallback(async () => {
    try {
      // Web share API via navigator if available
      // @ts-ignore
      if (typeof navigator !== 'undefined' && navigator.share) {
        // @ts-ignore
        await navigator.share({ title: 'Ticket', text: shareText })
        return
      }
      await Share.share({ message: shareText })
    } catch {}
  }, [shareText])

  const onPrint = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }, [])

  if (isLoading) {
    return (
      <YStack f={1} ai="center" jc="center" bg="$background">
        <Text>Cargando ticket...</Text>
      </YStack>
    )
  }

  if (isError || !ticket) {
    return (
      <YStack f={1} ai="center" jc="center" bg="$background" p="$4">
        <Text color="$error">Error al cargar ticket</Text>
        <Button mt="$3" onPress={() => refetch()}>Reintentar</Button>
        <Button mt="$2" variant="outlined" onPress={() => router.replace('/vendedor')}>Volver</Button>
      </YStack>
    )
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack p="$4" gap="$4" ai="center">
        <XStack gap="$2">
          <Button variant="ghost" onPress={() => router.replace('/vendedor')}>Cerrar</Button>
          <Button onPress={onShare}>Compartir</Button>
          <Button variant="outlined" onPress={onPrint}>Imprimir</Button>
        </XStack>

        <TicketReceipt ticket={ticket} />
      </YStack>
    </ScrollView>
  )
}
