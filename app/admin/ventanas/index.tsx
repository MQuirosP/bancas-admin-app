// app/admin/ventanas/index.tsx
import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, Button, Input, Card, ScrollView, Spinner, Separator } from 'tamagui'
import { useRouter } from 'expo-router'
import { Plus, Search, X, RefreshCw, Trash2, RotateCcw } from '@tamagui/lucide-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Toolbar } from '@/components/ui/Toolbar'
import ActiveBadge from '@/components/ui/ActiveBadge'
import FilterSwitch from '@/components/ui/FilterSwitch'
import { useConfirm } from '@/components/ui/Confirm'
import { useToast } from '@/hooks/useToast'
import {
  listVentanas, Ventana,
  softDeleteVentana, updateVentana, restoreVentana
} from '@/services/ventanas.service'

export default function VentanasListScreen() {
  const router = useRouter()
  const toast = useToast()
  const qc = useQueryClient()
  const { confirm, ConfirmRoot } = useConfirm()

  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  // ✅ Filtro solo en cliente: ON => activas; OFF => inactivas
  const [isActive, setIsActive] = useState<boolean>(true)

  // ✅ NO incluimos isActive en params para el backend
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['ventanas', 'list', { page, pageSize, search }], // ← sin isActive
    queryFn: () => listVentanas({ page, pageSize, search }),
    placeholderData: { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } },
    staleTime: 60_000,
  })

  const allRows = data?.data ?? []
  // ✅ Filtrado en memoria
  const rows = useMemo(
    () => allRows.filter(v => (v.isActive ?? true) === isActive),
    [allRows, isActive]
  )
  const meta = data?.meta

  const mDelete = useMutation({
    mutationFn: (id: string) => softDeleteVentana(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ventanas'] }); toast.success('Ventana eliminada') },
    onError: (e: any) => toast.error(e?.message || 'No fue posible eliminar'),
  })

  // ✅ Restaurar inactivas => set isActive = true vía update
  const mRestoreInactive = useMutation({
    mutationFn: (id: string) => restoreVentana(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ventanas'] }); toast.success('Ventana restaurada') },
    onError: (e: any) => toast.error(e?.message || 'No fue posible restaurar'),
  })

  const handleSearch = () => { setPage(1); setSearch(searchInput.trim()) }
  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setIsActive(true) // ← vuelve a activas
    setPage(1)
  }

  const askDelete = async (v: Ventana) => {
    const ok = await confirm({ title: 'Confirmar eliminación', description: `¿Eliminar “${v.name}”?`, okText: 'Eliminar' })
    if (ok) mDelete.mutate(v.id)
  }

  const restoreInactive = (e: any, v: Ventana) => {
    e?.stopPropagation?.()
    mRestoreInactive.mutate(v.id)
  }

  return (
    <ScrollView flex={1} backgroundColor="$background" contentContainerStyle={{ flexGrow: 1 }}>
      <YStack flex={1} padding="$4" gap="$4">
        {/* Header */}
        <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
          <XStack ai="center" gap="$2">
            <Text fontSize="$8" fontWeight="bold">Ventanas</Text>
            {isFetching && <Spinner size="small" />}
          </XStack>
          <Button
            icon={Plus}
            onPress={() => router.push('/admin/ventanas/nueva')}
            bg="$primary"
            hoverStyle={{ bg: '$primaryHover' }}
            pressStyle={{ bg: '$primaryPress', scale: 0.98 }}
          >
            <Text>Agregar</Text>
          </Button>
        </XStack>

        {/* Filtros */}
        <Toolbar>
          <YStack gap="$3">
            <XStack gap="$2" ai="center" flexWrap="wrap">
              <XStack flex={1} position="relative" ai="center">
                <Input
                  flex={1}
                  placeholder="Buscar por nombre, código o email"
                  value={searchInput}
                  onChangeText={setSearchInput}
                  inputMode="search"
                  enterKeyHint="search"
                  pr="$8"
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  aria-label="Buscar ventanas"
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

              <Button icon={Search} onPress={handleSearch} hoverStyle={{ scale: 1.02 }} pressStyle={{ scale: 0.98 }}>
                <Text>Buscar</Text>
              </Button>

              <Separator vertical />

              {/* ON => true (activas), OFF => false (inactivas) */}
              <FilterSwitch
                label="Activas:"
                checked={isActive}
                onCheckedChange={(v) => {
                  // 👇 Solo cambiamos el filtro en memoria
                  setIsActive(!!v)
                  // Si quisieras refetch explícito al togglear:
                  // refetch()
                }}
              />

              <Separator vertical />

              <Button icon={RefreshCw} onPress={() => { setPage(1); refetch() }} hoverStyle={{ scale: 1.02 }} pressStyle={{ scale: 0.98 }}>
                <Text>Refrescar</Text>
              </Button>
              <Button onPress={clearFilters} hoverStyle={{ scale: 1.02 }} pressStyle={{ scale: 0.98 }}>
                <Text>Limpiar</Text>
              </Button>
            </XStack>
          </YStack>
        </Toolbar>

        {/* Lista */}
        {isLoading ? (
          <Card padding="$4" elevate><Text>Cargando ventanas…</Text></Card>
        ) : isError ? (
          <Card padding="$4" elevate bg="$backgroundHover" borderColor="$error" borderWidth={1}>
            <Text color="$error">No fue posible cargar.</Text>
          </Card>
        ) : (rows?.length ?? 0) === 0 ? (
          <Card padding="$6" ai="center" jc="center" elevate borderColor="$borderColor" borderWidth={1}>
            <Text fontSize="$5" fontWeight="600">Sin resultados</Text>
            <Text color="$textSecondary">Ajusta filtros o crea una ventana.</Text>
          </Card>
        ) : (
          <YStack gap="$2">
            {rows!.map((v) => {
              const active = (v.isActive ?? true) === true
              return (
                <Card
                  key={v.id}
                  padding="$4"
                  bg="$backgroundHover"
                  borderColor="$borderColor"
                  borderWidth={1}
                  pressStyle={{ bg: '$backgroundPress', borderColor: '$borderColorHover', scale: 0.98 }}
                  onPress={() => router.push(`/admin/ventanas/${v.id}` as any)}
                >
                  <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
                    <YStack flex={1} gap="$1" minWidth={260}>
                      <XStack ai="center" gap="$2" flexWrap="wrap">
                        <Text fontSize="$5" fontWeight="600">{v.name}</Text>
                        <ActiveBadge active={active} />
                      </XStack>
                      <Text fontSize="$3" color="$textSecondary">
                        {(v.code ? `Código ${v.code} • ` : '')}{v.email || '—'}{v.phone ? ` • ${v.phone}` : ''}
                      </Text>
                    </YStack>

                    <XStack gap="$2">
                      {active ? (
                        <Button
                          backgroundColor={'$red4'}
                          borderColor={'$red8'}
                          icon={Trash2}
                          onPress={(e: any) => { e?.stopPropagation?.(); askDelete(v) }}
                          hoverStyle={{ backgroundColor: '$red5' }}
                          pressStyle={{ scale: 0.98 }}
                        >
                          <Text>Eliminar</Text>
                        </Button>
                      ) : (
                        <Button
                          icon={RotateCcw}
                          onPress={(e: any) => restoreInactive(e, v)}
                          disabled={mRestoreInactive.isPending}
                        >
                          {mRestoreInactive.isPending ? <Spinner size="small" /> : <Text>Restaurar</Text>}
                        </Button>
                      )}
                    </XStack>
                  </XStack>
                </Card>
              )
            })}
          </YStack>
        )}

        {/* Paginación */}
        {!!meta && (
          <XStack gap="$2" jc="center" mt="$4" ai="center">
            <Button disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}><Text>Anterior</Text></Button>
            <Card padding="$2" px="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
              <Text fontSize="$3">Página {meta.page} de {meta.totalPages}</Text>
            </Card>
            <Button disabled={page >= (meta.totalPages || 1)} onPress={() => setPage((p) => Math.min(p + 1, meta.totalPages || p + 1))}>
              <Text>Siguiente</Text>
            </Button>
          </XStack>
        )}

        <ConfirmRoot />
      </YStack>
    </ScrollView>
  )
}
