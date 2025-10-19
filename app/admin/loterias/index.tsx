// app/admin/loterias/index.tsx
import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, Input, Card, ScrollView, Spinner, Separator, Button } from 'tamagui'
import { useRouter } from 'expo-router'
import { Plus, Search, X, RefreshCw, Trash2 } from '@tamagui/lucide-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiErrorClass } from '@/lib/api.client'
import type { Loteria } from '@/types/models.types'
import { useToast } from '@/hooks/useToast'
import { Toolbar } from '@/components/ui/Toolbar'
import { Badge } from '@/components/ui/Badge'
import ActiveBadge from '@/components/ui/ActiveBadge'
import { useConfirm } from '@/components/ui/Confirm'
import FilterSwitch from '@/components/ui/FilterSwitch'

type ListParams = { page: number; pageSize: number; search?: string; isDeleted?: boolean; isActive?: boolean }

async function fetchLoterias(params: ListParams): Promise<{ data: Loteria[]; meta: { page:number; pageSize:number; total:number; totalPages:number } }> {
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
  const [isDeleted, setIsDeleted] = useState<boolean | undefined>(undefined)
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined)

  const params: ListParams = { page, pageSize, search, isDeleted, isActive }

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['loterias', 'list', params],
    queryFn: () => fetchLoterias(params),
    placeholderData: { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } },
    staleTime: 60_000,
  })

  const rows = useMemo(() => data?.data ?? [], [data])
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
  const clearFilters = () => { setSearchInput(''); setSearch(''); setIsDeleted(undefined); setIsActive(undefined); setPage(1) }

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
            hoverStyle={{ bg: '$primaryHover', scale: 1.02}}
            pressStyle={{ bg: '$primaryPress', scale: 0.98}}
            color="$background"
          >
            <Text>Nueva Lotería</Text>
          </Button>
        </XStack>

        <Toolbar>
          <YStack gap="$3">
            <XStack gap="$2" ai="center" flexWrap="wrap">
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
                  focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
                />
                {searchInput.length > 0 && (
                  <Button 
                    size="$2" 
                    circular 
                    icon={X}
                    position="absolute" 
                    onPress={() => setSearchInput('')}
                    aria-label='Limpiar búsqueda'
                    right="$2"
                    alignSelf='center'
                    variant='outlined'
                   />
                )}
              </XStack>

              <Button icon={Search} onPress={handleSearch}><Text>Buscar</Text></Button>
              <Separator vertical />

              {/* 🔁 Switches con estilo consistente */}
              {/* <FilterSwitch
                label="Activas:"
                checked={!!isActive}
                onCheckedChange={(v) => setIsActive(v || undefined)}
              />
              <Separator vertical /> */}
              <FilterSwitch
                label="Eliminadas:"
                checked={!!isDeleted}
                onCheckedChange={(v) => setIsDeleted(v || undefined)}
              />

              <Separator vertical />
              <Button icon={RefreshCw} onPress={() => { setPage(1); refetch() }}><Text>Refrescar</Text></Button>
              <Button onPress={clearFilters}><Text>Limpiar</Text></Button>
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
            <Text color="$textSecondary">Crea una nueva lotería.</Text>
          </Card>
        ) : (
          <YStack gap="$2">
            {rows!.map((lot) => {
              const deleted = ((lot as any)?.isDeleted === true)
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
                        {deleted && <Badge tone="warning">ELIMINADA</Badge>}
                      </XStack>
                    </YStack>

                    <XStack gap="$2">
                      {!deleted ? (
                        <Button icon={Trash2} onPress={(e:any) => { e?.stopPropagation?.(); askDelete(lot) }}>
                          <Text>Eliminar</Text>
                        </Button>
                      ) : (
                        <Button onPress={(e:any) => { e?.stopPropagation?.(); askRestore(lot) }}>
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
            <Button disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}><Text>Anterior</Text></Button>
            <Card padding="$2" px="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
              <Text fontSize="$3">Página {meta.page} de {meta.totalPages}</Text>
            </Card>
            <Button disabled={page >= (meta.totalPages || 1)} onPress={() => setPage((p) => Math.min(p + 1, meta.totalPages || p + 1))}><Text>Siguiente</Text></Button>
          </XStack>
        )}

        <ConfirmRoot />
      </YStack>
    </ScrollView>
  )
}
