/**
 * Tipos para el módulo de pagos de tiquetes ganadores
 * @version 2.0 - Sistema Unificado
 */

export type PaymentMethod = 'cash' | 'check' | 'transfer' | 'system'

/**
 * @deprecated Use RegisterPaymentRequest from api.types.ts
 * Se mantiene para compatibilidad temporal
 */
export interface CreatePaymentInput {
  ticketId: string
  amountPaid: number
  method?: PaymentMethod
  notes?: string
  idempotencyKey?: string
  isFinal?: boolean // Marca pago parcial como final
  ventanaId?: string // ID de la ventana del usuario (para VENTANA rol)
}

/**
 * Input para registrar pago usando el sistema unificado
 * @since v2.0 - Compatible con POST /tickets/:id/pay
 */
export interface RegisterPaymentInput {
  amountPaid: number
  method?: PaymentMethod
  notes?: string
  isFinal?: boolean
  idempotencyKey?: string
}

export interface TicketPayment {
  id: string
  ticketId: string
  amountPaid: number
  paidById: string
  paymentDate: string // ISO datetime
  method?: string
  notes?: string
  isReversed: boolean
  reversedAt?: string
  reversedBy?: string
  createdAt: string
  updatedAt: string
  idempotencyKey?: string
  isPartial: boolean
  remainingAmount?: number
  isFinal: boolean
  completedAt?: string
  paidBy?: {
    id: string
    name: string
    email: string
  }
  ticket?: any
}

/**
 * @deprecated Use Ticket from api.types.ts directamente
 * El Ticket ahora incluye todos los campos de pago unificados:
 * - totalPayout, totalPaid, remainingAmount
 * - paymentHistory (array completo de pagos)
 * - lastPaymentAt, paymentMethod, etc
 * @see Ticket
 * @see PaymentHistoryEntry
 */
export interface TicketWithPayments {
  id: string
  ticketNumber: string
  loteriaId: string
  ventanaId: string
  vendedorId: string
  totalAmount: number
  status: string
  isWinner: boolean
  createdAt: string
  updatedAt: string
  jugadas: Array<{
    id: string
    type: string
    isWinner: boolean
    payout?: number
  }>
  payments?: TicketPayment[]
  totalPayout?: number
  totalPaid?: number
  remaining?: number
}

export interface PaymentListResponse {
  data: TicketPayment[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface BatchPaymentInput {
  ticketIds: string[]
  amountPerTicket?: number // Si no especifica, paga el total de cada uno
  method?: PaymentMethod
  notes?: string
  // Para VENTANA: agrupa por vendedor automáticamente para trazabilidad
}
