import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Input, ScrollView, Card } from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus, Search } from '@tamagui/lucide-icons';
import { apiClient } from '../../../lib/api.client';
import { PaginatedResponse, Usuario } from '../../../types/models.types';
import { getRoleLabel } from '../../../utils/role';

export default function UsuariosListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['usuarios', page, search],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Usuario>>('/usuarios', {
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
            Usuarios
          </Text>
          <Button icon={Plus} onPress={() => router.push('/admin/usuarios/nuevo')}>
            Nuevo Usuario
          </Button>
        </XStack>

        <XStack gap="$3">
          <Input
            flex={1}
            placeholder="Buscar usuarios..."
            value={search}
            onChangeText={setSearch}
            size="$4"
          />
          <Button icon={Search}>Buscar</Button>
        </XStack>

        <YStack gap="$2">
          {data?.data.map((usuario) => (
            <Card
              key={usuario.id}
              padding="$4"
              pressStyle={{ scale: 0.98 }}
              onPress={() => router.push(`/admin/usuarios/${usuario.id}` as any)}
            >
              <XStack justifyContent="space-between" alignItems="center">
                <YStack flex={1}>
                  <Text fontSize="$5" fontWeight="600" color="$color">
                    {usuario.name}
                  </Text>
                  <Text fontSize="$3" color="$textSecondary">
                    {usuario.code} • {usuario.email}
                  </Text>
                  <Card
                    marginTop="$2"
                    padding="$1"
                    paddingHorizontal="$2"
                    backgroundColor="$blue4"
                    alignSelf="flex-start"
                  >
                    <Text fontSize="$2" fontWeight="600" color="$blue11">
                      {getRoleLabel(usuario.role as any)}
                    </Text>
                  </Card>
                </YStack>
                <Card
                  padding="$2"
                  paddingHorizontal="$3"
                  backgroundColor={usuario.isActive ? '$green4' : '$red4'}
                >
                  <Text
                    fontSize="$2"
                    fontWeight="600"
                    color={usuario.isActive ? '$green11' : '$red11'}
                  >
                    {usuario.isActive ? 'ACTIVO' : 'INACTIVO'}
                  </Text>
                </Card>
              </XStack>
            </Card>
          ))}
        </YStack>

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