// app/admin/multipliers/index.tsx
import React, { useMemo, useState } from 'react'
import {
  YStack, XStack, Text, Button, Card, Input, ScrollView,
  Spinner, Separator, Select, Sheet
} from 'tamagui'
import { useRouter } from 'expo-router'
import { Plus, Search, X, RefreshCw, Check, ChevronDown, Trash2 } from '@tamagui/lucide-icons'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api.client'
import type { Loteria } from '@/types/models.types'
import type { LoteriaMultiplier } from '@/types/api.types'
import { Toolbar } from '@/components/ui/Toolbar'
import { MultipliersApi } from '@/lib/api.multipliers'
import ActiveBadge from '@/components/ui/ActiveBadge'
import FilterSwitch from '@/components/ui/FilterSwitch'

export default function MultipliersListScreen() {
  const router = useRouter()

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loteriaId, setLoteriaId] = useState<string | undefined>(undefined)
  const [kind, setKind] = useState<'NUMERO' | 'REVENTADO' | undefined>(undefined)
  const [activeOnly, setActiveOnly] = useState(true) // FRONT-ONLY: ON por defecto

  // Loterías (normaliza array vs {data})
  const { data: lotData, isFetching: lotFetching } = useQuery({
    queryKey: ['loterias', 'select'],
    queryFn: () => apiClient.get<any>('/loterias'),
    staleTime: 60_000,
  })
  const loterias: Loteria[] = useMemo(() => {
    if (!lotData) return []
    return Array.isArray(lotData) ? lotData : (lotData?.data ?? [])
  }, [lotData])

  // Multiplicadores (el BE puede filtrar por search/loteria/kind; isActive se filtra en front)
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['multipliers', 'list', { search, loteriaId, kind }],
    queryFn: () => MultipliersApi.list({ search, loteriaId, kind }),
    staleTime: 60_000,
  })

  // Helpers estado activo/inactivo
  const isActive = (m: any) => (m?.isActive ?? true) === true
  const isInactive = (m: any) => (m?.isActive ?? true) === false

  // Normaliza payload y aplica filtros FRONT:
  // - activosOnly = true  => solo activos
  // - activosOnly = false => solo inactivos
  const rows = useMemo<LoteriaMultiplier[]>(() => {
    const payload = data as any
    const base: LoteriaMultiplier[] = Array.isArray(payload) ? payload : (payload?.data ?? [])

    const byActive = activeOnly ? base.filter(isActive) : base.filter(isInactive)

    if (!search) return byActive
    const q = search.toLowerCase()
    return byActive.filter(m => (m.name ?? '').toLowerCase().includes(q))
  }, [data, activeOnly, search])

  const handleSearch = () => setSearch(searchInput.trim())
  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setKind(undefined)
    setLoteriaId(undefined)
    setActiveOnly(true) // vuelve a activas
  }

  return (
    <ScrollView flex={1} backgroundColor="$background" contentContainerStyle={{ flexGrow: 1 }}>
      <YStack flex={1} padding="$4" gap="$4">
        {/* Header */}
        <XStack jc="space-between" ai="center" gap="$3" fw="wrap">
          <XStack ai="center" gap="$2">
            <Text fontSize="$8" fontWeight="bold">Multiplicadores</Text>
            {(isFetching || lotFetching) && <Spinner size="small" />}
          </XStack>
          <Button
            icon={Plus}
            onPress={() => router.push('/admin/multipliers/nuevo')}
            bg="$primary"
            borderColor="$primaryPress"
            hoverStyle={{ bg: '$primaryHover' }}
            pressStyle={{ bg: '$primaryPress', scale: 0.98 }}
          >
            <Text>Nuevo</Text>
          </Button>
        </XStack>

        {/* Filtros */}
        <Toolbar>
          <YStack gap="$3">
            <XStack gap="$3" ai="center" fw="wrap">
              {/* Buscar */}
              <XStack flex={1} position="relative" ai="center" minWidth={260}>
                <Input
                  flex={1}
                  placeholder="Buscar por nombre"
                  value={searchInput}
                  onChangeText={setSearchInput}
                  pr="$8"
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
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
                    hoverStyle={{ bg: '$backgroundHover' }}
                    aria-label="Limpiar búsqueda"
                  />
                )}
              </XStack>

              <Button
                icon={Search}
                onPress={handleSearch}
                hoverStyle={{ scale: 1.02 }}
                pressStyle={{ scale: 0.98 }}
              >
                <Text>Buscar</Text>
              </Button>

              <Separator vertical />

              {/* Selects compactos en la misma fila */}
              <XStack gap="$2" flexShrink={0} ai="center">
                {/* Lotería (más angosto) */}
                <Select value={loteriaId ?? ''} onValueChange={(v) => setLoteriaId(v || undefined)}>
                  <Select.Trigger
                    width={200}
                    iconAfter={ChevronDown}
                    br="$3"
                    bw={1}
                    bc="$borderColor"
                    bg="$background"
                    hoverStyle={{ bg: '$backgroundHover' }}
                  >
                    <Select.Value placeholder="Lotería (todas)" />
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
                    <Select.ScrollUpButton />
                    <Select.Viewport>
                      <Select.Item value="" index={0}>
                        <Select.ItemText>Todas</Select.ItemText>
                        <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                      </Select.Item>
                      {loterias.map((l, idx) => (
                        <Select.Item key={l.id} value={l.id} index={idx + 1}>
                          <Select.ItemText>{l.name}</Select.ItemText>
                          <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton />
                  </Select.Content>
                </Select>

                {/* Tipo */}
                <Select value={kind ?? ''} onValueChange={(v) => setKind((v || undefined) as any)}>
                  <Select.Trigger
                    width={160}
                    iconAfter={ChevronDown}
                    br="$3"
                    bw={1}
                    bc="$borderColor"
                    bg="$background"
                    hoverStyle={{ bg: '$backgroundHover' }}
                  >
                    <Select.Value placeholder="Tipo (todos)" />
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
                    <Select.ScrollUpButton />
                    <Select.Viewport>
                      <Select.Item value="" index={0}>
                        <Select.ItemText>Todos</Select.ItemText>
                        <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item value="NUMERO" index={1}>
                        <Select.ItemText>NÚMERO</Select.ItemText>
                        <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item value="REVENTADO" index={2}>
                        <Select.ItemText>REVENTADO</Select.ItemText>
                        <Select.ItemIndicator ml="auto"><Check size={16} /></Select.ItemIndicator>
                      </Select.Item>
                    </Select.Viewport>
                    <Select.ScrollDownButton />
                  </Select.Content>
                </Select>

                {/* Switch Activos a la derecha del Tipo */}
                <Separator vertical />
                <XStack ai="center" gap="$2">
                  <FilterSwitch
                    label="Activos:"
                    checked={activeOnly}
                    onCheckedChange={(v) => setActiveOnly(!!v)}
                  />
                </XStack>
              </XStack>

              {/* Empuja acciones a la derecha */}
              <XStack flex={1} />

              <Separator vertical />

              <Button
                icon={RefreshCw}
                onPress={() => refetch()}
                backgroundColor={'$green4'}
                borderColor={'$green8'}
                hoverStyle={{ backgroundColor: '$green5' }}
                pressStyle={{ scale: 0.98 }}
              >
                <Text>Refrescar</Text>
              </Button>

              <Button
                onPress={clearFilters}
                backgroundColor={'$gray4'}
                borderColor={'$gray8'}
                borderWidth={1}
                hoverStyle={{ backgroundColor: '$gray5' }}
                pressStyle={{ scale: 0.98 }}
              >
                <Text>Limpiar</Text>
              </Button>
            </XStack>
          </YStack>
        </Toolbar>

        {/* Lista */}
        {isLoading ? (
          <Card padding="$4"><Text>Cargando…</Text></Card>
        ) : isError ? (
          <Card padding="$4" bg="$backgroundHover" borderColor="$error" borderWidth={1}>
            <Text color="$error">No fue posible cargar.</Text>
          </Card>
        ) : rows.length === 0 ? (
          <Card padding="$6" ai="center" jc="center" borderColor="$borderColor" borderWidth={1}>
            <Text fontSize="$5" fontWeight="600">Sin resultados</Text>
            <Text color="$textSecondary">
              {activeOnly ? 'No hay multiplicadores activos con los filtros aplicados.' : 'No hay multiplicadores inactivos con los filtros aplicados.'}
            </Text>
          </Card>
        ) : (
          <YStack gap="$2">
            {rows.map((m) => {
              const active = (m as any)?.isActive !== false
              return (
                <Card
                  key={m.id}
                  padding="$4"
                  bg="$backgroundHover"
                  borderColor="$borderColor"
                  borderWidth={1}
                  pressStyle={{ bg: '$backgroundPress', borderColor: '$borderColorHover', scale: 0.98 }}
                  onPress={() => router.push(`/admin/multipliers/${m.id}` as any)}
                >
                  <XStack jc="space-between" ai="center" gap="$3" fw="wrap">
                    <YStack gap="$1" minWidth={260}>
                      <XStack ai="center" gap="$2" fw="wrap">
                        <Text fontSize="$5" fontWeight="600">{m.name}</Text>
                        <ActiveBadge active={active} />
                      </XStack>
                      <Text color="$textSecondary">
                        Lotería: {m.loteria?.name ?? m.loteriaId} • Tipo: {m.kind} • X: {m.valueX}
                      </Text>
                    </YStack>

                    <XStack gap="$2">
                      {/* Eliminar (rojo) - placeholder de acción */}
                      <Button
                        size="$2"
                        icon={Trash2}
                        backgroundColor={'$red4'}
                        borderColor={'$red8'}
                        hoverStyle={{ backgroundColor: '$red5' }}
                        pressStyle={{ opacity: 0.9, scale: 0.98 }}
                        onPress={(e:any) => {
                          e?.stopPropagation?.()
                          // TODO: askDelete(m)
                        }}
                      >
                        <Text>Eliminar</Text>
                      </Button>
                    </XStack>
                  </XStack>
                </Card>
              )
            })}
          </YStack>
        )}
      </YStack>
    </ScrollView>
  )
}
