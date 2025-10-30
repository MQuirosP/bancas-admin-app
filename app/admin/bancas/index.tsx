// app/admin/bancas/index.tsx
import React, { useMemo, useState } from 'react';
import { YStack, XStack, Text, ScrollView, Spinner } from 'tamagui';
import { Button, Input, Card, CollapsibleToolbar, ActiveBadge } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus, Search, X, RefreshCw, Trash2, ArrowLeft } from '@tamagui/lucide-icons';
import { useTheme } from 'tamagui';
import { apiClient, ApiErrorClass } from '@/lib/api.client';
// Usar Toolbar y ActiveBadge desde components/ui
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/components/ui/Confirm';
import type { PaginatedResponse, Banca } from '@/types/models.types';

async function fetchBancas(page: number, search: string): Promise<PaginatedResponse<Banca>> {
  const res = await apiClient.get('/bancas', {
    page,
    pageSize: 20,
    search: search.trim() || undefined,
  });

  const payload: any = res ?? {};
  let items: Banca[] = [];
  let meta = { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  if (Array.isArray(payload)) {
    items = payload as Banca[];
  } else if (payload && Array.isArray(payload.data)) {
    items = payload.data as Banca[];
    const m = payload.meta ?? payload.pagination ?? {};
    meta = {
      page: Number(m.page ?? 1),
      pageSize: Number(m.pageSize ?? 20),
      total: Number(m.total ?? 0),
      totalPages: Number(m.totalPages ?? 1),
    };
  }

  return { data: items, pagination: meta };
}

export default function BancasListScreen() {
  const theme = useTheme();
  const iconColor = (theme?.color as any)?.get?.() ?? '#000';
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const { confirm, ConfirmRoot } = useConfirm();

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['bancas', page, searchTerm],
    queryFn: () => fetchBancas(page, searchTerm),
    placeholderData: {
      data: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    },
    staleTime: 30_000,
    retry: 1,
  });

  const rows = useMemo(() => (Array.isArray(data?.data) ? data!.data : []), [data]);
  const pagination = data?.pagination!;

  const handleSearchClick = () => {
    const next = searchInput.trim();
    if (next === searchTerm) {
      setPage(1);
      refetch();
    } else {
      setPage(1);
      setSearchTerm(next);
    }
  };

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(p + 1, pagination?.totalPages ?? p + 1));

  // Mutations: eliminar / restaurar
  const softDelete = useMutation({
    mutationFn: (id: string) => apiClient.deleteWithBody(`/bancas/${id}`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bancas'] }); toast.success('Banca eliminada'); },
    onError: (e: ApiErrorClass) => toast.error(e?.message || 'No fue posible eliminar'),
  });

  const restore = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/bancas/${id}/restore`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bancas'] }); toast.success('Banca restaurada'); },
    onError: (e: ApiErrorClass) => toast.error(e?.message || 'No fue posible restaurar'),
  });

  const askDelete = async (banca: Banca) => {
    const ok = await confirm({
      title: 'Confirmar eliminación',
      description: `¿Eliminar la banca "${banca.name}"?`,
      okText: 'Eliminar',
      cancelText: 'Cancelar',
    });
    if (ok) softDelete.mutate((banca as any).id as string);
  };

  const askRestore = async (banca: Banca) => {
    const ok = await confirm({
      title: 'Restaurar banca',
      description: `¿Restaurar la banca "${banca.name}"?`,
      okText: 'Restaurar',
      cancelText: 'Cancelar',
    });
    if (ok) restore.mutate((banca as any).id as string);
  };

  return (
    <ScrollView flex={1} backgroundColor="$background" contentContainerStyle={{ flexGrow: 1 }}>
      <YStack flex={1} padding="$4" gap="$4" backgroundColor="$background" maxWidth={1200} alignSelf="center" width="100%">
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3">
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
            <Text fontSize="$8" fontWeight="bold" color="$color">Bancas</Text>
            {isFetching && <Spinner size="small" />}
          </XStack>
          <Button
            icon={(p:any)=> <Plus {...p} color={iconColor} />}
            onPress={() => router.push('/admin/bancas/nueva')}
            bg="$primary"
            hoverStyle={{ scale: 1.02 }}
            pressStyle={{ bg: '$primaryPress', scale: 0.98 }}
          >
            <Text>Agregar</Text>
          </Button>
        </XStack>

        {/* Toolbar */}
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
                  onPress={handleSearchClick}
                  aria-label="Buscar"
                  backgroundColor="transparent"
                  borderWidth={0}
                  hoverStyle={{ bg: '$backgroundHover' }}
                />
                
                <Input
                  flex={1}
                  placeholder="Buscar bancas..."
                  value={searchInput}
                  onChangeText={setSearchInput}
                  inputMode="search"
                  enterKeyHint="search"
                  pl="$10"
                  pr="$10"
                  onSubmitEditing={handleSearchClick}
                  returnKeyType="search"
                  aria-label="Buscar bancas"
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
          actionsContent={
            <XStack gap="$2" ai="center" flexWrap="wrap">
              <Button
                icon={(p:any)=> <RefreshCw {...p} color={iconColor} />}
                onPress={() => { setPage(1); refetch() }}
                backgroundColor="$green4"
                borderColor="$green8"
                hoverStyle={{ backgroundColor: '$green5' }}
                pressStyle={{ backgroundColor: '$green6', scale: 0.98 }}
              >
                <Text>Refrescar</Text>
              </Button>
            </XStack>
          }
        />


        {/* Contenido */}
        {isLoading ? (
          <YStack padding="$8" alignItems="center" backgroundColor="$background">
            <Spinner size="large" />
            <Text marginTop="$3" color="$textSecondary">Cargando bancas...</Text>
          </YStack>
        ) : isError ? (
          <Card padding="$4" backgroundColor="$red4" borderColor="$red11" borderWidth={1}>
            <Text color="$red11" fontWeight="700">Error</Text>
            <Text color="$color">{(error as Error)?.message ?? 'No se pudo cargar la lista.'}</Text>
          </Card>
        ) : rows.length === 0 ? (
          <Card padding="$4" backgroundColor="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
            <Text color="$textSecondary">No hay bancas para mostrar.</Text>
          </Card>
        ) : (
          <YStack gap="$2">
            {rows.map((banca) => {
              // const deleted = ((banca as any)?.isDeleted === true);
              const active = !!(banca as any)?.isActive;

              return (
                <Card
                  key={banca.id}
                  padding="$4"
                  backgroundColor="$backgroundHover"
                  borderColor="$borderColor"
                  borderWidth={1}
                >
                  <XStack justifyContent="space-between" alignItems="center" gap="$3" flexWrap="wrap">
                    {/* Título + badge juntos */}
                    <Button
                      unstyled
                      backgroundColor="transparent"
                      borderWidth={0}
                      padding={0}
                      hoverStyle={{ backgroundColor: 'transparent' }}
                      pressStyle={{ scale: 0.98 }}
                      onPress={() => router.push(`/admin/bancas/${banca.id}` as any)}
                    >
                      <YStack flex={1} gap="$1">
                        <XStack ai="center" gap="$2" flexWrap="wrap">
                          <Text fontSize="$5" fontWeight="600" color="$color">{banca.name}</Text>
                          <ActiveBadge active={active} />
                        </XStack>
                        <Text fontSize="$3" color="$textSecondary">{banca.code}</Text>
                      </YStack>
                    </Button>

                    {/* Acciones (no navegan) */}
                    <XStack gap="$2">
                      {active ? (
                        <Button
                          icon={(p:any)=> <Trash2 {...p} color={iconColor} />}
                          backgroundColor="$red3"
                          borderColor="$red8"
                          hoverStyle={{ backgroundColor: '$red5' }}
                          pressStyle={{ bg: '$red5', scale: 0.98 }}
                          onPress={(e: any) => { e?.preventDefault?.(); e?.stopPropagation?.(); askDelete(banca); }}
                        >
                          <Text>Eliminar</Text>
                        </Button>
                      ) : (
                        <Button
                          icon={(p:any)=> <RefreshCw {...p} color={iconColor} />}
                          onPress={(e: any) => { e?.preventDefault?.(); e?.stopPropagation?.(); askRestore(banca); }}
                          disabled={restore.isPending}
                        >
                          {restore.isPending ? <Spinner size="small" /> : <Text>Restaurar</Text>}
                        </Button>
                      )}
                    </XStack>
                  </XStack>
                </Card>
              );
            })}
          </YStack>
        )}

        {/* Paginación */}
        {!!pagination && (
          <XStack gap="$2" justifyContent="center" marginTop="$4" ai="center">
            <Button size="$2" variant="secondary" disabled={page <= 1} onPress={handlePrev}><Text>Anterior</Text></Button>
            <Card padding="$2" paddingHorizontal="$4" justifyContent="center" backgroundColor="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
              <Text fontSize="$3" color="$color">Página {pagination.page} de {pagination.totalPages}</Text>
            </Card>
            <Button size="$2" variant="secondary" disabled={page >= pagination.totalPages} onPress={handleNext}><Text>Siguiente</Text></Button>
          </XStack>
        )}

        <ConfirmRoot />
      </YStack>
    </ScrollView>
  );
}


