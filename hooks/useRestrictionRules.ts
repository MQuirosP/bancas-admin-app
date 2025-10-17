import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api.client';
import { queryKeys } from '../lib/queryClient';
import type {
  RestrictionRule,
  CreateRestrictionRuleRequest,
  UpdateRestrictionRuleRequest,
  RestrictionRulesQueryParams,
} from '../types/api.types';

/**
 * Hook para obtener reglas de restricción
 * GET /restriction-rules
 */
export function useRestrictionRulesQuery(params?: RestrictionRulesQueryParams) {
  return useQuery({
    queryKey: queryKeys.restrictionRules.list(params),
    queryFn: async () => {
      const queryString = params ? apiClient.buildQueryString(params) : '';
      return apiClient.get<RestrictionRule[]>(`/restriction-rules${queryString}`);
    },
    enabled: true,
  });
}

/**
 * Hook para obtener reglas activas de una banca
 */
export function useActiveBancaRulesQuery(bancaId?: string) {
  return useQuery({
    queryKey: queryKeys.restrictionRules.list({ bancaId, includeDeleted: false }),
    queryFn: async () => {
      if (!bancaId) return [];
      const queryString = apiClient.buildQueryString({
        bancaId,
        includeDeleted: false,
      });
      return apiClient.get<RestrictionRule[]>(`/restriction-rules${queryString}`);
    },
    enabled: !!bancaId,
  });
}

/**
 * Hook para calcular cutoff basado en reglas
 * Aplica prioridad: User > Ventana > Banca
 */
export function useCutoffCalculation(
  sorteo: { scheduledAt: string } | null,
  number?: string,
  bancaId?: string,
  ventanaId?: string,
  userId?: string
) {
  const params: RestrictionRulesQueryParams = {
    ...(number && { number }),
    ...(bancaId && { bancaId }),
    ...(ventanaId && { ventanaId }),
    ...(userId && { userId }),
    includeDeleted: false,
  };

  const { data: rules } = useRestrictionRulesQuery(params);

  return useQuery({
    queryKey: ['cutoff', sorteo?.scheduledAt, rules],
    queryFn: () => {
      if (!sorteo || !rules) return null;

      // Aplicar prioridad: User > Ventana > Banca
      const userRule = rules.find((r) => r.userId);
      const ventanaRule = rules.find((r) => r.ventanaId);
      const bancaRule = rules.find((r) => r.bancaId);

      const rule = userRule || ventanaRule || bancaRule;

      const scheduledTime = new Date(sorteo.scheduledAt);
      const cutoffMinutes = rule?.salesCutoffMinutes || 0;
      const cutoffTime = new Date(scheduledTime.getTime() - cutoffMinutes * 60000);

      return {
        cutoffTime,
        scheduledTime,
        minutesRemaining: Math.max(
          0,
          Math.floor((cutoffTime.getTime() - Date.now()) / 60000)
        ),
        isBeforeCutoff: Date.now() < cutoffTime.getTime(),
        appliedRule: rule,
      };
    },
    enabled: !!sorteo && !!rules,
    refetchInterval: 30000,
  });
}

/**
 * Hook para crear regla de restricción (ADMIN)
 * POST /restriction-rules
 */
export function useCreateRestrictionRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRestrictionRuleRequest) =>
      apiClient.post<RestrictionRule>('/restriction-rules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.restrictionRules.all });
    },
  });
}