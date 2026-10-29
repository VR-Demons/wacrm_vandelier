# Catálogo de Plantillas de WhatsApp (WhatsApp Templates) — Vandelier CRM

Este documento detalla las **12 plantillas oficiales de WhatsApp** aprobadas en Meta para Vandelier CRM. Está diseñado específicamente para armar y probar llamadas directamente en **Postman** o en integraciones externas (n8n, APIs externas, sistemas de cobranza).

---

## 🚀 Configuración General en Postman

### 1. Estructura y Ubicación en Postman
* **Workspace**: `VRDemons`
* **Colección**: `Vandelier`
* **Carpeta principal**: `CRM_API` (contiene peticiones de texto libre y outbox)
* **Subcarpeta de Plantillas**: `CRM_API > Templates` (contiene las 12 plantillas oficiales aprobadas de Meta y variantes de prueba)

### 2. Variables de Entorno / Colección Recomendadas en Postman
| Variable | Valor sugerido | Descripción |
|---|---|---|
| `baseUrl` | `https://crm.vandelierai.com` | Dominio del CRM |
| `crm_api_key` | `sk_live_...` | API Key generada en **Configuración → Desarrolladores** |
| `phone` | `+5215512345678` | Teléfono destino con código de país |
| `headerImageUrl` | `https://vrdemons.com/vandelier.png` | URL pública del banner/logo en el encabezado |

### 2. Especificación de los Endpoints
- **Método**: `POST`
- **URL**: `{{baseUrl}}/api/public/v1/messages` (o `{{baseUrl}}/api/public/v1/n8n/templates` para batches)
- **Headers**:
  ```http
  x-api-key: {{crm_api_key}}
  Content-Type: application/json
  ```
- **Parámetro `"immediate": true`**: Si se incluye, se envía inmediatamente a Meta. Si se omite o es `false`, se encola en la bandeja de salida (`outboxMessage`) para procesamiento programado.
- **Transición de Pipeline Automática**: Si la plantilla tiene asignada una etapa en **Configuración → Plantillas**, el CRM moverá el lead automáticamente a esa columna en el Kanban; **no** es necesario enviar variables de etapa.

---

## 📋 Índice Rápido de Plantillas

| # | Plantilla | Idioma | Categoría | Encabezado | Variables en Cuerpo | Uso Principal |
|---|---|---|---|---|:---:|---|
| 1 | [`recordatorio_pago_fisica_1`](#1-recordatorio_pago_fisica_1) | `es_MX` | `UTILITY` | 🖼️ Imagen | 7 | Recordatorio preventivo para Persona Física (1 crédito/folio) |
| 2 | [`recordatorio_pago_fisica_multi`](#2-recordatorio_pago_fisica_multi) | `es_MX` | `UTILITY` | 🖼️ Imagen | 3 | Recordatorio preventivo para Persona Física (Múltiples créditos) |
| 3 | [`dia_pago_fisica_1`](#3-dia_pago_fisica_1) | `es_MX` | `UTILITY` | 🖼️ Imagen | 5 | Recordatorio el mero día de vencimiento para Persona Física (1 crédito) |
| 4 | [`dia_pago_fisica_multi`](#4-dia_pago_fisica_multi) | `es_MX` | `UTILITY` | 🖼️ Imagen | 4 | Recordatorio el mero día de vencimiento para Persona Física (Múltiples) |
| 5 | [`recordatorio_pago_moral_1`](#5-recordatorio_pago_moral_1) | `es_MX` | `UTILITY` | 🖼️ Imagen | 8 | Recordatorio preventivo para Persona Moral / Empresa (1 crédito) |
| 6 | [`recordatorio_pago_moral_multi`](#6-recordatorio_pago_moral_multi) | `es_MX` | `UTILITY` | 🖼️ Imagen | 5 | Recordatorio preventivo para Persona Moral / Empresa (Múltiples créditos) |
| 7 | [`dia_pago_moral_1`](#7-dia_pago_moral_1) | `es_MX` | `UTILITY` | 🖼️ Imagen | 6 | Recordatorio el mero día de vencimiento para Empresa (1 crédito) |
| 8 | [`dia_pago_moral_multi`](#8-dia_pago_moral_multi) | `es_MX` | `UTILITY` | 🖼️ Imagen | 4 | Recordatorio el mero día de vencimiento para Empresa (Múltiples) |
| 9 | [`default`](#9-default) | `es_MX` | `MARKETING` | 🖼️ Imagen | 1 | Prospección inicial y presentación de Vandelier AI |
| 10 | [`hello_world`](#10-hello_world) | `en_US` | `UTILITY` | Texto fijo | 0 | Plantilla estándar de Meta para pruebas de conectividad |
| 11 | [`aviso_adeudo_moral`](#11-aviso_adeudo_moral) | `es_MX` | `UTILITY` | Texto fijo | 5 | Notificación de adeudo vencido para Persona Moral / Empresa (1 o varios créditos) |
| 12 | [`aviso_adeudo_fisica`](#12-aviso_adeudo_fisica) | `es_MX` | `UTILITY` | Texto fijo | 4 | Notificación de adeudo vencido para Persona Física / Individuos (1 o varios créditos) |

---

## 📑 Detalle y Payloads de Postman

---

### 1. `recordatorio_pago_fisica_1`

Recordatorio preventivo previo al vencimiento para clientes individuales (Persona Física) con un solo crédito/folio.

* **Idioma**: `es_MX`
* **Categoría**: `UTILITY`
* **Encabezado**: Imagen (`header_1`)
* **Botones**: `Ya pagué` | `Llámanos` | `Política de Privacidad`

#### Texto del Cuerpo:
> ¡Hola \*{{nombre_contacto}}\*!; le escribimos de Vandelier, esperamos que se encuentre bien. Únicamente para recordarle el pago del {{tipo_producto}} número {{numero_folio}} a más tardar el día {{fecha_exigibilidad}} por {{monto_total}}. Le agradeceremos nos pueda enviar el comprobante de pago una vez que este haya sido realizado, por favor. La cuenta de depósito es la siguiente: Titular: BANCO COVALTO SA DE CV IBM FID 1444 Banco: BBVA Cuenta: 0125218543 CLABE: 012180001252185431 Fecha límite de pago: {{fecha_limite}} Referencia: {{numero_referencia}} Cualquier pregunta o duda, estoy a sus órdenes. ¡Saludos!

#### Parámetros:
| Variable | Clave en JSON | Descripción | Ejemplo |
|---|---|---|---|
| Encabezado | `header_1` | URL pública de la imagen | `https://vrdemons.com/vandelier.png` |
| Variable 1 | `nombre_contacto` | Nombre del cliente | `"Carlos Mendoza"` |
| Variable 2 | `tipo_producto` | Tipo de financiamiento | `"Crédito Personal"` |
| Variable 3 | `numero_folio` | Número de contrato/folio | `"FOL-10423"` |
| Variable 4 | `fecha_exigibilidad` | Fecha límite formal | `"30 de Octubre de 2026"` |
| Variable 5 | `monto_total` | Importe total a pagar | `"$3,450.00 MXN"` |
| Variable 6 | `fecha_limite` | Fecha límite abreviada | `"30 de Octubre"` |
| Variable 7 | `numero_referencia` | Referencia bancaria BBVA/CLABE | `"REF948201"` |

#### Payload Postman (`raw JSON`):
```json
{
  "phone": "+5215512345678",
  "template": "recordatorio_pago_fisica_1",
  "language": "es_MX",
  "variables": {
    "header_1": "https://vrdemons.com/vandelier.png",
    "nombre_contacto": "Carlos Mendoza",
    "tipo_producto": "Crédito Personal",
    "numero_folio": "FOL-10423",
    "fecha_exigibilidad": "30 de Octubre de 2026",
    "monto_total": "$3,450.00 MXN",
    "fecha_limite": "30 de Octubre",
    "numero_referencia": "REF948201"
  },
  "immediate": true
}
```

---

### 2. `recordatorio_pago_fisica_multi`

Recordatorio preventivo para clientes individuales (Persona Física) que tienen 2 o más operaciones o créditos próximos a vencer.

* **Idioma**: `es_MX`
* **Categoría**: `UTILITY`
* **Encabezado**: Imagen (`header_1`)
* **Pie de mensaje**: "Por favor, ignore este mensaje si ya ha realizado el pago."
* **Botones**: `Ya pagué` | `Llámanos` | `Política de Privacidad`

#### Texto del Cuerpo:
> ¡Hola! \*{{nombre_contacto}}\*; le escribimos de Vandelier, esperamos que se encuentre bien. Le recordamos los siguientes pagos próximos a vencer: {{lista_operaciones}} La cuenta de depósito es la siguiente: Titular: BANCO COVALTO SA DE CV IBM FID 1444 Banco: BBVA Cuenta: 0125218543 CLABE: 012180001252185431 Referencia: {{referencias_combinadas}} Le agradeceremos nos pueda enviar el comprobante de pago una vez que cada uno haya sido realizado, por favor. Cualquier pregunta o duda, estamos a sus órdenes. ¡Saludos!

#### Parámetros:
| Variable | Clave en JSON | Descripción | Ejemplo |
|---|---|---|---|
| Encabezado | `header_1` | URL pública de la imagen | `https://vrdemons.com/vandelier.png` |
| Variable 1 | `nombre_contacto` | Nombre del cliente | `"Carlos Mendoza"` |
| Variable 2 | `lista_operaciones` | Desglose de créditos (en 1 sola línea) | `"• Folio 101: $1,500.00 (vence 30/Oct) — • Folio 102: $2,300.00 (vence 02/Nov)"` |
| Variable 3 | `referencias_combinadas` | Referencias asociadas (ver nota abajo) | `"REF-101 / REF-102"` |

> [!WARNING]
> **Acción requerida en Meta Business Suite (Límite de 20 caracteres de Meta)**:
> El nombre de variable original `referencias_combinadas` tiene **22 caracteres**.
> 1. Meta Cloud API rechaza nombres de más de 20 caracteres con el error: `Param template.components.parameters.parameter_name must be at most 20 characters long`.
> 2. Si se recorta el nombre a 20 caracteres (`referencias_combinad`), Meta devuelve `(#100) Invalid parameter` porque la plantilla registrada en Meta no contiene esa variable truncada.
> **Solución definitiva**: En el Administrador de WhatsApp de Meta (Business Suite), edita la plantilla `recordatorio_pago_fisica_multi`, renombra `{{referencias_combinadas}}` por `{{referencias}}` (11 caracteres, idéntico a `dia_pago_fisica_multi`), envía a aprobación (se aprueba en segundos/minutos para Utility) y presiona **Sincronizar** en el CRM (**Configuración → Plantillas**). Mientras tanto, puedes usar `dia_pago_fisica_multi` que ya tiene `{{referencias}}`.

#### Payload Postman (`raw JSON`):
```json
{
  "phone": "+5215512345678",
  "template": "recordatorio_pago_fisica_multi",
  "language": "es_MX",
  "variables": {
    "header_1": "https://vrdemons.com/vandelier.png",
    "nombre_contacto": "Carlos Mendoza",
    "lista_operaciones": "• Crédito Auto (Folio 10423): $3,200.00 MXN — • Préstamo Personal (Folio 10890): $1,450.00 MXN",
    "referencias_combinadas": "REF10423 / REF10890"
  },
  "immediate": true
}
```

---

### 3. `dia_pago_fisica_1`

Recordatorio enviado el **mismo día de vencimiento** para Persona Física con 1 crédito.

* **Idioma**: `es_MX`
* **Categoría**: `UTILITY`
* **Encabezado**: Imagen (`header_1`)
* **Pie de mensaje**: "Por favor, ignore este mensaje si ya ha realizado el pago."
* **Botones**: `Ya pagué` | `Llámanos` | `Política de Privacidad`

#### Texto del Cuerpo:
> ¡Hola \*{{contacto}}\*! Le escribimos de Vandelier, esperamos que se encuentre bien. Únicamente para recordarle que el pago del {{producto}} número {{folio}} vence el día de hoy por {{total}}. Le agradeceremos nos pueda enviar el comprobante de pago una vez que este haya sido realizado, por favor. La cuenta de depósito es la siguiente: Titular: BANCO COVALTO SA DE CV IBM FID 1444 Banco: BBVA Cuenta: 0125218543 CLABE: 012180001252185431 Fecha límite de pago: Hoy Referencia: {{referencia}} Cualquier pregunta o duda, estamos a sus órdenes. ¡Saludos!

#### Parámetros:
| Variable | Clave en JSON | Descripción | Ejemplo |
|---|---|---|---|
| Encabezado | `header_1` | URL pública de la imagen | `https://vrdemons.com/vandelier.png` |
| Variable 1 | `contacto` | Nombre del cliente | `"Carlos Mendoza"` |
| Variable 2 | `producto` | Tipo de producto | `"Arrendamiento"` |
| Variable 3 | `folio` | Número de folio | `"ARR-5520"` |
| Variable 4 | `total` | Monto que vence hoy | `"$4,850.00 MXN"` |
| Variable 5 | `referencia` | Referencia de pago | `"REF5520ARR"` |

#### Payload Postman (`raw JSON`):
```json
{
  "phone": "+5215512345678",
  "template": "dia_pago_fisica_1",
  "language": "es_MX",
  "variables": {
    "header_1": "https://vrdemons.com/vandelier.png",
    "contacto": "Carlos Mendoza",
    "producto": "Arrendamiento Automotriz",
    "folio": "ARR-5520",
    "total": "$4,850.00 MXN",
    "referencia": "REF5520ARR"
  },
  "immediate": true
}
```

---

### 4. `dia_pago_fisica_multi`

Recordatorio enviado el **mismo día de vencimiento** para Persona Física con múltiples créditos o pagos a liquidar hoy.

* **Idioma**: `es_MX`
* **Categoría**: `UTILITY`
* **Encabezado**: Imagen (`header_1`)
* **Pie de mensaje**: "Por favor, ignore este mensaje si ya ha realizado el pago."
* **Botones**: `Ya pagué` | `Llámanos` | `Política de Privacidad`

#### Texto del Cuerpo:
> ¡Hola \*{{contacto}}\*! Le escribimos de Vandelier, esperamos que se encuentre bien. Le recordamos que los siguientes pagos vencen el día de hoy: {{lista_operaciones}} La cuenta de depósito es la siguiente: Titular: BANCO COVALTO SA DE CV IBM FID 1444 Banco: BBVA Cuenta: 0125218543 CLABE: 012180001252185431 Fecha límite de pago: Hoy Referencia: {{referencias}} Le agradeceremos nos pueda enviar el comprobante de pago una vez que cada uno haya sido realizado, por favor. Cualquier pregunta o duda, estamos a sus órdenes. ¡Saludos!

#### Parámetros:
| Variable | Clave en JSON | Descripción | Ejemplo |
|---|---|---|---|
| Encabezado | `header_1` | URL pública de la imagen | `https://vrdemons.com/vandelier.png` |
| Variable 1 | `contacto` | Nombre del cliente | `"Carlos Mendoza"` |
| Variable 2 | `lista_operaciones` | Desglose de pagos en 1 sola línea (sin `\n`) | `"• Folio 201 por $2,100.00 — • Folio 202 por $1,800.00"` |
| Variable 3 | `referencias` | Referencias para depósito | `"REF201 / REF202"` |

> [!IMPORTANT]
> **Sin saltos de línea (`\n`)**: Meta Cloud API prohíbe saltos de línea (`\n` o `\r`) dentro del texto de los parámetros de plantilla. Enviar `\n` provoca el error Meta `(#132018) There’s an issue with the parameters in your template`. Utiliza separadores como `" — "` o `" | "` en una sola línea continua.

#### Payload Postman (`raw JSON`):
```json
{
  "phone": "+5215510163879",
  "template": "dia_pago_fisica_multi",
  "language": "es_MX",
  "variables": {
    "header_1": "https://vrdemons.com/vandelier.png",
    "contacto": "Carlos Mendoza",
    "lista_operaciones": "• Préstamo Nómina (Folio 201): $2,100.00 MXN — • Crédito Equipamiento (Folio 202): $1,800.00 MXN",
    "referencias": "REF201 / REF202"
  },
  "immediate": true
}
```

---

### 5. `recordatorio_pago_moral_1`

Recordatorio preventivo previo al vencimiento para Personas Morales / Empresas con 1 crédito o contrato.

* **Idioma**: `es_MX`
* **Categoría**: `UTILITY`
* **Encabezado**: Imagen (`header_1`)
* **Pie de mensaje**: "Por favor, ignore este mensaje si ya ha realizado el pago."
* **Botones**: `Ya pagué` | `Llámanos` | `Política de Privacidad`

#### Texto del Cuerpo:
> ¡Hola \*{{nombre_contacto}}\*! le escribimos de Vandelier, esperamos que se encuentre bien. Le recordamos el pago del {{tipo_producto}} número {{numero_folio}} a nombre de \*{{nombre_empresa}}\* a más tardar el día {{fecha_exigibilidad}} por {{monto_total}}. Adjuntamos los datos bancarios para su referencia. La cuenta de depósito es la siguiente: Titular: BANCO COVALTO SA DE CV IBM FID 1444 Banco: BBVA Cuenta: 0125218543 CLABE: 012180001252185431 Fecha límite de pago: {{fecha_limite}} Referencia: {{numero_referencia}} Le recordamos que es muy importante compartirnos el comprobante del pago realizado. Cualquier pregunta o duda, estamos a sus órdenes. ¡Saludos!

#### Parámetros:
| Variable | Clave en JSON | Descripción | Ejemplo |
|---|---|---|---|
| Encabezado | `header_1` | URL pública de la imagen | `https://vrdemons.com/vandelier.png` |
| Variable 1 | `nombre_contacto` | Representante o contacto | `"Lic. Sofia Herrera"` |
| Variable 2 | `tipo_producto` | Línea de crédito/servicio | `"Crédito Simple Pyme"` |
| Variable 3 | `numero_folio` | Número de contrato/folio | `"PYME-8842"` |
| Variable 4 | `nombre_empresa` | Razón social de la empresa | `"Logística y Cargas del Norte S.A. de C.V."` |
| Variable 5 | `fecha_exigibilidad` | Fecha límite completa | `"05 de Noviembre de 2026"` |
| Variable 6 | `monto_total` | Monto a pagar | `"$28,500.00 MXN"` |
| Variable 7 | `fecha_limite` | Fecha límite corta | `"05 de Noviembre"` |
| Variable 8 | `numero_referencia` | Referencia bancaria | `"REFPYME8842"` |

#### Payload Postman (`raw JSON`):
```json
{
  "phone": "+5215512345678",
  "template": "recordatorio_pago_moral_1",
  "language": "es_MX",
  "variables": {
    "header_1": "https://vrdemons.com/vandelier.png",
    "nombre_contacto": "Lic. Sofia Herrera",
    "tipo_producto": "Crédito Simple Pyme",
    "numero_folio": "PYME-8842",
    "nombre_empresa": "Logística y Cargas del Norte S.A. de C.V.",
    "fecha_exigibilidad": "05 de Noviembre de 2026",
    "monto_total": "$28,500.00 MXN",
    "fecha_limite": "05 de Noviembre",
    "numero_referencia": "REFPYME8842"
  },
  "immediate": true
}
```

---

### 6. `recordatorio_pago_moral_multi`

Recordatorio preventivo previo al vencimiento para Personas Morales / Empresas con múltiples créditos o contratos.

* **Idioma**: `es_MX`
* **Categoría**: `UTILITY`
* **Encabezado**: Imagen (`header_1`)
* **Pie de mensaje**: "Por favor, ignore este mensaje si ya ha realizado el pago."
* **Botones**: `Ya pagué` | `Llámanos` | `Política de Privacidad`

#### Texto del Cuerpo:
> ¡Hola! \*{{nombre_contacto}}\*; le escribimos de Vandelier, esperamos que se encuentre bien. Le recordamos los siguientes pagos próximos a vencer a nombre de \*{{nombre_empresa}}\*. Adjuntamos los datos bancarios para su referencia. {{lista_operaciones}} La cuenta de depósito es la siguiente: Titular: BANCO COVALTO SA DE CV IBM FID 1444 Banco: BBVA Cuenta: 0125218543 CLABE: 012180001252185431 Referencia: {{referencias_combinadas}} Le recordamos que es muy importante compartirnos el comprobante del pago realizado. Cualquier pregunta o duda, estamos a sus órdenes. ¡Saludos!

#### Parámetros:
| Variable | Clave en JSON | Descripción | Ejemplo |
|---|---|---|---|
| Encabezado | `header_1` | URL pública de la imagen | `https://vrdemons.com/vandelier.png` |
| Variable 1 | `nombre_contacto` | Representante o contacto | `"Lic. Sofia Herrera"` |
| Variable 2 | `nombre_empresa` | Razón social | `"Logística y Cargas del Norte S.A. de C.V."` |
| Variable 3 | `lista_operaciones` | Desglose de contratos (1 sola línea) | `"• Flotilla Unidad 01: $14,000.00 MXN — • Flotilla Unidad 02: $14,500.00 MXN"` |
| Variable 4 | `referencias_combinadas` | Referencias de pago | `"FLOT-01 / FLOT-02"` |

> [!WARNING]
> **Acción requerida en Meta Business Suite (Límite de 20 caracteres de Meta)**:
> El nombre de variable original `referencias_combinadas` tiene **22 caracteres**.
> 1. Meta Cloud API rechaza nombres de más de 20 caracteres con el error: `Param template.components.parameters.parameter_name must be at most 20 characters long`.
> 2. Si se recorta el nombre a 20 caracteres (`referencias_combinad`), Meta devuelve `(#100) Invalid parameter` porque la plantilla registrada en Meta no contiene esa variable truncada.
> **Solución definitiva**: En el Administrador de WhatsApp de Meta (Business Suite), edita la plantilla `recordatorio_pago_moral_multi`, renombra `{{referencias_combinadas}}` por `{{referencias}}` (11 caracteres, idéntico a `dia_pago_moral_multi`), envía a aprobación y presiona **Sincronizar** en el CRM (**Configuración → Plantillas**). Mientras tanto, puedes usar `dia_pago_moral_multi` que ya tiene `{{referencias}}`.

#### Payload Postman (`raw JSON`):
```json
{
  "phone": "+5215510163879",
  "template": "recordatorio_pago_moral_multi",
  "language": "es_MX",
  "variables": {
    "header_1": "https://vrdemons.com/vandelier.png",
    "nombre_contacto": "Lic. Sofia Herrera",
    "nombre_empresa": "Logística y Cargas del Norte S.A. de C.V.",
    "lista_operaciones": "• Contrato Arrendamiento 101: $14,000.00 MXN — • Contrato Arrendamiento 102: $14,500.00 MXN",
    "referencias_combinadas": "FLOT-01 / FLOT-02"
  },
  "immediate": true
}
```

---

### 7. `dia_pago_moral_1`

Recordatorio enviado el **mismo día de vencimiento** para Persona Moral / Empresa con 1 crédito o contrato.

* **Idioma**: `es_MX`
* **Categoría**: `UTILITY`
* **Encabezado**: Imagen (`header_1`)
* **Pie de mensaje**: "Por favor, ignore este mensaje si ya ha realizado el pago."
* **Botones**: `Ya pagué` | `Llámanos` | `Política de Privacidad`

#### Texto del Cuerpo:
> ¡Hola \*{{contacto}}\*! Le escribimos de Vandelier, esperamos que se encuentre bien. Le recordamos que el pago del {{producto}} número {{folio}} a nombre de \*{{empresa}}\* vence el día de hoy por {{total}}. Adjunto los datos bancarios para su referencia. La cuenta de depósito es la siguiente: Titular: BANCO COVALTO SA DE CV IBM FID 1444 Banco: BBVA Cuenta: 0125218543 CLABE: 012180001252185431 Fecha límite de pago: Hoy Referencia: {{referencia}} Le recordamos que es muy importante compartirnos el comprobante del pago realizado. Cualquier pregunta o duda, estamos a sus órdenes. ¡Saludos!

#### Parámetros:
| Variable | Clave en JSON | Descripción | Ejemplo |
|---|---|---|---|
| Encabezado | `header_1` | URL pública de la imagen | `https://vrdemons.com/vandelier.png` |
| Variable 1 | `contacto` | Contacto en la empresa | `"Lic. Sofia Herrera"` |
| Variable 2 | `producto` | Producto o crédito | `"Arrendamiento de Maquinaria"` |
| Variable 3 | `folio` | Número de folio | `"MAQ-410"` |
| Variable 4 | `empresa` | Razón social | `"Constructora Metrópoli S.A."` |
| Variable 5 | `total` | Monto que vence hoy | `"$35,000.00 MXN"` |
| Variable 6 | `referencia` | Referencia de pago | `"REFMAQ410"` |

#### Payload Postman (`raw JSON`):
```json
{
  "phone": "+5215512345678",
  "template": "dia_pago_moral_1",
  "language": "es_MX",
  "variables": {
    "header_1": "https://vrdemons.com/vandelier.png",
    "contacto": "Lic. Sofia Herrera",
    "producto": "Arrendamiento de Maquinaria",
    "folio": "MAQ-410",
    "empresa": "Constructora Metrópoli S.A.",
    "total": "$35,000.00 MXN",
    "referencia": "REFMAQ410"
  },
  "immediate": true
}
```

---

### 8. `dia_pago_moral_multi`

Recordatorio enviado el **mismo día de vencimiento** para Persona Moral / Empresa con múltiples pagos que vencen hoy.

* **Idioma**: `es_MX`
* **Categoría**: `UTILITY`
* **Encabezado**: Imagen (`header_1`)
* **Pie de mensaje**: "Por favor, ignore este mensaje si ya ha realizado el pago."
* **Botones**: `Ya pagué` | `Llámanos` | `Política de Privacidad`

#### Texto del Cuerpo:
> ¡Hola \*{{contacto}}\*! Le escribimos de Vandelier, esperamos que se encuentre bien. Le recordamos que los siguientes pagos a nombre de \*{{empresa}}\* vencen el día de hoy: {{lista_operaciones}} La cuenta de depósito es la siguiente: Titular: BANCO COVALTO SA DE CV IBM FID 1444 Banco: BBVA Cuenta: 0125218543 CLABE: 012180001252185431 Fecha límite de pago: Hoy Referencia: {{referencias}} Le recordamos que es muy importante compartirnos el comprobante del pago realizado. Cualquier pregunta o duda, estamos a sus órdenes. ¡Saludos!

#### Parámetros:
| Variable | Clave en JSON | Descripción | Ejemplo |
|---|---|---|---|
| Encabezado | `header_1` | URL pública de la imagen | `https://vrdemons.com/vandelier.png` |
| Variable 1 | `contacto` | Contacto en la empresa | `"Lic. Sofia Herrera"` |
| Variable 2 | `empresa` | Razón social | `"Constructora Metrópoli S.A."` |
| Variable 3 | `lista_operaciones` | Desglose de vencimientos (1 sola línea) | `"• Factura F-101: $15,000.00 MXN — • Factura F-102: $20,000.00 MXN"` |
| Variable 4 | `referencias` | Referencias para depósito | `"F101 / F102"` |

> [!IMPORTANT]
> **Sin saltos de línea (`\n`)**: Meta Cloud API prohíbe saltos de línea (`\n` o `\r`) dentro del texto de los parámetros de plantilla. Enviar `\n` provoca el error Meta `(#132018) There’s an issue with the parameters in your template`. Utiliza separadores como `" — "` o `" | "` en una sola línea continua.

#### Payload Postman (`raw JSON`):
```json
{
  "phone": "+5215510163879",
  "template": "dia_pago_moral_multi",
  "language": "es_MX",
  "variables": {
    "header_1": "https://vrdemons.com/vandelier.png",
    "contacto": "Lic. Sofia Herrera",
    "empresa": "Constructora Metrópoli S.A.",
    "lista_operaciones": "• Factura F-101: $15,000.00 MXN — • Factura F-102: $20,000.00 MXN",
    "referencias": "F101 / F102"
  },
  "immediate": true
}
```

---

### 9. `default`

Plantilla de **Marketing / Prospección comercial** para iniciar conversaciones con nuevos clientes interesados en Vandelier AI.

* **Idioma**: `es_MX`
* **Categoría**: `MARKETING`
* **Encabezado**: Imagen (`header_1`)
* **Pie de mensaje**: "Responde \"STOP\" para dejar de recibir mensajes."
* **Botones**: `Quiero más info` | `Visitar Vandelier AI`

#### Texto del Cuerpo:
> Hola {{name}}, optimiza tu proceso de registro y cobranza con Vandelier AI 🤖. Gestiona tus préstamos y arrendamientos de forma automática, segura y sin fricciones. ¿Te gustaría ver cómo funciona?

#### Parámetros:
| Variable | Clave en JSON | Descripción | Ejemplo |
|---|---|---|---|
| Encabezado | `header_1` | URL pública de la imagen | `https://vrdemons.com/vandelier.png` |
| Variable 1 | `name` | Nombre de la persona o prospecto | `"Alejandro"` |

#### Payload Postman (`raw JSON`):
```json
{
  "phone": "+5215512345678",
  "template": "default",
  "language": "es_MX",
  "variables": {
    "header_1": "https://vrdemons.com/vandelier.png",
    "name": "Alejandro"
  },
  "immediate": true
}
```

---

### 10. `hello_world`

Plantilla de prueba estándar provista por Meta para verificar que la integración con la Cloud API y las credenciales funcionen correctamente.

* **Idioma**: `en_US`
* **Categoría**: `UTILITY`
* **Encabezado**: Texto fijo: `Hello World`
* **Pie de mensaje**: "WhatsApp Business Platform sample message"
* **Variables**: Ninguna (cuerpo estático).

#### Texto del Cuerpo:
> Welcome and congratulations!! This message demonstrates your ability to send a WhatsApp message notification from the Cloud API, hosted by Meta. Thank you for taking the time to test with us.

#### Payload Postman (`raw JSON`):
```json
{
  "phone": "+5215512345678",
  "template": "hello_world",
  "language": "en_US",
  "variables": {},
  "immediate": true
}
```

---

### 11. `aviso_adeudo_moral`

Plantilla de **Cobranza / Notificación de Adeudo Vencido** dirigida a Personas Morales (Empresas). Soporta de forma flexible uno o múltiples créditos/arrendamientos (préstamo, arrendamiento o mixtos) mediante variables nombradas.

* **Idioma**: `es_MX`
* **Categoría**: `UTILITY`
* **Tipo de variables**: `Named`
* **Encabezado**: *Ninguno* (o texto fijo)

#### Texto del Cuerpo:
> Hola \*{{contacto}}\*, espero te encuentres bien. Le escribimos de Vandelier para informarle que no recibimos el pago de {{producto}} a nombre de \*{{empresa}}\*. Le compartimos el detalle de los montos pendientes al día de hoy:
>
> {{lista_adeudos}}
>
> La cuenta de depósito es la siguiente:
>
> Titular: BANCO COVALTO SA DE IBM FID 1444
> Banco: BBVA
> Cuenta: 0125218543
> CLABE: 012180001252185431
> Fecha límite de pago: \*INMEDIATO\*
> Referencia: {{referencias}}
>
> Recuerde que el atraso en los pagos afecta el historial crediticio de la persona moral y sus representantes y avales. Cualquier pregunta o duda, estamos a sus órdenes. ¡Saludos!

#### Parámetros:
| Variable | Clave en JSON | Longitud | Descripción | Ejemplo |
|---|---|:---:|---|---|
| Variable 1 | `contacto` | 8 chars | Nombre del contacto / representante | `"DIEGO"` o `"Lic. Sofía Herrera"` |
| Variable 2 | `producto` | 8 chars | Tipo de producto con artículo (singular/plural) | `"los préstamos"` / `"el préstamo"` / `"el arrendamiento"` / `"sus financiamientos"` |
| Variable 3 | `empresa` | 7 chars | Razón social de la Persona Moral | `"Garciacano Garcia Diego"` |
| Variable 4 | `lista_adeudos` | 13 chars | Desglose de folios en 1 sola línea (sin `\n`) | `"• Folio 001227 - Fecha Límite: 18 de septiembre - $578,550.00 MXN — • Folio 001304 - Fecha Límite: 21 de octubre - $7,500.00 MXN"` |
| Variable 5 | `referencias` | 11 chars | Folio(s) para depósito | `"001227, 001304"` |

> [!IMPORTANT]
> **Sin saltos de línea (`\n`)**: Meta Cloud API prohíbe saltos de línea (`\n` o `\r`) dentro del texto de los parámetros de plantilla (`#132018`). En `lista_adeudos`, concatena múltiples operaciones con separadores como `" — "` o `" | "`.

#### Payload Postman (`raw JSON`):
```json
{
  "phone": "+5215535750839",
  "template": "aviso_adeudo_moral",
  "language": "es_MX",
  "variables": {
    "contacto": "DIEGO",
    "producto": "los préstamos",
    "empresa": "Garciacano Garcia Diego",
    "lista_adeudos": "• Folio 001227 - Fecha Límite: 18 de septiembre - $578,550.00 MXN — • Folio 001304 - Fecha Límite: 21 de octubre - $7,500.00 MXN",
    "referencias": "001227, 001304"
  },
  "immediate": true
}
```

---

### 12. `aviso_adeudo_fisica`

Plantilla de **Cobranza / Notificación de Adeudo Vencido** dirigida a Personas Físicas (Individuos). Mantiene un trato directo y personal, cubriendo uno o múltiples contratos sin redundancia de nombres.

* **Idioma**: `es_MX`
* **Categoría**: `UTILITY`
* **Tipo de variables**: `Named`
* **Encabezado**: *Ninguno* (o texto fijo)

#### Texto del Cuerpo:
> Hola \*{{cliente}}\*, espero te encuentres bien. Te escribimos de Vandelier para informarte que no recibimos el pago de {{producto}}. Te compartimos el detalle de los montos pendientes al día de hoy:
>
> {{lista_adeudos}}
>
> La cuenta de depósito es la siguiente:
>
> Titular: BANCO COVALTO SA DE IBM FID 1444
> Banco: BBVA
> Cuenta: 0125218543
> CLABE: 012180001252185431
> Fecha límite de pago: \*INMEDIATO\*
> Referencia: {{referencias}}
>
> Recuerda que el atraso en los pagos afecta tu historial crediticio y el de tus avales. Cualquier pregunta o duda, estamos a tus órdenes. ¡Saludos!

#### Parámetros:
| Variable | Clave en JSON | Longitud | Descripción | Ejemplo |
|---|---|:---:|---|---|
| Variable 1 | `cliente` | 7 chars | Nombre del titular acreditado | `"Carlos Mendoza"` |
| Variable 2 | `producto` | 8 chars | Tipo de financiamiento con pronombre posesivo | `"tu préstamo"` / `"tus préstamos"` / `"tu arrendamiento"` / `"tus financiamientos"` |
| Variable 3 | `lista_adeudos` | 13 chars | Desglose de folios en 1 sola línea (sin `\n`) | `"• Folio 002100 - Fecha Límite: 15 de octubre - $12,450.00 MXN"` |
| Variable 4 | `referencias` | 11 chars | Folio(s) para depósito | `"002100"` |

#### Payload Postman (`raw JSON`):
```json
{
  "phone": "+5215512345678",
  "template": "aviso_adeudo_fisica",
  "language": "es_MX",
  "variables": {
    "cliente": "Carlos Mendoza",
    "producto": "tu préstamo",
    "lista_adeudos": "• Folio 002100 - Fecha Límite: 15 de octubre - $12,450.00 MXN",
    "referencias": "002100"
  },
  "immediate": true
}
```

---

## 💡 Notas Técnicas y Buenas Prácticas

1. **Variables Numéricas vs. Variables Nombradas**:
   El motor de plantillas de Vandelier CRM soporta automáticamente variables con su nombre original (`"nombre_contacto": "..."`) o con su posición numérica (`"1": "..."`). Se recomienda usar el **nombre original** tal como aparece en los ejemplos de arriba para mayor claridad en Postman.
2. **Encabezado de Imagen (`header_1`)**:
   Todas las plantillas con encabezado tipo imagen aceptan la clave `"header_1"` apuntando a la URL pública `https://vrdemons.com/vandelier.png`. Si se omite en la llamada, el CRM utilizará automáticamente el logo global configurado en **Configuración → Marca**.
3. **Respuesta Exitosa**:
   Al enviar con `"immediate": true`, el endpoint devuelve:
   ```json
   {
     "success": true,
     "summary": {
       "total": 1,
       "success": 1,
       "error": 0
     },
     "sentMessageIds": [
       "msg_01JBXXXXXXXXXXXXXX"
     ]
   }
   ```
   El mensaje aparecerá al instante en la bandeja de entrada del CRM con `direction: "out"` y origen `template`, manteniendo el hilo de conversación completamente sincronizado con la interfaz web.

---

## 🛠️ Errores Frecuentes de Meta Cloud API y Soluciones

### 1. `(#132018) There’s an issue with the parameters in your template`
* **Causa**: Meta prohíbe terminantemente incluir saltos de línea (`\n`, `\r`) o tabuladores dentro del valor de cualquier parámetro de texto (`text`). Enviar `\n` dentro de `lista_operaciones` o cualquier otra variable causa el rechazo inmediato de Meta con el código `132018`.
* **Solución**: Enviar los valores en una **sola línea continua**, separando conceptos con guiones largos (`" — "`), plecas (`" | "`) o comas. El backend del CRM ahora también reemplaza de forma preventiva los saltos de línea por `" — "` para proteger las llamadas.

### 2. `Param template.components.parameters.parameter_name must be at most 20 characters long.` y `(#100) Invalid parameter`
* **Causa**:
  - Meta Cloud API (`POST /messages`) impone un límite estricto de esquema: ningún nombre de parámetro (`parameter_name`) puede tener más de **20 caracteres**.
  - En las plantillas `recordatorio_pago_fisica_multi` y `recordatorio_pago_moral_multi`, la variable fue nombrada originalmente en Meta como `referencias_combinadas` (**22 caracteres**).
  - Al enviar `"parameter_name": "referencias_combinadas"`, la pasarela de Meta rechaza la petición indicando que supera los 20 caracteres.
  - Si se intenta recortar el nombre a 20 caracteres (`referencias_combinad`), la pasarela lo deja pasar pero el motor de plantillas de Meta devuelve **`(#100) Invalid parameter`**, porque no existe ninguna variable registrada con ese nombre truncado en la plantilla aprobada.
* **Solución definitiva**:
  1. En **Meta Business Suite** (WhatsApp Manager), editar `recordatorio_pago_fisica_multi` y `recordatorio_pago_moral_multi`.
  2. Renombrar la variable `{{referencias_combinadas}}` a `{{referencias}}` (11 caracteres, idéntico a `dia_pago_fisica_multi` y `dia_pago_moral_multi`).
  3. Enviar a aprobación y, una vez aprobada, hacer clic en **Sincronizar** en el CRM (**Configuración → Plantillas**).
  4. Mientras se realiza ese cambio en Meta, se pueden utilizar directamente las plantillas equivalentes **`dia_pago_fisica_multi`** y **`dia_pago_moral_multi`**, las cuales ya utilizan `{{referencias}}` y funcionan de inmediato.
* **Protección en el CRM backend**:
  - El backend ahora valida preventivamente si alguna variable supera los 20 caracteres y emite un mensaje de error claro en español antes de intentar la llamada fallida a Meta.
  - Además, el backend extrae el campo `error_data.details` de cualquier error de Meta para mostrar diagnósticos transparentes y completos en las respuestas de la API.

