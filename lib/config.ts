// lib/config.ts
import Constants from 'expo-constants'

type Extra = {
  EXPO_PUBLIC_API_URL?: string
  EXPO_PUBLIC_API_BASE_URL?: string
  apiBaseUrl?: string
}

const extra = ((Constants as any)?.expoConfig?.extra ??
  (Constants as any)?.manifest?.extra ??
  {}) as Extra

// Prefer environment vars (Expo public), then app.config extra, then default
const envBaseUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL

const extraBaseUrl =
  extra.EXPO_PUBLIC_API_URL ??
  extra.EXPO_PUBLIC_API_BASE_URL ??
  extra.apiBaseUrl

// Fallback keeps current production default
export const API_BASE_URL =
  envBaseUrl ??
  extraBaseUrl ??
  'https://backend-bancas.onrender.com/api/v1'

export function getApiBaseUrl() {
  return API_BASE_URL
}

