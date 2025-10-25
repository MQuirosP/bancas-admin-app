// app/admin/loterias/index.tsx
import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, ScrollView, Spinner, Separator } from 'tamagui'
import { Button, Input, Card, Toolbar, ActiveBadge } from '@/components/ui'
import { Badge } from '@/components/ui/Badge'
import { useRouter } from 'expo-router'
import { Plus, Search, X, RefreshCw, Trash2 } from '@tamagui/lucide-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiErrorClass } from '@/lib/api.client'
import type { Loteria } from '@/types/models.types'
import { useToast } from '@/hooks/useToast'
// Toolbar/Badge/ActiveBadge desde components/ui
import { useConfirm } from '@/components/ui/Confirm'
import FilterSwitch from '@/components/ui/FilterSwitch'

type ListParams = { page: number; pageSize: number; search?: string } // ← sin isActive ni isDeleted

async function fetchLoterias(params: ListParams): Promise<{ data: Loteria[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }> {
  const res = await apiClient.get<any>('/loterias', params)
  return {
    data: Array.isArray(res) ? res : res?.data ?? [],
    meta: res?.meta ?? { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  }
}

export default function LoteriasListScreen() {
  const router = useRouter()
  const toast = useToast()
  const qc = useQueryClient()
  const { confirm, ConfirmRoot } = useConfirm()

  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  // Front-only: Activas ON por defecto (ON = activas, OFF = inactivas)
  const [activeOnly, setActiveOnly] = useState(true)

  const params: ListParams = { page, pageSize, search }

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['loterias', 'list', params],
    queryFn: () => fetchLoterias(params),
    placeholderData: { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } },
    staleTime: 60_000,
  })

  const baseRows = useMemo(() => data?.data ?? [], [data])

  // Helper: estado activo por flag, default true si no viene
  const isRowActive = (l: Loteria) => ((l as any).isActive ?? true) === true

  // Filtro local: ON → activas, OFF → inactivas
  const rows = useMemo(() => {
    const byActive = baseRows.filter(l => (activeOnly ? isRowActive(l) : !isRowActive(l)))
    if (!search.trim()) return byActive
    const q = search.trim().toLowerCase()
    return byActive.filter(l => (l.name ?? '').toLowerCase().includes(q))
  }, [baseRows, activeOnly, search])

  const meta = data?.meta

  const softDelete = useMutation({
    mutationFn: (id: string) => apiClient.deleteWithBody(`/loterias/${id}`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loterias'] }); toast.success('Lotería eliminada') },
    onError: (e: ApiErrorClass) => toast.error(e?.message || 'No fue posible eliminar'),
  })

  const restore = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/loterias/${id}/restore`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loterias'] }); toast.success('Lotería restaurada') },
    onError: (e: ApiErrorClass) => toast.error(e?.message || 'No fue posible restaurar'),
  })

  const handleSearch = () => { setPage(1); setSearch(searchInput.trim()) }
  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setActiveOnly(true) // vuelve a activas
    setPage(1)
  }

  const askDelete = async (lot: Loteria) => {
    const ok = await confirm({ title: 'Confirmar eliminación', description: `¿Eliminar ${lot.name}?`, okText: 'Eliminar' })
    if (ok) softDelete.mutate((lot as any).id as string)
  }
  const askRestore = async (lot: Loteria) => {
    const ok = await confirm({ title: 'Restaurar lotería', description: `¿Restaurar ${lot.name}?`, okText: 'Restaurar' })
    if (ok) restore.mutate((lot as any).id as string)
  }

  return (
    <ScrollView flex={1} backgroundColor="$background" contentContainerStyle={{ flexGrow: 1 }}>
      <YStack flex={1} padding="$4" gap="$4">
        <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
          <XStack ai="center" gap="$2">
            <Text fontSize="$8" fontWeight="bold">Loterías</Text>
            {isFetching && <Spinner size="small" />}
          </XStack>
          <Button
            icon={Plus}
            onPress={() => router.push('/admin/loterias/nueva')}
            bg="$primary"
            hoverStyle={{ scale: 1.02 }}
            pressStyle={{ bg: '$primaryPress', scale: 0.98 }}
          >
            <Text>Agregar</Text>
          </Button>
        </XStack>

        <Toolbar>
          <YStack gap="$3">
            <XStack gap="$2" ai="center" flexWrap="wrap">
              {/* Buscar */}
              <XStack flex={1} position="relative" ai="center">
                <Input
                  flex={1}
                  placeholder="Buscar por nombre"
                  value={searchInput}
                  onChangeText={setSearchInput}
                  inputMode="search"
                  enterKeyHint="search"
                  pr="$8"
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  aria-label='Buscar ventanas'
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
                    aria-label='Limpiar búsqueda'
                    // alignSelf='center'
                    hoverStyle={{ bg: '$backgroundHover' }}
                  />
                )}
              </XStack>

              <Button icon={Search} onPress={handleSearch}
              pressStyle={{ scale: 0.98 }}>
                <Text>Buscar</Text>
                </Button>

              <Separator vertical />

              {/* Empuja el switch a la derecha */}
              {/* <XStack flex={1} /> */}

              {/* Front-only: Activas (default true) */}
              {/* <XStack ai="center" gap="$2" minWidth={220} ml="$2"> */}
                <FilterSwitch
                  label="Activas:"
                  checked={activeOnly}
                  onCheckedChange={(v) => { setActiveOnly(!!v); setPage(1) }}
                />
                {/* <Text color="$textSecondary" fontSize="$2">
                </Text> */}
              {/* </XStack> */}

              <Separator vertical />

              <Button
                icon={RefreshCw}
                onPress={() => { setPage(1); refetch() }}
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
                hoverStyle={{ backgroundColor: '$gray5' }}
                pressStyle={{ scale: 0.98 }}
              >
                Limpiar
              </Button>
            </XStack>
          </YStack>
        </Toolbar>

        {isLoading ? (
          <Card padding="$4"><Text>Cargando loterías…</Text></Card>
        ) : isError ? (
          <Card padding="$4" bg="$backgroundHover" borderColor="$error" borderWidth={1}><Text color="$error">No fue posible cargar.</Text></Card>
        ) : (rows?.length ?? 0) === 0 ? (
          <Card padding="$6" ai="center" jc="center" borderColor="$borderColor" borderWidth={1}>
            <Text fontSize="$5" fontWeight="600">Sin resultados</Text>
            <Text color="$textSecondary">
              {activeOnly ? 'No hay loterías activas con los filtros aplicados.' : 'No hay loterías inactivas con los filtros aplicados.'}
            </Text>
          </Card>
        ) : (
          <YStack gap="$2">
            {rows!.map((lot) => {
              // const deleted = ((lot as any)?.isDeleted === true)
              const active = ((lot as any)?.isActive ?? true) === true
              return (
                <Card
                  key={(lot as any).id as string}
                  padding="$4"
                  backgroundColor="$backgroundHover"
                  borderColor="$borderColor"
                  borderWidth={1}
                  pressStyle={{ scale: 0.98, backgroundColor: '$backgroundPress', borderColor: '$borderColorHover' }}
                  onPress={() => router.push(`/admin/loterias/${(lot as any).id}` as any)}
                >
                  <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
                    <YStack gap="$1" minWidth={260}>
                      <XStack ai="center" gap="$2" flexWrap="wrap">
                        <Text fontSize="$5" fontWeight="600">{lot.name}</Text>
                        <ActiveBadge active={active} />
                        {!active && <Badge tone="warning">ELIMINADA</Badge>}
                      </XStack>
                    </YStack>

                    <XStack gap="$2">
                      {active ? (
                        <Button
                          backgroundColor={'$red4'}
                          borderColor={'$red8'}
                          hoverStyle={{ backgroundColor: '$red5' }}
                          pressStyle={{ backgroundColor: '$red6', scale: 0.98 }}
                          icon={Trash2}
                          onPress={(e: any) => { e?.stopPropagation?.(); askDelete(lot) }}
                        >
                          <Text>Eliminar</Text>
                        </Button>
                      ) : (
                        <Button onPress={(e: any) => { e?.stopPropagation?.(); askRestore(lot) }}>
                          <Text>Restaurar</Text>
                        </Button>
                      )}
                    </XStack>
                  </XStack>
                </Card>
              )
            })}
          </YStack>
        )}

        {!!meta && (
          <XStack gap="$2" jc="center" mt="$4" ai="center">
            <Button size="$2" variant="secondary" disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}><Text>Anterior</Text></Button>
            <Card padding="$2" px="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
              <Text fontSize="$3">Página {meta.page} de {meta.totalPages}</Text>
            </Card>
            <Button size="$2" variant="secondary" disabled={page >= (meta.totalPages || 1)} onPress={() => setPage((p) => Math.min(p + 1, meta.totalPages || p + 1))}><Text>Siguiente</Text></Button>
          </XStack>
        )}

        <ConfirmRoot />
      </YStack>
    </ScrollView>
  )
}
