# Tickets Utilities

Utilities centralizados para el módulo de tickets del sistema bancas.

## 📦 Módulos

### `calculations.ts`

Lógica de cálculo de pagos y validaciones.

**Funciones principales:**

- `calculatePaymentTotals(ticket)` - Calcula totales de pago con sistema unificado v2.0
- `getWinningJugadas(ticket)` - Obtiene jugadas ganadoras con montos normalizados
- `canReceivePayment(ticket)` - Verifica si un ticket puede recibir pagos
- `validatePaymentAmount(amount, ticket)` - Valida monto de pago
- `calculatePartialPayment(amount, ticket)` - Calcula información de pago parcial

**Uso:**

```typescript
import { calculatePaymentTotals } from '@/lib/tickets'

const totals = calculatePaymentTotals(ticket)
console.log(totals.totalPayout) // 50000
console.log(totals.hasWinner) // true
console.log(totals.isFullyPaid) // false
```

### `constants.ts`

Constantes centralizadas para evitar duplicación.

**Constantes principales:**

- `PAYMENT_METHODS` - Métodos de pago disponibles
- `PAYMENT_METHOD_LABELS` - Mapa de valores a etiquetas
- `TICKET_STATUSES` - Estados de ticket
- `STATUS_BADGE_STYLES` - Estilos para badges de estado
- `PAYMENT_STATUS_COLORS` - Colores para estados de pago
- `COMPONENT_SIZES` - Tamaños estándar para componentes

**Uso:**

```typescript
import { PAYMENT_METHODS, getStatusBadgeStyles } from '@/lib/tickets'

// En un select de métodos de pago
<Select>
  {PAYMENT_METHODS.map(m => (
    <Select.Item key={m.value} value={m.value}>
      <Select.ItemText>{m.label}</Select.ItemText>
    </Select.Item>
  ))}
</Select>

// Para badges de estado
const styles = getStatusBadgeStyles(ticket.status)
<XStack {...styles}>
  <Text color={styles.color}>{ticket.status}</Text>
</XStack>
```

## 🎯 Beneficios

### Antes

```typescript
// ❌ Duplicado en 6 archivos diferentes
const hasUnifiedPayout = ticket.totalPayout !== undefined && ticket.totalPayout !== null
const shouldUseUnified = hasUnifiedPayout && (ticket.totalPayout > 0 || !hasWinner)

const totalWinnings = shouldUseUnified
  ? ticket.totalPayout
  : jugadas.reduce((sum, j) => sum + (j.isWinner ? (j.payout || j.winAmount || 0) : 0), 0)
// ... más código duplicado
```

### Después

```typescript
// ✅ Una sola línea, misma lógica en toda la app
const totals = calculatePaymentTotals(ticket)
```

## 📊 Impacto

- **6 archivos** con código duplicado → **1 archivo** centralizado
- **~300 líneas** de código duplicadas → **~200 líneas** de utilities reutilizables
- **Reducción de ~33%** en código de cálculos
- **100% consistencia** en toda la aplicación

## 🔄 Migración

Ver `PROPUESTA_UNIFICACION_TICKETS.md` para el plan completo de migración.

### Fase 1 (Actual): Utilities ✅

- [x] Crear `calculations.ts`
- [x] Crear `constants.ts`
- [x] Extender `formatters.ts`
- [x] Documentación

### Próximas Fases

- [ ] Fase 2: Componentes reutilizables (TicketStatusBadge, PaymentAmountsGrid, etc.)
- [ ] Fase 3: Modal unificado de pago
- [ ] Fase 4: Refactorización de componentes existentes

## 🧪 Testing

Los utilities deben ser testeados de forma aislada:

```typescript
import { calculatePaymentTotals } from '@/lib/tickets'

describe('calculatePaymentTotals', () => {
  it('should use unified fields when available', () => {
    const ticket = {
      id: '1',
      totalPayout: 50000,
      totalPaid: 20000,
      remainingAmount: 30000,
      isWinner: true,
    }
    
    const totals = calculatePaymentTotals(ticket)
    
    expect(totals.totalPayout).toBe(50000)
    expect(totals.totalPaid).toBe(20000)
    expect(totals.remainingAmount).toBe(30000)
    expect(totals.hasWinner).toBe(true)
  })
  
  // ... más tests
})
```

## 📚 Referencias

- `PROPUESTA_UNIFICACION_TICKETS.md` - Propuesta completa
- `types/payment.types.ts` - Tipos relacionados
- `docs/BACKEND_INTEGRATION_PAYMENTS.md` - Integración con backend

