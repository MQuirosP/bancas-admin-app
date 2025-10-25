// src/hooks/useLoteriaRules.ts
import { useQuery } from '@tanstack/react-query';
import { LoteriasApi } from '@/lib/api.loterias';
import { DEFAULT_RULES, LoteriaRulesJson } from '../types/loteriaRules';

export function useLoteriaRules(loteriaId?: string) {
  return useQuery({
    queryKey: ['loteria', loteriaId],
    enabled: !!loteriaId,
    queryFn: () => LoteriasApi.getById(loteriaId!),
    select: (resp) => {
      const lot = resp?.data?.data ?? {};
      const rules = (lot?.rulesJson ?? {}) as LoteriaRulesJson;
      return {
        loteria: lot,
        rules: { ...DEFAULT_RULES, ...rules } as LoteriaRulesJson,
      };
    },
    staleTime: 60_000,
  });
}
