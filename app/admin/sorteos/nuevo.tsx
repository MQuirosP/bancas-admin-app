import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Input, Card, ScrollView, Select } from 'tamagui';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiErrorClass } from '../../../lib/api.client';
import { Sorteo, Loteria } from '../../../types/models.types';
import { Check, ChevronDown } from '@tamagui/lucide-icons';

export default function NuevoSorteoScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [loteriaId, setLoteriaId] = useState('');
  const [name, setName] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar lista de loterías para el select
  const { data: loteriasData } = useQuery({
    queryKey: ['loterias'],
    queryFn: () => apiClient.get<{ data: Loteria[] }>('/loterias'),
  });

  const loterias = loteriasData?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: Partial<Sorteo>) => apiClient.post<Sorteo>('/sorteos', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sorteos'] });
      router.back();
    },
    onError: (error: ApiErrorClass) => {
      if (error.details) {
        const fieldErrors: Record<string, string> = {};
        error.details.forEach((detail) => {
          if (detail.field) {
            fieldErrors[detail.field] = detail.message;
          }
        });
        setErrors(fieldErrors);
      }
    },
  });

  const handleSubmit = () => {
    setErrors({});

    const payload: any = {
      loteriaId,
      name,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    };

    createMutation.mutate(payload);
  };

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={600} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Nuevo Sorteo
        </Text>

        <Card padding="$4">
          <YStack gap="$4">
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Lotería *
              </Text>
              <Select value={loteriaId} onValueChange={setLoteriaId}>
                <Select.Trigger width="100%" iconAfter={ChevronDown}>
                  <Select.Value placeholder="Seleccione una lotería" />
                </Select.Trigger>

                <Select.Content zIndex={200000}>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    <Select.Group>
                      {loterias.map((loteria, idx) => (
                        <Select.Item key={loteria.id} index={idx} value={loteria.id}>
                          <Select.ItemText>{loteria.name}</Select.ItemText>
                          <Select.ItemIndicator marginLeft="auto">
                            <Check size={16} />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Group>
                  </Select.Viewport>
                  <Select.ScrollDownButton />
                </Select.Content>
              </Select>
              {errors.loteriaId && (
                <Text color="$error" fontSize="$2">
                  {errors.loteriaId}
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Nombre *
              </Text>
              <Input
                size="$4"
                placeholder="Sorteo Tarde, Sorteo Noche, etc."
                value={name}
                onChangeText={setName}
              />
              <Text fontSize="$2" color="$textSecondary">
                Máximo 100 caracteres
              </Text>
              {errors.name && (
                <Text color="$error" fontSize="$2">
                  {errors.name}
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Fecha y Hora Programada *
              </Text>
              <Input
                size="$4"
                placeholder="2024-10-17T15:00"
                value={scheduledAt}
                onChangeText={setScheduledAt}
              />
              <Text fontSize="$2" color="$textSecondary">
                Formato: YYYY-MM-DDTHH:mm (ej: 2024-10-17T15:00)
              </Text>
              {errors.scheduledAt && (
                <Text color="$error" fontSize="$2">
                  {errors.scheduledAt}
                </Text>
              )}
            </YStack>
          </YStack>
        </Card>

        <XStack gap="$3">
          <Button flex={1} backgroundColor="$red4" borderColor="$red8" borderWidth={1} onPress={() => router.back()}>
            Cancelar
          </Button>
          <Button
            flex={1}
            backgroundColor="$blue4" borderColor="$blue8" borderWidth={1}
            onPress={handleSubmit}
            disabled={createMutation.isPending || !loteriaId || !name || !scheduledAt}
          >
            {createMutation.isPending ? 'Creando...' : 'Crear Sorteo'}
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  );
}