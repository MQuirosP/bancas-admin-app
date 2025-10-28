/**
 * Tipos para el módulo de pagos de tiquetes ganadores
 */

export type PaymentMethod = 'cash' | 'check' | 'transfer' | 'system'

export interface CreatePaymentInput {
  ticketId: string
  amountPaid: number
  method?: PaymentMethod
  notes?: string
  idempotencyKey?: string
  isFinal?: boolean // Marca pago parcial como final
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
