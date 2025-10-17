import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Input, ScrollView, Card, Spinner } from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus, Search } from '@tamagui/lucide-icons';
import { apiClient } from '../../../lib/api.client';
import { PaginatedResponse, Banca } from '../../../types/models.types';

export default function BancasListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
  queryKey: ['bancas', page, search],
  queryFn: () =>
    apiClient.get<PaginatedResponse<Banca>>('/bancas', {
      page,
      pageSize: 20,
      ...(search && search.trim() ? { search: search.trim() } : {}), // 👈 sólo si hay valor
    }),
});

  return (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3">
          <Text fontSize="$8" fontWeight="bold" color="$color">
            Bancas
          </Text>
          <Button icon={Plus} onPress={() => router.push('/admin/bancas/nueva')}>
            Nueva Banca
          </Button>
        </XStack>

        <XStack gap="$3">
          <Input
            flex={1}
            placeholder="Buscar bancas..."
            value={search}
            onChangeText={setSearch}
            size="$4"
          />
          <Button icon={Search} onPress={() => setPage(1)}>
            Buscar
          </Button>
        </XStack>

        {isLoading ? (
          <YStack padding="$8" alignItems="center">
            <Spinner size="large" />
            <Text marginTop="$3" color="$secondary">
              Cargando bancas...
            </Text>
          </YStack>
        ) : (
          <YStack gap="$2">
            {data?.data.map((banca) => (
              <Card
                key={banca.id}
                padding="$4"
                pressStyle={{ scale: 0.98 }}
                onPress={() => router.push(`/admin/bancas/${banca.id}` as any)}
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack flex={1}>
                    <Text fontSize="$5" fontWeight="600" color="$color">
                      {banca.name}
                    </Text>
                    <Text fontSize="$3" color="$secondary">
                      {banca.code}
                    </Text>
                  </YStack>
                  <Card
                    padding="$2"
                    paddingHorizontal="$3"
                    backgroundColor={banca.isActive ? '$green4' : '$red4'}
                  >
                    <Text
                      fontSize="$2"
                      fontWeight="600"
                      color={banca.isActive ? '$green11' : '$red11'}
                    >
                      {banca.isActive ? 'ACTIVA' : 'INACTIVA'}
                    </Text>
                  </Card>
                </XStack>
              </Card>
            ))}
          </YStack>
        )}

        {data?.pagination && (
          <XStack gap="$2" justifyContent="center" marginTop="$4">
            <Button size="$3" disabled={page === 1} onPress={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Card padding="$2" paddingHorizontal="$4" justifyContent="center">
              <Text fontSize="$3">
                Página {data.pagination.page} de {data.pagination.totalPages}
              </Text>
            </Card>
            <Button
              size="$3"
              disabled={page === data.pagination.totalPages}
              onPress={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </XStack>
        )}
      </YStack>
    </ScrollView>
  );
}