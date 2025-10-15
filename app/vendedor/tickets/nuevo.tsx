import React, { useState, useEffect } from 'react';
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  Select,
  Card,
  ScrollView,
  Spinner,
} from 'tamagui';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2, AlertCircle } from '@tamagui/lucide-icons';
import { apiClient, ApiErrorClass } from '../../../lib/api.client';
import { useAuthStore } from '../../../store/auth.store';
import { JugadaType, Sorteo, SorteoStatus, CreateTicketRequest, RestrictionRule } from '../../../types/models.types';
import { getSalesCutoffMinutes, canCreateTicket } from '../../../utils/cutoff';
import { formatCurrency } from '../../../utils/formatters';
import { validateReventadoReferences } from '../../../utils/validation';

interface JugadaForm {
  type: JugadaType;
  number?: string;
  reventadoNumber?: string;
  amount: string;
}

export default function NuevoTicketScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [ventanaId] = useState(user?.ventanaId || '');
  const [sorteoId, setSorteoId] = useState('');
  const [jugadas, setJugadas] = useState<JugadaForm[]>([
    { type: JugadaType.NUMERO, number: '', amount: '' },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cutoffError, setCutoffError] = useState<string>('');

  // Fetch sorteos abiertos
  const { data: sorteos, isLoading: loadingSorteos } = useQuery({
    queryKey: ['sorteos', 'open'],
    queryFn: () => apiClient.get<Sorteo[]>('/sorteos', { status: SorteoStatus.OPEN }),
  });

  // Fetch restriction rules para calcular cutoff
  // 👈 importa el tipo

// --- restricciones tipadas + default vacío
const { data: restrictions = [], isLoading: loadingRestrictions } = useQuery<RestrictionRule[]>({
  queryKey: ['restrictions'],
  queryFn: () => apiClient.get<RestrictionRule[]>('/restrictions'),
  enabled: !!sorteoId,
  initialData: [],            // ✅ evita {} y unknown
});


  // Validar cutoff cuando cambia el sorteo seleccionado
  useEffect(() => {
    if (sorteoId && sorteos) {
      const selectedSorteo = sorteos.find((s) => s.id === sorteoId);
      if (selectedSorteo && user) {
        const cutoffMinutes = getSalesCutoffMinutes(
          restrictions || [],
          user.id,
          user.ventanaId || '',
          user.bancaId || ''
        );

        const validation = canCreateTicket(
          selectedSorteo.date,
          selectedSorteo.hour,
          cutoffMinutes
        );

        if (!validation.canCreate) {
          setCutoffError(validation.message || 'No se puede crear el tiquete');
        } else {
          setCutoffError('');
        }
      }
    }
  }, [sorteoId, sorteos, restrictions, user]);

  const createTicketMutation = useMutation({
    mutationFn: (data: CreateTicketRequest) => apiClient.post('/tickets', data),
    onSuccess: () => {
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

  const addJugada = () => {
    setJugadas([...jugadas, { type: JugadaType.NUMERO, number: '', amount: '' }]);
  };

  const removeJugada = (index: number) => {
    setJugadas(jugadas.filter((_, i) => i !== index));
  };

  const updateJugada = (index: number, field: keyof JugadaForm, value: string) => {
    const newJugadas = [...jugadas];
    newJugadas[index] = { ...newJugadas[index], [field]: value };
    setJugadas(newJugadas);
  };

  const validateAndSubmit = () => {
    setErrors({});

    // Client-side validation
    const newErrors: Record<string, string> = {};

    if (!sorteoId) newErrors.sorteoId = 'Selecciona un sorteo';

    jugadas.forEach((jugada, index) => {
      if (jugada.type === JugadaType.NUMERO && !jugada.number) {
        newErrors[`jugadas.${index}.number`] = 'Ingresa un número';
      }
      if (jugada.type === JugadaType.NUMERO && jugada.number && !/^\d{2}$/.test(jugada.number)) {
        newErrors[`jugadas.${index}.number`] = 'Debe ser un número de 2 dígitos (00-99)';
      }
      if (jugada.type === JugadaType.REVENTADO && !jugada.reventadoNumber) {
        newErrors[`jugadas.${index}.reventadoNumber`] = 'Referencia un número';
      }
      if (!jugada.amount || parseFloat(jugada.amount) <= 0) {
        newErrors[`jugadas.${index}.amount`] = 'Monto inválido';
      }
    });

    // Validate REVENTADO references
    const mappedJugadas = jugadas.map((j) => ({
      type: j.type,
      number: j.number,
      reventadoNumber: j.reventadoNumber,
      amount: parseFloat(j.amount) || 0,
    }));

    const reventadoValidation = validateReventadoReferences(mappedJugadas);
    if (!reventadoValidation.valid) {
      reventadoValidation.errors.forEach((error) => {
        newErrors[`reventado_${Date.now()}`] = error;
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (cutoffError) {
      setErrors({ cutoff: cutoffError });
      return;
    }

    // Get loteria ID from selected sorteo
    const selectedSorteo = sorteos?.find((s) => s.id === sorteoId);
    if (!selectedSorteo) return;

    // Submit
    const payload: CreateTicketRequest = {
      ventanaId,
      loteriaId: selectedSorteo.loteriaId,
      sorteoId,
      jugadas: jugadas.map((j) => ({
        type: j.type,
        number: j.type === JugadaType.NUMERO ? j.number : undefined,
        reventadoNumber: j.type === JugadaType.REVENTADO ? j.reventadoNumber : undefined,
        amount: parseFloat(j.amount),
      })),
    };

    createTicketMutation.mutate(payload);
  };

  const totalAmount = jugadas.reduce((sum, j) => sum + (parseFloat(j.amount) || 0), 0);

  return (
    <ScrollView>
      <YStack padding="$4" gap="$4" maxWidth={800} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Crear Nuevo Tiquete
        </Text>

        {cutoffError && (
          <Card padding="$3" backgroundColor="$red2" borderWidth={1} borderColor="$red8">
            <XStack gap="$2" alignItems="center">
              <AlertCircle size={20} color="$red10" />
              <Text color="$red10" fontSize="$3" flex={1}>
                {cutoffError}
              </Text>
            </XStack>
          </Card>
        )}

        <Card padding="$4">
          <YStack gap="$3">
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Sorteo *
              </Text>
              {loadingSorteos ? (
                <Spinner />
              ) : (
                <Select value={sorteoId} onValueChange={setSorteoId}>
                  <Select.Trigger width="100%">
                    <Select.Value placeholder="Seleccionar sorteo" />
                  </Select.Trigger>

                  <Select.Adapt when="sm" platform="touch">
                    <Select.Sheet modal dismissOnSnapToBottom>
                      <Select.Sheet.Frame>
                        <Select.Sheet.ScrollView>
                          <Select.Adapt.Contents />
                        </Select.Sheet.ScrollView>
                      </Select.Sheet.Frame>
                      <Select.Sheet.Overlay />
                    </Select.Sheet>
                  </Select.Adapt>

                  <Select.Content zIndex={200000}>
                    <Select.ScrollUpButton />
                    <Select.Viewport>
                      <Select.Group>
                        {sorteos?.map((s, index) => (
                          <Select.Item key={s.id} index={index} value={s.id}>
                            <Select.ItemText>
                              {s.loteria?.name || 'Lotería'} - {s.date} {s.hour}
                            </Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Group>
                    </Select.Viewport>
                    <Select.ScrollDownButton />
                  </Select.Content>
                </Select>
              )}
              {errors.sorteoId && (
                <Text color="$error" fontSize="$2">
                  {errors.sorteoId}
                </Text>
              )}
            </YStack>
          </YStack>
        </Card>

        <Card padding="$4">
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="600">
                Jugadas
              </Text>
              <Button size="$3" icon={Plus} onPress={addJugada}>
                Agregar
              </Button>
            </XStack>

            {jugadas.map((jugada, index) => (
              <Card key={index} padding="$3" backgroundColor="$backgroundHover">
                <YStack gap="$2">
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="$3" fontWeight="600">
                      Jugada {index + 1}
                    </Text>
                    {jugadas.length > 1 && (
                      <Button
                        size="$2"
                        chromeless
                        icon={Trash2}
                        color="$red10"
                        onPress={() => removeJugada(index)}
                      />
                    )}
                  </XStack>

                  <Select
                    value={jugada.type}
                    onValueChange={(value) => updateJugada(index, 'type', value)}
                  >
                    <Select.Trigger width="100%">
                      <Select.Value />
                    </Select.Trigger>

                    <Select.Adapt when="sm" platform="touch">
                      <Select.Sheet modal dismissOnSnapToBottom>
                        <Select.Sheet.Frame>
                          <Select.Sheet.ScrollView>
                            <Select.Adapt.Contents />
                          </Select.Sheet.ScrollView>
                        </Select.Sheet.Frame>
                        <Select.Sheet.Overlay />
                      </Select.Sheet>
                    </Select.Adapt>

                    <Select.Content zIndex={200000}>
                      <Select.Viewport>
                        <Select.Group>
                          <Select.Item index={0} value={JugadaType.NUMERO}>
                            <Select.ItemText>NUMERO</Select.ItemText>
                          </Select.Item>
                          <Select.Item index={1} value={JugadaType.REVENTADO}>
                            <Select.ItemText>REVENTADO</Select.ItemText>
                          </Select.Item>
                        </Select.Group>
                      </Select.Viewport>
                    </Select.Content>
                  </Select>

                  {jugada.type === JugadaType.NUMERO ? (
                    <YStack gap="$1">
                      <Input
                        placeholder="Número (00-99)"
                        value={jugada.number}
                        onChangeText={(value) => updateJugada(index, 'number', value)}
                        maxLength={2}
                        keyboardType="number-pad"
                      />
                      {errors[`jugadas.${index}.number`] && (
                        <Text color="$error" fontSize="$2">
                          {errors[`jugadas.${index}.number`]}
                        </Text>
                      )}
                    </YStack>
                  ) : (
                    <YStack gap="$1">
                      <Input
                        placeholder="Referencia número NUMERO"
                        value={jugada.reventadoNumber}
                        onChangeText={(value) => updateJugada(index, 'reventadoNumber', value)}
                        maxLength={2}
                        keyboardType="number-pad"
                      />
                      {errors[`jugadas.${index}.reventadoNumber`] && (
                        <Text color="$error" fontSize="$2">
                          {errors[`jugadas.${index}.reventadoNumber`]}
                        </Text>
                      )}
                    </YStack>
                  )}

                  <YStack gap="$1">
                    <Input
                      placeholder="Monto"
                      value={jugada.amount}
                      onChangeText={(value) => updateJugada(index, 'amount', value)}
                      keyboardType="decimal-pad"
                    />
                    {errors[`jugadas.${index}.amount`] && (
                      <Text color="$error" fontSize="$2">
                        {errors[`jugadas.${index}.amount`]}
                      </Text>
                    )}
                  </YStack>
                </YStack>
              </Card>
            ))}

            {/* Mostrar errores de validación de REVENTADO */}
            {Object.keys(errors)
              .filter((key) => key.startsWith('reventado_'))
              .map((key) => (
                <Card key={key} padding="$3" backgroundColor="$red2" borderWidth={1} borderColor="$red8">
                  <Text color="$red10" fontSize="$2">
                    {errors[key]}
                  </Text>
                </Card>
              ))}
          </YStack>
        </Card>

        <Card padding="$4" backgroundColor="$blue2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="600">
              Total:
            </Text>
            <Text fontSize="$7" fontWeight="bold" color="$blue10">
              {formatCurrency(totalAmount)}
            </Text>
          </XStack>
        </Card>

        <XStack gap="$3">
          <Button flex={1} theme="red" onPress={() => router.back()}>
            Cancelar
          </Button>
          <Button
            flex={1}
            theme="blue"
            onPress={validateAndSubmit}
            disabled={createTicketMutation.isPending || !!cutoffError}
          >
            {createTicketMutation.isPending ? 'Creando...' : 'Crear Tiquete'}
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  );
}