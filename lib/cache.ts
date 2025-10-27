/**
 * Sistema de caché en localStorage para datos críticos
 * Evita pérdida de datos si las peticiones fallan
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const CACHE_KEYS = {
  SORTEOS: 'app_cache_sorteos',
  RESTRICCIONES: 'app_cache_restricciones',
}

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutos

export function setCacheData<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch (error) {
    console.warn('Error saving to localStorage:', error)
  }
}

export function getCacheData<T>(key: string, maxAge = CACHE_DURATION): T | null {
  try {
    const item = localStorage.getItem(key)
    if (!item) return null

    const entry: CacheEntry<T> = JSON.parse(item)
    const age = Date.now() - entry.timestamp

    if (age > maxAge) {
      // Caché expirado, pero devolvemos de todas formas como fallback
      return entry.data
    }

    return entry.data
  } catch (error) {
    console.warn('Error reading from localStorage:', error)
    return null
  }
}

export function clearCache(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('Error clearing cache:', error)
  }
}

export function clearAllCache(): void {
  try {
    Object.values(CACHE_KEYS).forEach(key => localStorage.removeItem(key))
  } catch (error) {
    console.warn('Error clearing all cache:', error)
  }
}

/**
 * Sorteos
 */
export function cacheSorteos(sorteos: any[]): void {
  setCacheData(CACHE_KEYS.SORTEOS, sorteos)
}

export function getCachedSorteos(): any[] | null {
  return getCacheData(CACHE_KEYS.SORTEOS)
}

/**
 * Restricciones
 */
export function cacheRestrictions(restrictions: any[]): void {
  setCacheData(CACHE_KEYS.RESTRICCIONES, restrictions)
}

export function getCachedRestrictions(): any[] | null {
  return getCacheData(CACHE_KEYS.RESTRICCIONES)
}
