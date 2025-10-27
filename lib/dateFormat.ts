/**
 * Date formatting utilities for Costa Rica timezone
 * Timezone: America/Costa_Rica (UTC-6)
 */

export const CR_TIMEZONE = 'America/Costa_Rica'

/**
 * Format date to YYYY-MM-DD string
 * Used for API requests and date comparisons
 */
export function formatDateYYYYMMDD(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date

  return d
    .toLocaleDateString('es-CR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: CR_TIMEZONE,
    })
    .split('/')
    .reverse()
    .join('-') // Converts DD/MM/YYYY → YYYY-MM-DD
}

/**
 * Format date to DD/MM/YYYY string (for display)
 * Used in UI components
 */
export function formatDateDDMMYYYY(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date

  return d.toLocaleDateString('es-CR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: CR_TIMEZONE,
  })
}

/**
 * Format time to HH:MM string
 * Used in timestamps
 */
export function formatTimeHHMM(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date

  return d.toLocaleTimeString('es-CR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: CR_TIMEZONE,
  })
}

/**
 * Format date and time together: YYYY-MM-DD HH:MM
 * Used in payment details and confirmations
 */
export function formatDateTimeYYYYMMDD_HHMM(date: string | Date): string {
  return `${formatDateYYYYMMDD(date)} ${formatTimeHHMM(date)}`
}

/**
 * Format date and time for display: DD/MM/YYYY HH:MM
 * Used in UI labels
 */
export function formatDateTimeDDMMYYYY_HHMM(date: string | Date): string {
  return `${formatDateDDMMYYYY(date)} ${formatTimeHHMM(date)}`
}

/**
 * Parse YYYY-MM-DD string to Date object
 * Inverse of formatDateYYYYMMDD
 */
export function parseDateYYYYMMDD(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Get today's date in YYYY-MM-DD format
 * Respects CR timezone
 */
export function getTodayYYYYMMDD(): string {
  const now = new Date()
  return formatDateYYYYMMDD(now)
}

/**
 * ⚠️ CRITICAL: Backend Authority Model
 *
 * Frontend MUST NOT calculate date ranges.
 * The backend is the ONLY source of truth for date calculations.
 *
 * NOTE: Different endpoints support different tokens!
 * - /ventas/* endpoints: all tokens ('today' | 'yesterday' | 'week' | 'month' | 'year' | 'range')
 * - /tickets endpoint: basic tokens ('today' | 'yesterday' | 'range')
 * - Custom date ranges: use 'range' with fromDate/toDate in YYYY-MM-DD format
 */

// ✅ All semantic tokens (supported by ventas endpoints)
export type DateToken = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'range'

// ✅ Basic tokens (supported by all endpoints including /tickets)
export type DateTokenBasic = 'today' | 'yesterday' | 'range'

// ✅ Extended tokens (only /ventas/* endpoints support these)
export type DateTokenExtended = 'week' | 'month' | 'year'

/**
 * Send date token to backend
 * Backend will resolve using CR timezone and proper date calculations
 *
 * IMPORTANT: Frontend must NOT do date math!
 */
export function getDateParam(
  token: DateToken,
  customFrom?: string,
  customTo?: string
): { date: string; fromDate?: string; toDate?: string } {
  // ✅ Only pass token to backend - let it handle calculations
  if (token === 'range' && customFrom && customTo) {
    return {
      date: 'range',
      fromDate: customFrom,  // Already in YYYY-MM-DD format
      toDate: customTo,      // Already in YYYY-MM-DD format
    }
  }

  // ✅ All other tokens go directly to backend for resolution
  return { date: token }
}

/**
 * ⚠️ DEPRECATED: Do NOT use getDateRangeForTimeframe
 *
 * This function violates the Backend Authority Model.
 * Frontend MUST NOT calculate date ranges.
 *
 * Use getDateParam() with tokens instead:
 *   - getDateParam('week')    instead of getDateRangeForTimeframe('thisWeek')
 *   - getDateParam('month')   instead of getDateRangeForTimeframe('thisMonth')
 *   - getDateParam('today')   instead of getDateRangeForTimeframe('today')
 *
 * Backend will calculate proper date boundaries using CR timezone.
 */

/**
 * Format currency amount
 * Already exists in lib/currency but imported here for convenience
 */
export { formatCurrency } from './currency'
