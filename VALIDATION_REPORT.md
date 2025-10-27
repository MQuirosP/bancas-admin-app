# Validación de Implementación Frontend - Módulo de Pagos

**Fecha**: 2025-10-27
**Guía Base**: docs/FRONTEND_INTEGRATION_GUIDE.md
**Status**: ⚠️ PARCIALMENTE COMPLETO - Correcciones Necesarias

---

## 📋 Resumen Ejecutivo

| Aspecto | Estado | Prioridad |
|---------|--------|-----------|
| Endpoints Implementados | ⚠️ 50% | 🔴 CRÍTICA |
| Formato de Fechas | ❌ NO | 🔴 CRÍTICA |
| Error Codes | ❌ NO | 🔴 CRÍTICA |
| Idempotency Key | ✅ SÍ | ✅ OK |
| RBAC Automático | ⚠️ Parcial | 🟡 MEDIA |
| Status PAGADO | ⚠️ Backend Solo | 🟡 MEDIA |
| Timezone CR | ❌ NO | 🔴 CRÍTICA |

---

## 1. ENDPOINTS - Validación

### Requerido por Guía (6 endpoints)

#### ✅ Endpoint 1: Fetch Pending Winning Tickets
```
GET /api/v1/tickets?status=EVALUATED&isWinner=true
```
- **Ubicación Frontend**: [PendingTicketsScreen.tsx:48-56](components/payments/PendingTicketsScreen.tsx#L48-L56)
- **Hook**: `usePendingWinningTicketsQuery()`
- **Status**: ✅ IMPLEMENTADO
- **Validación**:
  - ✅ Filtra por status=EVALUATED
  - ✅ Filtra por isWinner=true
  - ✅ Filtra automático por rol
  - ✅ Calcula totalPayout, totalPaid, remaining
- **Issue**: Response debe incluir jugadas con `payout` field

---

#### ✅ Endpoint 2: Create Payment
```
POST /api/v1/ticket-payments
```
- **Ubicación Frontend**: [PaymentFormModal.tsx:90-105](components/payments/PaymentFormModal.tsx#L90-L105)
- **Hook**: `useCreatePaymentMutation()`
- **Status**: ✅ IMPLEMENTADO
- **Validación**:
  - ✅ Genera idempotencyKey (UUID)
  - ✅ Envia amountPaid, method, notes, isFinal
  - ⚠️ **ISSUE**: No mapea `method` correctamente (debería enviar lowercase: 'cash', 'check', 'transfer', 'system')
  - ⚠️ **ISSUE**: No maneja response con `remainingAmount` correctamente

**Código Actual**:
```typescript
// PaymentFormModal.tsx:90
const input: CreatePaymentInput = {
  ticketId: ticket.id,
  amountPaid: parseFloat(amountPaid),
  method,  // ← Problema: envia CASH pero API espera 'cash' (lowercase)
  notes: notes || undefined,
  idempotencyKey: uuidv4(),
  isFinal,
}
```

**Debe ser**:
```typescript
const input: CreatePaymentInput = {
  ticketId: ticket.id,
  amountPaid: parseFloat(amountPaid),
  method: method.toLowerCase() as PaymentMethod,  // ← lowercase
  notes: notes || undefined,
  idempotencyKey: uuidv4(),
  isFinal,
}
```

---

#### ✅ Endpoint 3: Mark Payment as Final
```
PATCH /api/v1/ticket-payments/{paymentId}
```
- **Status**: ❌ NO IMPLEMENTADO
- **Prioridad**: 🔴 CRÍTICA
- **Necesario para**: Cambiar pago parcial a final después de creado
- **Dónde se usa**: En [PaymentHistoryModal.tsx](components/payments/PaymentHistoryModal.tsx) se necesita botón "Marcar como Final"

**Hook a crear**:
```typescript
export function useUpdatePaymentMutation() {
  return useMutation({
    mutationFn: (data: { paymentId: string; isFinal: boolean; notes?: string }) =>
      apiClient.patch<TicketPayment>(`/ticket-payments/${data.paymentId}`, {
        isFinal: data.isFinal,
        notes: data.notes,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticketPaymentHistory', data.ticketId] })
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all })
    },
  })
}
```

---

#### ✅ Endpoint 4: Get Payment History
```
GET /api/v1/tickets/{ticketId}/payment-history
```
- **Ubicación Frontend**: [PaymentHistoryModal.tsx:17](components/payments/PaymentHistoryModal.tsx#L17)
- **Hook**: `useTicketPaymentHistoryQuery()`
- **Status**: ✅ IMPLEMENTADO
- **Validación**:
  - ✅ Fetch correcto
  - ✅ Maneja respuesta con payments array
  - ⚠️ **ISSUE**: No mapea `paidAt` a fechas formateadas (debe ser YYYY-MM-DD)

---

#### ✅ Endpoint 5: Reverse Payment
```
POST /api/v1/ticket-payments/{paymentId}/reverse
```
- **Ubicación Frontend**: [PaymentHistoryModal.tsx:35-42](components/payments/PaymentHistoryModal.tsx#L35-L42)
- **Hook**: `useReversePaymentMutation()`
- **Status**: ✅ IMPLEMENTADO
- **Validación**: ✅ Correcto

---

#### ⚠️ Endpoint 6: List Payments with Filters
```
GET /api/v1/ticket-payments?page=1&pageSize=20&status=pending...
```
- **Status**: ⚠️ PARCIALMENTE IMPLEMENTADO
- **Ubicación**: [usePaymentListQuery()](hooks/useTicketPayments.ts)
- **Implementación Actual**: Muy básica, no soporta filtros
- **Falta**:
  - Filtro por `status` (pending, completed, reversed, partial)
  - Filtro por `fromDate` y `toDate` (YYYY-MM-DD)
  - Filtro por `sortBy` y `sortOrder`
  - Query parameter builder correcto

**Hook Mejorado necesario**:
```typescript
export function usePaymentListQuery(params?: {
  page?: number
  pageSize?: number
  ticketId?: string
  ventanaId?: string
  vendedorId?: string
  status?: 'pending' | 'completed' | 'reversed' | 'partial'
  fromDate?: string  // YYYY-MM-DD
  toDate?: string    // YYYY-MM-DD
  sortBy?: 'createdAt' | 'amountPaid' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}) {
  return useQuery({
    queryKey: ['paymentList', params],
    queryFn: async () => {
      const queryString = apiClient.buildQueryString({
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        ...(params?.ticketId && { ticketId: params.ticketId }),
        ...(params?.ventanaId && { ventanaId: params.ventanaId }),
        ...(params?.vendedorId && { vendedorId: params.vendedorId }),
        ...(params?.status && { status: params.status }),
        ...(params?.fromDate && { fromDate: params.fromDate }),
        ...(params?.toDate && { toDate: params.toDate }),
        ...(params?.sortBy && { sortBy: params.sortBy }),
        ...(params?.sortOrder && { sortOrder: params.sortOrder }),
      })
      return apiClient.get<PaymentListResponse>(`/ticket-payments${queryString}`)
    },
  })
}
```

---

## 2. FORMATO DE FECHAS - Validación

### Problema Crítico: ISO DateTime vs YYYY-MM-DD

**Guía Especifica**:
- API espera y devuelve: ISO 8601 (2025-10-27T14:30:00Z)
- Frontend debe mostrar: YYYY-MM-DD
- Frontend debe enviar fechas: YYYY-MM-DD (en filtros)
- **Timezone**: America/Costa_Rica (UTC-6)

**Problemas en Código Actual**:

#### PaymentFormModal.tsx (línea ~150)
```typescript
// ACTUAL - Usando ISO y locale default
<Text>{date.toLocaleDateString()}</Text>

// DEBE SER
<Text>{formatDateYYYYMMDD(date)}</Text>
```

#### PaymentHistoryModal.tsx (línea ~150)
```typescript
// ACTUAL
<Text fontSize="$2" color="$gray10">
  {date.toLocaleDateString()} {date.toLocaleTimeString()}
</Text>

// DEBE SER
<Text fontSize="$2" color="$gray10">
  {formatDateYYYYMMDD(date)} {formatTimeHHMM(date)}
</Text>
```

#### PaymentConfirmationModal.tsx (línea ~110)
```typescript
// ACTUAL
{date.toLocaleDateString()} {date.toLocaleTimeString()}

// DEBE SER
{formatDateYYYYMMDD(date)} {formatTimeHHMM(date)}
```

**Función de Utilidad Necesaria**:
```typescript
// lib/dateFormat.ts (crear)
export const CR_TIMEZONE = 'America/Costa_Rica'

export function formatDateYYYYMMDD(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-CR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: CR_TIMEZONE,
  }).split('/').reverse().join('-')  // Convierte DD/MM/YYYY → YYYY-MM-DD
}

export function formatTimeHHMM(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('es-CR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: CR_TIMEZONE,
  })
}

export function parseDateYYYYMMDD(dateStr: string): Date {
  // "2025-10-27" → Date
  const [year, month, day] = dateStr.split('-')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}
```

---

## 3. ERROR CODES - Validación

### Problema Crítico: Sin implementación de error codes

**Guía Especifica Error Codes**:
```
TKT_PAY_001 - 404 - Ticket not found
TKT_PAY_002 - 409 - Not a winner
TKT_PAY_003 - 409 - Not yet evaluated
TKT_PAY_004 - 400 - Amount exceeds payout
TKT_PAY_005 - 409 - Payment already exists
TKT_PAY_006 - 403 - Unauthorized
TKT_PAY_007 - 409 - Idempotency conflict
```

**Implementación Actual** (PaymentFormModal.tsx:~70):
```typescript
// ACTUAL - Sin error codes
const errors = useMemo(() => {
  const errs: string[] = []
  const amount = parseFloat(amountPaid) || 0

  if (!amountPaid) {
    errs.push('Ingresa el monto')  // ← Sin código
  } else if (amount <= 0) {
    errs.push('El monto debe ser mayor a 0')  // ← Sin código
  }
  // ...
}, [amountPaid, method, totals.remaining])
```

**Debe ser**:
```typescript
// types/error.types.ts (crear)
export const ERROR_CODES = {
  TKT_PAY_001: 'Tiquete no encontrado',
  TKT_PAY_002: 'El tiquete no es ganador',
  TKT_PAY_003: 'El tiquete aún no ha sido evaluado',
  TKT_PAY_004: 'El monto excede el premio',
  TKT_PAY_005: 'El tiquete ya tiene un pago registrado',
  TKT_PAY_006: 'No autorizado para esta operación',
  TKT_PAY_007: 'Clave de idempotencia duplicada',
} as const

export type ErrorCode = keyof typeof ERROR_CODES

// En PaymentFormModal.tsx
const handleError = (error: any) => {
  const errorCode = error.response?.data?.error || 'UNKNOWN'
  const errorMessage = ERROR_CODES[errorCode as ErrorCode] || error.message

  // Mostrar: "TKT_PAY_004: El monto excede el premio"
  toast.error(`${errorCode}: ${errorMessage}`)
}
```

---

## 4. IDEMPOTENCY KEY - Validación

### ✅ CORRECTO

**Ubicación**: [PaymentFormModal.tsx:90](components/payments/PaymentFormModal.tsx#L90)
```typescript
idempotencyKey: uuidv4()  // ✅ Correcto
```

**Validación**:
- ✅ Se genera único por pago
- ✅ Usa uuid v4
- ✅ Se envía en POST /ticket-payments
- ✅ Previene duplicados en retries

---

## 5. RBAC - Validación

### ⚠️ PARCIALMENTE IMPLEMENTADO

**Guía Especifica**:
- VENDEDOR: ❌ Forbidden (no puede pagar)
- VENTANA: ✅ Puede pagar su ventana
- ADMIN: ✅ Puede pagar todos

**Implementación Actual** [PendingTicketsScreen.tsx:48-56]:
```typescript
const params = useMemo(() => {
  if (user?.role === Role.VENDEDOR) {
    return { vendedorId: user.id }  // ← INCORRECTO: Debería retornar error
  }
  if (user?.role === Role.VENTANA) {
    return { ventanaId: user.ventanaId }
  }
  return {}
}, [user?.role, user?.id, user?.ventanaId])
```

**Problema**: VENDEDOR puede acceder a la pantalla pero no debería.

**Debe ser**:
```typescript
// En app/pagos/index.tsx - VALIDAR AL INICIO
if (!user || ![Role.VENTANA, Role.ADMIN].includes(user.role as any)) {
  return (
    <YStack flex={1} ai="center" jc="center">
      <Text>No tienes permiso para acceder a pagos</Text>
    </YStack>
  )
}
```

**Validación RBAC Correcta**:

| Rol | Puede Ver | Puede Pagar |
|-----|-----------|------------|
| ADMIN | ✅ Todos | ✅ Todos |
| VENTANA | ✅ Su ventana | ✅ Su ventana |
| VENDEDOR | ❌ Acceso Denegado | ❌ Acceso Denegado |
| BANCA | ❌ Acceso Denegado | ❌ Acceso Denegado |

---

## 6. STATUS PAGADO - Validación

### ⚠️ AUTOMÁTICO EN BACKEND

**Guía Especifica**:
- Cuando se registra pago completo (`amountPaid == totalPayout`): Status → PAGADO
- Cuando se marca pago parcial como final (`isFinal=true`): Status → PAGADO
- Frontend NO debe actualizar status manualmente

**Implementación Actual**:
- ✅ Correctamente se confía en backend
- ✅ Se refrescan queries después de pago
- ⚠️ Frontend solo muestra `remaining` si `> 0`

**Validación**:
```typescript
// En PendingTicketsScreen.tsx (línea ~200)
const isPaid = ticket.remaining <= 0

// Mostrar estado:
{isPaid ? 'PAGADO' : 'PENDIENTE'}
```

✅ Correcto.

---

## 7. DASHBOARD - Validación

### ❌ NO IMPLEMENTADO

**4 Endpoints Requeridos**:

1. **GET /api/v1/admin/dashboard**
   - Status: ❌ NO IMPLEMENTADO
   - Retorna: Ganancia, CxC, CxP, Summary
   - Filtros: timeframe, ventanaId (ADMIN only), scope

2. **GET /api/v1/admin/dashboard/ganancia**
   - Status: ❌ NO IMPLEMENTADO
   - Detalle de ganancias by ventana, by lotería

3. **GET /api/v1/admin/dashboard/cxc**
   - Status: ❌ NO IMPLEMENTADO
   - Desglose de Cuentas por Cobrar

4. **GET /api/v1/admin/dashboard/cxp**
   - Status: ❌ NO IMPLEMENTADO
   - Desglose de Cuentas por Pagar

**RBAC Dashboard**:
- ADMIN: ✅ Global + filtro ventanaId
- VENTANA: ✅ Solo su ventana (auto-set)
- VENDEDOR/BANCA: ❌ Forbidden

**Necesario Crear**:
- `hooks/useDashboard.ts` - 4 hooks para dashboard
- `components/dashboard/DashboardScreen.tsx` - Vista principal
- `components/dashboard/DashboardMetrics.tsx` - Cards de métricas
- `app/dashboard/index.tsx` - Ruta

---

## 📊 Resumen de Issues

### 🔴 CRÍTICOS (Bloquean uso)

| # | Issue | Ubicación | Solución |
|---|-------|-----------|----------|
| 1 | Payment method debe ser lowercase | PaymentFormModal:90 | `.toLowerCase()` |
| 2 | Sin soporte YYYY-MM-DD (fechas) | Múltiples | Crear `lib/dateFormat.ts` |
| 3 | Sin implementación error codes | PaymentFormModal:~70 | Crear `types/error.types.ts` |
| 4 | PATCH endpoint no implementado | useTicketPayments.ts | Agregar `useUpdatePaymentMutation()` |
| 5 | VENDEDOR puede acceder a pagos | app/pagos/index.tsx | Validar RBAC al inicio |

### 🟡 MEDIA (Incompletos)

| # | Issue | Ubicación | Solución |
|---|-------|-----------|----------|
| 1 | List Payments filtros incompletos | usePaymentListQuery | Agregar todos los parámetros |
| 2 | Dashboard no implementado | - | Crear módulo completo |
| 3 | Timezone CR no aplicado | Múltiples | Usar `CR_TIMEZONE` en formatos |

### ✅ OK

- Idempotency key generation
- Create Payment endpoint
- Payment History endpoint
- Reverse Payment endpoint
- Basic RBAC filtering

---

## 🔧 Acción Recomendada

### Fase 1: Críticos (esta sesión)
1. ✅ Crear `lib/dateFormat.ts` con formatters
2. ✅ Crear `types/error.types.ts` con ERROR_CODES
3. ✅ Actualizar PaymentFormModal (method lowercase)
4. ✅ Agregar `useUpdatePaymentMutation()` hook
5. ✅ Validar RBAC en app/pagos/index.tsx

### Fase 2: Media (siguiente sesión)
1. Mejorar `usePaymentListQuery()` con todos los filtros
2. Actualizar todas las vistas para usar dateFormat.ts
3. Implementar error handling con códigos
4. Agregar validación de timezone en filtros

### Fase 3: Dashboard (sesión posterior)
1. Implementar 4 hooks de dashboard
2. Crear vistas y componentes dashboard
3. Agregar filtros y timeframes
4. Integrar con datos reales

---

## 📝 Testing Checklist

- [ ] Payment form envia `method` en lowercase
- [ ] Fechas muestran YYYY-MM-DD
- [ ] Error codes se muestran al usuario
- [ ] VENDEDOR no puede acceder a /pagos
- [ ] VENTANA solo ve su ventana
- [ ] ADMIN ve todos
- [ ] Partial payment muestra remaining correcto
- [ ] Reversión actualiza historial
- [ ] Timezone CR se aplica en todas las fechas

---

**Fecha de Revisión**: 2025-10-27
**Próxima Validación**: Después de implementar Fase 1
