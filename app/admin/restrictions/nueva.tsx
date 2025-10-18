import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Input, Card, ScrollView, Select } from 'tamagui';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiErrorClass } from '../../../lib/api.client';
import { RestrictionRule, Banca, Ventana, Usuario } from '../../../types/models.types';
import { Check, ChevronDown } from '@tamagui/lucide-icons';

export default function NuevaRestrictionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [bancaId, setBancaId] = useState('');
  const [ventanaId, setVentanaId] = useState('');
  const [userId, setUserId] = useState('');
  const [number, setNumber] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [maxTotal, setMaxTotal] = useState('');
  const [salesCutoffMinutes, setSalesCutoffMinutes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar listas para los selects
  const { data: bancasData } = useQuery({
    queryKey: ['bancas'],
    queryFn: () => apiClient.get<{ data: Banca[] }>('/bancas'),
  });

  const { data: ventanasData } = useQuery({
    queryKey: ['ventanas'],
    queryFn: () => apiClient.get<{ data: Ventana[] }>('/ventanas'),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get<{ data: Usuario[] }>('/users'),
  });

  const bancas = bancasData?.data || [];
  const ventanas = ventanasData?.data || [];
  const users = usersData?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: Partial<RestrictionRule>) => apiClient.post<RestrictionRule>('/restrictions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restrictions'] });
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

    const payload: any = {};

    // Alcance (al menos uno requerido)
    if (bancaId) payload.bancaId = bancaId;
    if (ventanaId) payload.ventanaId = ventanaId;
    if (userId) payload.userId = userId;

    // Reglas de montos
    if (number) payload.number = number;
    if (maxAmount) payload.maxAmount = parseFloat(maxAmount);
    if (maxTotal) payload.maxTotal = parseFloat(maxTotal);

    // O regla de cutoff
    if (salesCutoffMinutes) payload.salesCutoffMinutes = parseInt(salesCutoffMinutes);

    createMutation.mutate(payload);
  };

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={600} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Nueva Restricción
        </Text>

        <Card padding="$4">
          <YStack gap="$4">
            <Text fontSize="$5" fontWeight="600" color="$color">
              Alcance (al menos uno)
            </Text>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Banca
              </Text>
              <Select value={bancaId} onValueChange={setBancaId}>
                <Select.Trigger width="100%" iconAfter={ChevronDown}>
                  <Select.Value placeholder="Seleccione una banca (opcional)" />
                </Select.Trigger>

                <Select.Content zIndex={200000}>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    <Select.Group>
                      <Select.Item index={0} value="">
                        <Select.ItemText>(Ninguna)</Select.ItemText>
                        <Select.ItemIndicator marginLeft="auto">
                          <Check size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                      {bancas.map((banca, idx) => (
                        <Select.Item key={banca.id} index={idx + 1} value={banca.id}>
                          <Select.ItemText>{banca.name}</Select.ItemText>
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
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Ventana
              </Text>
              <Select value={ventanaId} onValueChange={setVentanaId}>
                <Select.Trigger width="100%" iconAfter={ChevronDown}>
                  <Select.Value placeholder="Seleccione una ventana (opcional)" />
                </Select.Trigger>

                <Select.Content zIndex={200000}>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    <Select.Group>
                      <Select.Item index={0} value="">
                        <Select.ItemText>(Ninguna)</Select.ItemText>
                        <Select.ItemIndicator marginLeft="auto">
                          <Check size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                      {ventanas.map((ventana, idx) => (
                        <Select.Item key={ventana.id} index={idx + 1} value={ventana.id}>
                          <Select.ItemText>{ventana.name}</Select.ItemText>
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
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Usuario
              </Text>
              <Select value={userId} onValueChange={setUserId}>
                <Select.Trigger width="100%" iconAfter={ChevronDown}>
                  <Select.Value placeholder="Seleccione un usuario (opcional)" />
                </Select.Trigger>

                <Select.Content zIndex={200000}>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    <Select.Group>
                      <Select.Item index={0} value="">
                        <Select.ItemText>(Ninguno)</Select.ItemText>
                        <Select.ItemIndicator marginLeft="auto">
                          <Check size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                      {users.map((user, idx) => (
                        <Select.Item key={user.id} index={idx + 1} value={user.id}>
                          <Select.ItemText>{user.name} ({user.username})</Select.ItemText>
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
            </YStack>

            {errors['(root)'] && (
              <Text color="$error" fontSize="$2">
                {errors['(root)']}
              </Text>
            )}

            <Text fontSize="$5" fontWeight="600" color="$color" marginTop="$4">
              Límites de Monto
            </Text>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Número (0-999, opcional)
              </Text>
              <Input
                size="$4"
                placeholder="23"
                value={number}
                onChangeText={setNumber}
                keyboardType="number-pad"
              />
              <Text fontSize="$2" color="$textSecondary">
                Número específico para la restricción
              </Text>
              {errors.number && (
                <Text color="$error" fontSize="$2">
                  {errors.number}
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Monto Máximo por Jugada
              </Text>
              <Input
                size="$4"
                placeholder="1000"
                value={maxAmount}
                onChangeText={setMaxAmount}
                keyboardType="decimal-pad"
              />
              {errors.maxAmount && (
                <Text color="$error" fontSize="$2">
                  {errors.maxAmount}
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Monto Máximo Total
              </Text>
              <Input
                size="$4"
                placeholder="5000"
                value={maxTotal}
                onChangeText={setMaxTotal}
                keyboardType="decimal-pad"
              />
              {errors.maxTotal && (
                <Text color="$error" fontSize="$2">
                  {errors.maxTotal}
                </Text>
              )}
            </YStack>

            <Text fontSize="$5" fontWeight="600" color="$color" marginTop="$4">
              O Límite de Cutoff
            </Text>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Minutos de Cutoff (0-30)
              </Text>
              <Input
                size="$4"
                placeholder="5"
                value={salesCutoffMinutes}
                onChangeText={setSalesCutoffMinutes}
                keyboardType="number-pad"
              />
              <Text fontSize="$2" color="$textSecondary">
                Minutos antes del sorteo para bloquear ventas. No compatible con límites de monto.
              </Text>
              {errors.salesCutoffMinutes && (
                <Text color="$error" fontSize="$2">
                  {errors.salesCutoffMinutes}
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
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creando...' : 'Crear Restricción'}
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  );
}