// utils/safe.ts
export async function safe<T>(p: Promise<T>): Promise<[T | null, unknown]> {
  try {
    const res = await p
    return [res, null]
  } catch (e) {
    return [null, e]
  }
}
