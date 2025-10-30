// app/admin/multipliers/index.tsx
import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, ScrollView, Spinner, Separator, Select, Sheet, useTheme } from 'tamagui'
import { Button, Card, Input, CollapsibleToolbar, ActiveBadge } from '@/components/ui'
import { useRouter } from 'expo-router'
import { Plus, Search, X, RefreshCw, Check, ChevronDown, Trash2, ArrowLeft } from '@tamagui/lucide-icons'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api.client'
import type { Loteria } from '@/types/models.types'
import type { LoteriaMultiplier } from '@/types/api.types'
import { MultipliersApi } from '@/lib/api.multipliers'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/components/ui/Confirm'
import { useQueryClient } from '@tanstack/react-query'
import FilterSwitch from '@/components/ui/FilterSwitch'

export default function MultipliersListScreen() {
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
  const router = useRouter()
  const { success, error } = useToast()
  const queryClient = useQueryClient()
  const { confirm, ConfirmRoot } = useConfirm()

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
    queryKey: ['multipliers', 'list', { loteriaId, kind }],
    queryFn: () => MultipliersApi.list({ loteriaId, kind }),
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

  const handleToggle = async (m: any) => {
    const targetActive = !activeOnly ? true : false // si estoy viendo inactivos => restaurar (true), si activos => eliminar (false)
    const label = targetActive ? 'restaurar' : 'eliminar'
    const ok = await confirm({
      title: `Confirmar ${label}`,
      description: `¿Deseas ${label} "${m.name}"?`,
      okText: label === 'eliminar' ? 'Eliminar' : 'Restaurar',
      cancelText: 'Cancelar',
      theme: label === 'eliminar' ? 'danger' : 'default',
    })
    if (!ok) return
    try {
      await MultipliersApi.toggleActive(m.id, targetActive)
      success(`Multiplicador ${label}do.`)
      // refrescar lista
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['multipliers'] }),
      ])
    } catch (err: any) {
      error(err?.message || `No se pudo ${label}.`)
    }
  }

  return (
    <ScrollView flex={1} backgroundColor="$background" contentContainerStyle={{ flexGrow: 1 }}>
      <YStack flex={1} padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        {/* Header */}
        <XStack jc="space-between" ai="center" gap="$3" fw="wrap">
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
            <Text fontSize="$8" fontWeight="bold">Multiplicadores</Text>
            {(isFetching || lotFetching) && <Spinner size="small" />}
          </XStack>
          <Button
            icon={(p:any)=> <Plus {...p} color={iconColor} />}
            onPress={() => router.push('/admin/multipliers/nuevo')}
            bg="$primary"
            borderColor="$primaryPress"
            hoverStyle={{ bg: '$primaryHover' }}
            pressStyle={{ bg: '$primaryPress', scale: 0.98 }}
          >
            <Text>Agregar</Text>
          </Button>
        </XStack>

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
                  placeholder="Buscar por nombre"
                  value={searchInput}
                  onChangeText={setSearchInput}
                  inputMode='search'
                  enterKeyHint='search'
                  pl="$10"
                  pr="$10"
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  aria-label='Buscar multiplicador'
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
              <XStack minWidth={200} flexShrink={0}>
                <Select value={loteriaId ?? ''} onValueChange={(v) => setLoteriaId(v || undefined)}>
                  <Select.Trigger
                    width="100%"
                    iconAfter={ChevronDown}
                    br="$3"
                    bw={1}
                    bc="$borderColor"
                    backgroundColor="$background"
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
              </XStack>

              <XStack width={1} height={24} backgroundColor="$borderColor" marginHorizontal="$2" flexShrink={0} />

              <XStack minWidth={160} flexShrink={0}>
                <Select value={kind ?? ''} onValueChange={(v) => setKind((v || undefined) as any)}>
                  <Select.Trigger
                    width="100%"
                    iconAfter={ChevronDown}
                    br="$3"
                    bw={1}
                    bc="$borderColor"
                    backgroundColor="$background"
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
              </XStack>

              <XStack width={1} height={24} backgroundColor="$borderColor" marginHorizontal="$2" flexShrink={0} />

              <FilterSwitch
                label="Activos:"
                checked={activeOnly}
                onCheckedChange={(v) => setActiveOnly(!!v)}
              />
            </XStack>
          }
          actionsContent={
            <XStack gap="$2" ai="center" flexWrap="wrap">
              <Button
                icon={(p:any)=> <RefreshCw {...p} color={iconColor} />}
                onPress={() => refetch()}
                backgroundColor={'$green4'}
                borderColor={'$green8'}
                hoverStyle={{ backgroundColor: '$green5' }}
                pressStyle={{ scale: 0.98 }}
              >
                Refrescar
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
          }
        />

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
                  // Quitar onPress del contenedor para permitir clicks en botones internos
                >
                  <XStack jc="space-between" ai="center" gap="$3" fw="wrap">
                    {/* Zona clickeable para ir al detalle */}
                    <Button
                      unstyled
                      backgroundColor="transparent"
                      borderWidth={0}
                      padding={0}
                      hoverStyle={{ backgroundColor: 'transparent' }}
                      pressStyle={{ scale: 0.98 }}
                      onPress={() => router.push(`/admin/multipliers/${m.id}` as any)}
                    >
                      <YStack gap="$1" minWidth={260}>
                        <XStack ai="center" gap="$2" fw="wrap">
                          <Text fontSize="$5" fontWeight="600">{m.name}</Text>
                          <ActiveBadge active={active} />
                        </XStack>
                        <Text color="$textSecondary">
                          Lotería: {m.loteria?.name ?? m.loteriaId} • Tipo: {m.kind} • X: {m.valueX}
                        </Text>
                      </YStack>
                    </Button>

                    <XStack gap="$2">
                      {/* Eliminar (rojo) - placeholder de acción */}
                  <Button
                        // size="$2"
                        icon={(p:any)=> <Trash2 {...p} color={iconColor} />}
                        backgroundColor={'$red4'}
                        borderColor={'$red8'}
                        hoverStyle={{ backgroundColor: '$red5' }}
                        pressStyle={{ opacity: 0.9, scale: 0.98 }}
                        onPress={(e:any) => {
                          e?.preventDefault?.()
                          e?.stopPropagation?.()
                          handleToggle(m)
                        }}
                      >
                        <Text>{activeOnly ? 'Eliminar' : 'Restaurar'}</Text>
                      </Button>
                    </XStack>
                  </XStack>
                </Card>
              )
            })}
          </YStack>
        )}
        <ConfirmRoot />
      </YStack>
    </ScrollView>
  )
}

