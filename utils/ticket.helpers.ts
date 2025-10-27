/**
 * Utilities for ticket formatting and grouping
 */

type JugadaType = 'NUMERO' | 'REVENTADO'

export type JugadaGroup = {
  amount: number
  numbers: string[]
  type: JugadaType
}

type Jugada = {
  type: JugadaType
  number?: string
  reventadoNumber?: string
  amount: number
}

/**
 * Groups jugadas by amount for compact receipt printing
 * Returns array of groups sorted by amount descending
 *
 * Example input:
 *   [{ type: 'NUMERO', number: '34', amount: 200000 },
 *    { type: 'NUMERO', number: '38', amount: 50800 },
 *    { type: 'NUMERO', number: '32', amount: 8400 }]
 *
 * Output:
 *   [{ amount: 200000, numbers: ['34'], type: 'NUMERO' },
 *    { amount: 50800, numbers: ['38'], type: 'NUMERO' },
 *    { amount: 8400, numbers: ['32'], type: 'NUMERO' }]
 */
export function groupJugadasByAmount(jugadas: Jugada[]): {
  numeros: JugadaGroup[]
  reventados: JugadaGroup[]
} {
  const numeroMap = new Map<number, string[]>()
  const reventadoMap = new Map<number, string[]>()

  jugadas.forEach((jugada) => {
    const amount = jugada.amount
    const number = jugada.type === 'NUMERO'
      ? (jugada.number ?? '')
      : (jugada.reventadoNumber ?? jugada.number ?? '')

    // Normalize number to 2 digits
    const normalizedNumber = number.replace(/\D/g, '').slice(0, 2).padStart(2, '0')

    if (jugada.type === 'NUMERO') {
      const existing = numeroMap.get(amount) || []
      existing.push(normalizedNumber)
      numeroMap.set(amount, existing)
    } else if (jugada.type === 'REVENTADO') {
      const existing = reventadoMap.get(amount) || []
      existing.push(normalizedNumber)
      reventadoMap.set(amount, existing)
    }
  })

  // Convert maps to sorted arrays (descending by amount)
  const numeros: JugadaGroup[] = Array.from(numeroMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([amount, numbers]) => ({
      amount,
      numbers: numbers.sort(), // Sort numbers for consistency
      type: 'NUMERO' as JugadaType
    }))

  const reventados: JugadaGroup[] = Array.from(reventadoMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([amount, numbers]) => ({
      amount,
      numbers: numbers.sort(),
      type: 'REVENTADO' as JugadaType
    }))

  return { numeros, reventados }
}

/**
 * Formats numbers for display on a single line with commas
 * Example: ['34', '38', '32'] => '34, 38, 32'
 */
export function formatNumbersList(numbers: string[]): string {
  return numbers.join(', ')
}

/**
 * Pads number to 2 digits
 */
export function pad2(n?: string): string {
  const s = (n ?? '').replace(/\D/g, '').slice(0, 2)
  return s.length === 2 ? s : s.padStart(2, '0')
}
