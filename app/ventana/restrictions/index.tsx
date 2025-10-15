import React from 'react';
import { YStack, Text, ScrollView, Card } from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import { restrictionsService } from '../../../services/restrictions.service';

export default function VentanaRestrictionsScreen() {
  const { data: restrictions } = useQuery({
    queryKey: ['restrictions'],
    queryFn: () => restrictionsService.getAll(),
  });

  return (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Restricciones
        </Text>
        <Text color="$secondary" fontSize="$3">
          Vista de solo lectura de las reglas aplicables
        </Text>

        {restrictions?.map((rule) => (
          <Card key={rule.id} padding="$4">
            <YStack gap="$2">
              {rule.number && (
                <Text fontSize="$4">
                  <Text fontWeight="600">Número:</Text> {rule.number}
                </Text>
              )}
              {rule.maxAmount && (
                <Text fontSize="$4">
                  <Text fontWeight="600">Monto máximo:</Text> ${rule.maxAmount}
                </Text>
              )}
              {rule.salesCutoffMinutes && (
                <Text fontSize="$4">
                  <Text fontWeight="600">Cutoff:</Text> {rule.salesCutoffMinutes} minutos
                </Text>
              )}
            </YStack>
          </Card>
        ))}
      </YStack>
    </ScrollView>
  );
}