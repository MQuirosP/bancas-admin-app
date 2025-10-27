// hooks/useTickets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api.client';
import { queryKeys } from '../lib/queryClient';
import type {
  Ticket,
  TicketsQueryParams,
  CreateTicketRequest,
  PaginatedResponse,
} from '../types/api.types';

/**
 * Hook para obtener listado de tickets con filtros
 * GET /tickets
 */
export function useTicketsQuery(params?: TicketsQueryParams) {
  return useQuery({
    queryKey: queryKeys.tickets.list(params),
    queryFn: async () => {
      const queryString = params ? apiClient.buildQueryString(params) : '';
      return apiClient.get<PaginatedResponse<Ticket>>(`/tickets${queryString}`);
    },
    enabled: true,
  });
}

/**
 * Hook para obtener un ticket específico por ID
 * GET /tickets/:id
 */
export function useTicketQuery(ticketId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(ticketId),
    queryFn: () => apiClient.get<Ticket>(`/tickets/${ticketId}`),
    enabled: enabled && !!ticketId,
  });
}

/**
 * Hook para obtener tickets de hoy
 */
export function useTodayTicketsQuery(ventanaId?: string, vendedorId?: string) {
  return useQuery({
    queryKey: queryKeys.tickets.list({ date: 'today', ventanaId, vendedorId }),
    queryFn: async () => {
      const params: any = {
        date: 'today',
        scope: 'mine',
      };
      const queryString = apiClient.buildQueryString(params);
      return apiClient.get<PaginatedResponse<Ticket>>(`/tickets${queryString}`);
    },
    enabled: true,
    refetchInterval: 30000, // Refetch cada 30 segundos
  });
}

/**
 * Hook para obtener tickets activos (status = ACTIVE)
 */
export function useActiveTicketsQuery(ventanaId?: string) {
  return useQuery({
    queryKey: queryKeys.tickets.list({ status: 'ACTIVE', ventanaId }),
    queryFn: async () => {
      const params: any = {
        status: 'ACTIVE',
        scope: 'mine',
      };
      const queryString = apiClient.buildQueryString(params);
      return apiClient.get<PaginatedResponse<Ticket>>(`/tickets${queryString}`);
    },
    enabled: true,
  });
}

/**
 * Hook para crear un nuevo ticket
 * POST /tickets
 */
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTicketRequest) => 
      apiClient.post<Ticket>('/tickets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.banca() });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'ventana'] });
    },
  });
}