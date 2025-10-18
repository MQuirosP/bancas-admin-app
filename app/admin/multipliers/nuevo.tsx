import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Input, Card, Switch, ScrollView, Select } from 'tamagui';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiErrorClass } from '../../../lib/api.client';
import { Loteria } from '../../../types/models.types';
import { Check, ChevronDown } from '@tamagui/lucide-icons';
import { LoteriaMultiplier } from '../../../types/api.types';

export default function NuevoMultiplierScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [loteriaId, setLoteriaId] = useState('');
  const [name, setName] = useState('');
  const [valueX, setValueX] = useState('');
  const [kind, setKind] = useState<'NUMERO' | 'REVENTADO'>('NUMERO');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar lista de loterías para el select
  const { data: loteriasData } = useQuery({
    queryKey: ['loterias'],
    queryFn: () => apiClient.get<{ data: Loteria[] }>('/loterias'),
  });

  const loterias = loteriasData?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/multipliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multipliers'] });
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

    const payload: Partial<LoteriaMultiplier> = {
      loteriaId,
      name,
      valueX: valueX ? parseFloat(valueX) : undefined,
      kind,
      isActive,
    };

    createMutation.mutate(payload);
  };

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={600} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Nuevo Multiplicador
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
                placeholder="x2, Base, etc."
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
                Valor Multiplicador *
              </Text>
              <Input
                size="$4"
                placeholder="2.0"
                value={valueX}
                onChangeText={setValueX}
                keyboardType="decimal-pad"
              />
              {errors.valueX && (
                <Text color="$error" fontSize="$2">
                  {errors.valueX}
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Tipo *
              </Text>
              <Select value={kind} onValueChange={(value: string) => setKind(value as 'NUMERO' | 'REVENTADO')}>
                <Select.Trigger width="100%" iconAfter={ChevronDown}>
                  <Select.Value placeholder="Tipo de multiplicador" />
                </Select.Trigger>

                <Select.Content zIndex={200000}>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    <Select.Group>
                      <Select.Item index={0} value="NUMERO">
                        <Select.ItemText>NUMERO</Select.ItemText>
                        <Select.ItemIndicator marginLeft="auto">
                          <Check size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item index={1} value="REVENTADO">
                        <Select.ItemText>REVENTADO</Select.ItemText>
                        <Select.ItemIndicator marginLeft="auto">
                          <Check size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                    </Select.Group>
                  </Select.Viewport>
                  <Select.ScrollDownButton />
                </Select.Content>
              </Select>
              {errors.kind && (
                <Text color="$error" fontSize="$2">
                  {errors.kind}
                </Text>
              )}
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
                aria-label="Activo"
                focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: 'var(--color10)' }}
              >
                <Switch.Thumb animation="quick" bg="$color12" />
              </Switch>

              <Text fontSize="$4">Activo</Text>
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
            disabled={createMutation.isPending || !loteriaId || !name || !valueX}
          >
            {createMutation.isPending ? 'Creando...' : 'Crear Multiplicador'}
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  );
}