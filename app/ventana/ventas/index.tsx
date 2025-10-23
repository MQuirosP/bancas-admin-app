import React, { useState } from 'react';
import { YStack, XStack, Text, ScrollView, Card, Select } from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api.client';
import { formatCurrency } from '../../../utils/formatters';

export default function MisVentasScreen() {
  const [dateRange, setDateRange] = useState('today');
  const [vendedorId] = useState('all');

  useQuery({
    queryKey: ['ventas', dateRange, vendedorId],
    queryFn: () => apiClient.get('/ventas', {
      dateRange,
      vendedorId: vendedorId === 'all' ? undefined : vendedorId,
    }),
  });

  return (
    <ScrollView flex={1} backgroundColor={'$background'}>
      <YStack padding="$4" gap="$4">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Mis Ventas
        </Text>

        <XStack gap="$3" flexWrap="wrap">
          <YStack flex={1} minWidth={200}>
            <Text fontSize="$3" marginBottom="$2">
              Período
            </Text>
            <Select value={dateRange} onValueChange={setDateRange}>
              <Select.Trigger width="100%">
                <Select.Value />
              </Select.Trigger>
              <Select.Content zIndex={200000}>
                <Select.Viewport>
                  <Select.Item index={0} value="today">
                    <Select.ItemText>Hoy</Select.ItemText>
                  </Select.Item>
                  <Select.Item index={1} value="week">
                    <Select.ItemText>Esta Semana</Select.ItemText>
                  </Select.Item>
                  <Select.Item index={2} value="month">
                    <Select.ItemText>Este Mes</Select.ItemText>
                  </Select.Item>
                </Select.Viewport>
              </Select.Content>
            </Select>
          </YStack>
        </XStack>

        <Card padding="$4">
          <Text fontSize="$5" fontWeight="600" marginBottom="$3">
            Resumen
          </Text>
          <XStack justifyContent="space-around" flexWrap="wrap" gap="$4">
            <YStack alignItems="center">
              <Text fontSize="$7" fontWeight="bold" color="$primary">
                45
              </Text>
              <Text color="$textSecondary">Tickets Vendidos</Text>
            </YStack>
            <YStack alignItems="center">
              <Text fontSize="$7" fontWeight="bold" color="$green10">
                {formatCurrency(12540)}
              </Text>
              <Text color="$textSecondary">Total Vendido</Text>
            </YStack>
          </XStack>
        </Card>

        <Text fontSize="$5" fontWeight="600" marginTop="$2">
          Vendedores
        </Text>

        {/* Lista de vendedores con sus totales */}
        <YStack gap="$2">
          <Card padding="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <YStack>
                <Text fontSize="$4" fontWeight="600">
                  Juan Pérez
                </Text>
                <Text fontSize="$3" color="$textSecondary">
                  VEND-001 • 15 tickets
                </Text>
              </YStack>
              <Text fontSize="$5" fontWeight="bold" color="$primary">
                {formatCurrency(4200)}
              </Text>
            </XStack>
          </Card>

          <Card padding="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <YStack>
                <Text fontSize="$4" fontWeight="600">
                  María González
                </Text>
                <Text fontSize="$3" color="$textSecondary">
                  VEND-002 • 20 tickets
                </Text>
              </YStack>
              <Text fontSize="$5" fontWeight="bold" color="$primary">
                {formatCurrency(5800)}
              </Text>
            </XStack>
          </Card>

          <Card padding="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <YStack>
                <Text fontSize="$4" fontWeight="600">
                  Carlos Rodríguez
                </Text>
                <Text fontSize="$3" color="$textSecondary">
                  VEND-003 • 10 tickets
                </Text>
              </YStack>
              <Text fontSize="$5" fontWeight="bold" color="$primary">
                {formatCurrency(2540)}
              </Text>
            </XStack>
          </Card>
        </YStack>
      </YStack>
    </ScrollView>
  );
}