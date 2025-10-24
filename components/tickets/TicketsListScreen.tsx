// app/admin/tickets/index.tsx
import React, { useMemo, useState, useRef, useEffect } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  Card,
  ScrollView,
  Spinner,
  Separator,
  Select,
  Sheet,
} from 'tamagui'
import { useRouter } from 'expo-router'
import { Search, X, RefreshCw, ChevronDown, Check } from '@tamagui/lucide-icons'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api.client'
import type { Ticket, TicketsQueryParams } from '@/types/api.types'
import { Toolbar } from '@/components/ui/Toolbar'
import { formatCurrency } from '@/utils/formatters'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import FilterSwitch from '@/components/ui/FilterSwitch'
import { Platform } from 'react-native'
import { Scope } from '../../types/scope'

type Props = {
  scope: Scope
  buildDetailPath: (id: string) => string
}

type DateFilter = 'today' | 'yesterday' | 'last7' | 'last30' | 'range'

/** ─────────────── Date Picker Button (web) ─────────────── **/
function pad(n: number) { return String(n).padStart(2, '0') }

function WebDateButton({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLInputElement | null>(null)
  return (
    <YStack gap="$1" width={140}>
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
      />
      <Button
        size="$3"
        px="$3"
        bg="$background"
        bw={1}
        bc="$borderColor"
        hoverStyle={{ bg: '$backgroundHover' }}
        onPress={() => {
          const el = ref.current
          // @ts-ignore
          if (el?.showPicker) el.showPicker(); else { el?.click(); el?.focus() }
        }}
      >
        Fecha
      </Button>
      <Text fontSize="$2" color="$textSecondary">{value || placeholder}</Text>
    </YStack>
  )
}

async function fetchTickets(
  params: TicketsQueryParams & { page: number; pageSize: number; scope?: string; date?: string; from?: string; to?: string }
): Promise<{ data: Ticket[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }> {
  const res = await apiClient.get<any>('/tickets', params)
  const payload: any = res ?? {}

  // El backend devuelve { success, data: { data: [], meta: {} } }
  const actualData = payload?.data?.data ?? payload?.data ?? []
  const actualMeta = payload?.data?.meta ?? payload?.meta ?? {}

  const items: Ticket[] = Array.isArray(actualData) ? actualData : []
  const meta = {
    page: Number(actualMeta?.page ?? params.page ?? 1),
    pageSize: Number(actualMeta?.pageSize ?? params.pageSize ?? 20),
    total: Number(actualMeta?.total ?? 0),
    totalPages: Number(actualMeta?.totalPages ?? 1),
  }
  return { data: items, meta }
}

async function fetchVentanas(): Promise<any[]> {
  const res = await apiClient.get<any>('/ventanas', { pageSize: 100 })
  const payload: any = res ?? {}
  return Array.isArray(payload) ? payload : payload?.data ?? []
}

async function fetchLoterias(): Promise<any[]> {
  const res = await apiClient.get<any>('/loterias', { pageSize: 100 })
  const payload: any = res ?? {}
  return Array.isArray(payload) ? payload : payload?.data ?? []
}

async function fetchSorteos(): Promise<any[]> {
  const res = await apiClient.get<any>('/sorteos', { pageSize: 100 })
  const payload: any = res ?? {}
  return Array.isArray(payload) ? payload : payload?.data ?? []
}

function GenericSelect({
  value,
  onChange,
  items,
  placeholder,
  label,
}: {
  value: string | undefined
  onChange: (val: string | undefined) => void
  items: { value: string; label: string }[]
  placeholder: string
  label: string
}) {
  const internal = value ?? 'ALL'
  const labelOf = (v: string) => items.find((i) => i.value === v)?.label ?? placeholder

  return (
    <Select
      size="$3"
      value={internal}
      onValueChange={(v: string) => onChange(v === 'ALL' ? undefined : v)}
    >
      <Select.Trigger
        px="$3"
        w={160}
        br="$3"
        bw={1}
        bc="$borderColor"
        bg="$background"
        hoverStyle={{ bg: '$backgroundHover' }}
        focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
        iconAfter={ChevronDown}
      >
        <Select.Value>{labelOf(internal)}</Select.Value>
      </Select.Trigger>

      <Select.Adapt when="sm">
        <Sheet modal dismissOnSnapToBottom animation="quick">
          <Sheet.Frame p="$4">
            <Select.Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay />
        </Sheet>
      </Select.Adapt>

      <Select.Content zIndex={1000}>
        <YStack br="$3" bw={1} bc="$borderColor" bg="$background">
          <Select.ScrollUpButton />
          <Select.Viewport>
            <Select.Item
              value="ALL"
              index={0}
              pressStyle={{ bg: '$backgroundHover' }}
              bw={0}
              px="$3"
            >
              <Select.ItemText>{placeholder}</Select.ItemText>
              <Select.ItemIndicator ml="auto">
                <Check size={16} />
              </Select.ItemIndicator>
            </Select.Item>
            {items.map((it, idx) => (
              <Select.Item
                key={it.value}
                value={it.value}
                index={idx + 1}
                pressStyle={{ bg: '$backgroundHover' }}
                bw={0}
                px="$3"
              >
                <Select.ItemText>{it.label}</Select.ItemText>
                <Select.ItemIndicator ml="auto">
                  <Check size={16} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton />
        </YStack>
      </Select.Content>
    </Select>
  )
}

export default function TicketsListScreen({ scope, buildDetailPath }: Props) {
  const router = useRouter()

  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchInput, setSearchInput] = useState('')

  // Filtros del backend
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Filtros locales
  const [filterVentana, setFilterVentana] = useState<string | undefined>(undefined)
  const [filterVendedor, setFilterVendedor] = useState<string | undefined>(undefined)
  const [filterLoteria, setFilterLoteria] = useState<string | undefined>(undefined)
  const [filterSorteo, setFilterSorteo] = useState<string | undefined>(undefined)
  const [filterWinnersOnly, setFilterWinnersOnly] = useState(false)

  // Construir params para el backend
  const backendParams = useMemo(() => {
    const params: any = {
      page,
      pageSize,
      scope: 'all', // Para admin, ver todos
    }

    // Aplicar filtro de fecha
    if (dateFilter === 'today') {
      params.date = 'today'
    } else if (dateFilter === 'yesterday') {
      params.date = 'yesterday'
    } else if (dateFilter === 'last7') {
      params.date = 'range'
      params.from = subDays(new Date(), 7).toISOString()
      params.to = new Date().toISOString()
    } else if (dateFilter === 'last30') {
      params.date = 'range'
      params.from = subDays(new Date(), 30).toISOString()
      params.to = new Date().toISOString()
    } else if (dateFilter === 'range' && dateFrom && dateTo) {
      params.date = 'range'
      params.from = new Date(dateFrom).toISOString()
      params.to = new Date(dateTo).toISOString()
    }

    return params
  }, [page, pageSize, dateFilter, dateFrom, dateTo])

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['tickets', 'list', backendParams],
    queryFn: () => fetchTickets(backendParams),
    placeholderData: { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } },
    staleTime: 30_000,
  })

  const { data: ventanasData } = useQuery({
    queryKey: ['ventanas', 'all'],
    queryFn: fetchVentanas,
    staleTime: 300_000,
  })

  const { data: loteriasData } = useQuery({
    queryKey: ['loterias', 'all'],
    queryFn: fetchLoterias,
    staleTime: 300_000,
  })

  const { data: sorteosData } = useQuery({
    queryKey: ['sorteos', 'all'],
    queryFn: fetchSorteos,
    staleTime: 300_000,
  })

  // Filtrado local (frontend)
  const filteredRows = useMemo(() => {
    let rows = data?.data ?? []

    // Búsqueda por texto
    if (searchInput.trim()) {
      const search = searchInput.toLowerCase()
      rows = rows.filter((t) => {
        const vendorName = (t.vendedor as any)?.name?.toLowerCase() || ''
        const ventanaName = (t.ventana as any)?.name?.toLowerCase() || ''
        const loteriaName = (t.loteria as any)?.name?.toLowerCase() || ''
        const sorteoName = (t.sorteo as any)?.name?.toLowerCase() || ''
        return (
          t.id.toLowerCase().includes(search) ||
          vendorName.includes(search) ||
          ventanaName.includes(search) ||
          loteriaName.includes(search) ||
          sorteoName.includes(search)
        )
      })
    }

    // Filtro por ventana
    if (filterVentana) {
      rows = rows.filter((t) => t.ventanaId === filterVentana)
    }

    // Filtro por vendedor
    if (filterVendedor) {
      rows = rows.filter((t) => t.vendedorId === filterVendedor)
    }

    // Filtro por lotería
    if (filterLoteria) {
      rows = rows.filter((t) => t.loteriaId === filterLoteria)
    }

    // Filtro por sorteo
    if (filterSorteo) {
      rows = rows.filter((t) => t.sorteoId === filterSorteo)
    }

    // Filtro por ganadores
    if (filterWinnersOnly) {
      rows = rows.filter((t) => {
        const jugadas = (t as any).jugadas || []
        return jugadas.some((j: any) => j.isWinner === true)
      })
    }

    return rows
  }, [data, searchInput, filterVentana, filterVendedor, filterLoteria, filterSorteo, filterWinnersOnly])

  const meta = data?.meta

  // Opciones para selects
  const ventanasOptions = useMemo(() => {
    return (ventanasData ?? []).map((v) => ({ value: v.id, label: v.name || v.code || v.id }))
  }, [ventanasData])

  const vendedoresOptions = useMemo(() => {
    const vendedores = new Map<string, string>()
    ;(data?.data ?? []).forEach((t) => {
      if (t.vendedorId && t.vendedor) {
        vendedores.set(t.vendedorId, (t.vendedor as any).name || t.vendedorId)
      }
    })
    return Array.from(vendedores.entries()).map(([id, name]) => ({ value: id, label: name }))
  }, [data])

  const loteriasOptions = useMemo(() => {
    return (loteriasData ?? []).map((l) => ({ value: l.id, label: l.name || l.id }))
  }, [loteriasData])

  const sorteosOptions = useMemo(() => {
    return (sorteosData ?? []).map((s) => ({ value: s.id, label: s.name || s.id }))
  }, [sorteosData])

  const dateFilterOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'last7', label: 'Últimos 7 días' },
    { value: 'last30', label: 'Últimos 30 días' },
    { value: 'range', label: 'Rango personalizado' },
  ]

  const clearFilters = () => {
    setSearchInput('')
    setDateFilter('today')
    setDateFrom('')
    setDateTo('')
    setFilterVentana(undefined)
    setFilterVendedor(undefined)
    setFilterLoteria(undefined)
    setFilterSorteo(undefined)
    setFilterWinnersOnly(false)
    setPage(1)
  }

  return (
    <ScrollView flex={1} backgroundColor="$background" contentContainerStyle={{ flexGrow: 1 }}>
      <YStack flex={1} padding="$4" gap="$4">
        {/* Header */}
        <XStack justifyContent="space-between" ai="center" gap="$3" flexWrap="wrap">
          <XStack ai="center" gap="$2">
            <Text fontSize="$8" fontWeight="bold">Tickets</Text>
            {isFetching && <Spinner size="small" />}
          </XStack>
        </XStack>

        {/* Filtros */}
        <Toolbar>
          <YStack gap="$3">
            {/* Fila 1: Búsqueda y Filtro de fecha */}
            <XStack gap="$4" ai="center" flexWrap="wrap">
              <XStack position="relative" ai="center" minWidth={260}>
                <Input
                  // flex={1}
                  w={460}
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

              <XStack ai="center" gap="$2">
                <Text fontSize="$3" fontWeight="600">Fecha:</Text>
                <GenericSelect
                  value={dateFilter}
                  onChange={(v) => setDateFilter(v as DateFilter)}
                  items={dateFilterOptions}
                  placeholder="Hoy"
                  label="Fecha"
                />
              </XStack>
            </XStack>

            {/* Fila 2: Rango de fechas (solo si dateFilter === 'range') */}
            {dateFilter === 'range' && (
              <XStack gap="$3" ai="flex-start" flexWrap="wrap">
                <WebDateButton
                  value={dateFrom}
                  onChange={setDateFrom}
                  placeholder="Desde"
                />
                <WebDateButton
                  value={dateTo}
                  onChange={setDateTo}
                  placeholder="Hasta"
                />
              </XStack>
            )}

            {/* Fila 3: Ventana y Vendedor */}
            <XStack gap="$3" ai="center" flexWrap="wrap">
              <XStack ai="center" gap="$2"  minWidth={200}>
                <Text fontSize="$3">Ventana:</Text>
                <GenericSelect
                  value={filterVentana}
                  onChange={setFilterVentana}
                  items={ventanasOptions}
                  placeholder="Todas"
                  label="Ventana"
                />
              </XStack>

              <Separator vertical />

              <XStack ai="center" gap="$2" minWidth={200}>
                <Text fontSize="$3">Vendedor:</Text>
                <GenericSelect
                  value={filterVendedor}
                  onChange={setFilterVendedor}
                  items={vendedoresOptions}
                  placeholder="Todos"
                  label="Vendedor"
                />
              </XStack>
              <XStack ai="center" gap="$2" flex={1} minWidth={200}>
                <Text fontSize="$3">Lotería:</Text>
                <GenericSelect
                  value={filterLoteria}
                  onChange={setFilterLoteria}
                  items={loteriasOptions}
                  placeholder="Todas"
                  label="Lotería"
                />
              </XStack>
              <XStack ai="center" gap="$2" minWidth={160}>
                <FilterSwitch
                  label="Solo ganadores"
                  checked={filterWinnersOnly}
                  onCheckedChange={setFilterWinnersOnly}
                />
              </XStack>
            </XStack>

            {/* Fila 4: Lotería, Sorteo y Solo ganadores */}
            <XStack gap="$3" ai="center" flexWrap="wrap">
              

              <Separator vertical />

              

              <Separator vertical />

              
            </XStack>

            {/* Fila 5: Acciones */}
            <XStack gap="$3" ai="center" jc="flex-end">
              <Button
                size="$3"
                icon={RefreshCw}
                onPress={() => { setPage(1); refetch() }}
                backgroundColor="$green4"
                borderColor="$green8"
                borderWidth={1}
                hoverStyle={{ backgroundColor: '$green5' }}
                pressStyle={{ backgroundColor: '$green6' }}
              >
                Refrescar
              </Button>

              <Button
                size="$3"
                onPress={clearFilters}
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

        {/* Lista */}
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
              const vendorName = (ticket.vendedor as any)?.name || 'N/A'
              const ventanaName = (ticket.ventana as any)?.name || (ticket.ventana as any)?.code || 'N/A'
              const loteriaName = (ticket.loteria as any)?.name || 'N/A'
              const sorteoName = (ticket.sorteo as any)?.name || 'N/A'
              const jugadas = (ticket as any).jugadas || []
              const hasWinner = jugadas.some((j: any) => j.isWinner === true)
              const createdAt = ticket.createdAt ? format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A'

              // Calcular monto ganado total
              const totalWinnings = jugadas.reduce((sum: number, j: any) => {
                return sum + (j.isWinner ? (j.winAmount || 0) : 0)
              }, 0)

              // Badge styling para status
              const statusBadgeProps = (() => {
                switch (ticket.status) {
                  case 'EVALUATED':
                    return { bg: '$yellow4', color: '$yellow11', bc: '$yellow8' }
                  case 'ACTIVE':
                    return { bg: '$green4', color: '$green11', bc: '$green8' }
                  case 'RESTORED':
                    return { bg: '$blue4', color: '$blue11', bc: '$blue8' }
                  case 'CANCELLED':
                    return { bg: '$red4', color: '$red11', bc: '$red8' }
                  default:
                    return { bg: '$gray4', color: '$gray11', bc: '$gray8' }
                }
              })()

              return (
                <Card
                  key={ticket.id}
                  padding="$4"
                  backgroundColor="$backgroundHover"
                  borderColor={hasWinner ? '$green8' : '$borderColor'}
                  borderWidth={hasWinner ? 2 : 1}
                  pressStyle={{ backgroundColor: '$backgroundPress', borderColor: '$borderColorHover' }}
                  onPress={() => router.push(`/ventana/tickets/${ticket.id}` as any)}
                >
                  <XStack justifyContent="space-between" ai="flex-start" gap="$3" flexWrap="wrap">
                    <YStack flex={1} gap="$1" minWidth={260}>
                      <XStack ai="center" gap="$2" flexWrap="wrap">
                        <Text fontSize="$5" fontWeight="600">Ticket #{ticket.id.slice(-8)}</Text>
                        {hasWinner && (
                          <XStack
                            bg="$green4"
                            px="$2"
                            py="$1"
                            br="$2"
                            bw={1}
                            bc="$green8"
                          >
                            <Text color="$green11" fontSize="$2" fontWeight="700">
                              GANADOR
                            </Text>
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
                      <XStack
                        px="$2"
                        py="$1"
                        br="$2"
                        bw={1}
                        {...statusBadgeProps}
                      >
                        <Text
                          fontSize="$2"
                          fontWeight="700"
                          textTransform="uppercase"
                          color={statusBadgeProps.color}
                        >
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

        {/* Paginación */}
        {!!meta && meta.totalPages > 0 && (
          <XStack gap="$2" jc="center" mt="$4" ai="center">
            <Button size="$3" disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}>
              Anterior
            </Button>
            <Card padding="$2" px="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
              <Text fontSize="$3">
                Página {meta.page} de {meta.totalPages} • {filteredRows.length} de {meta.total} tickets
              </Text>
            </Card>
            <Button size="$3" disabled={page >= (meta.totalPages || 1)} onPress={() => setPage((p) => Math.min(p + 1, meta.totalPages || p + 1))}>
              Siguiente
            </Button>
          </XStack>
        )}
      </YStack>
    </ScrollView>
  )
}
