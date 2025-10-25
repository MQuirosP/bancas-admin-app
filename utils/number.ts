// utils/number.ts
// Acepta string/'' y retorna number | undefined | NaN
export const toNumberOrUndef = (v: unknown) => {
  const s = typeof v === 'string' ? v.trim() : v
  if (s === '' || s === undefined || s === null) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

