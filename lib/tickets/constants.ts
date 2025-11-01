/**
 * Constantes centralizadas para el módulo de tickets
 * @version 2.0 - Sistema Unificado
 * 
 * Este módulo centraliza todas las constantes relacionadas con tickets
 * para evitar duplicación en múltiples componentes.
 */

import type { PaymentMethod } from '@/types/payment.types'

/**
 * Métodos de pago disponibles en el sistema
 * 
 * Usado en:
 * - TicketPaymentModal
 * - PaymentFormModal
 * - PendingTicketsScreen
 */
export const PAYMENT_METHODS: Array<{ label: string; value: PaymentMethod }> = [
  { label: 'Efectivo', value: 'cash' },
  { label: 'Cheque', value: 'check' },
  { label: 'Transferencia Bancaria', value: 'transfer' },
  { label: 'Sinpe Móvil', value: 'system' },
] as const

/**
 * Mapa de valores de métodos de pago a sus etiquetas
 * Para uso en displays y selects
 */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = Object.fromEntries(
  PAYMENT_METHODS.map(m => [m.value, m.label])
) as Record<PaymentMethod, string>

/**
 * Estados de ticket disponibles en el sistema
 * 
 * Usado en:
 * - TicketsListScreen
 * - Filtros de tickets
 */
export const TICKET_STATUSES = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'EVALUATED', label: 'Evaluados' },
  { value: 'PAID', label: 'Pagados' },
  { value: 'CANCELLED', label: 'Cancelados' },
] as const

/**
 * Mapa de estados a sus etiquetas
 */
export const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  TICKET_STATUSES.map(s => [s.value, s.label])
)

/**
 * Configuración de estilos para badges de estado de tickets
 * Proporciona colores consistentes en toda la aplicación
 * 
 * Usado en:
 * - TicketDetailScreen
 * - TicketsListScreen
 * - TicketPreviewModal
 * 
 * @example
 * ```tsx
 * const styles = STATUS_BADGE_STYLES[ticket.status] || STATUS_BADGE_STYLES.default
 * <XStack {...styles}>
 *   <Text color={styles.color}>{ticket.status}</Text>
 * </XStack>
 * ```
 */
export const STATUS_BADGE_STYLES = {
  EVALUATED: { 
    bg: '$yellow4', 
    color: '$yellow11', 
    bc: '$yellow8' 
  },
  ACTIVE: { 
    bg: '$green4', 
    color: '$green11', 
    bc: '$green8' 
  },
  OPEN: { 
    bg: '$green4', 
    color: '$green11', 
    bc: '$green8' 
  },
  PENDING: { 
    bg: '$blue4', 
    color: '$blue11', 
    bc: '$blue8' 
  },
  PAID: { 
    bg: '$purple4', 
    color: '$purple11', 
    bc: '$purple8' 
  },
  CANCELLED: { 
    bg: '$red4', 
    color: '$red11', 
    bc: '$red8' 
  },
  RESTORED: { 
    bg: '$blue4', 
    color: '$blue11', 
    bc: '$blue8' 
  },
  default: { 
    bg: '$gray4', 
    color: '$gray11', 
    bc: '$gray8' 
  },
} as const

/**
 * Tipo para los estilos de badge
 */
export type StatusBadgeStyle = {
  bg: string
  color: string
  bc: string
}

/**
 * Helper para obtener estilos de badge de forma segura
 * 
 * @param status - Estado del ticket
 * @returns Estilos de badge correspondientes
 */
export function getStatusBadgeStyles(status?: string): StatusBadgeStyle {
  if (!status) return STATUS_BADGE_STYLES.default
  return STATUS_BADGE_STYLES[status as keyof typeof STATUS_BADGE_STYLES] || STATUS_BADGE_STYLES.default
}

/**
 * Configuración de colores para estados de pago
 * 
 * Usado en:
 * - PaymentAmountsGrid
 * - Payment modals
 */
export const PAYMENT_STATUS_COLORS = {
  totalPayout: {
    bg: '$green2',
    color: '$green11',
    label: 'Total Premio',
  },
  totalPaid: {
    bg: '$blue2',
    color: '$blue11',
    label: 'Ya Pagado',
  },
  remainingAmount: {
    pending: {
      bg: '$red2',
      color: '$red11',
      label: 'Pendiente',
    },
    complete: {
      bg: '$gray2',
      color: '$gray11',
      label: 'Pendiente',
    },
  },
  winner: {
    bg: '$green4',
    bc: '$green8',
    color: '$green11',
  },
  partial: {
    bg: '$yellow4',
    bc: '$yellow8',
    color: '$yellow11',
  },
} as const

/**
 * Tamaños estándar para componentes reutilizables
 */
export const COMPONENT_SIZES = {
  badge: {
    sm: { padding: '$2', fontSize: '$2' },
    md: { padding: '$2.5', fontSize: '$3' },
    lg: { padding: '$3', fontSize: '$4' },
  },
  grid: {
    sm: { minWidth: 80, padding: '$2', labelSize: '$1', valueSize: '$4' },
    md: { minWidth: 100, padding: '$3', labelSize: '$2', valueSize: '$6' },
    lg: { minWidth: 140, padding: '$4', labelSize: '$3', valueSize: '$8' },
  },
  jugada: {
    sm: { padding: '$2', fontSize: '$3' },
    md: { padding: '$2', fontSize: '$5' },
    lg: { padding: '$3', fontSize: '$6' },
  },
} as const

/**
 * Configuración de paginación por defecto
 */
export const PAGINATION_DEFAULTS = {
  pageSize: 20,
  page: 1,
} as const

/**
 * Límites y validaciones
 */
export const VALIDATION_LIMITS = {
  minPaymentAmount: 1,
  maxPaymentAmountMultiplier: 1, // No puede exceder el monto pendiente
  maxJugadasPerTicket: 100,
} as const

