# Changelog

All notable changes to this project will be documented in this file.

## [0.5.0] - 2025-10-26 (pre-release)

### Added
- Admin headers: icon-only “back to panel” across Bancas, Ventanas, Loterías, Usuarios, Sorteos (index/new/preview/detail), Restricciones, Multiplicadores, Tickets (admin scope), Reportes, Configuración.
- Drawer: hover transitions with subtle border glow; top-down panel animation.
- CommissionForm: per-field validations with reserved space to avoid layout jumps; live preview syncing with form state.

### Changed
- Drawer menu simplified: Dashboard, Panel Administrativo, Configuración; user info moved after Configuración with separator. Drawer uses 75% opacity background (glass effect removed).
- Button icon theming: ensured all admin list buttons render icons in white/black depending on theme.
- Ventas hooks: increased `staleTime`, disabled refetch on focus, minimal retries.

### Fixed
- API rate limit handling: client now retries briefly on 429 (respect `Retry-After`).
- ventas/breakdown `top` clamped to API limit (<= 50); dashboard requests adjusted.

### Notes
- If you need the old drawer submenu, restore previous `components/layout/Drawer.tsx` commit.

