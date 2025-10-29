# Componentes Compartidos de Tickets

Componentes reutilizables para el módulo de tickets del sistema bancas.

## 🎨 Componentes

### `TicketStatusBadge`

Badge unificado para mostrar el estado de un ticket con colores consistentes.

**Variantes:**
- `TicketStatusBadge` - Badge de estado general
- `WinnerBadge` - Badge especial para tickets ganadores
- `PaymentStatusBadge` - Badge para estado de pago

**Props:**
```typescript
interface TicketStatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
  uppercase?: boolean
}
```

**Ejemplo:**
```tsx
import { TicketStatusBadge, WinnerBadge } from '@/components/tickets/shared'

<TicketStatusBadge status="EVALUATED" size="md" />
<WinnerBadge size="lg" />
<PaymentStatusBadge status="partial" />
```

**Reemplaza código en:**
- ✅ TicketDetailScreen (líneas 79-88)
- ✅ TicketsListScreen (líneas 439-448)
- ✅ TicketPreviewModal (líneas 70-90)

---

### `PaymentAmountsGrid`

Grid reutilizable para mostrar montos de pago (Total Premio, Ya Pagado, Pendiente).

**Variantes:**
- `PaymentAmountsGrid` - Grid completo con 3 cards
- `PaymentAmountsCompact` - Versión compacta sin cards
- `PaymentProgressBar` - Barra de progreso de pago

**Props:**
```typescript
interface PaymentAmountsGridProps {
  totals: PaymentTotals
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  orientation?: 'horizontal' | 'vertical'
}
```

**Ejemplo:**
```tsx
import { PaymentAmountsGrid, PaymentProgressBar } from '@/components/tickets/shared'
import { calculatePaymentTotals } from '@/lib/tickets'

const totals = calculatePaymentTotals(ticket)

<PaymentAmountsGrid totals={totals} size="md" />
<PaymentProgressBar totals={totals} showPercentage />
```

**Reemplaza código en:**
- ✅ TicketDetailScreen (líneas 158-179) ~22 líneas
- ✅ TicketPaymentModal (líneas 230-256) ~27 líneas
- ✅ PaymentFormModal (líneas 198-223) ~26 líneas
- ✅ PendingTicketsScreen (modal embebido, líneas 438-464) ~27 líneas

**Total eliminado:** ~100 líneas

---

### `WinningJugadasList`

Lista reutilizable para mostrar jugadas ganadoras con detalles completos.

**Variantes:**
- `WinningJugadasList` - Lista completa con scroll
- `WinningJugadasCompact` - Versión compacta (primeras N jugadas)
- `WinningJugadasSummary` - Solo contador y total

**Props:**
```typescript
interface WinningJugadasListProps {
  ticket: TicketForCalculations
  maxHeight?: number
  showScrollbar?: boolean
  size?: 'sm' | 'md' | 'lg'
  showTitle?: boolean
}
```

**Ejemplo:**
```tsx
import { WinningJugadasList, WinningJugadasCompact } from '@/components/tickets/shared'

<WinningJugadasList 
  ticket={ticket} 
  maxHeight={200}
  size="md"
/>

<WinningJugadasCompact 
  ticket={ticket}
  maxItems={3}
/>
```

**Reemplaza código en:**
- ✅ TicketPaymentModal (líneas 258-301) ~44 líneas
- ✅ PaymentFormModal (líneas 225-268) ~44 líneas

**Total eliminado:** ~88 líneas

---

## 📊 Impacto

### Antes de la Fase 2

| Archivo | Líneas con duplicación |
|---------|------------------------|
| TicketDetailScreen | 335 |
| TicketPaymentModal | 478 |
| PaymentFormModal | 416 |
| TicketsListScreen | 589 |
| TicketPreviewModal | 374 |
| PendingTicketsScreen | 559 |
| **Total** | **2,751** |

### Después de la Fase 2

| Componente Compartido | Líneas | Elimina |
|-----------------------|--------|---------|
| TicketStatusBadge | 150 | ~30 líneas en 3 archivos |
| PaymentAmountsGrid | 180 | ~100 líneas en 4 archivos |
| WinningJugadasList | 230 | ~88 líneas en 2 archivos |
| **Total** | **560** | **~218 líneas** |

**Reducción estimada:** ~8% adicional al usar estos componentes

---

## 🔄 Próximos Pasos

### Fase 3: Modal Unificado de Pago

Crear `PaymentModal` que reemplace:
- ❌ `TicketPaymentModal.tsx` (478 líneas)
- ❌ `PaymentFormModal.tsx` (416 líneas)
- ❌ Modal embebido en `PendingTicketsScreen` (~170 líneas)

**Impacto:** ~1,000 líneas eliminadas

### Fase 4: Refactorización

Migrar componentes existentes para usar los utilities y componentes compartidos:
- `TicketDetailScreen.tsx`
- `TicketsListScreen.tsx`
- `TicketPreviewModal.tsx`
- `PendingTicketsScreen.tsx`

---

## 🧪 Testing

Los componentes deben ser testeados de forma aislada:

```typescript
import { render } from '@testing-library/react-native'
import { TicketStatusBadge } from '@/components/tickets/shared'

describe('TicketStatusBadge', () => {
  it('should render status correctly', () => {
    const { getByText } = render(
      <TicketStatusBadge status="EVALUATED" />
    )
    expect(getByText('EVALUATED')).toBeTruthy()
  })
  
  it('should apply correct styles for each status', () => {
    // Test color styles for different statuses
  })
})
```

---

## 📚 Referencias

- `lib/tickets/` - Utilities y constantes
- `PROPUESTA_UNIFICACION_TICKETS.md` - Propuesta completa
- `lib/tickets/README.md` - Documentación de utilities

