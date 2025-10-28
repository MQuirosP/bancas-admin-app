// lib/navigation.ts
import { Href, router } from 'expo-router'

/** Go to fallback route (dashboard). Always navigates directly, never goes back. */
export function safeBack(fallback: Href<string>) {
  router.push(fallback)
}

/** Replace navigation to a list/index route (avoid stacking history). */
export function goToList(path: Href<string>) {
  router.replace(path)
}
