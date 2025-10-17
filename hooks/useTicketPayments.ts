import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api.client';
import { queryKeys } from '../lib/queryClient';
import type {
  TicketPayment,
  CreateTicketPaymentRequest,
} from '../types/api.types';

/**
 * Hook para crear pago de ticket
 * POST /ticket-payments
 */
export function useCreateTicketPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTicketPaymentRequest) =>
      apiClient.post<TicketPayment>('/ticket-payments', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.detail(data.ticketId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.ticketPayments.all });
    },
  });
}