// hooks/useSorteos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api.client';
import { queryKeys } from '../lib/queryClient';
import type {
  Sorteo,
  CreateSorteoRequest,
  UpdateSorteoRequest,
  EvaluateSorteoRequest,
} from '../types/api.types';

/**
 * Hook para obtener sorteos
 * GET /sorteos
 */
export function useSorteosQuery(params?: {
  status?: string;
  loteriaId?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: queryKeys.sorteos.list(params),
    queryFn: async () => {
      const queryString = params ? apiClient.buildQueryString(params) : '';
      return apiClient.get<Sorteo[]>(`/sorteos${queryString}`);
    },
    enabled: true,
  });
}

/**
 * Hook para obtener sorteos activos (SCHEDULED u OPEN)
 */
export function useActiveSorteosQuery(loteriaId?: string) {
  return useQuery({
    queryKey: queryKeys.sorteos.active,
    queryFn: async () => {
      const scheduled = await apiClient.get<Sorteo[]>('/sorteos?status=SCHEDULED');
      const open = await apiClient.get<Sorteo[]>('/sorteos?status=OPEN');
      
      const combined = [...scheduled, ...open];
      
      if (loteriaId) {
        return combined.filter(s => s.loteriaId === loteriaId);
      }
      
      return combined;
    },
    enabled: true,
    refetchInterval: 60000,
  });
}

/**
 * Hook para obtener el próximo sorteo
 */
export function useNextSorteoQuery(loteriaId?: string) {
  return useQuery({
    queryKey: queryKeys.sorteos.next(loteriaId),
    queryFn: async () => {
      const sorteos = await apiClient.get<Sorteo[]>('/sorteos?status=SCHEDULED');
      
      const now = new Date();
      const upcoming = sorteos
        .filter(s => !loteriaId || s.loteriaId === loteriaId)
        .map(sorteo => ({
          sorteo,
          scheduledDate: new Date(sorteo.scheduledAt),
        }))
        .filter(({ scheduledDate }) => scheduledDate > now)
        .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
      
      return upcoming.length > 0 ? upcoming[0].sorteo : null;
    },
    enabled: true,
    refetchInterval: 60000,
  });
}

/**
 * Hook para obtener un sorteo específico
 * GET /sorteos/:id
 */
export function useSorteoQuery(sorteoId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.sorteos.detail(sorteoId),
    queryFn: () => apiClient.get<Sorteo>(`/sorteos/${sorteoId}`),
    enabled: enabled && !!sorteoId,
  });
}

/**
 * Hook para crear sorteo (ADMIN)
 * POST /sorteos
 */
export function useCreateSorteo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSorteoRequest) =>
      apiClient.post<Sorteo>('/sorteos', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sorteos.all });
    },
  });
}

/**
 * Hook para evaluar sorteo (ADMIN)
 * PATCH /sorteos/:id/evaluate
 */
export function useEvaluateSorteo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sorteoId, data }: { sorteoId: string; data: EvaluateSorteoRequest }) =>
      apiClient.patch<Sorteo>(`/sorteos/${sorteoId}/evaluate`, data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.sorteos.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.sorteos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
    },
  });
}

/**
 * Hook para abrir sorteo (ADMIN)
 * PATCH /sorteos/:id/open
 */
export function useOpenSorteo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sorteoId: string) =>
      apiClient.patch<Sorteo>(`/sorteos/${sorteoId}/open`, {}),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.sorteos.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.sorteos.all });
    },
  });
}