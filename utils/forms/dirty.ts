// utils/dirty.ts
export function isDirty<T>(
  current: T,
  initial: T,
  normalize: (v: T) => any = (x) => x
): boolean {
  // compara versiones normalizadas usando JSON
  const a = normalize(current);
  const b = normalize(initial);
  return JSON.stringify(a) !== JSON.stringify(b);
}
