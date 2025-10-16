import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Input, Card, Switch, ScrollView } from 'tamagui';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiErrorClass } from '../../../lib/api.client';
import { Banca } from '../../../types/models.types';

export default function NuevaBancaScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [salesCutoffMinutes, setSalesCutoffMinutes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (data: Partial<Banca>) => apiClient.post<Banca>('/bancas', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bancas'] });
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

    const payload: Partial<Banca> = {
      name,
      code,
      isActive,
      salesCutoffMinutes: salesCutoffMinutes ? parseInt(salesCutoffMinutes) : undefined,
    };

    createMutation.mutate(payload);
  };

  return (
    <ScrollView>
      <YStack padding="$4" gap="$4" maxWidth={600} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Nueva Banca
        </Text>

        <Card padding="$4">
          <YStack gap="$4">
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Nombre *
              </Text>
              <Input
                size="$4"
                placeholder="Nombre de la banca"
                value={name}
                onChangeText={setName}
              />
              {errors.name && (
                <Text color="$error" fontSize="$2">
                  {errors.name}
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Código *
              </Text>
              <Input
                size="$4"
                placeholder="BCN-001"
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
              />
              {errors.code && (
                <Text color="$error" fontSize="$2">
                  {errors.code}
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Minutos de Cutoff (opcional)
              </Text>
              <Input
                size="$4"
                placeholder="5"
                value={salesCutoffMinutes}
                onChangeText={setSalesCutoffMinutes}
                keyboardType="number-pad"
              />
              <Text fontSize="$2" color="$secondary">
                Minutos antes del sorteo para bloquear ventas
              </Text>
            </YStack>

            <XStack gap="$3" alignItems="center">
              <Switch size="$4" checked={isActive} onCheckedChange={setIsActive}>
                <Switch.Thumb animation="quick" />
              </Switch>
              <Text fontSize="$4">Activa</Text>
            </XStack>
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
            disabled={createMutation.isPending || !name || !code}
          >
            {createMutation.isPending ? 'Creando...' : 'Crear Banca'}
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  );
}