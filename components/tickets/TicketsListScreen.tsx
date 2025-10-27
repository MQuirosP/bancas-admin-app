import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, ScrollView, Spinner, Separator } from 'tamagui'
import { Button, Input, Card, Select, DatePicker } from '@/components/ui'
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
import { Toolbar } from '@/components/ui/Toolbar'
import type { Scope } from '@/types/scope'
import { getDateParam, type DateTokenBasic, formatDateYYYYMMDD } from '@/lib/dateFormat'

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

export default function TicketsListScreen({ scope }: Props) {
  const router = useRouter()
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'

  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

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

    return params
  }, [page, pageSize, dateFilter, dateFrom, dateTo, statusFilter, scope])

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['tickets', 'list', scope, backendParams],
    queryFn: () => fetchTickets(backendParams),
    placeholderData: { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } },
    staleTime: 30_000,
  })

  const filteredRows = useMemo(() => {
    let rows = data?.data ?? []
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
  }, [data, searchInput])

  const meta = data?.meta

  return (
    <ScrollView flex={1} backgroundColor="$background" contentContainerStyle={{ flexGrow: 1 }}>
      <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        <XStack justifyContent="space-between" ai="center" gap="$3" flexWrap="wrap">
          <XStack ai="center" gap="$2">
            {(scope === 'admin' || scope === 'ventana') && (
              <Button
                size="$3"
                icon={(p:any)=> <ArrowLeft {...p} size={24} color={iconColor} />}
                onPress={()=> safeBack(scope === 'admin' ? '/admin' : '/ventana')}
                backgroundColor="transparent"
                borderWidth={0}
                hoverStyle={{ backgroundColor: 'transparent' }}
                pressStyle={{ scale: 0.98 }}
              />
            )}
            <Text fontSize="$8" fontWeight="bold">
              {scope === 'admin' ? 'Tickets (Admin)' : 'Tickets de la Ventana'}
            </Text>
            {isFetching && <Spinner size="small" />}
          </XStack>
          {(scope === 'admin' || scope === 'ventana') && (
            <Button
              size="$3"
              onPress={() => router.push((scope === 'admin' ? '/admin/tickets/nuevo' : '/ventana/tickets/nuevo') as any)}
            >
              Nuevo Ticket
            </Button>
          )}
        </XStack>

        <Toolbar>
          <YStack gap="$3">
            {/* Fila 1: búsqueda + fecha + solo ganadores (responsiva) */}
            <XStack gap="$3" ai="center" flexWrap="wrap">
              {/* Buscar */}
              <XStack position="relative" ai="center" flex={1} minWidth={260} maxWidth="100%">
                <Input
                  flex={1}
                  minWidth={240}
                  placeholder="Buscar por ID, vendedor, ventana, lotería..."
                  value={searchInput}
                  onChangeText={setSearchInput}
                  inputMode="search"
                  enterKeyHint="search"
                  pr="$8"
                  returnKeyType="search"
                  aria-label="Buscar tickets"
                  focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
                />
                {searchInput.length > 0 && (
                  <Button
                    size="$2"
                    circular
                    icon={X}
                    position="absolute"
                    right="$2"
                    onPress={() => setSearchInput('')}
                    aria-label="Limpiar búsqueda"
                    hoverStyle={{ bg: '$backgroundHover' }}
                  />
                )}
              </XStack>

              <Button size="$3" icon={Search} onPress={() => setPage(1)}>
                Buscar
              </Button>

              <Separator vertical />

              {/* Fecha + Solo ganadores (no se sobreponen, se envuelven si no hay espacio) */}
              <XStack ai="center" gap="$3" flexWrap="wrap">
                {/* Bloque Fecha */}
                <XStack ai="center" gap="$2" flexShrink={0}>
                  <Text fontSize="$3" fontWeight="600">Fecha:</Text>
                  <Select
                    size="$3"
                    value={dateFilter}
                    onValueChange={(v: any) => setDateFilter(v)}
                  >
                    <Select.Trigger
                      // ← evita que se expanda y se monte sobre el switch
                      width={160}
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
                      <Select.Value>{({
                        today: 'Hoy',
                        yesterday: 'Ayer',
                        range: 'Rango personalizado',
                      } as any)[dateFilter]}</Select.Value>
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

                {/* Bloque Status */}
                <XStack ai="center" gap="$2" flexShrink={0}>
                  <Text fontSize="$3" fontWeight="600">Estado:</Text>
                  <Select
                    size="$3"
                    value={statusFilter}
                    onValueChange={(v: any) => setStatusFilter(v)}
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

                {/* Winners filtering is done on backend via API */}
                {/* Removed client-side FilterSwitch for "Solo ganadores" */}
              </XStack>

            </XStack>

            {/* Fila 2: rango personalizado (también responsiva) */}
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

            {/* Fila 3: acciones a la derecha pero que no desborden */}
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
          </YStack>
        </Toolbar>


        {isLoading ? (
          <Card padding="$4" elevate><Text>Cargando tickets…</Text></Card>
        ) : isError ? (
          <Card padding="$4" elevate bg="$backgroundHover" borderColor="$error" borderWidth={1}>
            <Text color="$error">No fue posible cargar tickets.</Text>
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

              const totalWinnings = jugadas.reduce((sum: number, j: any) => sum + (j.isWinner ? (j.winAmount || 0) : 0), 0)

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
                  pressStyle={{ backgroundColor: '$backgroundPress', borderColor: '$borderColorHover' }}
                  onPress={() => {
                    // navegación por pathname dinámico + params (expo-router)
                    router.push({
                      pathname: scope === 'admin'
                        ? '/admin/tickets/[id]'
                        : scope === 'ventana'
                        ? '/ventana/tickets/[id]'
                        : '/vendedor/tickets/[id]',
                      params: { id: ticket.id },
                    })
                  }}
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
                        Vendedor: {vendorName} • Ventana: {ventanaName}
                      </Text>
                      <Text fontSize="$2" color="$gray10">
                        Creado: {createdAt} • {jugadas.length} jugada(s)
                      </Text>
                    </YStack>

                    <YStack ai="flex-end" gap="$2">
                      <Text fontSize="$6" fontWeight="700" color="$blue11">
                        {formatCurrency(ticket.totalAmount)}
                      </Text>
                      <XStack px="$2" py="$1" br="$2" bw={1} {...statusBadgeProps}>
                        <Text fontSize="$2" fontWeight="700" textTransform="uppercase" color={statusBadgeProps.color}>
                          {ticket.status}
                        </Text>
                      </XStack>
                      {hasWinner && totalWinnings > 0 && (
                        <Text fontSize="$5" fontWeight="700" color="$green10">
                          Ganado: {formatCurrency(totalWinnings)}
                        </Text>
                      )}
                    </YStack>
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
  )
}

