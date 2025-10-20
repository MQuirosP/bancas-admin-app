// utils/object.ts
export function compact<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: any = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue
    if (typeof v === 'string') {
      const s = v.trim()
      if (s === '') continue
      out[k] = s
    } else {
      out[k] = v
    }
  }
  return out
}
