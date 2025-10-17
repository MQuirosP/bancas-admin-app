import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api.client';
import { queryKeys } from '../lib/queryClient';
import type {
  LoteriaMultiplier,
  CreateMultiplierRequest,
  UpdateMultiplierRequest,
  MultipliersQueryParams,
} from '../types/api.types';

/**
 * Hook para obtener multiplicadores
 * GET /multipliers
 */
export function useMultipliersQuery(params?: MultipliersQueryParams) {
  return useQuery({
    queryKey: queryKeys.multipliers.list(params),
    queryFn: async () => {
      const queryString = params ? apiClient.buildQueryString(params) : '';
      return apiClient.get<LoteriaMultiplier[]>(`/multipliers${queryString}`);
    },
    enabled: true,
  });
}

/**
 * Hook para obtener multiplicadores activos
 */
export function useActiveMultipliersQuery(loteriaId?: string, kind?: 'NUMERO' | 'REVENTADO') {
  return useQuery({
    queryKey: queryKeys.multipliers.active(kind),
    queryFn: async () => {
      const params: MultipliersQueryParams = {
        isActive: true,
        ...(loteriaId && { loteriaId }),
        ...(kind && { kind }),
      };
      const queryString = apiClient.buildQueryString(params);
      return apiClient.get<LoteriaMultiplier[]>(`/multipliers${queryString}`);
    },
    enabled: true,
  });
}

/**
 * Hook para crear multiplicador (ADMIN)
 * POST /multipliers
 */
export function useCreateMultiplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMultiplierRequest) =>
      apiClient.post<LoteriaMultiplier>('/multipliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.multipliers.all });
    },
  });
}