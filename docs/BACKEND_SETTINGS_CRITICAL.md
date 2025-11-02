# 🔴 INSTRUCCIONES CRÍTICAS PARA EL BACKEND: Configuraciones de Usuario

## Problema Actual

El frontend ya está configurado para enviar y recibir configuraciones del usuario mediante un campo JSON `settings`, pero **el backend NO está devolviendo este campo** en los endpoints principales.

## Cambios REQUERIDOS en el Backend

### 1. Modelo de Base de Datos

**Ya implementado según documentación previa:**
- ✅ Campo `settings Json?` debe existir en modelo `User`
- ✅ Campo `settings Json?` debe existir en modelo `Ventana`

### 2. Endpoints que DEBEN devolver el campo `settings`

#### 2.1. GET /api/v1/users/:id

**Respuesta actual (incorrecta):**
```json
{
  "id": "abc123",
  "name": "Juan Pérez",
  "username": "juan",
  "role": "VENDEDOR",
  "isActive": true
  // ❌ Falta el campo settings
}
```

**Respuesta requerida:**
```json
{
  "id": "abc123",
  "name": "Juan Pérez",
  "username": "juan",
  "role": "VENDEDOR",
  "isActive": true,
  "settings": {
    "print": {
      "name": "Yorleny",
      "phone": "8888-8888",
      "width": 58,
      "footer": "Gracias por su preferencia",
      "barcode": true
    },
    "theme": "dark"
  }
}
```

#### 2.2. GET /api/v1/users (Lista de usuarios)

**Respuesta requerida:** Cada elemento debe incluir el campo `settings`:

```json
{
  "data": [
    {
      "id": "abc123",
      "name": "Juan Pérez",
      "username": "juan",
      "role": "VENDEDOR",
      "isActive": true,
      "settings": { /* ... */ }
    }
  ],
  "meta": { /* ... */ }
}
```

#### 2.3. GET /api/v1/ventanas/:id

**Respuesta actual (incorrecta):**
```json
{
  "id": "xyz789",
  "name": "Listero 1",
  "code": "LV-001",
  "isActive": true
  // ❌ Falta el campo settings
}
```

**Respuesta requerida:**
```json
{
  "id": "xyz789",
  "name": "Listero 1",
  "code": "LV-001",
  "isActive": true,
  "settings": {
    "print": {
      "name": "Listero Centro",
      "phone": "7777-7777",
      "width": 88,
      "footer": null,
      "barcode": true
    },
    "theme": "light"
  }
}
```

#### 2.4. GET /api/v1/ventanas (Lista de ventanas)

**Respuesta requerida:** Cada elemento debe incluir el campo `settings`.

### 2.5. GET /api/v1/auth/me

**Respuesta requerida:** Debe incluir el campo `settings` del usuario autenticado.

### 3. Endpoints que DEBEN aceptar actualizaciones a `settings`

#### 3.1. PATCH /api/v1/users/:id

**Request body:**
```json
{
  "settings": {
    "print": {
      "name": "Nuevo nombre",
      "phone": "1234-5678",
      "width": 88,
      "footer": "Texto adicional",
      "barcode": false
    },
    "theme": "dark"
  }
}
```

**Validaciones:**
- `settings.print.width` debe ser `58` o `88` (número entero)
- `settings.print.footer` máximo 200 caracteres
- `settings.print.barcode` debe ser boolean
- `settings.theme` debe ser `"light"` o `"dark"`
- **HACER MERGE PARCIAL** (no sobrescribir todo el JSON si solo se envía una parte)

**Ejemplo de merge:**
- Usuario tiene: `{ "print": { "name": "A" }, "theme": "light" }`
- Se envía: `{ "settings": { "theme": "dark" } }`
- Resultado: `{ "print": { "name": "A" }, "theme": "dark" }` ✅

#### 3.2. PATCH /api/v1/ventanas/:id

**Mismas validaciones y comportamiento que PATCH /api/v1/users/:id**.

### 4. Tickets: Incluir configuraciones en las respuestas

#### 4.1. POST /api/v1/tickets

Cuando se crea un ticket, debe incluir las configuraciones de impresión del vendedor y ventana:

```json
{
  "id": "ticket123",
  "ticketNumber": "T251101-00000001-00",
  "vendedor": {
    "id": "abc123",
    "name": "Juan Pérez",
    "code": "YV-001",
    "phone": "8888-8888",
    "printName": "Yorleny",        // Desde settings.print.name (o name por defecto)
    "printPhone": "8888-8888",     // Desde settings.print.phone (o phone por defecto)
    "printWidth": 58,               // Desde settings.print.width
    "printFooter": "Gracias...",    // Desde settings.print.footer
    "printBarcode": true            // Desde settings.print.barcode (o true por defecto)
  },
  "ventana": {
    "id": "xyz789",
    "name": "Listero 1",
    "code": "LV-001",
    "phone": "7777-7777",
    "printName": "Listero Centro",
    "printPhone": "7777-7777",
    "printWidth": 88,
    "printFooter": null,
    "printBarcode": true
  }
}
```

**Lógica de obtención:**

```typescript
// Pseudocódigo
const vendedor = await getUserById(ticket.vendedorId);
const ventana = await getVentanaById(ticket.ventanaId);

const ticketWithConfig = {
  ...ticket,
  vendedor: {
    ...vendedor,
    printName: vendedor.settings?.print?.name ?? vendedor.name,
    printPhone: vendedor.settings?.print?.phone ?? vendedor.phone,
    printWidth: vendedor.settings?.print?.width ?? null,
    printFooter: vendedor.settings?.print?.footer ?? null,
    printBarcode: vendedor.settings?.print?.barcode ?? true,
  },
  ventana: {
    ...ventana,
    printName: ventana.settings?.print?.name ?? ventana.name,
    printPhone: ventana.settings?.print?.phone ?? ventana.phone,
    printWidth: ventana.settings?.print?.width ?? null,
    printFooter: ventana.settings?.print?.footer ?? null,
    printBarcode: ventana.settings?.print?.barcode ?? true,
  },
};
```

#### 4.2. GET /api/v1/tickets/:id

**Misma lógica**: Incluir configuraciones de impresión del vendedor y ventana en la respuesta.

#### 4.3. GET /api/v1/tickets (Lista de tickets)

**Respuesta requerida:** Cada ticket debe incluir las configuraciones de impresión en `vendedor` y `ventana`.

### 5. Prioridad de Implementación

#### ✅ CRÍTICO (Debe funcionar YA):
1. **GET /api/v1/users/:id** - Devolver `settings`
2. **PATCH /api/v1/users/:id** - Aceptar actualización de `settings`
3. **GET /api/v1/ventanas/:id** - Devolver `settings`
4. **PATCH /api/v1/ventanas/:id** - Aceptar actualización de `settings`
5. **GET /api/v1/auth/me** - Devolver `settings`

#### 🔸 IMPORTANTE (Necesario para configuración de impresión):
6. **POST /api/v1/tickets** - Incluir configuraciones de impresión
7. **GET /api/v1/tickets/:id** - Incluir configuraciones de impresión
8. **GET /api/v1/tickets** - Incluir configuraciones de impresión

#### 🔹 OPCIONAL (Listas):
9. **GET /api/v1/users** - Incluir `settings` en cada elemento
10. **GET /api/v1/ventanas** - Incluir `settings` en cada elemento

### 6. Estructura del JSON `settings`

```typescript
interface UserSettings {
  print?: {
    name?: string | null;           // Nombre personalizado para imprimir
    phone?: string | null;           // Teléfono personalizado para imprimir
    width?: 58 | 88 | null;         // Ancho de papel (58mm o 88mm)
    footer?: string | null;          // Pie de ticket (texto adicional, máximo 200 caracteres)
    barcode?: boolean | null;        // Si debe imprimir código de barras
  };
  theme?: 'light' | 'dark' | null;  // Tema de la aplicación
}
```

### 7. Validaciones

#### Para `settings.print`:
- `width`: Debe ser `58` o `88` (número entero, no string)
- `footer`: Máximo 200 caracteres
- `barcode`: Boolean (true/false, no "true"/"false")
- `name` y `phone`: Strings opcionales

#### Para `settings.theme`:
- Debe ser `'light'` o `'dark'` (string literal)

### 8. Notas Importantes

1. **Merge parcial**: Cuando se actualiza `settings`, NO sobrescribir todo el JSON, hacer merge inteligente
2. **Valores por defecto**: Si `settings` es `null` o vacío, devolver un objeto vacío `{}`
3. **Backward compatibility**: Si existen campos legacy (`printName`, `printPhone`, etc.), el backend debe priorizar `settings.print` sobre estos campos
4. **Tickets**: Las configuraciones deben obtenerse dinámicamente del vendedor y ventana en el momento de creación/consulta del ticket

## Resumen Ejecutivo

**El frontend ya está 100% preparado** para trabajar con el campo `settings`. Solo necesita que el backend:
1. **Devuelva** el campo `settings` en GET /users/:id, GET /ventanas/:id, GET /auth/me
2. **Acepte actualizaciones** a `settings` en PATCH /users/:id y PATCH /ventanas/:id
3. **Incluya configuraciones** en las respuestas de tickets (POST, GET /:id, GET lista)

**Sin estos cambios, la funcionalidad de configuración de impresión NO funcionará correctamente.**

