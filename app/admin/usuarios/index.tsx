// app/admin/usuarios/index.tsx
import React, { useMemo, useState } from 'react'
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
import { Plus, Search, X, Trash2, RefreshCw, ChevronDown, Check } from '@tamagui/lucide-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiErrorClass } from '@/lib/api.client'
import type { Usuario } from '@/types/models.types'
import type { UsersQueryParams } from '@/services/users.service'
import { useToast } from '@/hooks/useToast'
import { Toolbar } from '@/components/ui/Toolbar'
import { RoleBadge } from '@/components/ui/Badge'
import ActiveBadge from '@/components/ui/ActiveBadge'
import { useConfirm } from '@/components/ui/Confirm'
import FilterSwitch from '@/components/ui/FilterSwitch'
import { useVentanasInfinite } from '@/hooks/useVentanasInfinite'
import { set } from 'date-fns'


async function fetchUsers(
  params: UsersQueryParams & { page: number; pageSize: number }
): Promise<{ data: Usuario[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }> {
  const res = await apiClient.get<any>('/users', params)
  const payload: any = res ?? {}
  const items: Usuario[] = Array.isArray(payload) ? payload : payload?.data ?? []
  const m = payload?.meta ?? payload?.pagination ?? {}
  const meta = {
    page: Number(m?.page ?? params.page ?? 1),
    pageSize: Number(m?.pageSize ?? params.pageSize ?? 20),
    total: Number(m?.total ?? (Array.isArray(items) ? items.length : 0)),
    totalPages: Number(m?.totalPages ?? 1),
  }
  return { data: items, meta }
}

/** Select de roles SIN Select.Portal (compatible con tu versión) */
function RoleSelect({
  value,
  onChange,
}: {
  value: UsersQueryParams['role'] | undefined
  onChange: (val: UsersQueryParams['role'] | undefined) => void
}) {
  type RoleValue = UsersQueryParams['role'] | 'ALL' | undefined
  const internal = (value ?? 'ALL') as RoleValue

  const items: { value: RoleValue; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'ADMIN', label: 'ADMIN' },
    { value: 'VENTANA', label: 'VENTANA' },
    { value: 'VENDEDOR', label: 'VENDEDOR' },
  ]

  const labelOf = (v: RoleValue) => items.find(i => i.value === v)?.label ?? 'Todos'

  return (
    <Select
      size="$3"
      value={internal}
      onValueChange={(v: string) =>
        onChange(v === 'ALL' ? undefined : (v as UsersQueryParams['role']))
      }
    >
      <Select.Trigger
        px="$3"
        br="$3"
        bw={1}
        mr={7}
        bc="$borderColor"
        bg="$background"
        hoverStyle={{ bg: '$backgroundHover' }}
        focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
        iconAfter={ChevronDown}
      >
        <Select.Value>{labelOf(internal)}</Select.Value>
      </Select.Trigger>

      {/* Adapt móvil */}
      <Select.Adapt when="sm">
        <Sheet modal dismissOnSnapToBottom animation="quick">
          <Sheet.Frame p="$4">
            <Select.Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay />
        </Sheet>
      </Select.Adapt>

      {/* Contenido inline (sin Portal) */}
      <Select.Content zIndex={1000}>
        <YStack br="$3" bw={1} bc="$borderColor" bg="$background">
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

export default function UsuariosListScreen() {
  const router = useRouter()
  const toast = useToast()
  const qc = useQueryClient()
  const { confirm, ConfirmRoot } = useConfirm()

  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UsersQueryParams['role'] | undefined>(undefined)
  const [isActive, setIsActive] = useState<boolean | undefined>(true)

  const params: UsersQueryParams & { page: number; pageSize: number } = { page, pageSize, search, role }

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['users', 'list', params],
    queryFn: () => fetchUsers(params),
    placeholderData: { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } },
    staleTime: 60_000,
  })

  const rows = useMemo(() => {
    const base = data?.data ?? []
    if (isActive === true) return base.filter(u => (u as any).isActive !== false)
    if (isActive === false) return base.filter(u => (u as any).isActive === false)
    return base
  }, [data, isActive])

  const meta = data?.meta

  const softDelete = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.deleteWithBody(`/users/${id}`, reason?.trim() ? { reason } : undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Usuario eliminado') },
    onError: (err: ApiErrorClass) => toast.error(err?.message || 'No fue posible eliminar'),
  })

  const restore = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/users/${id}/restore`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Usuario restaurado') },
    onError: (err: ApiErrorClass) => toast.error(err?.message || 'No fue posible restaurar'),
  })

  const {
    data: vData,
    isFetching: vFetching,
    isError: vError,
    fetchNextPage,
    hasNextPage,
  } = useVentanasInfinite('') // sin búsqueda

  // Aplana + crea mapa { id: code|name }
  const ventanaLabelById = useMemo(() => {
    const all = (vData?.pages ?? []).flatMap(p => p.data ?? [])
    const map = new Map<string, string>()
    for (const v of all) {
      map.set(v.id, (v as any).code ?? v.name ?? v.id)
    }
    return map
  }, [vData])

  const handleSearch = () => { setPage(1); setSearch(searchInput.trim()) }
  const clearFilters = () => { setSearchInput(''); setSearch(''); setRole(undefined); setIsActive(true); setPage(1) }

  const confirmDelete = async (u: Usuario) => {
    const ok = await confirm({ title: 'Confirmar eliminación', description: `¿Eliminar a ${u.name}?`, okText: 'Eliminar', cancelText: 'Cancelar' })
    if (ok) softDelete.mutate({ id: u.id })
  }
  const confirmRestore = async (u: Usuario) => {
    const ok = await confirm({ title: 'Restaurar usuario', description: `¿Restaurar a ${u.name}?`, okText: 'Restaurar', cancelText: 'Cancelar' })
    if (ok) restore.mutate(u.id)
  }

  return (
    <ScrollView flex={1} backgroundColor="$background" contentContainerStyle={{ flexGrow: 1 }}>
      <YStack flex={1} padding="$4" gap="$4">
        {/* Header */}
        <XStack justifyContent="space-between" ai="center" gap="$3" flexWrap="wrap">
          <XStack ai="center" gap="$2">
            <Text fontSize="$8" fontWeight="bold">Usuarios</Text>
            {isFetching && <Spinner size="small" />}
          </XStack>
          <Button
            icon={Plus}
            onPress={() => router.push('/admin/usuarios/nuevo')}
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
            <XStack gap="$3" ai="center" flexWrap="wrap">
              <XStack flex={1} position="relative" ai="center" minWidth={260}>
                <Input
                  flex={1}
                  placeholder="Buscar por nombre, usuario o correo"
                  value={searchInput}
                  onChangeText={setSearchInput}
                  inputMode="search"
                  enterKeyHint="search"
                  pr="$8"
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  aria-label="Buscar usuarios"
                  focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
                />
                {searchInput.length > 0 && (
                  <Button
                    size="$2"
                    circular
                    icon={X}
                    position="absolute"
                    // right="$1"
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

              <XStack ai="center" gap="$2" minWidth={180}>
                <Text fontSize="$3">Rol:</Text>
                <RoleSelect value={role} onChange={setRole} />
              </XStack>

              <Separator vertical />

              {/* Etiqueta + switch en bloque para que no se sobreponga */}
              {/* <XStack ai="center" gap="$2" minWidth={200} marginLeft={'$3'}> */}
                <FilterSwitch
                  label="Activos:"
                  checked={isActive === true}
                  onCheckedChange={(v) => {
                    setIsActive(v)
                    setPage(1)
                  }}
                />
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
                <Text>Refrescar</Text>
              </Button>

              <Button 
              onPress={clearFilters} 
              backgroundColor={'$gray4'}
                borderColor={'$gray8'}
                hoverStyle={{ backgroundColor: '$gray5' }}
                pressStyle={{ scale: 0.98 }}
              >
                <Text>Limpiar</Text>
              </Button>
            </XStack>
          </YStack>
        </Toolbar>

        {/* Cargar más ventanas para etiquetas */}
        {hasNextPage && (
          <Button
            onPress={() => fetchNextPage()}
            disabled={vFetching}
            size="$2"
            alignSelf="flex-start"
            bg="$background"
            bw={1}
            bc="$borderColor"
            hoverStyle={{ bg: '$backgroundHover', scale: 1.02 }}
            pressStyle={{ scale: 0.98 }}
          >
            <Text>{vFetching ? 'Cargando…' : 'Cargar más ventanas'}</Text>
          </Button>
        )}

        {/* Lista */}
        {isLoading ? (
          <Card padding="$4" elevate><Text>Cargando usuarios…</Text></Card>
        ) : isError ? (
          <Card padding="$4" elevate bg="$backgroundHover" borderColor="$error" borderWidth={1}>
            <Text color="$error">No fue posible cargar usuarios.</Text>
          </Card>
        ) : (rows?.length ?? 0) === 0 ? (
          <Card padding="$6" ai="center" jc="center" elevate borderColor="$borderColor" borderWidth={1}>
            <Text fontSize="$5" fontWeight="600">Sin resultados</Text>
            <Text color="$textSecondary">Ajusta filtros o crea un usuario nuevo.</Text>
          </Card>
        ) : (
          <YStack gap="$2">
            {rows!.map((u) => {
              const rowIsActive = (u as any).isActive !== false
              return (
                <Card
                  key={u.id}
                  padding="$4"
                  backgroundColor="$backgroundHover"
                  borderColor="$borderColor"
                  borderWidth={1}
                  pressStyle={{ backgroundColor: '$backgroundPress', borderColor: '$borderColorHover', scale: 0.98 }}
                  onPress={() => router.push(`/admin/usuarios/${u.id}` as any)}
                >
                  <XStack justifyContent="space-between" ai="center" gap="$3" flexWrap="wrap">
                    <YStack flex={1} gap="$1" minWidth={260}>
                      <XStack ai="center" gap="$2" flexWrap="wrap">
                        <Text fontSize="$5" fontWeight="600">{u.name}</Text>
                        <Text fontSize="$3" color="$textSecondary">({u.username})</Text>
                        <RoleBadge role={u.role as any} />
                        <ActiveBadge active={rowIsActive} />
                      </XStack>
                      <Text fontSize="$3" color="$textSecondary">
                        {u.email || '—'}
                        {!!u.ventanaId && <> • Ventana {ventanaLabelById.get(u.ventanaId) ?? u.ventanaId}</>}
                        {!!(u as any).code && <> • Código {(u as any).code}</>}
                      </Text>
                    </YStack>

                    <XStack gap="$2">
                      {!u.isDeleted ? (
                        <Button
                          backgroundColor={'$red4'}
                          borderColor={'$red8'}
                          hoverStyle={{ backgroundColor: '$red5' }}
                          pressStyle={{ backgroundColor: '$red6', scale: 0.98 }}
                          icon={Trash2}
                          onPress={(e: any) => { e?.stopPropagation?.(); confirmDelete(u) }}
                        >
                          <Text>Eliminar</Text>
                        </Button>
                      ) : (
                        <Button
                          icon={RefreshCw}
                          onPress={(e: any) => { e?.stopPropagation?.(); confirmRestore(u) }}
                          disabled={restore.isPending}
                        >
                          {restore.isPending ? <Spinner size="small" /> : <Text>Restaurar</Text>}
                        </Button>
                      )}
                    </XStack>
                  </XStack>
                </Card>
              )
            })}
          </YStack>
        )}

        {/* ...lista de usuarios... */}

        {hasNextPage && (
          <Button
            onPress={() => fetchNextPage()}
            disabled={vFetching}
            size="$2"
            alignSelf="flex-start"
            mt="$2"
            bg="$background"
            bw={1}
            bc="$borderColor"
            hoverStyle={{ bg: '$backgroundHover', scale: 1.02 }}
            pressStyle={{ scale: 0.98 }}
          >
            <Text>{vFetching ? 'Cargando…' : 'Cargar más ventanas'}</Text>
          </Button>
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
