/**
 * Utilities para cálculos relacionados con tickets y pagos
 * @version 2.0 - Sistema Unificado
 * 
 * Este módulo centraliza toda la lógica de cálculo de pagos para evitar
 * duplicación en múltiples componentes (TicketDetailScreen, TicketPaymentModal,
 * PaymentFormModal, TicketsListScreen, PendingTicketsScreen, TicketPreviewModal)
 */

/**
 * Tipos para los cálculos de pago
 */
export interface PaymentTotals {
  totalPayout: number
  totalPaid: number
  remainingAmount: number
  hasWinner: boolean
  isFullyPaid: boolean
  hasPartialPayment: boolean
}

export interface Jugada {
  id?: string
  number?: string
  type?: string
  amount: number
  isWinner?: boolean
  payout?: number
  winAmount?: number
  finalMultiplierX?: number
  multiplier?: {
    name?: string
  }
}

export interface TicketForCalculations {
  id: string
  ticketNumber?: string
  status?: string
  isWinner?: boolean
  jugadas?: Jugada[]
  payments?: Array<{
    id: string
    amountPaid: number
    isReversed?: boolean
  }>
  // ✅ v2.0: Campos unificados del backend
  totalPayout?: number
  totalPaid?: number
  remainingAmount?: number
}

/**
 * Calcular totales de pago de un ticket usando sistema unificado v2.0
 * con fallback para compatibilidad con backend antiguo.
 * 
 * ✅ v2.0: Prioriza campos unificados (totalPayout, totalPaid, remainingAmount)
 * ⚠️ Fallback: Si totalPayout es 0 pero hay jugadas ganadoras, calcula manualmente
 * 
 * @param ticket - Ticket con jugadas y/o campos unificados
 * @returns Objeto con todos los totales calculados y flags de estado
 * 
 * @example
 * ```typescript
 * const totals = calculatePaymentTotals(ticket)
 * console.log(totals.totalPayout) // 50000
 * console.log(totals.hasWinner) // true
 * console.log(totals.isFullyPaid) // false
 * ```
 */
export function calculatePaymentTotals(ticket: TicketForCalculations): PaymentTotals {
  const jugadas = ticket.jugadas || []
  const hasWinner = jugadas.some((j) => j.isWinner === true)
  
  // ✅ v2.0: Usar campos unificados si están disponibles
  // PERO: Si totalPayout es 0 y el ticket es ganador, usar fallback para calcular
  const hasUnifiedPayout = ticket.totalPayout !== undefined && ticket.totalPayout !== null
  const shouldUseUnified = hasUnifiedPayout && (ticket.totalPayout > 0 || !hasWinner)
  
  if (shouldUseUnified) {
    const totalPayout = ticket.totalPayout || 0
    const totalPaid = ticket.totalPaid || 0
    const remainingAmount = ticket.remainingAmount || 0
    
    return {
      totalPayout,
      totalPaid,
      remainingAmount,
      hasWinner: ticket.isWinner || false,
      isFullyPaid: ticket.status === 'PAID' || remainingAmount <= 0,
      hasPartialPayment: totalPaid > 0 && remainingAmount > 0,
    }
  }

  // Fallback: calcular manualmente (compatibilidad con backend antiguo)
  const totalPayout = jugadas
    .filter((j) => j.isWinner)
    .reduce((sum, j) => sum + (j.payout || j.winAmount || 0), 0)

  const totalPaid = (ticket.payments || [])
    .filter((p) => !p.isReversed)
    .reduce((sum, p) => sum + p.amountPaid, 0)

  const remainingAmount = totalPayout - totalPaid

  return {
    totalPayout,
    totalPaid,
    remainingAmount,
    hasWinner,
    isFullyPaid: ticket.status === 'PAID' || remainingAmount <= 0,
    hasPartialPayment: totalPaid > 0 && remainingAmount > 0,
  }
}

/**
 * Obtener jugadas ganadoras con cálculos de premio
 * 
 * @param ticket - Ticket con jugadas
 * @returns Array de jugadas ganadoras con montos normalizados
 * 
 * @example
 * ```typescript
 * const winners = getWinningJugadas(ticket)
 * console.log(winners.length) // 3
 * console.log(winners[0].winAmount) // 15000
 * ```
 */
export function getWinningJugadas(ticket: TicketForCalculations): Array<Jugada & { winAmount: number }> {
  const jugadas = ticket.jugadas || []
  return jugadas
    .filter((j) => j.isWinner)
    .map((j) => ({
      ...j,
      winAmount: j.payout || j.winAmount || 0,
    }))
}

/**
 * Verificar si un ticket puede recibir pagos
 * 
 * @param ticket - Ticket a verificar
 * @returns true si el ticket puede recibir pagos
 * 
 * @example
 * ```typescript
 * if (canReceivePayment(ticket)) {
 *   // Mostrar botón de pago
 * }
 * ```
 */
export function canReceivePayment(ticket: TicketForCalculations): boolean {
  const totals = calculatePaymentTotals(ticket)
  
  return (
    totals.hasWinner &&
    totals.totalPayout > 0 &&
    !totals.isFullyPaid &&
    (ticket.status === 'EVALUATED' || ticket.status === 'PAID')
  )
}

/**
 * Validar monto de pago
 * 
 * @param amount - Monto a validar
 * @param ticket - Ticket para el cual se va a pagar
 * @returns Objeto con resultado de validación y mensaje de error si aplica
 * 
 * @example
 * ```typescript
 * const validation = validatePaymentAmount(5000, ticket)
 * if (!validation.valid) {
 *   console.error(validation.error)
 * }
 * ```
 */
export function validatePaymentAmount(
  amount: number,
  ticket: TicketForCalculations
): { valid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'El monto debe ser mayor a 0' }
  }

  const totals = calculatePaymentTotals(ticket)

  if (!totals.hasWinner) {
    return { valid: false, error: 'Este ticket no es ganador' }
  }

  if (totals.isFullyPaid) {
    return { valid: false, error: 'Este ticket ya está completamente pagado' }
  }

  if (amount > totals.remainingAmount) {
    return { valid: false, error: `El monto supera el pendiente (${totals.remainingAmount})` }
  }

  return { valid: true }
}

/**
 * Calcular si un pago es parcial y cuánto faltaría
 * 
 * @param amount - Monto del pago
 * @param ticket - Ticket para el cual se va a pagar
 * @returns Objeto con información del pago parcial
 * 
 * @example
 * ```typescript
 * const partial = calculatePartialPayment(10000, ticket)
 * if (partial.isPartial) {
 *   console.log(`Faltarían ${partial.remainingAfterPayment}`)
 * }
 * ```
 */
export function calculatePartialPayment(
  amount: number,
  ticket: TicketForCalculations
): {
  isPartial: boolean
  remainingAfterPayment: number
  percentagePaid: number
} {
  const totals = calculatePaymentTotals(ticket)
  const remainingAfterPayment = totals.remainingAmount - amount
  const isPartial = amount > 0 && remainingAfterPayment > 0
  const percentagePaid = totals.totalPayout > 0 
    ? ((totals.totalPaid + amount) / totals.totalPayout) * 100 
    : 0

  return {
    isPartial,
    remainingAfterPayment,
    percentagePaid: Math.round(percentagePaid),
  }
}

