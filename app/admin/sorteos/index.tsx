// app/admin/sorteos/index.tsx
import React, { useMemo, useState, useCallback } from 'react'
import { YStack, XStack, Text, Spinner, Separator, Sheet, ScrollView } from 'tamagui'
import { Button, Card, Input, Select, CollapsibleToolbar, ActiveBadge } from '@/components/ui'
import { useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, X, RefreshCw, ChevronDown, Check, Trash2, RotateCcw, Calendar, ArrowLeft } from '@tamagui/lucide-icons'
import { useTheme } from 'tamagui'
// UI unificada desde components/ui
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/components/ui/Confirm'
import { SorteosApi } from '@/lib/api.sorteos'
import type { ApiListResponse, Sorteo } from '@/types/models.types'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/role'
import { apiClient } from '@/lib/api.client'
import FilterSwitch from '@/components/ui/FilterSwitch'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'
import { getDateParam, formatDateYYYYMMDD } from '@/lib/dateFormat'
import { DatePicker } from '@/components/ui'

type Status = 'SCHEDULED' | 'OPEN' | 'EVALUATED' | 'CLOSED'
type StatusOrAll = Status | 'ALL' | undefined
// ✅ Backend soporta: today, yesterday, week, month, year, range (o sin filtro = ALL)
type DateFilter = 'ALL' | 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'range' | undefined

function StatusSelect({
  value,
  onChange,
}: {
  value: Status | undefined
  onChange: (val: Status | undefined) => void
}) {
  const internal: StatusOrAll = (value ?? 'ALL') as StatusOrAll

  const items: { value: StatusOrAll; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'SCHEDULED', label: 'SCHEDULED' },
    { value: 'OPEN', label: 'OPEN' },
    { value: 'EVALUATED', label: 'EVALUATED' },
    { value: 'CLOSED', label: 'CLOSED' },
  ]

  const labelOf = (v: StatusOrAll) => items.find(i => i.value === v)?.label ?? 'Todos'

  return (
    <Select
      size="$3"
      value={String(internal)}
      onValueChange={(v: string) => onChange(v === 'ALL' ? undefined : (v as Status))}
    >
      <Select.Trigger
        px="$2"
        br="$3"
        bw={1}
        bc="$borderColor"
        backgroundColor="$background"
        hoverStyle={{ bg: '$backgroundHover' }}
        focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
        iconAfter={ChevronDown}
        width={110}
        maxWidth={110}
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
        <YStack br="$3" bw={1} bc="$borderColor" backgroundColor="$background">
          <Select.ScrollUpButton />
          <Select.Viewport>
            {items.map((it, idx) => (
              <Select.Item
                key={String(it.value)}
                value={String(it.value)}
                index={idx}
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

function DateFilterSelect({
  value,
  onChange,
}: {
  value: DateFilter
  onChange: (val: DateFilter) => void
}) {
  const internal: DateFilter = (value ?? 'today') as DateFilter

  const items: { value: DateFilter; label: string }[] = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'year', label: 'Este año' },
    { value: 'range', label: 'Rango personalizado' },
    { value: 'ALL', label: 'Todos' },
  ]

  const labelOf = (v: DateFilter) => items.find(i => i.value === v)?.label ?? 'Hoy'

  const handleValueChange = useCallback((v: string) => {
    requestAnimationFrame(() => {
      onChange(v === 'ALL' ? 'ALL' : (v as DateFilter))
    })
  }, [onChange])

  return (
    <Select
      size="$3"
      value={String(internal)}
      onValueChange={handleValueChange}
    >
      <Select.Trigger
        px="$2"
        br="$3"
        bw={1}
        bc="$borderColor"
        backgroundColor="$background"
        hoverStyle={{ bg: '$backgroundHover' }}
        focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
        iconAfter={ChevronDown}
        width={90}
        maxWidth={90}
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
        <YStack br="$3" bw={1} bc="$borderColor" backgroundColor="$background">
          <Select.ScrollUpButton />
          <Select.Viewport>
            {items.map((it, idx) => (
              <Select.Item
                key={String(it.value)}
                value={String(it.value)}
                index={idx}
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

export default function SorteosListScreen() {
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
  const router = useRouter()
  const toast = useToast()
  const qc = useQueryClient()
  const { confirm, ConfirmRoot } = useConfirm()
  const { user } = useAuth()
  const admin = isAdmin(user?.role!)

  const [page, setPage] = useState(1)
  const [pageSize] = useState(DEFAULT_PAGE_SIZE)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<Status | undefined>(undefined)
  // Por defecto usar 'today' para mostrar solo registros de hoy hacia el futuro
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)

  // 🔁 Filtro local de "Activos":
  // ON  -> muestra solo activos
  // OFF -> muestra solo inactivos
  const [activeOnly, setActiveOnly] = useState(true)

  // Lotería seleccionada para preview
  const [selectedLoteriaForPreview, setSelectedLoteriaForPreview] = useState<{ id: string; name: string } | null>(null)

  // Preparar parámetros para el backend
  const backendParams = useMemo(() => {
    const params: any = {
      page,
      pageSize,
      search,
      status,
    }

    // Enviar parámetro de fecha al backend
    // Por defecto (today), el backend devuelve registros de hoy hacia el futuro
    if (dateFilter === 'ALL') {
      // No enviar parámetro de fecha, devolver todos (incluye pasado)
    } else if (dateFilter === 'range' && dateFrom && dateTo) {
      // Rango personalizado: enviar fromDate y toDate en formato YYYY-MM-DD
      Object.assign(params, getDateParam('range', formatDateYYYYMMDD(dateFrom), formatDateYYYYMMDD(dateTo)))
    } else if (dateFilter && dateFilter !== 'range') {
      // Otros tokens: today, yesterday, week, month, year
      Object.assign(params, getDateParam(dateFilter as 'today' | 'yesterday' | 'week' | 'month' | 'year'))
    }
    // Si dateFilter === 'range' pero no hay fechas, no agregar parámetro de fecha

    return params
  }, [page, pageSize, search, status, dateFilter, dateFrom, dateTo])

  // Deshabilitar query si está en modo 'range' pero no hay fechas seleccionadas
  const shouldFetch = !(dateFilter === 'range' && (!dateFrom || !dateTo))

  const { data, isLoading, isFetching, isError, refetch } = useQuery<ApiListResponse<Sorteo>>({
    queryKey: ['sorteos', 'list', backendParams],
    queryFn: () => SorteosApi.list(backendParams),
    enabled: shouldFetch,
    placeholderData: {
      success: true,
      data: [],
      meta: { page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false },
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  // Cargar loterías para el selector (usar un tamaño grande para obtener todas)
  const { data: loteriasData } = useQuery({
    queryKey: ['loterias', 'all'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/loterias', { pageSize: 100 })
      const payload: any = res ?? {}
      return Array.isArray(payload) ? payload : payload?.data ?? []
    },
    staleTime: 300_000,
  })

  // Filtrar solo las loterías activas para el selector
  const activeLoterias = useMemo(() => {
    const all = Array.isArray(loteriasData) ? loteriasData : []
    return all.filter((l: any) => ((l as any).isActive ?? true) === true)
  }, [loteriasData])

  const baseRows = useMemo(() => data?.data ?? [], [data])

  // Helper para saber si un sorteo está "activo" a efectos de UI
  const isRowActive = (s: Sorteo) => {
    const flag = (s as any).isActive
    // si BE no manda isActive, inferimos por estado
    const inferred = s.status === 'OPEN' || s.status === 'SCHEDULED'
    return flag === undefined ? inferred : flag === true
  }

  // ✅ Backend filtra por fecha, así que solo aplicamos filtros de frontend (activos/inactivos y búsqueda)
  const rows = useMemo(() => {
    // El status y la fecha ya se filtran en el backend
    // Solo aplicamos el filtro de activos/inactivos y búsqueda localmente
    const byActiveFlag = baseRows.filter(s => activeOnly ? isRowActive(s) : !isRowActive(s))

    let filtered = byActiveFlag
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = byActiveFlag.filter(s =>
        (s.name ?? '').toLowerCase().includes(q) ||
        (s.loteria?.name ?? s.loteriaId ?? '').toLowerCase().includes(q)
      )
    }

    // Ordenar por scheduledAt (más pronto primero)
    // Backend envía hora LOCAL de Costa Rica (sin 'Z'), ej: "2025-10-29T12:55:00"
    return filtered.sort((a, b) => {
      const dateA = new Date(a.scheduledAt as any).getTime()
      const dateB = new Date(b.scheduledAt as any).getTime()
      return dateA - dateB
    })
  }, [baseRows, activeOnly, search])

  // Usar meta del backend directamente (la paginación se maneja en el backend)
  // Los filtros del frontend solo afectan qué registros se muestran en la página actual
  const meta = data?.meta ?? {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  }

  // Los resultados filtrados del frontend (sin paginación adicional del frontend)
  const paginatedRows = rows

  const handleSearch = () => { setPage(1); setSearch(searchInput.trim()) }
  
  // Handler para cambio de filtro de fecha - usar requestAnimationFrame para evitar warnings
  const handleDateFilterChange = useCallback((v: DateFilter) => {
    requestAnimationFrame(() => {
      setDateFilter(v)
      setDateFrom(null)
      setDateTo(null)
      setPage(1)
    })
  }, [])

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setStatus(undefined)
    setDateFilter('today') // Por defecto mostrar desde hoy
    setDateFrom(null)
    setDateTo(null)
    setActiveOnly(true) // vuelve a activos
    setPage(1)
  }

  // Mutaciones
  const mOpen = useMutation({
    mutationFn: (id: string) => SorteosApi.open(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sorteos'] }); toast.success('Sorteo abierto') },
    onError: (e: any) => toast.error(e?.message || 'No fue posible abrir'),
  })

  const mClose = useMutation({
    mutationFn: (id: string) => SorteosApi.close(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sorteos'] }); toast.success('Sorteo cerrado') },
    onError: (e: any) => toast.error(e?.message || 'No fue posible cerrar'),
  })

  const mDelete = useMutation({
    mutationFn: (id: string) => apiClient.deleteWithBody(`/sorteos/${id}`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sorteos'] }); toast.success('Sorteo eliminado') },
    onError: (e: any) => toast.error(e?.message || 'No fue posible eliminar'),
  })

  const mRestore = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/sorteos/${id}/restore`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sorteos'] }); toast.success('Sorteo restaurado') },
    onError: (e: any) => toast.error(e?.message || 'No fue posible restaurar'),
  })

  const askDelete = async (s: Sorteo) => {
    const ok = await confirm({
      title: 'Confirmar eliminación',
      description: `¿Eliminar el sorteo “${s.name}”?`,
      okText: 'Eliminar',
      cancelText: 'Cancelar',
    })
    if (ok) mDelete.mutate(s.id)
  }

  const askRestore = async (s: Sorteo) => {
    const ok = await confirm({
      title: 'Restaurar sorteo',
      description: `¿Restaurar “${s.name}”?`,
      okText: 'Restaurar',
      cancelText: 'Cancelar',
    })
    if (ok) mRestore.mutate(s.id)
  }

  return (
    <ScrollView flex={1} backgroundColor="$background" contentContainerStyle={{ flexGrow: 1 }}>
      <YStack flex={1} padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        {/* Header */}
        <YStack gap="$3">
          <XStack justifyContent="space-between" ai="center" gap="$3" flexWrap="wrap">
            <XStack ai="center" gap="$2">
              <Button
                size="$3"
                icon={(p:any)=> <ArrowLeft {...p} size={24} color={iconColor} />}
                onPress={()=> router.push('/admin')}
                backgroundColor="transparent"
                borderWidth={0}
                hoverStyle={{ backgroundColor: 'transparent' }}
                pressStyle={{ scale: 0.98 }}
              />
              <Text fontSize="$8" fontWeight="bold">Sorteos</Text>
              {isFetching && <Spinner size="small" />}
            </XStack>
            {admin && (
              <Button
                size="$3"
                icon={(p:any)=> <Plus {...p} color={iconColor} />}
                onPress={() => router.push('/admin/sorteos/nuevo')}
                bg="$primary"
                hoverStyle={{ bg: '$primaryHover' }}
                pressStyle={{ bg: '$primaryPress' }}
              >
                Agregar
              </Button>
            )}
          </XStack>

          {/* Selector de lotería + Preview (fila separada para mejor responsividad) */}
          {admin && (
            <XStack gap="$2" ai="center" flexWrap="wrap">
              <Select
                size="$3"
                value={selectedLoteriaForPreview?.id ?? 'none'}
                onValueChange={(v: string) => {
                  if (v === 'none') {
                    setSelectedLoteriaForPreview(null)
                  } else {
                    const lot = activeLoterias.find((l: any) => l.id === v)
                    if (lot) {
                      setSelectedLoteriaForPreview({ id: lot.id, name: lot.name })
                    }
                  }
                }}
              >
                <Select.Trigger
                  px="$3"
                  br="$3"
                  bw={1}
                  bc="$borderColor"
                  backgroundColor="$background"
                  hoverStyle={{ bg: '$backgroundHover' }}
                  iconAfter={ChevronDown}
                  minWidth={200}
                  maxWidth={300}
                  flex={1}
                >
                  <Select.Value>
                    {selectedLoteriaForPreview?.name ?? 'Seleccionar lotería'}
                  </Select.Value>
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
                  <YStack br="$3" bw={1} bc="$borderColor" backgroundColor="$background">
                    <Select.ScrollUpButton />
                    <Select.Viewport>
                      <Select.Item value="none" index={0} pressStyle={{ bg: '$backgroundHover' }} bw={0} px="$3">
                        <Select.ItemText>Seleccionar lotería</Select.ItemText>
                      </Select.Item>
                      {activeLoterias.map((lot: any, idx: number) => (
                        <Select.Item
                          key={lot.id}
                          value={lot.id}
                          index={idx + 1}
                          pressStyle={{ bg: '$backgroundHover' }}
                          bw={0}
                          px="$3"
                        >
                          <Select.ItemText>{lot.name}</Select.ItemText>
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

              <Button
                size="$3"
                icon={(p:any)=> <Calendar {...p} color={iconColor} />}
                onPress={() => {
                  if (!selectedLoteriaForPreview) {
                    toast.error('Selecciona una lotería primero')
                    return
                  }
                  router.push(
                    `/admin/sorteos/preview?loteriaId=${selectedLoteriaForPreview.id}&loteriaName=${encodeURIComponent(selectedLoteriaForPreview.name)}` as any
                  )
                }}
                bg="$blue4"
                borderColor="$blue8"
                borderWidth={1}
                disabled={!selectedLoteriaForPreview}
                hoverStyle={{ bg: '$blue5' }}
                pressStyle={{ bg: '$blue6' }}
              >
                Preview
              </Button>
            </XStack>
          )}
        </YStack>

        {/* Filtros */}
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
                  placeholder="Buscar por nombre o lotería"
                  value={searchInput}
                  onChangeText={setSearchInput}
                  inputMode="search"
                  enterKeyHint="search"
                  pl="$10"
                  pr="$10"
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  aria-label="Buscar sorteos"
                  focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
                />
                
                {searchInput.length > 0 && (
                  <Button
                    size="$2"
                    circular
                    icon={(p:any)=> <X {...p} size={16} color={iconColor} />}
                    position="absolute"
                    right="$2"
                    onPress={() => setSearchInput('')}
                    aria-label="Limpiar búsqueda"
                    hoverStyle={{ bg: '$backgroundHover' }}
                    backgroundColor="transparent"
                    borderWidth={0}
                  />
                )}
              </XStack>
            </XStack>
          }
          filtersContent={
            <XStack gap="$4" ai="center" flexWrap="wrap">
              <XStack ai="center" gap="$2" minWidth={160} flexShrink={0}>
                <Text fontSize="$3" flexShrink={0}>Estado:</Text>
                <StatusSelect value={status} onChange={setStatus} />
              </XStack>

              <XStack width={1} height={24} backgroundColor="$borderColor" marginHorizontal="$2" flexShrink={0} />

              <XStack ai="center" gap="$2" minWidth={140} flexShrink={0}>
                <Text fontSize="$3" flexShrink={0}>Fecha:</Text>
                <DateFilterSelect value={dateFilter} onChange={handleDateFilterChange} />
              </XStack>

              {/* Rango personalizado */}
              {dateFilter === 'range' && (
                <XStack ai="center" gap="$2" flexWrap="wrap">
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

              <XStack width={1} height={24} backgroundColor="$borderColor" marginHorizontal="$2" flexShrink={0} />

              <FilterSwitch
                label="Activos:"
                checked={activeOnly}
                onCheckedChange={(v) => { setActiveOnly(!!v); setPage(1) }}
              />
            </XStack>
          }
          actionsContent={
            <XStack gap="$2" ai="center" flexWrap="wrap">
              <Button
                icon={(p:any)=> <RefreshCw {...p} color={iconColor} />}
                onPress={() => { setPage(1); refetch() }}
                backgroundColor="$green4"
                borderColor="$green8"
                hoverStyle={{ backgroundColor: '$green5' }}
                pressStyle={{ scale: 0.98 }}
              >
                Refrescar
              </Button>

              <Button
                onPress={clearFilters}
                backgroundColor="$gray4"
                borderColor="$gray8"
                hoverStyle={{ backgroundColor: '$gray5' }} 
                pressStyle={{ scale: 0.98 }}
              >
                Limpiar
              </Button>
            </XStack>
          }
        />

        {/* Lista */}
        {isLoading ? (
          <Card padding="$4" elevate><Text>Cargando sorteos…</Text></Card>
        ) : isError ? (
          <Card padding="$4" elevate bg="$backgroundHover" borderColor="$error" borderWidth={1}>
            <Text color="$error">No fue posible cargar.</Text>
          </Card>
        ) : (rows?.length ?? 0) === 0 ? (
          <Card padding="$6" ai="center" jc="center" elevate borderColor="$borderColor" borderWidth={1}>
            <Text fontSize="$5" fontWeight="600">Sin resultados</Text>
            <Text color="$textSecondary">
              {activeOnly ? 'No hay sorteos activos con los filtros aplicados.' : 'No hay sorteos inactivos con los filtros aplicados.'}
            </Text>
          </Card>
        ) : (
          <YStack gap="$2">
            {paginatedRows.map((s) => {
              const isActive = (s as any).isActive !== false
              const rowActive = isRowActive(s)
              const isFinal = s.status === 'EVALUATED' || s.status === 'CLOSED'

              return (
                <Card
                  key={s.id}
                  padding="$4"
                  backgroundColor="$backgroundHover"
                  borderColor="$borderColor"
                  borderWidth={1}
                  pressStyle={{ backgroundColor: '$backgroundPress', borderColor: '$borderColorHover' }}
                  onPress={() => router.push(`/admin/sorteos/${s.id}` as any)}
                >
                  <XStack justifyContent="space-between" ai="center" gap="$3" flexWrap="wrap">
                    <YStack flex={1} gap="$1" minWidth={260}>
                      <XStack ai="center" gap="$2" flexWrap="wrap">
                        <Text fontSize="$5" fontWeight="600">{s.name}</Text>
                        <Text fontSize="$3" color="$textSecondary">— {s.loteria?.name ?? s.loteriaId}</Text>
                        <ActiveBadge active={rowActive} />
                      </XStack>

                      <XStack ai="center" gap="$2" fw="wrap">
                        {/* Backend envía hora LOCAL (sin 'Z'), toLocaleString() la muestra correctamente */}
                        <Text fontSize="$3" color="$textSecondary">
                          Programado: {new Date(s.scheduledAt as any).toLocaleString()}
                        </Text>

                        <Text fontSize="$3" color="$textSecondary"> • </Text>

                        <Text fontSize="$3" color="$textSecondary">
                          <Text fontWeight="700">Estado:</Text>{' '}
                          <Text
                            fontWeight="700"
                            color={
                              s.status === 'OPEN' ? '$green11' :
                                s.status === 'SCHEDULED' ? '$blue11' :
                                  s.status === 'EVALUATED' ? '$yellow11' :
                                    '$gray11'
                            }
                          >
                            {s.status}
                          </Text>
                        </Text>

                        {!!s.winningNumber && (
                          <>
                            <Text fontSize="$3" color="$textSecondary"> • </Text>
                            <Text fontSize="$3" color="$textSecondary">
                              <Text fontWeight="700">Ganador:</Text>{' '}
                            </Text>
                            <Text
                              fontSize="$5"
                              fontWeight="800"
                              px="$2"
                              py={2}
                              br="$2"
                              bg="$purple3"
                              color="$purple12"
                              bw={1}
                              bc="$purple8"
                            >
                              {s.winningNumber}
                            </Text>

                            {(['EVALUATED', 'CLOSED'] as const).includes(s.status as any) && (() => {
                              const anyS = s as any

                              // Lee los campos según tu API
                              const x =
                                (typeof anyS.extraMultiplierX === 'number' ? anyS.extraMultiplierX : null) ??
                                (typeof anyS?.extraMultiplier?.valueX === 'number' ? anyS.extraMultiplier.valueX : null)

                              // Puedes priorizar el nombre del multiplicador; si no, usa el outcomeCode
                              const code: string | null =
                                (anyS.extraMultiplier?.name && String(anyS.extraMultiplier.name).trim()) ||
                                (anyS.extraOutcomeCode && String(anyS.extraOutcomeCode).trim()) ||
                                null

                              // Si no hay info extra, no mostramos nada
                              if (x == null && !code) return null

                              const parts: string[] = []
                              if (x != null) parts.push(`X ${x}`)
                              if (code) parts.push(code)
                              const label = parts.join(' · ')

                              return (
                                <>
                                  <Text fontSize="$3" color="$textSecondary"> • </Text>
                                  <Text fontSize="$3" color="$textSecondary">
                                    <Text fontWeight="700">Reventado:</Text>{' '}
                                  </Text>
                                  <Text
                                    fontSize="$4"
                                    fontWeight="700"
                                    px="$2"
                                    py={2}
                                    br="$2"
                                    bg="$orange3"
                                    color="$orange12"
                                    bw={1}
                                    bc="$orange8"
                                  >
                                    {label}
                                  </Text>
                                </>
                              )
                            })()}
                          </>
                        )}

                      </XStack>
                    </YStack>

                    {admin && (
                      <XStack gap="$2" fw="wrap">
                        {/* SCHEDULED: Abrir o Eliminar */}
                        {s.status === 'SCHEDULED' && (
                          <>
                            <Button
                              size="$3"
                              backgroundColor="$blue4"
                              borderColor="$blue8"
                              borderWidth={1}
                              hoverStyle={{ backgroundColor: '$blue5' }}
                              pressStyle={{ backgroundColor: '$blue6' }}
                              onPress={async (e: any) => {
                                e?.stopPropagation?.()
                                const ok = await confirm({
                                  title: '¿Abrir sorteo?',
                                  description: 'Pasará a estado OPEN y permitirá ventas.',
                                  okText: 'Abrir',
                                  cancelText: 'Cancelar',
                                })
                                if (!ok) return
                                mOpen.mutate(s.id)
                              }}
                              disabled={mOpen.isPending}
                            >
                              <Text>Abrir</Text>
                            </Button>
                            <Button
                              size="$3"
                              backgroundColor="$red4"
                              borderColor="$red8"
                              borderWidth={1}
                              icon={(p:any)=> <Trash2 {...p} color={iconColor} />}
                              hoverStyle={{ backgroundColor: '$red5' }}
                              pressStyle={{ backgroundColor: '$red6' }}
                              onPress={(e: any) => { e?.stopPropagation?.(); askDelete(s) }}
                            >
                              <Text>Eliminar</Text>
                            </Button>
                          </>
                        )}

                        {/* OPEN: Cerrar y Evaluar */}
                        {s.status === 'OPEN' && (
                          <>
                            <Button
                              size="$3"
                              backgroundColor="$gray4"
                              borderColor="$gray8"
                              borderWidth={1}
                              hoverStyle={{ backgroundColor: '$gray5' }}
                              pressStyle={{ backgroundColor: '$gray6' }}
                              onPress={async (e: any) => {
                                e?.stopPropagation?.()
                                const ok = await confirm({
                                  title: '¿Cerrar sorteo?',
                                  description: 'Pasará a CLOSED y desactivará tickets.',
                                  okText: 'Cerrar',
                                  cancelText: 'Cancelar',
                                })
                                if (!ok) return
                                mClose.mutate(s.id)
                              }}
                              disabled={mClose.isPending}
                            >
                              <Text>Cerrar</Text>
                            </Button>
                            <Button
                              size="$3"
                              backgroundColor="$yellow4"
                              borderColor="$yellow8"
                              borderWidth={1}
                              hoverStyle={{ backgroundColor: '$yellow5' }}
                              pressStyle={{ backgroundColor: '$yellow6' }}
                              onPress={(e: any) => {
                                e?.stopPropagation?.()
                                router.push(`/admin/sorteos/${s.id}` as any)
                              }}
                            >
                              <Text>Evaluar</Text>
                            </Button>
                          </>
                        )}

                        {/* CLOSED: Eliminar */}
                        {s.status === 'CLOSED' && (
                          <Button
                            size="$3"
                            backgroundColor="$red4"
                            borderColor="$red8"
                            borderWidth={1}
                            icon={(p:any)=> <Trash2 {...p} color={iconColor} />}
                            hoverStyle={{ backgroundColor: '$red5' }}
                            pressStyle={{ backgroundColor: '$red6' }}
                            onPress={(e: any) => { e?.stopPropagation?.(); askDelete(s) }}
                          >
                            <Text>Eliminar</Text>
                          </Button>
                        )}

                        {/* EVALUATED: Ningún botón */}
                      </XStack>
                    )}
                  </XStack>
                </Card>
              )
            })}
          </YStack>
        )}

        {/* Paginación */}
        {!!meta && (
          <XStack gap="$2" jc="center" mt="$4" ai="center">
            <Button size="$2" variant="secondary" disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}><Text>Anterior</Text></Button>
            <Card padding="$2" px="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
              <Text fontSize="$3">Página {meta.page} de {meta.totalPages}</Text>
            </Card>
            <Button size="$2" variant="secondary" disabled={page >= (meta.totalPages || 1)} onPress={() => setPage((p) => Math.min(p + 1, meta.totalPages || p + 1))}>
              <Text>Siguiente</Text>
            </Button>
          </XStack>
        )}

        <ConfirmRoot />
      </YStack>
    </ScrollView>
  )
}

