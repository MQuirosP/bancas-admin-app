/**
 * Constantes del sistema frontend
 * Sincronizadas con valores del backend
 */

// Paginación
export const DEFAULT_PAGE_SIZE = 20
export const DEFAULT_TOP = 50  // Máximo permitido por backend para requests con paginación

// Timeouts y tiempos
export const DEFAULT_STALE_TIME = 30_000  // 30 segundos
export const DEFAULT_CACHE_TIME = 5 * 60_000  // 5 minutos

// Validaciones
export const MAX_BET_AMOUNT = 10_000_000
export const MIN_BET_AMOUNT = 1
export const MAX_MULTIPLIER = 9999
export const MIN_MULTIPLIER = 1

// Scopes
export const SCOPE_ALL = 'all'
export const SCOPE_MINE = 'mine'

// Dimensiones para breakdown
export const DIMENSION_VENDEDOR = 'vendedor'
export const DIMENSION_VENTANA = 'ventana'
export const DIMENSION_LOTERIA = 'loteria'
