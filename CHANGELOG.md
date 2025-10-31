# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-10-30 (pre-release)

### Added
- **Dashboard Admin Completo**: Dashboard administrativo completamente funcional con todas las secciones implementadas
- **Modo Mock**: Switch en toolbar para alternar entre datos mock y datos reales del backend
- **Gráfico de Series Temporales**: Visualización de ventas con barras animadas, comparación de períodos y animación "grow up"
- **Desgloses por Dimensión**: Componente con tabs para Ventanas, Loterías y Vendedores con métricas detalladas
- **Análisis de Riesgo y Finanzas**: Secciones para Exposición por número, CxC, CxP y Ganancia con visualizaciones
- **Datos Mock Generados**: Funciones para generar datos mock realistas de KPIs, TimeSeries, Alertas y desgloses

### Changed
- **Dashboard Components**: Mejoras en visualización de KPIs, gráficos y alertas
- **Formularios Estandarizados**: Todos los formularios "nuevo" en app/admin tienen ancho máximo de 720px
- **Switch de Comparación**: Mismo estilo que FilterSwitch en admin/ventana/index

### Fixed
- **Animación de Barras**: Corregida animación cuando se desactiva switch de comparación, barras actuales mantienen estado
- **Switch de Comparación**: Estados separados para barras actuales vs barras de comparación

### Technical
- Animaciones spring con damping y stiffness optimizados
- Delay escalonado para efecto cascada en gráficos
- Estructura lista para datos reales del backend sin cambios de código

## [1.1.0] - 2025-10-30

### Added
- **Skeleton Loading States**: Componentes de carga animados para dashboard (SkeletonKPI, SkeletonChart, SkeletonText)
- **Dashboard Filtros Colapsables**: Filtros del admin dashboard ahora son colapsables con animación suave, contraídos por defecto
- **Collapsible Toolbar**: Componente reutilizable para toolbars colapsables en todos los módulos admin
- **Vendedor Dashboard Mejorado**: 
  - Nueva métrica "Pagado Hoy" con comparaciones vs día anterior
  - Indicadores visuales con flechas de tendencia (↗️/↘️) y badges de colores
  - Grid 2x2 responsivo
- **Búsqueda Integrada**: Ícono de lupa y botón de limpiar (X) integrados dentro de los inputs en todos los módulos admin
- **Responsive Design**: Layout mobile optimizado para sección "Desempeño Individual" en ventana/vendedores con grid 2x2

### Changed
- **UI/UX Improvements**:
  - Separación visual mejorada entre elementos de filtros con espaciado consistente
  - Toolbars responsivos en todos los módulos admin (bancas, ventanas, usuarios, sorteos, loterias, multipliers, restrictions, tickets)
  - Título personalizado "Mis Tickets" para scope vendedor
  - Dashboard admin inicia con filtros contraídos para enfoque en métricas
- **Ticket Form**: 
  - Validaciones condicionales con toasts informativos
  - Corrección de shifting de campos al seleccionar sorteo
  - Inhabilitación inteligente de "Apuesta Reventado" según reglas de lotería
- **Ventana Module**:
  - Nuevo diseño de "Resumen de Ventas" con métricas de pagos (pagado/pendiente)
  - Cards individuales para métricas destacadas

### Fixed
- **RBAC Security Bugs**: Corregidos múltiples bugs críticos de seguridad
  - Vendedores ahora solo ven sus propios tickets (scope: mine aplicado correctamente)
  - Ventanas solo ven tickets de sus vendedores asignados
  - Backend aplica filtros RBAC correctamente en /tickets y /ventas/breakdown
- **Responsive Issues**: 
  - Eliminado desbordamiento horizontal en mobile (ventana/vendedores)
  - Elementos de filtros no se superponen en mobile
  - Grid adaptativo para pantallas pequeñas
- **Skeleton Warning**: Eliminada prop 'animated' no-DOM que causaba warning en React
- **Form UX**: Eliminados inline legends en QuickBetEditor, reemplazados por toasts

### Removed
- Console.log de debug en app/vendedor, app/ventana/ventas, components/tickets/TicketsListScreen, lib/api.ventas

### Technical
- Animaciones optimizadas con timing de 200ms para transiciones fluidas
- Breakpoints $sm para layouts mobile
- Componentes Skeleton con animación pulse de opacidad
- RBAC validación con manejo de errores RBAC_003

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

