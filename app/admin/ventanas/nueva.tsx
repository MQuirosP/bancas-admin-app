import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Input, Card, Switch, Select, ScrollView } from 'tamagui';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiErrorClass } from '../../../lib/api.client';
import { Banca, Ventana } from '../../../types/models.types';

export default function NuevaVentanaScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [bancaId, setBancaId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [salesCutoffMinutes, setSalesCutoffMinutes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: bancas } = useQuery({
    queryKey: ['bancas'],
    queryFn: () => apiClient.get<Banca[]>('/bancas'),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Ventana>) => apiClient.post<Ventana>('/ventanas', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventanas'] });
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

    const payload: Partial<Ventana> = {
      bancaId,
      name,
      code,
      isActive,
      salesCutoffMinutes: salesCutoffMinutes ? parseInt(salesCutoffMinutes) : undefined,
    };

    createMutation.mutate(payload);
  };

  return (
    <ScrollView backgroundColor={'$background'}>
      <YStack padding="$4" gap="$4" maxWidth={600} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Nueva Ventana
        </Text>

        <Card padding="$4">
          <YStack gap="$4">
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Banca *
              </Text>
              <Select value={bancaId} onValueChange={setBancaId}>
                <Select.Trigger width="100%">
                  <Select.Value placeholder="Seleccionar banca" />
                </Select.Trigger>
                <Select.Content zIndex={200000}>
                  <Select.Viewport>
                    {bancas?.map((banca, index) => (
                      <Select.Item key={banca.id} index={index} value={banca.id}>
                        <Select.ItemText>{banca.name}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select>
              {errors.bancaId && (
                <Text color="$error" fontSize="$2">
                  {errors.bancaId}
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Nombre *
              </Text>
              <Input size="$4" placeholder="Nombre de la ventana" value={name} onChangeText={setName} />
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
                placeholder="VNT-001"
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
              <Text fontSize="$2" color="$textSecondary">
                Sobrescribe el cutoff de la banca
              </Text>
            </YStack>

            <XStack gap="$3" alignItems="center">
              <Switch
                size="$2"
                checked={isActive}
                onCheckedChange={(v) => setIsActive(!!v)}
                // visibilidad/contraste en web
                bw={1}
                bc="$borderColor"
                bg={isActive ? '$color10' : '$background'}
                hoverStyle={{ bg: isActive ? '$color10' : '$backgroundHover' }}
                aria-label="Activa"
              >
                <Switch.Thumb animation="quick" bg="$color12" />
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
            disabled={createMutation.isPending || !bancaId || !name || !code}
          >
            {createMutation.isPending ? 'Creando...' : 'Crear Ventana'}
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  );
}