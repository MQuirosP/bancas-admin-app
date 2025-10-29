/**
 * Punto de entrada para utilities de tickets
 * @version 2.0 - Sistema Unificado
 */

// Re-export calculations
export {
  calculatePaymentTotals,
  getWinningJugadas,
  canReceivePayment,
  validatePaymentAmount,
  calculatePartialPayment,
} from './calculations'

export type {
  PaymentTotals,
  Jugada,
  TicketForCalculations,
} from './calculations'

// Re-export constants
export {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  TICKET_STATUSES,
  STATUS_LABELS,
  STATUS_BADGE_STYLES,
  PAYMENT_STATUS_COLORS,
  COMPONENT_SIZES,
  PAGINATION_DEFAULTS,
  VALIDATION_LIMITS,
  getStatusBadgeStyles,
} from './constants'

export type {
  StatusBadgeStyle,
} from './constants'

