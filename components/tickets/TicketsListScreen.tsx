import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, ScrollView, Spinner, Separator } from 'tamagui'
import { Button, Input, Card, Select, DatePicker, CollapsibleToolbar } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import { Search, X, RefreshCw, ChevronDown, Check, ArrowLeft } from '@tamagui/lucide-icons'
import { safeBack } from '@/lib/navigation'
import { useTheme } from 'tamagui'
import { useRouter } from 'expo-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { apiClient } from '@/lib/api.client'
import { formatCurrency } from '@/utils/formatters'
import FilterSwitch from '@/components/ui/FilterSwitch'
import type { Scope } from '@/types/scope'
import { getDateParam, type DateTokenBasic, formatDateYYYYMMDD } from '@/lib/dateFormat'
import { object } from 'zod'
import TicketActionButtons from './TicketActionButtons'
import TicketPreviewModal from './TicketPreviewModal'
import { PaymentModal } from './shared'
import type { CreatePaymentInput } from '@/types/payment.types'
import { useToast } from '@/hooks/useToast'
import { calculatePaymentTotals } from '@/lib/tickets'

// Ajusta a tu modelo real si tienes tipos en '@/types/api.types'
export type Ticket = {
  id: string
  ventanaId: string
  vendedorId: string
  loteriaId: string
  sorteoId: string
  totalAmount: number
  status: string
  createdAt: string
  jugadas?: any[]
  vendedor?: { name?: string }
  ventana?: { name?: string; code?: string }
  loteria?: { name?: string }
  sorteo?: { name?: string }
}

type Props = {
  scope: Scope
  filterPendientes?: boolean
  /**
   * Modo de operación de la lista
   * - 'general': Lista normal con todos los filtros
   * - 'pending-payments': Solo ganadores pendientes, filtros simplificados
   */
  variant?: 'general' | 'pending-payments'
  /**
   * Callback cuando se selecciona un ticket (modo pending-payments)
   * Si se proporciona, se usa en lugar de los botones normales
   */
  onSelectTicket?: (ticket: Ticket) => void
  /**
   * Ocultar el header con título y botón "Nuevo Ticket"
   */
  hideHeader?: boolean
}

// ✅ Tickets endpoint only supports: today, yesterday, range
// (No week/month/year - use range with custom dates if needed)
type DateFilter = 'today' | 'yesterday' | 'range'

const TICKET_STATUSES = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'EVALUATED', label: 'Evaluados' },
  { value: 'PAID', label: 'Pagados' },
  { value: 'CANCELED', label: 'Cancelados' },
]

const STATUS_LABEL_MAP = Object.fromEntries(TICKET_STATUSES.map(s => [s.value, s.label]))

const DATE_FILTER_LABELS = {
  today: 'Hoy',
  yesterday: 'Ayer',
  range: 'Rango personalizado',
} as const

// Rango personalizado utilizará DatePicker (web/nativo)

async function fetchTickets(params: any): Promise<{ data: Ticket[]; meta: any }> {
  const res = await apiClient.get<any>('/tickets', params)
  const payload = res ?? {}
  const actualData = payload?.data?.data ?? payload?.data ?? []
  const actualMeta = payload?.data?.meta ?? payload?.meta ?? {}
  return {
    data: Array.isArray(actualData) ? actualData : [],
    meta: {
      page: Number(actualMeta?.page ?? params.page ?? 1),
      pageSize: Number(actualMeta?.pageSize ?? params.pageSize ?? 20),
      total: Number(actualMeta?.total ?? 0),
      totalPages: Number(actualMeta?.totalPages ?? 1),
    }
  }
}

export default function TicketsListScreen({ 
  scope, 
  filterPendientes,
  variant = 'general',
  onSelectTicket,
  hideHeader = false
}: Props) {
  const router = useRouter()
  const theme = useTheme()
  const { success, error } = useToast()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'

  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>(variant === 'pending-payments' ? 'today' : 'today')
  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>(variant === 'pending-payments' ? 'EVALUATED' : 'ALL')

  // Modals
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTicket, setPreviewTicket] = useState<Ticket | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentTicket, setPaymentTicket] = useState<Ticket | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

  const backendParams = useMemo(() => {
    const params: any = {
      page,
      pageSize,
      // ✅ Backend authority: only 'all' | 'mine'
      scope: scope === 'admin' ? 'all' : 'mine',
    }

    // ✅ Backend authority: use tokens, not Date calculations
    // Tickets endpoint only supports: today, yesterday, range
    if (dateFilter === 'range' && dateFrom && dateTo) {
      Object.assign(params, getDateParam('range', formatDateYYYYMMDD(dateFrom), formatDateYYYYMMDD(dateTo)))
    } else {
      Object.assign(params, getDateParam(dateFilter as DateTokenBasic))
    }

    // Add status filter if not 'ALL'
    if (statusFilter !== 'ALL') {
      params.status = statusFilter
    }

    // Para modo pending-payments, forzar solo tickets evaluados con ganadores
    if (variant === 'pending-payments') {
      params.status = 'EVALUATED'
      params.hasWinner = true
    }

    return params
  }, [page, pageSize, dateFilter, dateFrom, dateTo, statusFilter, scope, variant])

  const { data, isLoading, isFetching, isError, error: queryError, refetch } = useQuery({
    queryKey: ['tickets', 'list', scope, backendParams],
    queryFn: () => fetchTickets(backendParams),
    placeholderData: { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } },
    staleTime: 30_000,
    onError: (err: any) => {
      if (err?.code === 'RBAC_003') {
        error('Tu cuenta necesita configuración. Contacta al administrador.')
      }
    },
  })

  const filteredRows = useMemo(() => {
    let rows = data?.data ?? []
    
    // Filtrar por pendientes de pago (ganadores sin pagar completamente)
    // ✅ Usando utility centralizado
    if (filterPendientes) {
      rows = rows.filter((t) => {
        const totals = calculatePaymentTotals(t as any)
        return totals.hasWinner && !totals.isFullyPaid && totals.totalPayout > 0
      })
    }
    
    // ✅ Status filtering is done on backend now
    // ✅ Winners filtering should be done on backend via params
    if (searchInput.trim()) {
      const search = searchInput.toLowerCase()
      rows = rows.filter((t) => {
        const vendorName = t.vendedor?.name?.toLowerCase() || ''
        const ventanaName = t.ventana?.name?.toLowerCase() || t.ventana?.code?.toLowerCase() || ''
        const loteriaName = t.loteria?.name?.toLowerCase() || ''
        const sorteoName = t.sorteo?.name?.toLowerCase() || ''
        return (
          t.id.toLowerCase().includes(search) ||
          vendorName.includes(search) ||
          ventanaName.includes(search) ||
          loteriaName.includes(search) ||
          sorteoName.includes(search)
        )
      })
    }
    return rows
  }, [data, searchInput, filterPendientes])

  const meta = data?.meta

  // Handler para búsqueda
  const handleSearch = () => {
    setPage(1)
    refetch()
  }

  // Handlers para modals
  const handlePreviewTicket = (ticket: Ticket) => {
    setPreviewTicket(ticket)
    setPreviewOpen(true)
  }

  const handlePaymentTicket = (ticket: Ticket) => {
    setPaymentTicket(ticket)
    setPaymentOpen(true)
  }

  const handlePaymentSubmit = async (input: CreatePaymentInput) => {
    setPaymentLoading(true)
    try {
      // ✅ v2.0: Usar endpoint unificado
      const { ticketId, ...paymentData } = input
      await apiClient.post(`/tickets/${ticketId}/pay`, paymentData)
      // El PaymentModal maneja el toast de éxito y el refetch en onSuccess
    } catch (err: any) {
      error(err.message || 'Error al registrar pago')
      throw err // Re-throw para que el modal maneje el error
    } finally {
      setPaymentLoading(false)
    }
  }

  return (
    <>
      <ScrollView flex={1} backgroundColor="$background" contentContainerStyle={{ flexGrow: 1 }}>
      <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        {!hideHeader && (
          <XStack justifyContent="space-between" ai="center" gap="$3" flexWrap="wrap">
            <XStack ai="center" gap="$2">
              {(scope === 'admin' || scope === 'ventana' || scope === 'vendedor') && (
                <Button
                  size="$3"
                  icon={(p:any)=> <ArrowLeft {...p} size={24} color={iconColor} />}
                  onPress={()=> safeBack(
                    scope === 'admin' ? '/admin' 
                    : scope === 'vendedor' ? '/vendedor'
                    : '/ventana'
                  )}
                  backgroundColor="transparent"
                  borderWidth={0}
                  hoverStyle={{ backgroundColor: 'transparent' }}
                  pressStyle={{ scale: 0.98 }}
                />
              )}
              <Text fontSize="$8" fontWeight="bold">
                {variant === 'pending-payments' 
                  ? 'Tiquetes Ganadores Pendientes'
                  : scope === 'admin' ? 'Tickets (Admin)' 
                  : scope === 'vendedor' ? 'Mis Tickets'
                  : 'Tickets del Listero'
                }
              </Text>
              {isFetching && <Spinner size="small" />}
            </XStack>
            {(scope === 'admin' || scope === 'ventana' || scope === 'vendedor') && variant !== 'pending-payments' && (
              <Button
                size="$3"
                onPress={() => router.push((
                  scope === 'admin' ? '/admin/tickets/nuevo' 
                  : scope === 'vendedor' ? '/vendedor/tickets/nuevo'
                  : '/ventana/tickets/nuevo'
                ) as any)}
              >
                Nuevo Ticket
              </Button>
            )}
          </XStack>
        )}

        <CollapsibleToolbar
          searchContent={
            <XStack gap="$2" ai="center" flex={1}>
              <XStack flex={1} position="relative" ai="center">
                <Button
                  size="$2"
                  circular
                  icon={(p:any)=> <Search {...p} size={18} color="$textSecondary" />}
                  position="absolute"
                  left="$2"
                  zIndex={1}
                  onPress={handleSearch}
                  aria-label="Buscar"
                  backgroundColor="transparent"
                  borderWidth={0}
                  hoverStyle={{ bg: '$backgroundHover' }}
                />
                
                <Input
                  flex={1}
                  placeholder={variant === 'pending-payments' ? "Buscar por # ticket..." : "Buscar por ID, vendedor, listero, lotería..."}
                  value={searchInput}
                  onChangeText={setSearchInput}
                  onSubmitEditing={handleSearch}
                  inputMode="search"
                  enterKeyHint="search"
                  returnKeyType="search"
                  pl="$9"
                  pr={searchInput ? "$9" : "$3"}
                  aria-label="Buscar tickets"
                />
                
                {searchInput.length > 0 && (
                  <Button
                    size="$2"
                    circular
                    icon={(p:any)=> <X {...p} size={18} />}
                    position="absolute"
                    right="$1"
                    zIndex={1}
                    onPress={() => setSearchInput('')}
                    aria-label="Limpiar búsqueda"
                    backgroundColor="transparent"
                    borderWidth={0}
                    hoverStyle={{ bg: '$backgroundHover' }}
                  />
                )}
              </XStack>
            </XStack>
          }
          filtersContent={
            variant !== 'pending-payments' ? (
              <YStack gap="$3">
                {/* Filtros de fecha y estado */}
                <XStack gap="$4" ai="center" flexWrap="wrap">
                  <XStack ai="center" gap="$2" minWidth={200} flexShrink={0}>
                    <Text fontSize="$3" fontWeight="600" flexShrink={0}>Fecha:</Text>
                    <Select
                      size="$3"
                      value={dateFilter}
                      onValueChange={(v: any) => setDateFilter(v)}
                    >
                      <Select.Trigger
                        width={180}
                        flexShrink={0}
                        br="$3"
                        bw={1}
                        bc="$borderColor"
                        backgroundColor="$background"
                        px="$3"
                        hoverStyle={{ bg: '$backgroundHover' }}
                        focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
                        iconAfter={ChevronDown}
                      >
                        <Select.Value>{DATE_FILTER_LABELS[dateFilter]}</Select.Value>
                      </Select.Trigger>

                      <Select.Content zIndex={1000}>
                        <YStack br="$3" bw={1} bc="$borderColor" backgroundColor="$background">
                          <Select.Viewport>
                            {[
                              { value: 'today', label: 'Hoy' },
                              { value: 'yesterday', label: 'Ayer' },
                              { value: 'range', label: 'Rango personalizado' },
                            ].map((it, idx) => (
                              <Select.Item key={it.value} value={it.value} index={idx} pressStyle={{ bg: '$backgroundHover' }} bw={0} px="$3">
                                <Select.ItemText>{it.label}</Select.ItemText>
                                <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </YStack>
                      </Select.Content>
                    </Select>
                  </XStack>

                  <XStack width={1} height={24} backgroundColor="$borderColor" marginHorizontal="$2" />

                  <XStack ai="center" gap="$2" minWidth={220} flexShrink={0}>
                    <Text fontSize="$3" fontWeight="600" flexShrink={0}>Estado:</Text>
                    <Select
                      size="$3"
                      value={statusFilter}
                      onValueChange={(v: any) => setStatusFilter(v)}
                    >
                      <Select.Trigger
                        width={200}
                        flexShrink={0}
                        br="$3"
                        bw={1}
                        bc="$borderColor"
                        backgroundColor="$background"
                        px="$3"
                        hoverStyle={{ bg: '$backgroundHover' }}
                        focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
                        iconAfter={ChevronDown}
                      >
                        <Select.Value>{STATUS_LABEL_MAP[statusFilter as keyof typeof STATUS_LABEL_MAP] || 'Todos'}</Select.Value>
                      </Select.Trigger>

                      <Select.Content zIndex={1000}>
                        <YStack br="$3" bw={1} bc="$borderColor" backgroundColor="$background">
                          <Select.Viewport>
                            {TICKET_STATUSES.map((it, idx) => (
                              <Select.Item key={it.value} value={it.value} index={idx} pressStyle={{ bg: '$backgroundHover' }} bw={0} px="$3">
                                <Select.ItemText>{it.label}</Select.ItemText>
                                <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </YStack>
                      </Select.Content>
                    </Select>
                  </XStack>
                </XStack>

                {/* Rango personalizado */}
                {dateFilter === 'range' && (
                  <XStack gap="$3" ai="flex-start" flexWrap="wrap">
                    <DatePicker
                      value={dateFrom}
                      onChange={(d) => setDateFrom(d)}
                      placeholder="Desde"
                    />
                    <DatePicker
                      value={dateTo}
                      onChange={(d) => setDateTo(d)}
                      placeholder="Hasta"
                    />
                  </XStack>
                )}
              </YStack>
            ) : undefined
          }
          actionsContent={
            variant !== 'pending-payments' ? (
              <XStack gap="$3" ai="center" flexWrap="wrap">
                <Button
                  size="$3"
                  icon={(p:any)=> <RefreshCw {...p} color={iconColor} />}
                  onPress={() => { setPage(1); refetch() }}
                  backgroundColor="$green4"
                  borderColor="$green8"
                  borderWidth={1}
                  hoverStyle={{ backgroundColor: '$green5' }}
                  pressStyle={{ backgroundColor: '$green6', scale: 0.98 }}
                >
                  Refrescar
                </Button>

                <Button
                  size="$3"
                  onPress={() => {
                    setSearchInput('')
                    setDateFilter('today')
                    setDateFrom(null)
                    setDateTo(null)
                    setStatusFilter('ALL')
                    setPage(1)
                  }}
                  backgroundColor="$gray4"
                  borderColor="$gray8"
                  borderWidth={1}
                  hoverStyle={{ backgroundColor: '$gray5' }}
                  pressStyle={{ backgroundColor: '$gray6' }}
                >
                  Limpiar
                </Button>
              </XStack>
            ) : undefined
          }
        />


        {isLoading ? (
          <Card padding="$4" elevate><Text>Cargando tickets…</Text></Card>
        ) : isError ? (
          <Card padding="$6" bg="$red2" borderColor="$red8" borderWidth={2} ai="center" jc="center" gap="$3">
            <Text fontSize="$6" fontWeight="bold" color="$red11">⚠️ Error de Configuración</Text>
            <Text color="$red11" fontSize="$4" ta="center">
              {(queryError as any)?.code === 'RBAC_003' 
                ? 'Tu cuenta necesita configuración. Por favor contacta al administrador del sistema para que configure tu cuenta correctamente.'
                : 'No fue posible cargar los tickets. Por favor intenta de nuevo o contacta al administrador.'}
            </Text>
          </Card>
        ) : (filteredRows?.length ?? 0) === 0 ? (
          <Card padding="$6" ai="center" jc="center" elevate borderColor="$borderColor" borderWidth={1}>
            <Text fontSize="$5" fontWeight="600">Sin resultados</Text>
            <Text color="$textSecondary">Ajusta filtros o intenta una búsqueda diferente.</Text>
          </Card>
        ) : (
          <YStack gap="$2">
            {filteredRows!.map((ticket) => {
              const vendorName = ticket.vendedor?.name || 'N/A'
              const ventanaName = ticket.ventana?.name || ticket.ventana?.code || 'N/A'
              const loteriaName = ticket.loteria?.name || 'N/A'
              const sorteoName = ticket.sorteo?.name || 'N/A'
              const jugadas = ticket.jugadas || []
              const hasWinner = jugadas.some((j: any) => j.isWinner === true)
              const createdAt = ticket.createdAt ? format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A'

              // ✅ v2.0: Usar campos unificados si están disponibles, fallback a cálculo manual
              // PERO: Si totalPayout es 0 y el ticket es ganador, calcular desde jugadas
              const hasUnifiedPayout = (ticket as any).totalPayout !== undefined && (ticket as any).totalPayout !== null
              const shouldUseUnified = hasUnifiedPayout && ((ticket as any).totalPayout > 0 || !hasWinner)
              
              const totalWinnings = shouldUseUnified
                ? (ticket as any).totalPayout
                : jugadas.reduce((sum: number, j: any) => sum + (j.isWinner ? (j.payout || j.winAmount || 0) : 0), 0)
              
              const totalPaid = shouldUseUnified ? ((ticket as any).totalPaid || 0) : 0
              const remainingAmount = shouldUseUnified ? ((ticket as any).remainingAmount || 0) : (totalWinnings - totalPaid)
              const isPaid = ticket.status === 'PAID'
              const hasPartialPayment = totalPaid > 0 && totalPaid < totalWinnings

              const statusBadgeProps = (() => {
                switch (ticket.status) {
                  case 'EVALUATED': return { bg: '$yellow4', color: '$yellow11', bc: '$yellow8' }
                  case 'ACTIVE': return { bg: '$green4', color: '$green11', bc: '$green8' }
                  case 'RESTORED': return { bg: '$blue4', color: '$blue11', bc: '$blue8' }
                  case 'CANCELLED': return { bg: '$red4', color: '$red11', bc: '$red8' }
                  default: return { bg: '$gray4', color: '$gray11', bc: '$gray8' }
                }
              })()

              // Consecutivo mostrado: ticketNumber o code del backend; fallback: últimos 8 del id
              const displayNum = (ticket as any).ticketNumber ?? (ticket as any).code ?? ticket.id.slice(-8)
              return (
                <Card
                  key={ticket.id}
                  padding="$4"
                  backgroundColor="$backgroundHover"
                  borderColor={hasWinner ? '$green8' : '$borderColor'}
                  borderWidth={hasWinner ? 2 : 1}
                  gap="$3"
                >
                  <XStack justifyContent="space-between" ai="flex-start" gap="$3" flexWrap="wrap">
                    <YStack flex={1} gap="$1" minWidth={260}>
                      <XStack ai="center" gap="$2" flexWrap="wrap">
                        <Text fontSize="$5" fontWeight="600">Tiquete #{displayNum}</Text>
                        {hasWinner && (
                          <XStack bg="$green4" px="$2" py="$1" br="$2" bw={1} bc="$green8">
                            <Text color="$green11" fontSize="$2" fontWeight="700">GANADOR</Text>
                          </XStack>
                        )}
                      </XStack>
                      <Text fontSize="$3" color="$textSecondary">
                        {loteriaName} • {sorteoName}
                      </Text>
                      <Text fontSize="$3" color="$textSecondary">
                        Vendedor: {vendorName} • Listero: {ventanaName}
                      </Text>
                      <Text fontSize="$2" color="$gray10">
                        Creado: {createdAt} • {jugadas.length} jugada(s)
                      </Text>
                    </YStack>

                    <YStack ai="flex-end" gap="$2">
                      <Text fontSize="$6" fontWeight="700" color="$blue11">
                        {formatCurrency(ticket.totalAmount)}
                      </Text>
                      
                      {/* Status badge + SIN PAGAR al lado */}
                      <XStack gap="$2" ai="center">
                        <XStack px="$2" py="$1" br="$2" bw={1} {...statusBadgeProps}>
                          <Text fontSize="$2" fontWeight="700" textTransform="uppercase" color={statusBadgeProps.color}>
                            {ticket.status}
                          </Text>
                        </XStack>
                        {hasWinner && totalWinnings > 0 && !totalPaid && !isPaid && ticket.status === 'EVALUATED' && (
                          <XStack bg="$red4" px="$2" py="$1" br="$2" bw={1} bc="$red8">
                            <Text color="$red11" fontSize="$2" fontWeight="700">SIN PAGAR</Text>
                          </XStack>
                        )}
                      </XStack>
                      
                      {hasWinner && totalWinnings > 0 && (
                        <>
                          <Text fontSize="$5" fontWeight="700" color="$green10">
                            Premio: {formatCurrency(totalWinnings)}
                          </Text>
                          
                          {/* ✅ v2.0: Información de pagos */}
                          {isPaid && (
                            <XStack bg="$green4" px="$2" py="$1" br="$2" bw={1} bc="$green8" gap="$1">
                              <Text color="$green11" fontSize="$2" fontWeight="700">✓ PAGADO</Text>
                            </XStack>
                          )}
                          
                          {hasPartialPayment && !isPaid && (
                            <YStack ai="flex-end" gap="$1">
                              <XStack bg="$yellow4" px="$2" py="$1" br="$2" bw={1} bc="$yellow8">
                                <Text color="$yellow11" fontSize="$2" fontWeight="700">PAGO PARCIAL</Text>
                              </XStack>
                              <Text fontSize="$3" fontWeight="600" color="$green10">
                                Pagado: {formatCurrency(totalPaid)}
                              </Text>
                              <Text fontSize="$3" fontWeight="600" color="$red10">
                                Pendiente: {formatCurrency(remainingAmount)}
                              </Text>
                            </YStack>
                          )}
                        </>
                      )}
                    </YStack>
                  </XStack>

                  {/* Botones de acción */}
                  <XStack gap="$2" jc="flex-end">
                    {onSelectTicket ? (
                      <Button
                        size="$3"
                        onPress={() => onSelectTicket(ticket)}
                        backgroundColor="$green4"
                        borderColor="$green8"
                        borderWidth={1}
                        hoverStyle={{ backgroundColor: '$green5' }}
                        pressStyle={{ backgroundColor: '$green6', scale: 0.98 }}
                      >
                        <Text>Pagar</Text>
                      </Button>
                    ) : (
                      <TicketActionButtons
                        ticket={ticket}
                        onView={handlePreviewTicket}
                        onPayment={handlePaymentTicket}
                      />
                    )}
                  </XStack>
                </Card>
              )
            })}
          </YStack>
        )}

        {!!meta && meta.totalPages > 0 && (
          <XStack gap="$2" jc="center" mt="$4" ai="center">
            <Button size="$2" variant="secondary" disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}>
              Anterior
            </Button>
            <Card padding="$2" px="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
              <Text fontSize="$3">
                Página {meta.page} de {meta.totalPages} • {filteredRows.length} de {meta.total} tickets
              </Text>
            </Card>
            <Button size="$2" variant="secondary" disabled={page >= (meta.totalPages || 1)} onPress={() => setPage((p) => Math.min(p + 1, meta.totalPages || p + 1))}>
              Siguiente
            </Button>
          </XStack>
        )}
      </YStack>
    </ScrollView>

    {/* Modals */}
    <TicketPreviewModal
      key="ticket-preview-modal"
      isOpen={previewOpen}
      ticket={previewTicket}
      onClose={() => {
        setPreviewOpen(false)
        setPreviewTicket(null)
      }}
    />

    <PaymentModal
      key="ticket-payment-modal"
      isOpen={paymentOpen}
      ticket={paymentTicket}
      onClose={() => {
        setPaymentOpen(false)
        setPaymentTicket(null)
      }}
      onSubmit={handlePaymentSubmit}
      isLoading={paymentLoading}
      onSuccess={() => refetch()}
    />
    </>
  )
}

