/**
 * Componentes compartidos para tickets
 * @version 2.0 - Sistema Unificado
 */

// Status badges
export {
  TicketStatusBadge,
  WinnerBadge,
  PaymentStatusBadge,
} from './TicketStatusBadge'

export type {
  TicketStatusBadgeProps,
  PaymentStatusBadgeProps,
} from './TicketStatusBadge'

// Payment amounts grid
export {
  PaymentAmountsGrid,
  PaymentAmountsCompact,
  PaymentProgressBar,
} from './PaymentAmountsGrid'

export type {
  PaymentAmountsGridProps,
} from './PaymentAmountsGrid'

// Winning jugadas list
export {
  WinningJugadasList,
  WinningJugadasCompact,
  WinningJugadasSummary,
} from './WinningJugadasList'

export type {
  WinningJugadasListProps,
} from './WinningJugadasList'

// Payment modal (unificado)
export {
  PaymentModal,
} from './PaymentModal'

export type {
  PaymentModalProps,
} from './PaymentModal'

// Jugadas list (vista normal o agrupada)
export {
  JugadasList,
} from './JugadasList'

export type {
  JugadasListProps,
} from './JugadasList'

