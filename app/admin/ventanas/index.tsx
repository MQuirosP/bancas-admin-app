// app/admin/ventanas/index.tsx
import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, ScrollView, Spinner, Separator } from 'tamagui'
import { Button, Input, Card, CollapsibleToolbar, ActiveBadge } from '@/components/ui'
import { useRouter } from 'expo-router'
import { Plus, Search, X, RefreshCw, Trash2, RotateCcw, ArrowLeft } from '@tamagui/lucide-icons'
import { useTheme } from 'tamagui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// Toolbar y ActiveBadge ahora desde components/ui/index
import FilterSwitch from '@/components/ui/FilterSwitch'
import { useConfirm } from '@/components/ui/Confirm'
import { useToast } from '@/hooks/useToast'
import { listVentanas, Ventana, softDeleteVentana, restoreVentana } from '@/services/ventanas.service' // Removed unused: updateVentana
import { queryKeys } from '@/lib/queryClient'

export default function VentanasListScreen() {
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
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
    queryKey: queryKeys.ventanas.list({ page, pageSize, search }), // ✅ Usar queryKeys centralizados
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.ventanas.all }); toast.success('Ventana eliminada') },
    onError: (e: any) => toast.error(e?.message || 'No fue posible eliminar'),
  })

  // ✅ Restaurar inactivas => set isActive = true vía update
  const mRestoreInactive = useMutation({
    mutationFn: (id: string) => restoreVentana(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.ventanas.all }); toast.success('Ventana restaurada') },
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
      <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        {/* Header */}
        <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
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
            <Text fontSize="$8" fontWeight="bold">Ventanas</Text>
            {isFetching && <Spinner size="small" />}
          </XStack>
          <Button
            icon={(p:any)=> <Plus {...p} color={iconColor} />}
            onPress={() => router.push('/admin/ventanas/nueva')}
            bg="$primary"
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
                  placeholder="Buscar por nombre, código o correo"
                  value={searchInput}
                  onChangeText={setSearchInput}
                  inputMode="search"
                  enterKeyHint="search"
                  pl="$10"
                  pr="$10"
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  aria-label="Buscar ventanas"
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
            <XStack gap="$3" ai="center" flexWrap="wrap">
              <FilterSwitch
                label="Activas:"
                checked={isActive}
                onCheckedChange={(v) => setIsActive(!!v)}
              />
            </XStack>
          }
          actionsContent={
            <XStack gap="$2" ai="center" flexWrap="wrap">
              <Button
                icon={(p:any)=> <RefreshCw {...p} color={iconColor} />}
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
          }
        />

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
                          icon={(p:any)=> <Trash2 {...p} color={iconColor} />}
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

