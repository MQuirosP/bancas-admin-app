import React, { useState } from 'react';
import {
  YStack,
  XStack,
  Text,
  Button,
  ScrollView,
  Card,
  Spinner,
  Dialog,
  Input,
  Select,
} from 'tamagui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Play, Square, CheckCircle } from '@tamagui/lucide-icons';
import { apiClient } from '../../../lib/api.client.js';
import { Sorteo, Multiplier, MultiplierKind, SorteoStatus } from '../../../types/models.types.js';

export default function SorteosListScreen() {
  const queryClient = useQueryClient();
  const [selectedSorteo, setSelectedSorteo] = useState<Sorteo | null>(null);
  const [showEvaluateDialog, setShowEvaluateDialog] = useState(false);
  const [winningNumber, setWinningNumber] = useState('');
  const [extraMultiplierId, setExtraMultiplierId] = useState<string>('');

  const { data: sorteos, isLoading } = useQuery({
    queryKey: ['sorteos'],
    queryFn: () => apiClient.get<Sorteo[]>('/sorteos'),
  });

  const { data: multipliers } = useQuery({
    queryKey: ['multipliers', 'reventado'],
    queryFn: () =>
      apiClient.get<Multiplier[]>('/multipliers', {
        kind: MultiplierKind.REVENTADO,
      }),
    enabled: showEvaluateDialog,
  });

  const openSorteoMutation = useMutation({
    mutationFn: (sorteoId: string) => apiClient.patch(`/sorteos/${sorteoId}/open`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sorteos'] });
    },
  });

  const closeSorteoMutation = useMutation({
    mutationFn: (sorteoId: string) => apiClient.patch(`/sorteos/${sorteoId}/close`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sorteos'] });
    },
  });

  const evaluateSorteoMutation = useMutation({
    mutationFn: ({ sorteoId, data }: { sorteoId: string; data: any }) =>
      apiClient.patch(`/sorteos/${sorteoId}/evaluate`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sorteos'] });
      setShowEvaluateDialog(false);
      setSelectedSorteo(null);
      setWinningNumber('');
      setExtraMultiplierId('');
    },
  });

  const handleEvaluate = () => {
    if (!selectedSorteo || !winningNumber) return;

    evaluateSorteoMutation.mutate({
      sorteoId: selectedSorteo.id,
      data: {
        winningNumber,
        extraMultiplierId: extraMultiplierId || null,
        extraOutcomeCode: multipliers?.find((m) => m.id === extraMultiplierId)?.outcomeCode || null,
      },
    });
  };

  const getStatusColor = (status: SorteoStatus) => {
    switch (status) {
      case SorteoStatus.PENDING:
        return { bg: '$gray4', text: '$gray11' };
      case SorteoStatus.OPEN:
        return { bg: '$green4', text: '$green11' };
      case SorteoStatus.CLOSED:
        return { bg: '$orange4', text: '$orange11' };
      case SorteoStatus.EVALUATED:
        return { bg: '$blue4', text: '$blue11' };
      default:
        return { bg: '$gray4', text: '$gray11' };
    }
  };

  return (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$8" fontWeight="bold" color="$color">
            Sorteos
          </Text>
        </XStack>

        {isLoading ? (
          <YStack padding="$8" alignItems="center">
            <Spinner size="large" />
            <Text marginTop="$3" color="$secondary">
              Cargando sorteos...
            </Text>
          </YStack>
        ) : (
          <YStack gap="$3">
            {sorteos?.map((sorteo) => {
              const statusColors = getStatusColor(sorteo.status);
              return (
                <Card key={sorteo.id} padding="$4">
                  <XStack justifyContent="space-between" alignItems="center" gap="$3" flexWrap="wrap">
                    <YStack flex={1} minWidth={200}>
                      <XStack gap="$2" alignItems="center">
                        <Trophy size={20} color="$color" />
                        <Text fontSize="$5" fontWeight="600" color="$color">
                          {sorteo.date} - {sorteo.hour}
                        </Text>
                      </XStack>
                      <Card
                        marginTop="$2"
                        padding="$2"
                        paddingHorizontal="$3"
                        backgroundColor={statusColors.bg}
                        alignSelf="flex-start"
                      >
                        <Text fontSize="$2" fontWeight="600" color={statusColors.text}>
                          {sorteo.status}
                        </Text>
                      </Card>
                      {sorteo.winningNumber && (
                        <Text fontSize="$6" color="$green10" fontWeight="bold" marginTop="$2">
                          Ganador: {sorteo.winningNumber}
                        </Text>
                      )}
                    </YStack>

                    <XStack gap="$2">
                      {sorteo.status === SorteoStatus.PENDING && (
                        <Button
                          size="$3"
                          theme="green"
                          icon={Play}
                          onPress={() => openSorteoMutation.mutate(sorteo.id)}
                          disabled={openSorteoMutation.isPending}
                        >
                          Abrir
                        </Button>
                      )}

                      {sorteo.status === SorteoStatus.OPEN && (
                        <Button
                          size="$3"
                          theme="orange"
                          icon={Square}
                          onPress={() => closeSorteoMutation.mutate(sorteo.id)}
                          disabled={closeSorteoMutation.isPending}
                        >
                          Cerrar
                        </Button>
                      )}

                      {sorteo.status === SorteoStatus.CLOSED && (
                        <Button
                          size="$3"
                          theme="blue"
                          icon={CheckCircle}
                          onPress={() => {
                            setSelectedSorteo(sorteo);
                            setShowEvaluateDialog(true);
                          }}
                        >
                          Evaluar
                        </Button>
                      )}
                    </XStack>
                  </XStack>
                </Card>
              );
            })}
          </YStack>
        )}
      </YStack>

      <Dialog modal open={showEvaluateDialog} onOpenChange={setShowEvaluateDialog}>
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Dialog.Content
            bordered
            elevate
            key="content"
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            gap="$4"
            padding="$4"
            maxWidth={500}
            width="90%"
          >
            <Dialog.Title>Evaluar Sorteo</Dialog.Title>

            <YStack gap="$3">
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="500">
                  Número Ganador (00-99) *
                </Text>
                <Input
                  size="$4"
                  value={winningNumber}
                  onChangeText={setWinningNumber}
                  maxLength={2}
                  keyboardType="number-pad"
                  placeholder="00-99"
                />
              </YStack>

              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="500">
                  Extra Multiplier (Opcional)
                </Text>
                <Select value={extraMultiplierId} onValueChange={setExtraMultiplierId}>
                  <Select.Trigger width="100%">
                    <Select.Value placeholder="Ninguno" />
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
                        <Select.Item index={0} value="">
                          <Select.ItemText>Ninguno</Select.ItemText>
                        </Select.Item>
                        {multipliers?.map((m, index) => (
                          <Select.Item key={m.id} index={index + 1} value={m.id}>
                            <Select.ItemText>
                              {m.outcomeCode} (x{m.multiplier})
                            </Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Group>
                    </Select.Viewport>
                    <Select.ScrollDownButton />
                  </Select.Content>
                </Select>
              </YStack>
            </YStack>

            <XStack gap="$3" justifyContent="flex-end">
              <Dialog.Close asChild>
                <Button theme="red">Cancelar</Button>
              </Dialog.Close>
              <Button
                theme="blue"
                onPress={handleEvaluate}
                disabled={!winningNumber || evaluateSorteoMutation.isPending}
              >
                {evaluateSorteoMutation.isPending ? 'Evaluando...' : 'Evaluar'}
              </Button>
            </XStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </ScrollView>
  );
}