// utils/format/phone.ts
export function formatPhoneCR(input: string) {
  // deja solo dígitos, máx 11 (3 prefijo + 8 número)
  const digits = (input || '').replace(/\D/g, '').slice(0, 11)

  const p = digits.slice(0, 3)      // prefijo
  const a = digits.slice(3, 7)      // primeros 4 del número
  const b = digits.slice(7, 11)     // últimos 4 del número

  let out = ''
  if (p) out += `(${p}`
  if (p.length === 3) out += ') '
  if (p.length < 3 && digits.length > 0) out = `(${p}` // mientras se escribe el prefijo

  if (a) out += a
  if (a.length === 4 && b.length > 0) out += '-'
  if (b) out += b

  return out
}
