// app/admin/usuarios/index.tsx
import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, Button, Input, Card, ScrollView, Spinner, Separator, Switch } from 'tamagui'
import { useRouter } from 'expo-router'
import { Plus, Search, X, Trash2, RefreshCw } from '@tamagui/lucide-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiErrorClass } from '@/lib/api.client'
import type { Usuario } from '@/types/models.types'
import type { UsersQueryParams } from '@/services/users.service'
import { useToast } from '@/hooks/useToast'
import { Toolbar } from '@/components/ui/Toolbar'
import { RoleBadge, StatusPill } from '@/components/ui/Badge'
import { useConfirm } from '@/components/ui/Confirm' // tu modal propio basado en RN Modal

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
  const [isDeleted, setIsDeleted] = useState<boolean | undefined>(undefined)

  const params: UsersQueryParams & { page: number; pageSize: number } = { page, pageSize, search, role, isDeleted }

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['users', 'list', params],
    queryFn: () => fetchUsers(params),
    placeholderData: { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } },
    staleTime: 60_000,
  })

  const rows = useMemo(() => data?.data ?? [], [data])
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

  const handleSearch = () => { setPage(1); setSearch(searchInput.trim()) }
  const clearFilters = () => { setSearchInput(''); setSearch(''); setRole(undefined); setIsDeleted(undefined); setPage(1) }

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
            hoverStyle={{ bg: '$primaryHover', scale: 1.02 }}
            pressStyle={{ bg: '$primaryPress', scale: 0.98 }}
            color="$background"
          >
            Nuevo Usuario
          </Button>
        </XStack>

        {/* Filtros */}
        <Toolbar>
          <YStack gap="$3">
            <XStack gap="$2" ai="center" flexWrap="wrap">
              <XStack flex={1} position="relative" ai="center">
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
                    right="$2"
                    onPress={() => setSearchInput('')}
                    aria-label="Limpiar búsqueda"
                    hoverStyle={{ bg: '$backgroundHover' }}
                  />
                )}
              </XStack>
              <Button icon={Search} onPress={handleSearch} hoverStyle={{ scale: 1.02 }} pressStyle={{ scale: 0.98 }}>
                Buscar
              </Button>
              <Separator vertical />
              <XStack ai="center" gap="$2">
                <Text fontSize="$3">Rol:</Text>
                <select
                  value={role ?? ''}
                  onChange={(e) => setRole((e.target.value || undefined) as any)}
                  style={{ padding: 8, borderRadius: 8 }}
                >
                  <option value="">Todos</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="VENTANA">VENTANA</option>
                  <option value="VENDEDOR">VENDEDOR</option>
                </select>
              </XStack>
              <Separator vertical />
              <XStack ai="center" gap="$2">
                <Text fontSize="$3">Eliminados:</Text>
                <Switch checked={!!isDeleted} onCheckedChange={(v) => setIsDeleted(!!v || undefined)} />
              </XStack>
              <Separator vertical />
              <Button icon={RefreshCw} onPress={() => { setPage(1); refetch() }} hoverStyle={{ scale: 1.02 }} pressStyle={{ scale: 0.98 }}>
                Refrescar
              </Button>
              <Button onPress={clearFilters} hoverStyle={{ scale: 1.02 }} pressStyle={{ scale: 0.98 }}>Limpiar</Button>
            </XStack>
          </YStack>
        </Toolbar>

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
            {rows!.map((u) => (
              <Card
                key={u.id}
                padding="$4"
                backgroundColor="$backgroundHover"
                borderColor="$borderColor"
                borderWidth={1}
                pressStyle={{
                  backgroundColor: '$backgroundPress',
                  borderColor: '$borderColorHover'
                }}
              >
                <XStack justifyContent="space-between" ai="center" gap="$3" flexWrap="wrap">
                  <YStack flex={1} gap="$1" minWidth={260}>
                    <XStack ai="center" gap="$2" flexWrap="wrap">
                      <Text fontSize="$5" fontWeight="600">{u.name}</Text>
                      <Text fontSize="$3" color="$textSecondary">({u.username})</Text>
                      <RoleBadge role={u.role as any} />
                      <StatusPill active={!(u as any).isActive === false ? true : !!(u as any).isActive} />
                    </XStack>
                    <Text fontSize="$3" color="$textSecondary">
                      {u.email || '—'} {u.ventanaId ? `• Ventana ${u.ventanaId}` : ''} {(u as any).code ? `• Código ${(u as any).code}` : ''}
                    </Text>
                  </YStack>
                  <XStack gap="$2">
                    {!u.isDeleted ? (
                      <Button icon={Trash2} onPress={() => confirmDelete(u)} hoverStyle={{ bg: '$backgroundHover', scale: 1.02 }} pressStyle={{ scale: 0.98 }}>
                        Eliminar
                      </Button>
                    ) : (
                      <Button icon={RefreshCw} onPress={() => confirmRestore(u)} disabled={restore.isPending}>
                        {restore.isPending ? <Spinner size="small" /> : 'Restaurar'}
                      </Button>
                    )}
                    <Button onPress={() => router.push(`/admin/usuarios/${u.id}` as any)} bg="$background" hoverStyle={{ bg: '$backgroundHover' }}>
                      Editar
                    </Button>
                  </XStack>
                </XStack>
              </Card>
            ))}
          </YStack>
        )}

        {/* Paginación */}
        {!!meta && (
          <XStack gap="$2" jc="center" mt="$4" ai="center">
            <Button disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
            <Card padding="$2" px="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
              <Text fontSize="$3">Página {meta.page} de {meta.totalPages}</Text>
            </Card>
            <Button disabled={page >= (meta.totalPages || 1)} onPress={() => setPage((p) => Math.min(p + 1, meta.totalPages || p + 1))}>
              Siguiente
            </Button>
          </XStack>
        )}

        <ConfirmRoot />
      </YStack>
    </ScrollView>
  )
}
