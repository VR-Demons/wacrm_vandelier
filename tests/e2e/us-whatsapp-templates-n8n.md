# E2E: Flujo de plantillas con n8n

Este archivo describe la prueba manual end-to-end para la asignación de plantillas a etapas de pipeline y el uso del webhook n8n.

## Preparación
1. Asegúrate de tener una plantilla aprobada por Meta (estado "approved").
2. Genera una API Key en Ajustes / Desarrolladores.
3. Asegúrate de tener al menos una etapa en el Pipeline (ej. "Negociación").

## Prueba 1: Asignación de plantilla a etapa
1. Navega a `Ajustes / Plantillas`.
2. En la tarjeta de la plantilla aprobada, asegúrate de que el select muestra "Sin asignar".
3. Despliega el menú y selecciona la etapa "Negociación".
4. Recarga la página y asegúrate de que la selección persiste.

## Prueba 2: Activación del webhook desde n8n
1. Usando Postman o `curl`, realiza un POST a `http://localhost:3000/api/public/v1/n8n/templates`.
2. Incluye el header `Authorization: Bearer <API_KEY>`.
3. El payload debe ser:
```json
{
  "records": [
    {
      "phone": "5512345678",
      "name": "Prueba E2E",
      "folio": 9999,
      "templateName": "nombre_de_la_plantilla",
      "templateLanguage": "es_MX",
      "templateVariables": {
        "1": "Valor E2E"
      }
    }
  ]
}
```

## Verificación de resultados
1. Recibir un HTTP 200 con `success: true`.
2. Ir al CRM -> Prospectos y buscar el contacto "Prueba E2E" (o número 5512345678).
3. Entrar a la conversación y verificar que hay un folio "9999" asociado.
4. Ir al Pipeline y verificar que el Lead del contacto está en la columna "Negociación".
5. En la base de datos o en la pestaña "Actividad" (si existe), verificar que se creó un evento `leadStageEvent` con el movimiento de etapa causado por "sistema" o "bot".
6. Asegurarse que se haya agregado un mensaje a la tabla `outboxMessage` y que el cronjob lo haya procesado enviando el template.
