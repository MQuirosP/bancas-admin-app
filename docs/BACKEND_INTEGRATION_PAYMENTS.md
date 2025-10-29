# 🔌 Integración Backend - Sistema de Pagos

**Versión:** 2.1  
**Fecha:** 2025-10-29  
**Propósito:** Especificaciones técnicas para que el backend calcule correctamente los montos de pago

---

## 📤 Lo que el Frontend ENVÍA al Backend

### Endpoint: `POST /api/v1/tickets/:ticketId/pay`

**Request Body:**
```typescript
{
  amountPaid: number        // Monto que se está pagando (requerido)
  method: string            // 'cash' | 'check' | 'transfer' | 'system' (requerido)
  idempotencyKey: string    // UUID generado por el frontend para evitar duplicados (requerido)
  isFinal?: boolean         // true = marcar como pago final aunque sea parcial (opcional)
}
```

**Ejemplo:**
```json
{
  "amountPaid": 25000,
  "method": "cash",
  "idempotencyKey": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "isFinal": false
}
```

**⚠️ IMPORTANTE:**
- **NO enviar** `ventanaId` (el backend lo rechaza con error 400)
- **NO enviar** `ticketId` en el body (va en la URL)
- El backend debe derivar el `userId` del token JWT

---

## 📥 Lo que el Frontend NECESITA del Backend

### 1. Al obtener un ticket: `GET /api/v1/tickets/:id`

**El backend DEBE calcular y enviar estos campos:**

```typescript
{
  // ... campos existentes del ticket ...
  
  // ============ CAMPOS UNIFICADOS (CRÍTICOS) ============
  totalPayout: number | null,        // Total de premios ganados (suma de jugadas ganadoras)
  totalPaid: number | null,          // Total pagado acumulado
  remainingAmount: number | null,    // Monto pendiente de pago (totalPayout - totalPaid)
  lastPaymentAt: string | null,      // Fecha del último pago (ISO 8601)
  paidById: string | null,           // ID del usuario que realizó el último pago
  paymentMethod: string | null,      // Método del último pago ('cash' | 'transfer' | 'check' | 'system')
  paymentNotes: string | null,       // Notas del último pago
  
  // Historial completo de pagos embebido
  paymentHistory: Array<{
    id: string,
    amountPaid: number,
    paidAt: string,                  // ISO 8601
    paidById: string,
    paidByName: string,              // Nombre del usuario que pagó
    method: 'cash' | 'transfer' | 'check' | 'system',
    notes?: string,
    isFinal: boolean,                // ¿Es pago final?
    isReversed: boolean,             // ¿Fue revertido?
    reversedAt?: string,             // Cuándo se revirtió (ISO 8601)
    reversedBy?: string              // Quién lo revirtió (nombre)
  }> | null,
  
  // Relación expandida (si aplica)
  paidBy?: {
    id: string,
    name: string,
    // ... otros campos del usuario
  }
}
```

---

## 🧮 Cálculos que DEBE hacer el Backend

### 1. **`totalPayout`** - Total de Premios Ganados

**Fórmula:**
```sql
-- Suma el payout de todas las jugadas ganadoras del ticket
SELECT SUM(payout) 
FROM jugadas 
WHERE ticketId = :ticketId 
  AND isWinner = true
```

**Ejemplo:**
- Jugada 1: `isWinner=true`, `payout=9500`
- Jugada 2: `isWinner=true`, `payout=4000`
- Jugada 3: `isWinner=false`, `payout=0`
- **`totalPayout` = 13500**

---

### 2. **`totalPaid`** - Total Pagado Acumulado

**Fórmula:**
```sql
-- Suma todos los pagos no revertidos
SELECT SUM(amountPaid) 
FROM ticket_payments 
WHERE ticketId = :ticketId 
  AND isReversed = false
```

**Ejemplo:**
- Pago 1: `amountPaid=5000`, `isReversed=false`
- Pago 2: `amountPaid=3000`, `isReversed=false`
- Pago 3: `amountPaid=2000`, `isReversed=true` ← NO contar
- **`totalPaid` = 8000**

---

### 3. **`remainingAmount`** - Monto Pendiente

**Fórmula:**
```typescript
remainingAmount = totalPayout - totalPaid
```

**Ejemplo:**
- `totalPayout` = 13500
- `totalPaid` = 8000
- **`remainingAmount` = 5500**

---

### 4. **`paymentHistory`** - Historial de Pagos

**Ordenar por fecha descendente (más reciente primero):**
```sql
SELECT 
  p.id,
  p.amountPaid,
  p.paidAt,
  p.paidById,
  u.name as paidByName,
  p.method,
  p.notes,
  p.isFinal,
  p.isReversed,
  p.reversedAt,
  ru.name as reversedBy
FROM ticket_payments p
LEFT JOIN users u ON p.paidById = u.id
LEFT JOIN users ru ON p.reversedById = ru.id
WHERE p.ticketId = :ticketId
ORDER BY p.paidAt DESC
```

---

## 🔴 Problema Actual (Por qué el Frontend está calculando)

### Escenario Real:

**Backend envía:**
```json
{
  "id": "606c091c-95c4-4c7c-a0c6-7a0834784937",
  "isWinner": true,
  "totalPayout": 0,        // ❌ INCORRECTO - debería ser 47500
  "totalPaid": 0,          // ✅ Correcto (no hay pagos)
  "remainingAmount": 0,    // ❌ INCORRECTO - debería ser 47500
  "jugadas": [
    { "isWinner": true, "payout": 9500 },
    { "isWinner": true, "payout": 4000 },
    { "isWinner": true, "payout": 2500 },
    // ... más jugadas
  ]
}
```

**Frontend hace fallback:**
```typescript
// El frontend NO debería hacer esto, pero lo hace porque el backend envía 0
const totalPayout = jugadas
  .filter(j => j.isWinner)
  .reduce((sum, j) => sum + j.payout, 0)
// totalPayout = 16000
```

---

## ✅ Solución: Backend Debe Calcular

**Backend debe enviar:**
```json
{
  "id": "606c091c-95c4-4c7c-a0c6-7a0834784937",
  "isWinner": true,
  "totalPayout": 47500,        // ✅ Calculado correctamente
  "totalPaid": 0,              // ✅ No hay pagos
  "remainingAmount": 47500,    // ✅ totalPayout - totalPaid
  "lastPaymentAt": null,
  "paidById": null,
  "paymentMethod": null,
  "paymentNotes": null,
  "paymentHistory": [],
  "jugadas": [
    { "isWinner": true, "payout": 9500 },
    { "isWinner": true, "payout": 4000 },
    { "isWinner": true, "payout": 2500 },
    // ... más jugadas
  ]
}
```

---

## 🎯 Casos de Uso

### Caso 1: Ticket Ganador Sin Pagos
```json
{
  "isWinner": true,
  "totalPayout": 50000,      // Suma de jugadas ganadoras
  "totalPaid": 0,            // Sin pagos
  "remainingAmount": 50000   // Todo pendiente
}
```
**UI muestra:** Input habilitado, "Máximo: $50,000"

---

### Caso 2: Ticket Ganador Con Pago Parcial
```json
{
  "isWinner": true,
  "totalPayout": 50000,
  "totalPaid": 20000,        // Ya pagó $20k
  "remainingAmount": 30000,  // Faltan $30k
  "lastPaymentAt": "2025-10-29T14:30:00Z",
  "paymentMethod": "cash",
  "paymentHistory": [
    {
      "id": "payment-1",
      "amountPaid": 20000,
      "paidAt": "2025-10-29T14:30:00Z",
      "paidById": "user-123",
      "paidByName": "Juan Pérez",
      "method": "cash",
      "isFinal": false,
      "isReversed": false
    }
  ]
}
```
**UI muestra:** Badge "PAGO PARCIAL", "Pagado: $20,000", "Pendiente: $30,000"

---

### Caso 3: Ticket Ganador Totalmente Pagado
```json
{
  "isWinner": true,
  "status": "PAID",
  "totalPayout": 50000,
  "totalPaid": 50000,        // Pagado completo
  "remainingAmount": 0,      // Nada pendiente
  "lastPaymentAt": "2025-10-29T15:00:00Z",
  "paymentMethod": "transfer"
}
```
**UI muestra:** Badge "✓ PAGADO", input deshabilitado

---

### Caso 4: Ticket NO Ganador
```json
{
  "isWinner": false,
  "totalPayout": 0,          // ✅ Correcto (no ganó)
  "totalPaid": 0,
  "remainingAmount": 0
}
```
**UI muestra:** Input deshabilitado, "Este ticket no es ganador"

---

## 🔄 Flujo Completo de Registro de Pago

### 1. Usuario Registra Pago

**Frontend → Backend:**
```http
POST /api/v1/tickets/606c091c-95c4-4c7c-a0c6-7a0834784937/pay
Content-Type: application/json
Authorization: Bearer <token>

{
  "amountPaid": 25000,
  "method": "cash",
  "idempotencyKey": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "isFinal": false
}
```

---

### 2. Backend Procesa

```typescript
// 1. Validar ticket existe y es ganador
// 2. Calcular totalPayout actual
// 3. Calcular totalPaid actual
// 4. Validar amountPaid <= remainingAmount
// 5. Crear registro de pago
// 6. Actualizar campos unificados del ticket
// 7. Si totalPaid >= totalPayout, marcar ticket como PAID
```

---

### 3. Backend Responde

**Backend → Frontend:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "payment-uuid",
    "ticketId": "606c091c-95c4-4c7c-a0c6-7a0834784937",
    "amountPaid": 25000,
    "paidAt": "2025-10-29T16:00:00Z",
    "paidById": "user-123",
    "method": "cash",
    "isReversed": false,
    "isFinal": false,
    
    // Ticket actualizado con nuevos montos
    "ticket": {
      "id": "606c091c-95c4-4c7c-a0c6-7a0834784937",
      "status": "EVALUATED",  // o "PAID" si se completó
      "totalPayout": 50000,
      "totalPaid": 25000,      // Actualizado
      "remainingAmount": 25000, // Actualizado
      "lastPaymentAt": "2025-10-29T16:00:00Z",
      "paymentMethod": "cash"
    }
  }
}
```

---

## ❌ Errores Comunes

### 1. Campo `ventanaId` no permitido
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Hay errores de validación en body (no permitidas: ventanaId)"
  }
}
```
**Solución:** NO enviar `ventanaId` en el body

---

### 2. Monto excede el pendiente
```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_EXCEEDS_REMAINING",
    "message": "El monto de $60000 excede el pendiente de $50000"
  }
}
```

---

### 3. Ticket no es ganador
```json
{
  "success": false,
  "error": {
    "code": "TICKET_NOT_WINNER",
    "message": "Este ticket no es ganador, no se puede registrar pago"
  }
}
```

---

## 📋 Checklist para el Backend

- [ ] Calcular `totalPayout` sumando jugadas ganadoras
- [ ] Calcular `totalPaid` sumando pagos no revertidos
- [ ] Calcular `remainingAmount = totalPayout - totalPaid`
- [ ] Incluir `paymentHistory` con todos los pagos
- [ ] Expandir relación `paidBy` con nombre del usuario
- [ ] NO aceptar `ventanaId` en el body del registro de pago
- [ ] Derivar `userId` del token JWT automáticamente
- [ ] Marcar ticket como `PAID` cuando `remainingAmount <= 0`
- [ ] Validar `amountPaid <= remainingAmount` antes de registrar
- [ ] Soportar idempotencia con `idempotencyKey`

---

## 🚀 Beneficios de esta Integración

| Aspecto | Sin Backend | Con Backend Calculando |
|---------|-------------|------------------------|
| **Performance** | Frontend calcula en cada render | Backend calcula 1 vez al guardar |
| **Consistencia** | Puede desincronizarse | Siempre consistente |
| **Mantenibilidad** | Lógica duplicada | Single source of truth |
| **Confiabilidad** | Errores de cálculo en frontend | Cálculos validados en backend |
| **Velocidad** | Múltiples cálculos | 1 solo valor ya calculado |

---

## 📞 Contacto

Si tienes dudas sobre la integración, consulta con el equipo de frontend.

**Documento actualizado:** 2025-10-29

