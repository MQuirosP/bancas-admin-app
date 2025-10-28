import React, { useMemo } from 'react'
import { YStack, XStack, Text, ScrollView, Dialog, VisuallyHidden } from 'tamagui'
import { Button, Card } from '@/components/ui'
import { X, TrendingUp } from '@tamagui/lucide-icons'
import { formatCurrency } from '@/utils/formatters'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export type Jugada = {
  id: string
  type: string
  number: string
  amount: number
  finalMultiplierX?: number
  payout?: number
  winAmount?: number
  isWinner?: boolean
}

export type TicketForPreview = {
  id: string
  ticketNumber?: string
  totalAmount: number
  status: string
  createdAt: string
  jugadas?: Jugada[]
  vendedor?: { name?: string; username?: string }
  ventana?: { name?: string; code?: string }
  loteria?: { name?: string }
  sorteo?: { name?: string; scheduledAt?: string }
  [key: string]: any
}

interface TicketPreviewModalProps {
  isOpen: boolean
  ticket?: TicketForPreview | null
  onClose: () => void
}

/**
 * Modal de vista previa del tiquete con detalles completos
 * Muestra:
 * - Información básica (número, vendedor, ventana, lotería, sorteo)
 * - Monto total apostado
 * - Lista de jugadas con ganadores
 * - Total ganado (si aplica)
 * - Estado del tiquete
 */
const TicketPreviewModalComponent = ({ isOpen, ticket, onClose }: TicketPreviewModalProps) => {
  const calculations = useMemo(() => {
    if (!ticket?.jugadas) return { totalWinnings: 0, hasWinner: false, displayNum: '' }

    const totalWinnings = ticket.jugadas.reduce((sum: number, j) => {
      return sum + (j.isWinner ? (j.winAmount || j.payout || 0) : 0)
    }, 0)

    const hasWinner = ticket.jugadas.some((j: any) => j.isWinner === true)
    const displayNum = ticket.ticketNumber || ticket.id.slice(-8)

    return { totalWinnings, hasWinner, displayNum }
  }, [ticket])

  if (!ticket) return null

  const createdAt = ticket.createdAt
    ? format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: es })
    : 'N/A'

  const statusColor = (() => {
    switch (ticket.status) {
      case 'EVALUATED': return '$yellow11'
      case 'ACTIVE': return '$green11'
      case 'RESTORED': return '$blue11'
      case 'CANCELLED': return '$red11'
      case 'PAID': return '$purple11'
      default: return '$gray11'
    }
  })()

  const statusBg = (() => {
    switch (ticket.status) {
      case 'EVALUATED': return '$yellow4'
      case 'ACTIVE': return '$green4'
      case 'RESTORED': return '$blue4'
      case 'CANCELLED': return '$red4'
      case 'PAID': return '$purple4'
      default: return '$gray4'
    }
  })()

  return (
    <Dialog modal open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="preview-overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          key={`preview-content-${calculations.displayNum}`}
          bordered
          elevate
          maxHeight="85vh"
          width="90%"
          maxWidth={700}
          padding="$4"
          gap="$4"
          backgroundColor="$background"
        >
          {/* Accessible Title - Hidden visually */}
          <Dialog.Title asChild>
            <VisuallyHidden>
              <Text>Tiquete #{calculations.displayNum}</Text>
            </VisuallyHidden>
          </Dialog.Title>

          {/* Header */}
          <XStack jc="space-between" ai="center" gap="$2">
            <YStack gap="$1" flex={1}>
              <Text fontSize="$7" fontWeight="bold">
                Tiquete #{calculations.displayNum}
              </Text>
              <Text fontSize="$3" color="$textSecondary">
                {ticket.loteria?.name ?? 'N/A'} • {ticket.sorteo?.name ?? 'N/A'}
              </Text>
            </YStack>

            <Button
              size="$3"
              circular
              icon={X}
              backgroundColor="transparent"
              borderWidth={0}
              onPress={onClose}
              hoverStyle={{ backgroundColor: '$backgroundHover' }}
            />
          </XStack>

          <ScrollView flex={1} showsVerticalScrollIndicator={true}>
            <YStack gap="$4" pr="$2">
              {/* Info general */}
              <Card padding="$3" backgroundColor="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
                <YStack gap="$3">
                  {/* Fila 1: Vendedor y Ventana */}
                  <XStack gap="$4" jc="space-between" flexWrap="wrap">
                    <YStack gap="$1">
                      <Text fontSize="$2" color="$textSecondary" fontWeight="600" textTransform="uppercase">
                        Vendedor
                      </Text>
                      <Text fontSize="$4" fontWeight="600">
                        {ticket.vendedor?.name ?? 'N/A'}
                      </Text>
                    </YStack>
                    <YStack gap="$1">
                      <Text fontSize="$2" color="$textSecondary" fontWeight="600" textTransform="uppercase">
                        Ventana
                      </Text>
                      <Text fontSize="$4" fontWeight="600">
                        {ticket.ventana?.name ?? ticket.ventana?.code ?? 'N/A'}
                      </Text>
                    </YStack>
                  </XStack>

                  {/* Fila 2: Fecha y Estado */}
                  <XStack gap="$4" jc="space-between" flexWrap="wrap" ai="flex-start">
                    <YStack gap="$1">
                      <Text fontSize="$2" color="$textSecondary" fontWeight="600" textTransform="uppercase">
                        Fecha creación
                      </Text>
                      <Text fontSize="$3" fontFamily="$mono">
                        {createdAt}
                      </Text>
                    </YStack>
                    <XStack
                      px="$3"
                      py="$2"
                      br="$3"
                      bw={1}
                      bc={`$${ticket.status === 'EVALUATED' ? 'yellow8' : ticket.status === 'ACTIVE' ? 'green8' : ticket.status === 'PAID' ? 'purple8' : 'gray8'}`}
                      backgroundColor={statusBg}
                    >
                      <Text fontSize="$3" fontWeight="700" color={statusColor} textTransform="uppercase">
                        {ticket.status}
                      </Text>
                    </XStack>
                  </XStack>
                </YStack>
              </Card>

              {/* Montos */}
              <XStack gap="$3" jc="space-between" flexWrap="wrap">
                <Card
                  flex={1}
                  minWidth={150}
                  padding="$3"
                  backgroundColor="$backgroundHover"
                  borderColor="$blue8"
                  borderWidth={1}
                  gap="$2"
                >
                  <Text fontSize="$2" color="$textSecondary" fontWeight="600" textTransform="uppercase">
                    Monto Apostado
                  </Text>
                  <Text fontSize="$6" fontWeight="700" color="$blue11">
                    {formatCurrency(ticket.totalAmount)}
                  </Text>
                </Card>

                {calculations.hasWinner && calculations.totalWinnings > 0 && (
                  <Card
                    flex={1}
                    minWidth={150}
                    padding="$3"
                    backgroundColor="$backgroundHover"
                    borderColor="$green8"
                    borderWidth={2}
                    gap="$2"
                  >
                    <Text fontSize="$2" color="$textSecondary" fontWeight="600" textTransform="uppercase">
                      Total Ganado
                    </Text>
                    <Text fontSize="$6" fontWeight="700" color="$green11">
                      {formatCurrency(calculations.totalWinnings)}
                    </Text>
                  </Card>
                )}
              </XStack>

              {/* Jugadas */}
              <YStack gap="$2">
                <XStack ai="center" gap="$2">
                  <Text fontSize="$5" fontWeight="bold">
                    Jugadas ({ticket.jugadas?.length ?? 0})
                  </Text>
                  {calculations.hasWinner && (
                    <XStack bg="$green4" px="$2" py="$1" br="$2" bw={1} bc="$green8">
                      <Text fontSize="$2" fontWeight="700" color="$green11">
                        CON GANADOR
                      </Text>
                    </XStack>
                  )}
                </XStack>

                {(ticket.jugadas ?? []).length === 0 ? (
                  <Card padding="$3" backgroundColor="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
                    <Text color="$textSecondary">Sin jugadas registradas</Text>
                  </Card>
                ) : (
                  <YStack gap="$2">
                    {ticket.jugadas?.map((jugada, idx) => (
                      <Card
                        key={jugada.id && jugada.id.trim() ? jugada.id : `jugada-${idx}`}
                        padding="$3"
                        backgroundColor={jugada.isWinner ? '$green2' : '$backgroundHover'}
                        borderColor={jugada.isWinner ? '$green8' : '$borderColor'}
                        borderWidth={jugada.isWinner ? 2 : 1}
                      >
                        <YStack gap="$2">
                          <XStack jc="space-between" ai="center" gap="$2">
                            <XStack ai="center" gap="$2" flex={1}>
                              <Text fontSize="$4" fontWeight="600">
                                {jugada.type}
                              </Text>
                              <Text fontSize="$4" fontWeight="700" color="$blue11" fontFamily="$mono">
                                {jugada.number}
                              </Text>
                            </XStack>
                            {jugada.isWinner && (
                              <XStack bg="$green4" px="$2" py="$1" br="$2" bw={1} bc="$green8">
                                <Text fontSize="$2" fontWeight="700" color="$green11">
                                  GANADOR
                                </Text>
                              </XStack>
                            )}
                          </XStack>

                          <XStack gap="$4" jc="space-between" flexWrap="wrap">
                            <YStack gap="$1">
                              <Text fontSize="$2" color="$textSecondary" fontWeight="600">
                                Apuesta
                              </Text>
                              <Text fontSize="$3" fontWeight="600">
                                {formatCurrency(jugada.amount)}
                              </Text>
                            </YStack>

                            {jugada.finalMultiplierX !== undefined && (
                              <YStack gap="$1">
                                <Text fontSize="$2" color="$textSecondary" fontWeight="600">
                                  Multiplicador
                                </Text>
                                <Text fontSize="$3" fontWeight="600" color="$purple11">
                                  {jugada.finalMultiplierX}x
                                </Text>
                              </YStack>
                            )}

                            {jugada.isWinner && (jugada.winAmount || jugada.payout) && (
                              <YStack gap="$1">
                                <Text fontSize="$2" color="$textSecondary" fontWeight="600">
                                  Premio
                                </Text>
                                <Text fontSize="$4" fontWeight="700" color="$green11">
                                  {formatCurrency(jugada.winAmount || jugada.payout || 0)}
                                </Text>
                              </YStack>
                            )}
                          </XStack>
                        </YStack>
                      </Card>
                    ))}
                  </YStack>
                )}
              </YStack>
            </YStack>
          </ScrollView>

          {/* Footer con botón cerrar */}
          <Button
            size="$3"
            onPress={onClose}
            backgroundColor="$gray4"
            borderColor="$gray8"
            borderWidth={1}
            hoverStyle={{ backgroundColor: '$gray5' }}
            pressStyle={{ backgroundColor: '$gray6', scale: 0.98 }}
          >
            Cerrar
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default TicketPreviewModalComponent
