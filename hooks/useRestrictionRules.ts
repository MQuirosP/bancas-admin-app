import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api.client';
import { queryKeys } from '../lib/queryClient';
import { cacheRestrictions, getCachedRestrictions } from '../lib/cache';
import type {
  RestrictionRule,
  CreateRestrictionRuleRequest,
  UpdateRestrictionRuleRequest,
  RestrictionRulesQueryParams,
} from '../types/api.types';

/**
 * Hook para obtener reglas de restricción
 * GET /restrictions
 * Con caché en localStorage para evitar pérdida de datos
 */
export function useRestrictionRulesQuery(params?: RestrictionRulesQueryParams) {
  return useQuery({
    queryKey: queryKeys.restrictionRules.list(params),
    queryFn: async () => {
      try {
        const queryString = params ? apiClient.buildQueryString(params) : '';
        const data = await apiClient.get<RestrictionRule[]>(`/restrictions${queryString}`);

        // Guardar en caché después de éxito
        cacheRestrictions(data);

        return data;
      } catch (error) {
        console.error('Error fetching restriction rules:', error);
        // Intentar recuperar del caché en caso de error
        const cached = getCachedRestrictions();
        if (cached) {
          console.log('Using cached restriction rules as fallback');
          return cached;
        }
        throw error;
      }
    },
    initialData: getCachedRestrictions() ?? undefined,
    enabled: true,
    staleTime: 30000,
  });
}

/**
 * Hook para obtener reglas activas de una banca
 * Con caché en localStorage para evitar pérdida de datos
 */
export function useActiveBancaRulesQuery(bancaId?: string) {
  return useQuery({
    queryKey: queryKeys.restrictionRules.list({ bancaId, includeDeleted: false }),
    queryFn: async () => {
      if (!bancaId) return [];
      try {
        const queryString = apiClient.buildQueryString({
          bancaId,
          includeDeleted: false,
        });
        const data = await apiClient.get<RestrictionRule[]>(`/restrictions${queryString}`);

        // Guardar en caché después de éxito
        cacheRestrictions(data);

        return data;
      } catch (error) {
        console.error('Error fetching banca rules:', error);
        // Intentar recuperar del caché en caso de error
        const cached = getCachedRestrictions();
        if (cached) {
          console.log('Using cached banca rules as fallback');
          return cached;
        }
        throw error;
      }
    },
    initialData: getCachedRestrictions() ?? undefined,
    enabled: !!bancaId,
    staleTime: 30000,
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
 * POST /restrictions
 */
export function useCreateRestrictionRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRestrictionRuleRequest) =>
      apiClient.post<RestrictionRule>('/restrictions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.restrictionRules.all });
    },
  });
}