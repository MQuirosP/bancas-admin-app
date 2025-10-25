// app/admin/loterias/[id]/rules.tsx
import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
import { YStack, Text, Spinner } from 'tamagui';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLoteriaRules } from '@/hooks/useLoteriaRules';
import { LoteriasApi } from '@/lib/api.loterias';
import LoteriaRulesInline from '@/components/loterias/LoteriaRulesInline';
import { useToast } from '@/hooks/useToast';
import type { LoteriaRulesJson } from '@/types/loteriaRules';

export default function LoteriaRulesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError } = useLoteriaRules(id);
  const [localRules, setLocalRules] = useState<LoteriaRulesJson | null>(null);
  const qc = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (data?.rules) setLocalRules(data.rules);
  }, [data]);

  const mSave = useMutation({
    mutationFn: (rules: LoteriaRulesJson) => LoteriasApi.update(id!, { rulesJson: rules }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loteria', id] });
      qc.invalidateQueries({ queryKey: ['loterias'] });
      toast.success('Reglas guardadas');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Error al guardar reglas'),
  });

  if (isLoading) return (
    <YStack ai="center" jc="center" f={1}>
      <Spinner /><Text>Cargando…</Text>
    </YStack>
  );
  if (isError || !data || !localRules) return (
    <YStack ai="center" jc="center" f={1}>
      <Text>Error al cargar</Text>
    </YStack>
  );

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, backgroundColor: 'var(--background)' }}>
      <YStack p="$4" gap="$4" maxWidth={900} alignSelf="center" w="100%">
        <Text fontSize="$8" fontWeight="800">{data.loteria?.name} · Reglas</Text>

        {/* El inline arma el JSON y te lo entrega; aquí lo mandas al backend */}
        <LoteriaRulesInline
          loteriaId={id}
          value={localRules}
          onChange={(rules) => { setLocalRules(rules); mSave.mutate(rules); }}
          submitLabel={mSave.isPending ? 'Guardando…' : 'Guardar reglas'}
        />
      </YStack>
    </ScrollView>
  );
}
