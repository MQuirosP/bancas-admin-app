import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Input, Card, ScrollView } from 'tamagui';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiErrorClass } from '../../../lib/api.client';
import { Loteria } from '../../../types/models.types';

export default function NuevaLoteriaScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (data: Partial<Loteria>) => apiClient.post<Loteria>('/loterias', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loterias'] });
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

    const payload: Partial<Loteria> = {
      name,
    };

    createMutation.mutate(payload);
  };

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={600} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Nueva Lotería
        </Text>

        <Card padding="$4">
          <YStack gap="$4">
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Nombre *
              </Text>
              <Input
                size="$4"
                placeholder="Nombre de la lotería"
                value={name}
                onChangeText={setName}
              />
              {errors.name && (
                <Text color="$error" fontSize="$2">
                  {errors.name}
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
            disabled={createMutation.isPending || !name}
          >
            {createMutation.isPending ? 'Creando...' : 'Crear Lotería'}
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  );
}