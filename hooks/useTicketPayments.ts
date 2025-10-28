import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/api.client'
import { queryKeys } from '../lib/queryClient'
import type {
  CreatePaymentInput,
  TicketPayment,
  TicketWithPayments,
  PaymentListResponse,
} from '../types/payment.types'

/**
 * Hook para obtener tiquetes ganadores pendientes de pago
 * GET /tickets?status=EVALUATED&isWinner=true
 */
export function usePendingWinningTicketsQuery(params?: {
  vendedorId?: string
  ventanaId?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: queryKeys.tickets.list({
      ...params,
      status: 'EVALUATED',
      isWinner: true,
    }),
    queryFn: async () => {
      const queryString = apiClient.buildQueryString({
        status: 'EVALUATED',
        isWinner: true,
        ...params,
      })
      return apiClient.get<TicketWithPayments[]>(`/tickets${queryString}`)
    },
    enabled: true,
    refetchInterval: 30000, // Actualiza cada 30s
  })
}

/**
 * Hook para obtener detalles de un tiquete con su historial de pagos
 */
export function useTicketDetailsQuery(ticketId?: string) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(ticketId),
    queryFn: async () => {
      if (!ticketId) return null
      return apiClient.get<TicketWithPayments>(`/tickets/${ticketId}`)
    },
    enabled: !!ticketId,
    staleTime: 10000, // Considera stale después de 10s
    refetchInterval: 30000, // Refresca cada 30s automáticamente
  })
}

/**
 * Hook para obtener historial de pagos de un tiquete
 * @since v2.0 - Ahora obtiene datos de ticket.paymentHistory en vez de endpoint separado
 * @deprecated Usar useTicketQuery directamente y acceder a ticket.paymentHistory
 */
export function useTicketPaymentHistoryQuery(ticketId?: string) {
  return useQuery({
    queryKey: ['ticketPaymentHistory', ticketId],
    queryFn: async () => {
      if (!ticketId) return []
      // ✅ v2.0: Obtener del ticket unificado
      const ticket = await apiClient.get<any>(`/tickets/${ticketId}`)
      return ticket.paymentHistory || []
    },
    enabled: !!ticketId,
  })
}

/**
 * Hook para registrar un pago de tiquete
 * POST /tickets/:id/pay (Sistema Unificado v2.0)
 * @since v2.0 - Migrado a sistema unificado
 */
export function useCreatePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ticketId, ...paymentData }: CreatePaymentInput) =>
      apiClient.post<any>(`/tickets/${ticketId}/pay`, paymentData),
    onSuccess: () => {
      // Invalidar todas las queries de tickets (pending, list, detail, etc.)
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.all,
        exact: false // ✅ Invalida todas las variantes con prefix ['tickets']
      })
      // Invalidar historial de pagos específico (ya no es necesario query separada)
      queryClient.invalidateQueries({
        queryKey: ['ticketPaymentHistory'],
        exact: false
      })
      // Invalidar lista de pagos
      queryClient.invalidateQueries({
        queryKey: ['paymentList'],
        exact: false
      })
    },
  })
}

/**
 * Hook para revertir el último pago de un ticket
 * POST /tickets/:id/reverse-payment (Sistema Unificado v2.0)
 * @since v2.0 - Migrado a sistema unificado
 */
export function useReversePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ticketId, reason }: { ticketId: string; reason?: string }) =>
      apiClient.post<any>(`/tickets/${ticketId}/reverse-payment`, { reason }),
    onSuccess: () => {
      // Invalidar todas las queries de tickets
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.all,
        exact: false
      })
      queryClient.invalidateQueries({
        queryKey: ['ticketPaymentHistory'],
        exact: false
      })
      queryClient.invalidateQueries({
        queryKey: ['paymentList'],
        exact: false
      })
    },
  })
}

/**
 * Hook para finalizar pago parcial (aceptar deuda)
 * POST /tickets/:id/finalize-payment (Sistema Unificado v2.0)
 * @since v2.0 - Migrado a sistema unificado
 */
export function useUpdatePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { ticketId: string; notes?: string }) =>
      apiClient.post<any>(`/tickets/${data.ticketId}/finalize-payment`, {
        notes: data.notes,
      }),
    onSuccess: () => {
      // Invalidar todas las queries de tickets
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.all,
        exact: false
      })
      queryClient.invalidateQueries({
        queryKey: ['ticketPaymentHistory'],
        exact: false
      })
      queryClient.invalidateQueries({
        queryKey: ['paymentList'],
        exact: false
      })
    },
  })
}

/**
 * Alias para mantener compatibilidad
 * @see useUpdatePaymentMutation
 */
export const useFinalizePaymentMutation = useUpdatePaymentMutation

/**
 * Hook para obtener lista paginada de pagos registrados
 */
export function usePaymentListQuery(params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['paymentList', params],
    queryFn: async () => {
      const queryString = apiClient.buildQueryString(params || {})
      return apiClient.get<PaymentListResponse>(`/ticket-payments${queryString}`)
    },
    enabled: true,
  })
}
