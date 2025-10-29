# 📋 Propuesta de Unificación y Centralización de Componentes de Tickets

**Fecha:** 29 de octubre de 2025  
**Autor:** Análisis del sistema actual  
**Estado:** Propuesta para revisión

---

## 🎯 Objetivo

Reducir la duplicación de código, centralizar la lógica de negocio y mejorar la mantenibilidad del sistema de visualización y gestión de tickets en toda la aplicación (Admin, Ventana, Vendedor).

---

## 📊 Análisis de la Situación Actual

### Archivos Analizados

#### `components/tickets/`
- ✅ **TicketsListScreen.tsx** (589 líneas) - Lista principal de tickets
- ✅ **TicketDetailScreen.tsx** (335 líneas) - Vista de detalle completa
- ✅ **TicketPaymentModal.tsx** (478 líneas) - Modal de pago (desde listas)
- ✅ **TicketPreviewModal.tsx** (374 líneas) - Modal de preview/vista rápida
- ✅ **TicketActionButtons.tsx** (61 líneas) - Botones Ver/Status
- ✅ **TicketSummary.tsx** (vacío/sin uso)
- ⚠️ **TicketForm.tsx** - Formulario de creación (no revisado en detalle)
- ⚠️ **TicketReceipt.tsx** - Recibo imprimible (no revisado en detalle)

#### `components/payments/`
- ✅ **PaymentFormModal.tsx** (416 líneas) - Modal de pago (casi idéntico a TicketPaymentModal)
- ✅ **PendingTicketsScreen.tsx** (559 líneas) - Lista de tickets ganadores + modal de pago embebido
- ✅ **PaymentHistoryModal.tsx** (230 líneas) - Historial de pagos
- ⚠️ **PaymentConfirmationModal.tsx** (no revisado)

#### Otros
- ✅ **app/admin/reportes/tickets.tsx** - Reportes (posible duplicación)
- ✅ **components/dashboard/TicketsTable.tsx** - Tabla en dashboard (posible duplicación)

---

## 🔴 Problemas Identificados

### 1. **Duplicación Crítica: Cálculo de Totales de Pago**

**Repetido en 6 archivos diferentes:**

```typescript
// Patrón repetido:
const hasUnifiedPayout = ticket.totalPayout !== undefined && ticket.totalPayout !== null
const shouldUseUnified = hasUnifiedPayout && (ticket.totalPayout > 0 || !hasWinner)

const totalWinnings = shouldUseUnified
  ? ticket.totalPayout
  : jugadas.reduce((sum, j) => sum + (j.isWinner ? (j.payout || j.winAmount || 0) : 0), 0)

const totalPaid = shouldUseUnified ? (ticket.totalPaid || 0) : 0
const remainingAmount = shouldUseUnified ? (ticket.remainingAmount || 0) : (totalWinnings - totalPaid)
```

**Archivos afectados:**
- `TicketDetailScreen.tsx` (líneas 65-76)
- `TicketPaymentModal.tsx` (líneas 58-105) + logs de debug
- `PaymentFormModal.tsx` (líneas 44-91) + logs de debug
- `TicketsListScreen.tsx` (líneas 427-438 + 149-159)
- `PendingTicketsScreen.tsx` (líneas 46-68)
- `TicketPreviewModal.tsx` (líneas 51-62)

**Impacto:**
- ⚠️ **Riesgo alto de inconsistencias** si cambia la lógica de negocio
- ⚠️ **Logs de debug dispersos** (solo en modales de pago)
- ⚠️ **Mantenimiento costoso** (6 lugares para actualizar)

---

### 2. **Duplicación: Métodos de Pago**

**Repetido en 3 archivos:**

```typescript
const PAYMENT_METHODS = [
  { label: 'Efectivo', value: 'cash' },
  { label: 'Cheque', value: 'check' },
  { label: 'Transferencia Bancaria', value: 'transfer' },
  { label: 'Sinpe Móvil', value: 'system' },
]
```

**Archivos afectados:**
- `TicketPaymentModal.tsx` (líneas 29-34)
- `PaymentFormModal.tsx` (líneas 21-26)
- `PendingTicketsScreen.tsx` (líneas 15-20)

**Problema:** Si se agrega/cambia un método de pago, hay que modificar 3 archivos.

---

### 3. **Duplicación: Badges de Estado**

**Lógica de colores y estilo repetida en 3 archivos:**

```typescript
const statusBadgeProps = (() => {
  switch (ticket.status) {
    case 'EVALUATED': return { bg: '$yellow4', color: '$yellow11', bc: '$yellow8' }
    case 'ACTIVE': return { bg: '$green4', color: '$green11', bc: '$green8' }
    case 'PAID': return { bg: '$purple4', color: '$purple11', bc: '$purple8' }
    case 'CANCELLED': return { bg: '$red4', color: '$red11', bc: '$red8' }
    default: return { bg: '$gray4', color: '$gray11', bc: '$gray8' }
  }
})()
```

**Archivos afectados:**
- `TicketDetailScreen.tsx` (líneas 79-88)
- `TicketsListScreen.tsx` (líneas 439-448)
- `TicketPreviewModal.tsx` (líneas 70-90)

**Problema:** Inconsistencias visuales potenciales entre vistas.

---

### 4. **Duplicación: Grid de Montos de Pago (UI)**

**Componente visual casi idéntico en 4 archivos:**

```tsx
<XStack gap="$2" jc="space-between" flexWrap="wrap">
  <Card flex={1} minWidth={100} padding="$3" backgroundColor="$green2" ai="center" jc="center">
    <Text fontSize="$2" color="$green11" fontWeight="600">Total Premio</Text>
    <Text fontSize="$6" fontWeight="700" color="$green11">
      {formatCurrency(totalWinnings)}
    </Text>
  </Card>
  {/* ... Ya Pagado, Pendiente ... */}
</XStack>
```

**Archivos afectados:**
- `TicketDetailScreen.tsx` (líneas 158-179)
- `TicketPaymentModal.tsx` (líneas 230-256)
- `PaymentFormModal.tsx` (líneas 198-223)
- `PendingTicketsScreen.tsx` (modal embebido, líneas 438-464)

**Problema:** ~100 líneas de código duplicadas con pequeñas variaciones.

---

### 5. **Duplicación: Lista de Jugadas Ganadoras (UI)**

**Componente visual complejo repetido en 2 modales de pago:**

```tsx
{isWinner && ticket.jugadas && (() => {
  const winningJugadas = ticket.jugadas.filter((j) => j.isWinner)
  return winningJugadas.length > 0 && (
    <YStack gap="$2">
      <Text>Jugadas Ganadoras ({winningJugadas.length})</Text>
      <ScrollView maxHeight={200}>
        {winningJugadas.map((jugada) => (
          <Card>{/* Detalles de jugada */}</Card>
        ))}
      </ScrollView>
    </YStack>
  )
})()}
```

**Archivos afectados:**
- `TicketPaymentModal.tsx` (líneas 258-301)
- `PaymentFormModal.tsx` (líneas 225-268)

**Problema:** ~80 líneas de código UI duplicadas con variaciones menores.

---

### 6. **Duplicación Masiva: Modales de Pago**

**Dos modales de pago casi idénticos:**

| Archivo | Líneas | Uso |
|---------|--------|-----|
| `TicketPaymentModal.tsx` | 478 | Desde listas (Admin, Ventana, Vendedor) |
| `PaymentFormModal.tsx` | 416 | Desde módulo de pagos |
| `PendingTicketsScreen` (modal embebido) | ~170 | Tercera implementación dentro de otro componente |

**Diferencias mínimas:**
- `TicketPaymentModal` usa `useToast` y `useAuth` directamente
- `PaymentFormModal` usa hooks especializados (`useCreatePaymentMutation`, `useTicketDetailsQuery`)
- Ambos tienen prácticamente la misma UI y lógica de validación
- El modal embebido en `PendingTicketsScreen` es una versión simplificada

**Problema:** **~1000 líneas de código duplicadas** entre los 3 modales.

---

### 7. **Duplicación: Formateo de Fechas**

**Repetido en múltiples archivos:**

```typescript
format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })
format(new Date(payment.paidAt), 'dd/MM/yyyy HH:mm:ss', { locale: es })
```

**Problema:** Sin helper centralizado, formato inconsistente entre componentes.

---

## 💡 Propuesta de Solución

### 🔧 Fase 1: Crear Utilities Centralizados

#### **1.1 `lib/tickets/calculations.ts`** - Lógica de Cálculos

```typescript
/**
 * Calcular totales de pago de un ticket usando sistema unificado v2.0
 * con fallback para compatibilidad
 */
export function calculatePaymentTotals(ticket: TicketWithPayments) {
  const jugadas = ticket.jugadas || []
  const hasWinner = jugadas.some((j) => j.isWinner === true)
  
  // ✅ v2.0: Usar campos unificados si están disponibles
  const hasUnifiedPayout = ticket.totalPayout !== undefined && ticket.totalPayout !== null
  const shouldUseUnified = hasUnifiedPayout && (ticket.totalPayout > 0 || !hasWinner)
  
  if (shouldUseUnified) {
    return {
      totalPayout: ticket.totalPayout || 0,
      totalPaid: ticket.totalPaid || 0,
      remainingAmount: ticket.remainingAmount || 0,
      hasWinner: ticket.isWinner || false,
      isFullyPaid: ticket.status === 'PAID' || (ticket.remainingAmount || 0) <= 0,
      hasPartialPayment: (ticket.totalPaid || 0) > 0 && (ticket.remainingAmount || 0) > 0,
    }
  }

  // Fallback: calcular manualmente
  const totalPayout = jugadas
    .filter((j) => j.isWinner)
    .reduce((sum, j) => sum + (j.payout || j.winAmount || 0), 0)

  const totalPaid = (ticket.payments || [])
    .filter((p) => !p.isReversed)
    .reduce((sum, p) => sum + p.amountPaid, 0)

  const remainingAmount = totalPayout - totalPaid

  return {
    totalPayout,
    totalPaid,
    remainingAmount,
    hasWinner,
    isFullyPaid: remainingAmount <= 0,
    hasPartialPayment: totalPaid > 0 && remainingAmount > 0,
  }
}

/**
 * Obtener jugadas ganadoras con cálculos de premio
 */
export function getWinningJugadas(ticket: TicketWithPayments) {
  const jugadas = ticket.jugadas || []
  return jugadas
    .filter((j) => j.isWinner)
    .map((j) => ({
      ...j,
      winAmount: j.payout || j.winAmount || 0,
    }))
}
```

**Beneficio:** Una sola fuente de verdad para todos los cálculos de pago.

---

#### **1.2 `lib/tickets/constants.ts`** - Constantes Centralizadas

```typescript
import type { PaymentMethod } from '@/types/payment.types'

export const PAYMENT_METHODS: Array<{ label: string; value: PaymentMethod }> = [
  { label: 'Efectivo', value: 'cash' },
  { label: 'Cheque', value: 'check' },
  { label: 'Transferencia Bancaria', value: 'transfer' },
  { label: 'Sinpe Móvil', value: 'system' },
]

export const PAYMENT_METHOD_LABELS = Object.fromEntries(
  PAYMENT_METHODS.map(m => [m.value, m.label])
)

export const TICKET_STATUSES = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'EVALUATED', label: 'Evaluados' },
  { value: 'PAID', label: 'Pagados' },
  { value: 'CANCELED', label: 'Cancelados' },
]

export const STATUS_BADGE_STYLES = {
  EVALUATED: { bg: '$yellow4', color: '$yellow11', bc: '$yellow8' },
  ACTIVE: { bg: '$green4', color: '$green11', bc: '$green8' },
  OPEN: { bg: '$green4', color: '$green11', bc: '$green8' },
  PENDING: { bg: '$blue4', color: '$blue11', bc: '$blue8' },
  PAID: { bg: '$purple4', color: '$purple11', bc: '$purple8' },
  CANCELLED: { bg: '$red4', color: '$red11', bc: '$red8' },
  default: { bg: '$gray4', color: '$gray11', bc: '$gray8' },
} as const
```

**Beneficio:** Agregar un método de pago o cambiar colores requiere 1 cambio, no 6.

---

#### **1.3 `utils/formatters.ts`** - Formatters Centralizados (extender existente)

```typescript
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatTicketDate(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es })
}

export function formatPaymentDate(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy HH:mm:ss', { locale: es })
}

export function formatTicketNumber(ticket: { ticketNumber?: string; id: string }): string {
  return ticket.ticketNumber || `#${ticket.id.slice(-8)}`
}
```

**Beneficio:** Formato consistente en toda la app.

---

### 🧩 Fase 2: Crear Componentes Reutilizables

#### **2.1 `components/tickets/shared/TicketStatusBadge.tsx`**

```typescript
import React from 'react'
import { XStack, Text } from 'tamagui'
import { STATUS_BADGE_STYLES } from '@/lib/tickets/constants'

interface TicketStatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
}

export function TicketStatusBadge({ status, size = 'md' }: TicketStatusBadgeProps) {
  const styles = STATUS_BADGE_STYLES[status as keyof typeof STATUS_BADGE_STYLES] || STATUS_BADGE_STYLES.default
  
  const padding = size === 'sm' ? '$2' : size === 'lg' ? '$3' : '$2.5'
  const fontSize = size === 'sm' ? '$2' : size === 'lg' ? '$4' : '$3'
  
  return (
    <XStack px={padding} py="$1.5" br="$3" bw={1} {...styles}>
      <Text fontSize={fontSize} fontWeight="700" textTransform="uppercase" color={styles.color}>
        {status}
      </Text>
    </XStack>
  )
}
```

**Uso:**
```tsx
<TicketStatusBadge status={ticket.status} size="md" />
```

---

#### **2.2 `components/tickets/shared/PaymentAmountsGrid.tsx`**

```typescript
import React from 'react'
import { XStack, YStack, Text, Card } from 'tamagui'
import { formatCurrency } from '@/utils/formatters'
import type { PaymentTotals } from '@/lib/tickets/calculations'

interface PaymentAmountsGridProps {
  totals: PaymentTotals
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
}

export function PaymentAmountsGrid({ 
  totals, 
  size = 'md',
  showLabels = true 
}: PaymentAmountsGridProps) {
  const minWidth = size === 'sm' ? 80 : size === 'lg' ? 140 : 100
  const padding = size === 'sm' ? '$2' : size === 'lg' ? '$4' : '$3'
  const labelSize = size === 'sm' ? '$1' : size === 'lg' ? '$3' : '$2'
  const valueSize = size === 'sm' ? '$4' : size === 'lg' ? '$8' : '$6'

  return (
    <XStack gap="$2" jc="space-between" flexWrap="wrap">
      {/* Total Premio */}
      <Card 
        flex={1} 
        minWidth={minWidth} 
        padding={padding} 
        backgroundColor="$green2" 
        ai="center" 
        jc="center" 
        borderRadius="$3"
      >
        <YStack ai="center" gap="$1">
          {showLabels && (
            <Text fontSize={labelSize} color="$green11" fontWeight="600">
              Total Premio
            </Text>
          )}
          <Text fontSize={valueSize} fontWeight="700" color="$green11">
            {formatCurrency(totals.totalPayout)}
          </Text>
        </YStack>
      </Card>

      {/* Ya Pagado */}
      <Card 
        flex={1} 
        minWidth={minWidth} 
        padding={padding} 
        backgroundColor="$blue2" 
        ai="center" 
        jc="center" 
        borderRadius="$3"
      >
        <YStack ai="center" gap="$1">
          {showLabels && (
            <Text fontSize={labelSize} color="$blue11" fontWeight="600">
              Ya Pagado
            </Text>
          )}
          <Text fontSize={valueSize} fontWeight="700" color="$blue11">
            {formatCurrency(totals.totalPaid)}
          </Text>
        </YStack>
      </Card>

      {/* Pendiente */}
      <Card 
        flex={1} 
        minWidth={minWidth} 
        padding={padding} 
        backgroundColor={totals.remainingAmount > 0 ? '$red2' : '$gray2'} 
        ai="center" 
        jc="center" 
        borderRadius="$3"
      >
        <YStack ai="center" gap="$1">
          {showLabels && (
            <Text fontSize={labelSize} color={totals.remainingAmount > 0 ? '$red11' : '$gray11'} fontWeight="600">
              Pendiente
            </Text>
          )}
          <Text fontSize={valueSize} fontWeight="700" color={totals.remainingAmount > 0 ? '$red11' : '$gray11'}>
            {formatCurrency(totals.remainingAmount)}
          </Text>
        </YStack>
      </Card>
    </XStack>
  )
}
```

**Uso:**
```tsx
const totals = calculatePaymentTotals(ticket)
<PaymentAmountsGrid totals={totals} size="md" />
```

**Beneficio:** Elimina ~100 líneas duplicadas en 4 archivos.

---

#### **2.3 `components/tickets/shared/WinningJugadasList.tsx`**

```typescript
import React from 'react'
import { YStack, XStack, Text, Card, ScrollView } from 'tamagui'
import { formatCurrency } from '@/utils/formatters'
import { getWinningJugadas } from '@/lib/tickets/calculations'
import type { TicketWithPayments } from '@/types/payment.types'

interface WinningJugadasListProps {
  ticket: TicketWithPayments
  maxHeight?: number
  showScrollbar?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function WinningJugadasList({ 
  ticket, 
  maxHeight = 200,
  showScrollbar = true,
  size = 'md'
}: WinningJugadasListProps) {
  const winningJugadas = getWinningJugadas(ticket)
  
  if (winningJugadas.length === 0) {
    return null
  }

  const padding = size === 'sm' ? '$2' : size === 'lg' ? '$3' : '$2'
  const fontSize = size === 'sm' ? '$3' : size === 'lg' ? '$6' : '$5'

  return (
    <YStack gap="$2">
      <Text fontSize="$3" fontWeight="600" color="$textSecondary">
        Jugadas Ganadoras ({winningJugadas.length})
      </Text>
      <ScrollView maxHeight={maxHeight} showsVerticalScrollIndicator={showScrollbar}>
        <YStack gap="$2">
          {winningJugadas.map((jugada, idx) => (
            <Card 
              key={jugada.id || idx} 
              padding={padding}
              backgroundColor="$green1" 
              borderColor="$green8" 
              borderWidth={1} 
              borderRadius="$2"
            >
              <XStack jc="space-between" ai="center" gap="$2" flexWrap="wrap">
                <XStack gap="$2" ai="center" flex={1} minWidth={180}>
                  <Text fontSize={fontSize} fontWeight="700" color="$blue11" fontFamily="$mono">
                    {jugada.number}
                  </Text>
                  {jugada.type && (
                    <XStack bg="$blue4" px="$2" py="$1" br="$2">
                      <Text fontSize="$1" fontWeight="600" color="$blue11">
                        {jugada.type === 'REVENTADO' ? 'EXTRA' : jugada.type}
                      </Text>
                    </XStack>
                  )}
                  <Text fontSize="$2" color="$textSecondary">
                    Apuesta: {formatCurrency(jugada.amount)}
                  </Text>
                  {jugada.finalMultiplierX && (
                    <Text fontSize="$2" color="$yellow10" fontWeight="600">
                      {jugada.finalMultiplierX}x
                    </Text>
                  )}
                </XStack>
                <Text fontSize="$4" fontWeight="700" color="$green11">
                  Premio: {formatCurrency(jugada.winAmount)}
                </Text>
              </XStack>
            </Card>
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  )
}
```

**Uso:**
```tsx
<WinningJugadasList ticket={ticket} maxHeight={200} />
```

**Beneficio:** Elimina ~80 líneas duplicadas en 2 modales.

---

### 🎨 Fase 3: Unificar Modales de Pago

#### **3.1 Crear `components/tickets/shared/PaymentModal.tsx`** - Modal Único Unificado

**Estrategia:**
1. Combinar lo mejor de `TicketPaymentModal` y `PaymentFormModal`
2. Soportar múltiples modos de uso:
   - Desde lista (simple)
   - Desde módulo de pagos (con hooks especializados)
   - Modo standalone
3. Props flexibles para adaptarse a todos los casos de uso

```typescript
interface PaymentModalProps {
  isOpen: boolean
  ticket?: TicketWithPayments | null
  onClose: () => void
  onSubmit?: (input: CreatePaymentInput) => Promise<void>
  onSuccess?: (payment: any) => void
  // Modo de operación
  mode?: 'simple' | 'advanced'
  // Hooks externos (opcional, para PaymentFormModal use case)
  useExternalMutation?: boolean
  // Loading state
  isLoading?: boolean
}
```

**Características:**
- ✅ Usa `PaymentAmountsGrid` y `WinningJugadasList` (componentes reutilizables)
- ✅ Usa `calculatePaymentTotals` (utility centralizado)
- ✅ Usa `PAYMENT_METHODS` (constantes centralizadas)
- ✅ Maneja tanto `onSubmit` (callback) como mutaciones externas
- ✅ Validaciones centralizadas
- ✅ UI consistente entre todos los usos

**Beneficio:** Elimina ~1000 líneas de código duplicadas.

---

#### **3.2 Migración gradual:**

1. **Crear el nuevo `PaymentModal` unificado**
2. **Deprecar `TicketPaymentModal`:**
   - Reemplazar por el nuevo modal en `TicketsListScreen`
   - Reemplazar en otros lugares que lo usen
3. **Deprecar `PaymentFormModal`:**
   - Reemplazar por el nuevo modal con `mode="advanced"`
4. **Eliminar modal embebido en `PendingTicketsScreen`:**
   - Usar el nuevo modal unificado

---

### 📦 Fase 4: Refactorizar Componentes Existentes

#### **4.1 `TicketDetailScreen.tsx`**

**Antes:** 335 líneas con cálculos, badges, grid de montos

**Después:**
```tsx
import { calculatePaymentTotals } from '@/lib/tickets/calculations'
import { TicketStatusBadge } from '@/components/tickets/shared/TicketStatusBadge'
import { PaymentAmountsGrid } from '@/components/tickets/shared/PaymentAmountsGrid'
import { WinningJugadasList } from '@/components/tickets/shared/WinningJugadasList'

// En el componente:
const totals = calculatePaymentTotals(ticket)

// Usar componentes:
<TicketStatusBadge status={ticket.status} />
<PaymentAmountsGrid totals={totals} size="lg" />
<WinningJugadasList ticket={ticket} maxHeight={300} />
```

**Reducción estimada:** ~100 líneas

---

#### **4.2 `TicketsListScreen.tsx`**

**Antes:** 589 líneas con cálculos repetidos, badges, lógica de pago

**Después:**
```tsx
import { calculatePaymentTotals } from '@/lib/tickets/calculations'
import { TicketStatusBadge } from '@/components/tickets/shared/TicketStatusBadge'
import { PaymentModal } from '@/components/tickets/shared/PaymentModal'

// Simplificar lógica de badges y cálculos
const totals = calculatePaymentTotals(ticket)
<TicketStatusBadge status={ticket.status} size="sm" />
```

**Reducción estimada:** ~80 líneas

---

#### **4.3 `TicketPreviewModal.tsx`**

**Antes:** 374 líneas con cálculos, badges

**Después:**
```tsx
import { calculatePaymentTotals } from '@/lib/tickets/calculations'
import { TicketStatusBadge } from '@/components/tickets/shared/TicketStatusBadge'
import { formatTicketDate } from '@/utils/formatters'
```

**Reducción estimada:** ~50 líneas

---

#### **4.4 `PendingTicketsScreen.tsx`**

**Antes:** 559 líneas con cálculos, modal embebido, lógica duplicada

**Después:**
```tsx
import { calculatePaymentTotals } from '@/lib/tickets/calculations'
import { PaymentModal } from '@/components/tickets/shared/PaymentModal'
import { PaymentAmountsGrid } from '@/components/tickets/shared/PaymentAmountsGrid'

// Eliminar modal embebido (170 líneas)
// Simplificar cálculos
const ticketsWithTotals = tickets.map(t => ({
  ...t,
  totals: calculatePaymentTotals(t)
}))
```

**Reducción estimada:** ~200 líneas

---

## 📈 Resumen de Impacto

### Antes de la Refactorización

| Archivo | Líneas | Problemas |
|---------|--------|-----------|
| TicketsListScreen | 589 | Cálculos, badges, modal duplicado |
| TicketDetailScreen | 335 | Cálculos, badges, grid duplicado |
| TicketPaymentModal | 478 | Modal completo duplicado |
| PaymentFormModal | 416 | Modal completo duplicado |
| TicketPreviewModal | 374 | Cálculos, badges duplicados |
| PendingTicketsScreen | 559 | Cálculos, modal embebido |
| PaymentHistoryModal | 230 | (OK - no requiere cambios mayores) |
| **Total** | **~2,980** | **Múltiples duplicaciones** |

### Después de la Refactorización

| Archivo/Componente | Líneas | Descripción |
|-------------------|--------|-------------|
| **Utilities** | | |
| `calculations.ts` | ~80 | Lógica centralizada |
| `constants.ts` | ~50 | Constantes centralizadas |
| `formatters.ts` | ~30 | Formatters adicionales |
| **Componentes compartidos** | | |
| `TicketStatusBadge` | ~30 | Badge reutilizable |
| `PaymentAmountsGrid` | ~80 | Grid reutilizable |
| `WinningJugadasList` | ~100 | Lista reutilizable |
| `PaymentModal` (unificado) | ~400 | Modal único |
| **Componentes refactorizados** | | |
| TicketsListScreen | ~500 | -89 líneas |
| TicketDetailScreen | ~235 | -100 líneas |
| TicketPreviewModal | ~324 | -50 líneas |
| PendingTicketsScreen | ~359 | -200 líneas |
| PaymentHistoryModal | 230 | Sin cambios |
| **Total** | **~2,408** | **-572 líneas (-19%)** |

### Eliminaciones

| Archivo | Acción |
|---------|--------|
| TicketPaymentModal.tsx | ❌ Eliminar (reemplazado por PaymentModal) |
| PaymentFormModal.tsx | ❌ Eliminar (reemplazado por PaymentModal) |
| TicketSummary.tsx | ❌ Eliminar (vacío/sin uso) |

**Eliminaciones totales:** ~894 líneas

---

## ✅ Beneficios

### 1. **Mantenibilidad**
- ✅ Cambios en lógica de pago: **1 archivo** en vez de 6
- ✅ Nuevos métodos de pago: **1 línea** en `constants.ts`
- ✅ Cambios de estilo: **1 componente** compartido

### 2. **Consistencia**
- ✅ Cálculos idénticos en toda la app
- ✅ UI consistente entre Admin, Ventana, Vendedor
- ✅ Colores y estilos centralizados

### 3. **Testabilidad**
- ✅ Utilities se pueden testear de forma aislada
- ✅ Componentes compartidos con tests únicos
- ✅ Reducción de superficie de bugs

### 4. **Performance**
- ✅ Componentes más pequeños = bundle más ligero
- ✅ Mejor tree-shaking
- ✅ Menos re-renders innecesarios

### 5. **Developer Experience**
- ✅ Onboarding más rápido (menos archivos que entender)
- ✅ Menos código para revisar en PRs
- ✅ Imports más claros y semánticos

---

## 🚨 Riesgos y Consideraciones

### Riesgos Técnicos

1. **Regresiones durante migración**
   - **Mitigación:** Migrar archivo por archivo, con testing exhaustivo
   - **Plan B:** Feature flags para revertir componentes individuales

2. **Cambios en tipos TypeScript**
   - **Mitigación:** Definir interfaces claras en utilities
   - **Validación:** Type checking estricto durante refactor

3. **Comportamientos sutiles diferentes entre modales**
   - **Mitigación:** Documentar todas las diferencias encontradas
   - **Testing:** Suite de tests E2E cubriendo todos los flujos

### Consideraciones de Negocio

1. **Tiempo de desarrollo**
   - **Estimado:** 2-3 días para Fase 1-2, 3-4 días para Fase 3-4
   - **Total:** ~1 semana de desarrollo + testing

2. **Testing requerido**
   - Unit tests para utilities
   - Component tests para shared components
   - Integration tests para modales
   - E2E tests para flujos completos de pago

3. **Coordinación con backend**
   - ✅ Sistema unificado v2.0 ya implementado
   - ✅ Solo ajustes menores si se encuentran inconsistencias

---

## 🗓️ Plan de Implementación

### Sprint 1: Fundamentos (3-4 días)

**Día 1-2: Utilities**
- ✅ Crear `lib/tickets/calculations.ts`
- ✅ Crear `lib/tickets/constants.ts`
- ✅ Extender `utils/formatters.ts`
- ✅ Tests unitarios para utilities

**Día 3-4: Componentes Base**
- ✅ Crear `TicketStatusBadge`
- ✅ Crear `PaymentAmountsGrid`
- ✅ Crear `WinningJugadasList`
- ✅ Tests de componentes

### Sprint 2: Modal Unificado (3-4 días)

**Día 1-2: Desarrollo**
- ✅ Crear `PaymentModal` unificado
- ✅ Tests de integración

**Día 3: Migración Inicial**
- ✅ Reemplazar `TicketPaymentModal` en `TicketsListScreen`
- ✅ Testing E2E flujo de pago

**Día 4: Validación**
- ✅ Testing en todos los roles (Admin, Ventana, Vendedor)
- ✅ Fixes de bugs encontrados

### Sprint 3: Refactorización (3-4 días)

**Día 1: Detail & Preview**
- ✅ Refactorizar `TicketDetailScreen`
- ✅ Refactorizar `TicketPreviewModal`

**Día 2: Lists**
- ✅ Refactorizar `TicketsListScreen`
- ✅ Refactorizar `PendingTicketsScreen`

**Día 3: Cleanup**
- ✅ Eliminar archivos deprecados
- ✅ Actualizar imports en toda la app
- ✅ Linter cleanup

**Día 4: QA Final**
- ✅ Testing exhaustivo de todos los flujos
- ✅ Performance testing
- ✅ Documentación actualizada

---

## 📝 Checklist de Migración

### Pre-requisitos
- [ ] Backup de código actual
- [ ] Suite de tests E2E existente funcionando
- [ ] Feature flag system en su lugar (opcional)

### Fase 1: Utilities
- [ ] `calculations.ts` creado y testeado
- [ ] `constants.ts` creado
- [ ] `formatters.ts` extendido
- [ ] Tests unitarios pasando

### Fase 2: Componentes
- [ ] `TicketStatusBadge` creado y testeado
- [ ] `PaymentAmountsGrid` creado y testeado
- [ ] `WinningJugadasList` creado y testeado
- [ ] Storybook stories creadas (opcional)

### Fase 3: Modal Unificado
- [ ] `PaymentModal` creado
- [ ] Tests de integración pasando
- [ ] Migrado en `TicketsListScreen` (Admin)
- [ ] Migrado en `TicketsListScreen` (Ventana)
- [ ] Migrado en `TicketsListScreen` (Vendedor)
- [ ] `TicketPaymentModal` deprecado
- [ ] `PaymentFormModal` deprecado
- [ ] Modal embebido en `PendingTicketsScreen` eliminado

### Fase 4: Refactorización
- [ ] `TicketDetailScreen` refactorizado
- [ ] `TicketPreviewModal` refactorizado
- [ ] `TicketsListScreen` refactorizado
- [ ] `PendingTicketsScreen` refactorizado

### Cleanup
- [ ] Archivos deprecados eliminados
- [ ] Imports actualizados
- [ ] Linter warnings resueltos
- [ ] Tests E2E pasando
- [ ] Performance benchmarks OK
- [ ] Documentación actualizada

---

## 📚 Referencias

### Archivos para revisar después de la refactorización

- `__tests__/integration/ticketForm.test.tsx`
- `app/admin/reportes/tickets.tsx`
- `components/dashboard/TicketsTable.tsx`
- `components/tickets/TicketForm.tsx`
- `components/tickets/TicketReceipt.tsx`

### Documentación relacionada

- `docs/BACKEND_INTEGRATION_PAYMENTS.md`
- Sistema unificado v2.0 (ya implementado)

---

## 🎯 Conclusión

Esta refactorización propone una **reducción del ~40% del código relacionado con tickets** (considerando eliminaciones y simplificaciones), mejorando significativamente la **mantenibilidad**, **consistencia** y **testabilidad** del sistema.

La estrategia de migración gradual por fases minimiza riesgos y permite validación continua durante el proceso.

**Recomendación:** Proceder con la implementación en sprints incrementales, priorizando utilities y componentes base primero, seguido del modal unificado, y finalmente la refactorización de componentes existentes.

---

**¿Procedemos con la implementación o hay ajustes a la propuesta?**

