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
 * Frontend only sends semantic tokens:
 * - 'today' - Backend calculates as CR timezone today
 * - 'yesterday' - Backend calculates as CR timezone yesterday
 * - 'week' - Backend calculates as CR timezone this week
 * - 'month' - Backend calculates as CR timezone this month
 * - 'year' - Backend calculates as CR timezone this year
 * - 'range' - Backend respects provided YYYY-MM-DD dates (already calculated by backend/user)
 */

export type DateToken = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'range'

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
 * Get date range for timeframe filter (deprecated)
 * Use getDateParamsForToken instead
 * Returns [fromDate, toDate] in YYYY-MM-DD format
 */
export function getDateRangeForTimeframe(
  timeframe: 'today' | 'thisWeek' | 'thisMonth' | 'thisYear'
): [string, string] {
  const now = new Date()

  // Adjust to CR timezone for calculations
  const crFormatter = new Intl.DateTimeFormat('es-CR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: CR_TIMEZONE,
  })

  const parts = crFormatter.formatToParts(now)
  const year = parseInt(parts.find((p) => p.type === 'year')?.value || '2025')
  const month = parseInt(parts.find((p) => p.type === 'month')?.value || '1') - 1
  const day = parseInt(parts.find((p) => p.type === 'day')?.value || '1')

  let fromDate: Date
  let toDate: Date

  switch (timeframe) {
    case 'today': {
      fromDate = new Date(year, month, day)
      toDate = new Date(year, month, day)
      break
    }

    case 'thisWeek': {
      // Start of week (Monday)
      const currentDay = now.getDay()
      const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1)
      fromDate = new Date(year, month, diff)
      toDate = new Date(year, month, diff + 6)
      break
    }

    case 'thisMonth': {
      fromDate = new Date(year, month, 1)
      toDate = new Date(year, month + 1, 0)
      break
    }

    case 'thisYear': {
      fromDate = new Date(year, 0, 1)
      toDate = new Date(year, 11, 31)
      break
    }

    default:
      fromDate = new Date(year, month, day)
      toDate = new Date(year, month, day)
  }

  return [formatDateYYYYMMDD(fromDate), formatDateYYYYMMDD(toDate)]
}

/**
 * Format currency amount
 * Already exists in lib/currency but imported here for convenience
 */
export { formatCurrency } from './currency'
