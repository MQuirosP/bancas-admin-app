import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Input, ScrollView, Card, Spinner } from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus, Search } from '@tamagui/lucide-icons';
import { apiClient } from '../../../lib/api.client';
import { PaginatedResponse, Ventana } from '../../../types/models.types';

export default function VentanasListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['ventanas', page, search],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Ventana>>('/ventanas', {
        page,
        pageSize: 20,
        search,
      }),
  });

  return (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3">
          <Text fontSize="$8" fontWeight="bold" color="$color">
            Ventanas
          </Text>
          <Button icon={Plus} onPress={() => router.push('/admin/ventanas/nueva')}>
            Nueva Ventana
          </Button>
        </XStack>

        <XStack gap="$3">
          <Input
            flex={1}
            placeholder="Buscar ventanas..."
            value={search}
            onChangeText={setSearch}
            size="$4"
          />
          <Button icon={Search}>Buscar</Button>
        </XStack>

        {isLoading ? (
          <YStack padding="$8" alignItems="center">
            <Spinner size="large" />
          </YStack>
        ) : (
          <YStack gap="$2">
            {data?.data.map((ventana) => (
              <Card
                key={ventana.id}
                padding="$4"
                pressStyle={{ scale: 0.98 }}
                onPress={() => router.push(`/admin/ventanas/${ventana.id}` as any)}
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack flex={1}>
                    <Text fontSize="$5" fontWeight="600" color="$color">
                      {ventana.name}
                    </Text>
                    <Text fontSize="$3" color="$textSecondary">
                      {ventana.code}
                    </Text>
                  </YStack>
                  <Card
                    padding="$2"
                    paddingHorizontal="$3"
                    backgroundColor={ventana.isActive ? '$green4' : '$red4'}
                  >
                    <Text
                      fontSize="$2"
                      fontWeight="600"
                      color={ventana.isActive ? '$green11' : '$red11'}
                    >
                      {ventana.isActive ? 'ACTIVA' : 'INACTIVA'}
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