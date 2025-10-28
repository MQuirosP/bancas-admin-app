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
 */
export function useTicketPaymentHistoryQuery(ticketId?: string) {
  return useQuery({
    queryKey: ['ticketPaymentHistory', ticketId],
    queryFn: async () => {
      if (!ticketId) return []
      const queryString = apiClient.buildQueryString({ ticketId })
      return apiClient.get<TicketPayment[]>(`/ticket-payments${queryString}`)
    },
    enabled: !!ticketId,
  })
}

/**
 * Hook para registrar un pago de tiquete
 * POST /ticket-payments
 */
export function useCreatePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePaymentInput) =>
      apiClient.post<TicketPayment>('/ticket-payments', data),
    onSuccess: (data) => {
      // Invalidar todas las queries de tickets (pending, list, detail, etc.)
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.all,
        exact: false // ✅ Invalida todas las variantes con prefix ['tickets']
      })
      // Invalidar historial de pagos específico
      queryClient.invalidateQueries({
        queryKey: ['ticketPaymentHistory', data.ticketId]
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
 * Hook para revertir un pago
 * POST /ticket-payments/:id/reverse
 */
export function useReversePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (paymentId: string) =>
      apiClient.post<TicketPayment>(`/ticket-payments/${paymentId}/reverse`, {}),
    onSuccess: (data) => {
      // Invalidar todas las queries de tickets
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.all,
        exact: false
      })
      queryClient.invalidateQueries({
        queryKey: ['ticketPaymentHistory', data.ticketId]
      })
      queryClient.invalidateQueries({
        queryKey: ['paymentList'],
        exact: false
      })
    },
  })
}

/**
 * Hook para actualizar un pago (marcar como final)
 * PATCH /ticket-payments/:id
 */
export function useUpdatePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { paymentId: string; isFinal: boolean; notes?: string }) =>
      apiClient.patch<TicketPayment>(`/ticket-payments/${data.paymentId}`, {
        isFinal: data.isFinal,
        notes: data.notes,
      }),
    onSuccess: (data) => {
      // Invalidar todas las queries de tickets
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.all,
        exact: false
      })
      queryClient.invalidateQueries({
        queryKey: ['ticketPaymentHistory', data.ticketId]
      })
      queryClient.invalidateQueries({
        queryKey: ['paymentList'],
        exact: false
      })
    },
  })
}

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
