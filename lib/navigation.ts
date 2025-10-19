// lib/navigation.ts
import { Href, router } from 'expo-router'

/** Go back if possible; otherwise replace with the provided fallback list route. */
export function safeBack(fallback: Href<string>) {
  try {
    // canGoBack existe en web/native recientes; en otras, ignoramos el error.
    // @ts-ignore
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back()
      return
    }
  } catch {}
  router.replace(fallback)
}

/** Replace navigation to a list/index route (avoid stacking history). */
export function goToList(path: Href<string>) {
  router.replace(path)
}
