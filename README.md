# Bancas Admin App

Admin dashboard for lottery “bancas”, built with Expo Router, Tamagui, React Query, and Zustand. Runs on web and native (iOS/Android).

## Stack

- Expo + React Native + Expo Router
- Tamagui UI (design tokens + cross‑platform primitives)
- @tanstack/react-query (data fetching/cache)
- Zustand (auth/UI state)
- TypeScript

## Requirements

- Node 18+
- pnpm or npm or yarn
- Xcode (iOS) / Android SDK (Android) for native targets

## Setup

1- Install dependencies

- `npm install` (or `pnpm i` / `yarn`)

2- Environment variables

- Copy `.env.example` to `.env` and adjust values.
- API base URL expected by the client (one of):
  - `EXPO_PUBLIC_API_BASE_URL` (preferred; read by `lib/api.client.ts`)
  - `EXPO_PUBLIC_API_URL` (exposed via `app.config.cjs` extra)
- If both exist, `EXPO_PUBLIC_API_BASE_URL` takes precedence.

3- Start the app

- Web: `npm run web`
- Android: `npm run android`
- iOS: `npm run ios`
- Dev client: `npm run dev`

## Scripts

- `npm start` — Expo dev server
- `npm run web` — run in browser
- `npm run android` — run on Android emulator/device
- `npm run ios` — run on iOS simulator/device
- `npm run test` — unit tests via Jest
- `npm run lint` — ESLint (TypeScript, React, RN)
- `npm run typecheck` — TypeScript check
- `npm run format` — Prettier formatting

## Project Structure

- `app/` — Expo Router routes (grouped by role: `(auth)`, `admin`, `ventana`, `vendedor`)
- `components/` — UI and screens (layout, tickets, forms, etc.)
  - `components/ui/` — shared UI built on Tamagui (Button, Card, Input, Select, DatePicker, Modal, Table, Toolbar, Toast, Confirm)
- `hooks/` — React hooks (domain/data hooks, UI helpers)
- `lib/` — API client, queryClient, errors, navigation, validators
- `services/` — resource‑oriented API helpers
- `store/` — Zustand stores (`auth`, `theme`, `ui`)
- `types/` — shared TypeScript types
- `utils/` — formatting, validation, object helpers, role utils

## UI/UX Guidelines

- Use `components/ui/*` wrappers (not Tamagui primitives directly) for consistency:
  - `Button` variants: `primary | outlined | ghost | danger | secondary` (secondary = subtle; ideal for pagination)
  - `Input` supports `error` and accessible focus outline
  - `Select` is re‑exported from Tamagui; prefer the shared import `@/components/ui`
  - `DatePicker` is cross‑platform (web uses `<input>`; native uses DateTimePicker)
  - `Table` exports `Table, THead, TBody, Tr, Th, Td`
  - `Modal` is a lightweight RN modal wrapper
- Layout and theming
  - Root providers live in `app/_layout.tsx` (TamaguiProvider, QueryClientProvider, ToastProvider, SystemThemeSync)
  - `MainLayout` applies `<Theme name={theme}>` around content; theme comes from `store/theme.store.ts`
- Pagination
  - Use compact and subtle controls: `size="$2" variant="secondary"` for “Anterior/Siguiente” buttons

## Data & Query Conventions

- Central query client and keys in `lib/queryClient.ts`
  - Prefer `queryKeys.*` when declaring/invalidation queries
  - Recommended defaults: `staleTime`, `gcTime`, `retry`, and `keepPreviousData` for paginated lists
- API client usage (lib/api.client.ts)
  - GET with params: `apiClient.get('/path', { p1, p2 })`
  - POST/PUT/PATCH with body: `apiClient.post('/path', body)`
  - If you need query params with POST/PUT/PATCH, build and append them:
    - `const qs = apiClient.buildQueryString({ p1, p2 })`
    - `apiClient.post(`/path${qs}`, body)`
  - DELETE with payload: `apiClient.deleteWithBody('/path', body)`
  - The client normalizes `{data, meta}` responses and handles token refresh/401 globally

## State Management

- `store/auth.store.ts` — session (persisted via AsyncStorage/localStorage), hydration (`isHydrating`) and helpers
- `store/theme.store.ts` — theme (`light|dark`), persistence, `getSafeTheme`
- `store/ui.store.ts` — drawer and transient UI state

## Routing & Access Control

- Expo Router — file‑based routes in `app/`
- Role layouts enforce access:
  - `app/admin/_layout.tsx` — ADMIN
  - `app/ventana/_layout.tsx` — VENTANA
  - `app/vendedor/_layout.tsx` — VENDEDOR
- `app/index.tsx` redirects to the proper dashboard by role

## Coding Standards

- TypeScript everywhere; avoid `any` — prefer explicit types from `types/*`
- Use path aliases: `@/` (repo root), `@components/*`, `@hooks/*`, `@lib/*`, `@services/*`, `@store/*`, `@types/*`, `@utils/*`
- Keep UI/shared logic in `components/ui/*` and reusable hooks
- Put business/API logic in `lib/` or `services/` (not in views)
- Localize strings in the future; fix encoding issues (accents/ñ) where spotted

## Testing

- Unit tests: `__tests__/` with Jest + Testing Library
- Run: `npm run test` or `npm run test:watch`

## Troubleshooting

- API base URL not picked up:
  - Ensure `EXPO_PUBLIC_API_BASE_URL` is set (preferred), or adjust `app.config.cjs`/`.env` so the exported extra matches the client expectation
- Web animations warnings:
  - `lib/patch-animated.ts` filters noisy `useNativeDriver` warnings on web
- Network/auth issues:
  - The API client refreshes tokens on 401; ensure refresh endpoint is reachable
  - Rate limits (429): the client now retries briefly (respecting `Retry-After` if present). Hooks for ventas increase `staleTime` and reduce refetches.

## Recent Changes (highlights)

- Drawer: simplified admin menu (Dashboard, Panel Administrativo, Configuración + user block), top-down animation, subtle hover transition, 75% opaque background.
- Dark/Light icons: button icons now take theme color across admin lists (Ventanas, Bancas, Loterías, Usuarios, Sorteos, Restricciones, Multipliers, Tickets).
- Back button: added icon-only “back to panel” on admin section headers (no background/border, press scale only).
- Commissions: cleaned CommissionForm UI, removed duplicate builder, added per-field validations with stable row height, live simulator wired to form.
- Ventas API usage: clamp `top` to <= 50; hooks reduce refetch noise and handle 429 more gracefully.

## Contributing

- Use the shared UI components and follow the API client conventions
- Keep lists consistent: loading/error/empty/content states
- Prefer `queryKeys` and invalidate narrowly (resource‑scoped) after mutations
- Smaller PRs with clear descriptions; reference the affected screens/resources
