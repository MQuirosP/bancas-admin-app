# Jerarquía de Multiplicadores - Documentación

## Resumen Ejecutivo

El sistema de multiplicadores permite asignar diferentes tasas de pago según múltiples niveles de configuración. El **backend resuelve automáticamente la jerarquía** durante la creación del ticket, por lo que el **frontend solo necesita enviar los datos básicos** y consumir el `finalMultiplierX` del ticket creado.

---

## Jerarquía Correcta (Orden de Resolución)

El multiplicador se resuelve en el siguiente orden de prioridad:

1. **UserMultiplierOverride[scope=USER].baseMultiplierX** ← Multiplicador específico por vendedor
2. **MultiplierOverride[scope=VENTANA].baseMultiplierX** ← Multiplicador específico por ventana
3. **BancaLoteriaSetting.baseMultiplierX** ← Configuración por banca + lotería
4. **LoteriaMultiplier[name="Base"]** ← Multiplicador con nombre exacto "Base"
5. **LoteriaMultiplier[kind=NUMERO]** (primero creado) ← Primer multiplicador del tipo
6. **Loteria.rulesJson.baseMultiplierX** ← Configuración en reglas de lotería
7. **Fallback: 90** ← Valor por defecto del sistema

**Nota**: Se buscan en orden. La **primera opción que existe se utiliza** y se ignoran las demás.

---

## Opciones de Configuración

### Opción A: Override a Nivel de Usuario (Highest Priority)

**Caso de uso**: Vendedor VIP con multiplicador especial

```bash
POST /api/v1/multiplier-overrides
{
  "scope": "USER",
  "scopeId": "uuid-vendedor",           # UUID del vendedor específico
  "loteriaId": "uuid-loteria",
  "multiplierType": "NUMERO",           # o "REVENTADO"
  "baseMultiplierX": 95.0               # Multiplicador para este vendedor
}
```

**Resultado**:
- Cuando este vendedor crea un ticket en esta lotería → usa multiplicador **95**
- Ignora BancaLoteriaSetting, LoteriaMultiplier, etc.

---

### Opción B: Override a Nivel de Ventana (NEW - Second Priority)

**Caso de uso**: Toda una ventana tiene multiplicador especial

```bash
POST /api/v1/multiplier-overrides
{
  "scope": "VENTANA",
  "scopeId": "uuid-ventana",            # UUID de la ventana
  "loteriaId": "uuid-loteria",
  "multiplierType": "NUMERO",
  "baseMultiplierX": 92.0               # Multiplicador para toda la ventana
}
```

**Resultado**:
- Cualquier vendedor de esta ventana → usa multiplicador **92**
- Si el vendedor tiene USER override → ignora VENTANA override
- Si el vendedor NO tiene USER override → usa VENTANA override

---

### Opción C: Configuración por Banca-Lotería

**Caso de uso**: Valor por defecto para toda la banca en esa lotería

```bash
PUT /api/v1/bancas/:bancaId/loteria-settings
{
  "loteriaId": "uuid-loteria",
  "baseMultiplierX": 90.0               # Para esta banca + lotería
}
```

**Resultado**:
- Si NO hay overrides USER/VENTANA → usa este valor **90**
- Si HAY overrides → se ignora

---

### Opción D: Multiplicador en Lotería (LoteriaMultiplier)

**Caso de uso**: Multiplicador global de la lotería

**Opción D1 - Multiplicador con nombre "Base":**
```bash
POST /api/v1/multipliers
{
  "loteriaId": "uuid-loteria",
  "name": "Base",                       # EXACTAMENTE "Base"
  "valueX": 88.0,
  "kind": "NUMERO",
  "isActive": true
}
```

**Opción D2 - Primer multiplicador del tipo creado:**
```bash
POST /api/v1/multipliers
{
  "loteriaId": "uuid-loteria",
  "name": "Multiplicador Estándar",
  "valueX": 88.0,
  "kind": "NUMERO",
  "isActive": true
}
```

**Resultado**:
- Si no hay overrides ni BancaLoteriaSetting → busca:
  1. Primero: multiplicador con `name="Base"` exacto
  2. Si no existe: primer `kind=NUMERO` creado
  3. Si existe: usa ese valor **88**

---

### Opción E: Reglas de Lotería (Fallback)

**Caso de uso**: Valor por defecto configurado en la lotería

```bash
PUT /api/v1/loterias/:id
{
  "rulesJson": {
    "baseMultiplierX": 87.0,            # En rulesJson
    "minBetAmount": 100,
    "maxBetAmount": 10000,
    ...
  }
}
```

**Resultado**:
- Si nada más está definido → usa este valor **87**
- Si existe cualquier opción anterior → se ignora

---

## Flujo Completo de Resolución (Visión Frontend)

### Escenario: Un vendedor crea un ticket

**Entrada Frontend**:
```javascript
POST /api/v1/tickets {
  loteriaId: "uuid-nacional",
  sorteoId: "uuid-sorteo-hoy",
  jugadas: [{ type: 'NUMERO', number: '42', amount: 100 }],
  vendedorId: "uuid-juan"
}
```

**Proceso Backend** (automático):
```
1️⃣ Busca USER override para (juan, nacional)
   → Si existe: ¡USA ESTE! (95.0)
   → Si NO existe: continúa

2️⃣ Busca VENTANA override para (ventana-de-juan, nacional)
   → Si existe: USA ESTE (92.0)
   → Si NO existe: continúa

3️⃣ Busca BancaLoteriaSetting para (banca, nacional)
   → Si existe: USA ESTE (90.0)
   → Si NO existe: continúa

4️⃣ Busca LoteriaMultiplier[name="Base"]
   → Si existe: USA ESTE (88.0)
   → Si NO existe: continúa

5️⃣ Busca LoteriaMultiplier[kind=NUMERO] primero creado
   → Si existe: USA ESTE
   → Si NO existe: continúa

6️⃣ Busca Loteria.rulesJson.baseMultiplierX
   → Si existe: USA ESTE (87.0)
   → Si NO existe: continúa

7️⃣ Fallback: USA 90.0 (constante del sistema)
```

**Salida Backend**:
```javascript
{
  id: "uuid-ticket",
  jugadas: [
    {
      type: 'NUMERO',
      number: '42',
      amount: 100,
      finalMultiplierX: 95  // ← Resuelto automáticamente
    }
  ]
}
```

**Consumo Frontend**:
```typescript
// TicketReceipt.tsx
const primeraNumero = ticket.jugadas.find(j => j.type === 'NUMERO')
const multiplierX = primeraNumero?.finalMultiplierX ?? 90  // Mostrar 95x
```

---

## Permisos Requeridos (RBAC)

| Acción | Requiere | Descripción |
|--------|----------|-------------|
| Crear/Editar Multiplier Override | ADMIN o VENTANA | ADMIN: cualquiera; VENTANA: solo sus usuarios/ventana |
| Ver Multiplier Override | Cualquier rol | ADMIN ve todo; VENTANA ve su ventana; VENDEDOR ve el suyo |
| Crear Multiplicador (LoteriaMultiplier) | ADMIN | Solo administrador |
| Editar Lotería (rulesJson) | ADMIN | Solo administrador |
| Crear Ticket | VENTANA / VENDEDOR | El backend resuelve multiplicador automáticamente |

---

## Flujo del Frontend (Implementación Actual)

### 1. Crear Ticket
**Archivo**: `components/tickets/TicketForm.tsx` (líneas 249-288)

```typescript
const payload: Omit<CreateTicketRequest, 'ventanaId'> = {
  loteriaId: selected.loteriaId,
  sorteoId,
  jugadas: jugadasPayload,  // SIN especificar multiplicador
}
// El backend resuelve automáticamente
onSubmit(payload)
```

✅ **CORRECTO**: El frontend NO intenta resolver el multiplicador

### 2. Display del Multiplicador en Receipt
**Archivo**: `components/tickets/TicketReceipt.tsx` (líneas 46-62)

```typescript
const { multiplierX } = useMemo(() => {
  let mult = 1
  const primeraNumero = (ticket.jugadas || []).find((j) => j.type === 'NUMERO')
  if (primeraNumero?.finalMultiplierX && primeraNumero.finalMultiplierX > 0) {
    mult = primeraNumero.finalMultiplierX  // ← Backend ya lo resolvió
  } else if (ticket.loteria?.rulesJson?.baseMultiplierX) {
    mult = ticket.loteria.rulesJson.baseMultiplierX  // ← Fallback
  }
  return { ..., multiplierX: mult }
}, [ticket])

// Mostrar: PAGAMOS 95x
```

✅ **CORRECTO**: El frontend solo consume `finalMultiplierX` del backend

---

## Validación de Datos (Backend)

El backend valida:
- ✅ `scope` debe ser "USER" o "VENTANA"
- ✅ `scopeId` debe ser UUID válido
- ✅ Si `scope=USER`: el usuario debe existir y estar activo
- ✅ Si `scope=VENTANA`: la ventana debe existir y estar activa
- ✅ `baseMultiplierX` debe ser positivo y ≤ 9999
- ✅ RBAC: ADMIN puede crear para cualquiera; VENTANA solo para su ventana/usuarios
- ✅ Unicidad: no puede haber dos overrides con mismo `(scope, scopeId, loteriaId, multiplierType)`

---

## Ejemplo Práctico: Crear Multiplicador Override

### Para un Vendedor VIP (USER scope)

```typescript
async function crearMultiplicadorVendedor(
  vendedorId: string,
  loteriaId: string,
  baseMultiplierX: number
) {
  const response = await fetch('/api/v1/multiplier-overrides', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scope: 'USER',
      scopeId: vendedorId,      // UUID del vendedor
      loteriaId: loteriaId,
      multiplierType: 'NUMERO',
      baseMultiplierX: baseMultiplierX  // ej: 95
    })
  });

  return response.json();
}
```

### Para una Ventana Completa (VENTANA scope)

```typescript
async function crearMultiplicadorVentana(
  ventanaId: string,
  loteriaId: string,
  baseMultiplierX: number
) {
  const response = await fetch('/api/v1/multiplier-overrides', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scope: 'VENTANA',
      scopeId: ventanaId,        // UUID de la ventana
      loteriaId: loteriaId,
      multiplierType: 'NUMERO',
      baseMultiplierX: baseMultiplierX  // ej: 92
    })
  });

  return response.json();
}
```

### Crear un Ticket (Sin especificar multiplicador)

```typescript
async function crearTicket(
  loteriaId: string,
  sorteoId: string,
  jugadas: { type: string; number: string; amount: number }[]
) {
  const response = await fetch('/api/v1/tickets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      loteriaId,
      sorteoId,
      jugadas
      // ← NO especificar multiplicador, backend lo resuelve!
    })
  });

  const ticket = await response.json();
  // ticket.jugadas[0].finalMultiplierX = 95 (resuelto)
  return ticket;
}
```

---

## Conclusión

✅ **La implementación frontend actual es correcta** y se ajusta perfectamente a la jerarquía de multiplicadores:

1. El frontend **NO resuelve multiplicadores** - deja que el backend lo haga
2. El frontend **solo consume `finalMultiplierX`** del ticket creado
3. El backend **automáticamente aplica la jerarquía** sin necesidad de lógica en cliente
4. Todo es **limpio, separado y escalable**

Para agregar UI de multiplicadores, solo necesita implementar calls a:
- `POST /api/v1/multiplier-overrides` (crear override)
- `GET /api/v1/multiplier-overrides` (listar overrides)
- `PUT/DELETE /api/v1/multiplier-overrides/:id` (editar/eliminar)

El flujo de creación de tickets **no cambia en absoluto**.
