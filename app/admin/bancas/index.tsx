// app/admin/bancas/index.tsx
import React, { useMemo, useState } from 'react';
import { YStack, XStack, Text, Button, Input, ScrollView, Card, Spinner } from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus, Search } from '@tamagui/lucide-icons';
import { apiClient } from '../../../lib/api.client';
import { PaginatedResponse, Banca } from '../../../types/models.types';

async function fetchBancas(page: number, search: string): Promise<PaginatedResponse<Banca>> {
  const res = await apiClient.get('/bancas', {
    page,
    pageSize: 20,
    search: search.trim() || undefined,
  });

  const payload: any = res ?? {};

  // Normalización estricta:
  // 1) Si apiClient devolvió un array directo: [...]
  // 2) Si devolvió { data: [...], meta: {...} }
  // 3) Si devolvió { success, data: [...], meta: {...} }

  let items: Banca[] = [];
  let meta = {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  };

  if (Array.isArray(payload)) {
    // Caso 1: array crudo
    items = payload as Banca[];
  } else if (payload && Array.isArray(payload.data)) {
    // Caso 2/3: con envoltura
    items = payload.data as Banca[];
    if (payload.meta) {
      meta = {
        page: Number(payload.meta.page ?? 1),
        pageSize: Number(payload.meta.pageSize ?? 20),
        total: Number(payload.meta.total ?? 0),
        totalPages: Number(payload.meta.totalPages ?? 1),
      };
    } else if (payload.pagination) {
      // Por si en algún punto viniera como `pagination` (no es tu caso actual)
      meta = {
        page: Number(payload.pagination.page ?? 1),
        pageSize: Number(payload.pagination.pageSize ?? 20),
        total: Number(payload.pagination.total ?? 0),
        totalPages: Number(payload.pagination.totalPages ?? 1),
      };
    }
  } else {
    // Forma inesperada: devuelve vacío pero tipado
    items = [];
  }

  return {
    data: items,
    // La pantalla espera `pagination`; mapeamos desde `meta`
    pagination: meta,
  };
}

export default function BancasListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['bancas', page, search],
    queryFn: () => fetchBancas(page, search),
    placeholderData: {
      data: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    },
    staleTime: 30_000,
    retry: 1,
  });

  const rows = useMemo(() => (Array.isArray(data?.data) ? data!.data : []), [data]);
  const pagination = data?.pagination!;

  return (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3">
          <XStack ai="center" gap="$2">
            <Text fontSize="$8" fontWeight="bold" color="$color">Bancas</Text>
            {isFetching && <Spinner size="small" />}
          </XStack>
          <Button icon={Plus} onPress={() => router.push('/admin/bancas/nueva')}>
            Nueva Banca
          </Button>
        </XStack>

        <XStack gap="$3">
          <Input
            flex={1}
            placeholder="Buscar bancas..."
            value={search}
            onChangeText={(v) => { setSearch(v); setPage(1); }}
            size="$4"
          />
          <Button icon={Search} onPress={() => refetch()}>
            Buscar
          </Button>
        </XStack>

        {isLoading ? (
          <YStack padding="$8" alignItems="center">
            <Spinner size="large" />
            <Text marginTop="$3" color="$secondary">Cargando bancas...</Text>
          </YStack>
        ) : isError ? (
          <Card padding="$4" backgroundColor="$red4">
            <Text color="$red11" fontWeight="700">Error</Text>
            <Text>{(error as Error)?.message ?? 'No se pudo cargar la lista.'}</Text>
          </Card>
        ) : rows.length === 0 ? (
          <Card padding="$4"><Text>No hay bancas para mostrar.</Text></Card>
        ) : (
          <YStack gap="$2">
            {rows.map((banca) => (
              <Card
                key={banca.id}
                padding="$4"
                pressStyle={{ scale: 0.98 }}
                onPress={() => router.push(`/admin/bancas/${banca.id}` as any)}
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack flex={1}>
                    <Text fontSize="$5" fontWeight="600" color="$color">{banca.name}</Text>
                    <Text fontSize="$3" color="$secondary">{banca.code}</Text>
                  </YStack>
                  <Card padding="$2" paddingHorizontal="$3" backgroundColor={banca.isActive ? '$green4' : '$red4'}>
                    <Text fontSize="$2" fontWeight="600" color={banca.isActive ? '$green11' : '$red11'}>
                      {banca.isActive ? 'ACTIVA' : 'INACTIVA'}
                    </Text>
                  </Card>
                </XStack>
              </Card>
            ))}
          </YStack>
        )}

        {!!pagination && (
          <XStack gap="$2" justifyContent="center" marginTop="$4" ai="center">
            <Button size="$3" disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}>
              Anterior
            </Button>
            <Card padding="$2" paddingHorizontal="$4" justifyContent="center">
              <Text fontSize="$3">Página {pagination.page} de {pagination.totalPages}</Text>
            </Card>
            <Button
              size="$3"
              disabled={page >= pagination.totalPages}
              onPress={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
            >
              Siguiente
            </Button>
          </XStack>
        )}
      </YStack>
    </ScrollView>
  );
}
