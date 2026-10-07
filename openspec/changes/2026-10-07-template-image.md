# Plan de Implementación SDD: Imagen Global de Plantillas

## 1. Proposal (Propuesta)
**Intención:** Simplificar el envío de "Plantillas aprobadas" en el Inbox. Cuando una plantilla requiere un encabezado tipo `IMAGE`, el usuario ya no tendrá que buscar y pegar una URL pública manualmente. 
En su lugar, podrá configurar una "Imagen de plantillas" global en `Configuración > Plantillas` que se adjuntará automáticamente.

## 2. Specification (Especificaciones)
**Requisitos:**
- La pantalla `Ajustes > Plantillas` debe incluir un cargador de imágenes idéntico al de "Logo del negocio" (`FaviconCard`).
- La carga de la imagen sobrescribirá la columna `logo` de la tabla `organization`.
- La imagen debe servirse públicamente porque Meta (WhatsApp Graph API) requiere descargarla desde una URL pública al enviar el mensaje.
- Al abrir una "Plantilla aprobada" en el Inbox, el formulario de envío ya no pedirá el campo "Imagen (URL)".

## 3. Design (Diseño Técnico)
- **Base de Datos:** Se reutiliza la columna existente `organization.logo`.
- **Componente UI:** `TemplateImageCard`, basado estrechamente en `FaviconCard`. Renderiza la vista previa y maneja la subida/eliminación. Se inyecta en `TemplatesSettingsPage`.
- **Ruta Privada (Escritura):** `/api/settings/templates/image` que llama a `saveMediaFile` y actualiza el campo `logo` a una URL absoluta apuntando a nuestro backend (`APP_BASE_URL`).
- **Ruta Pública (Lectura):** `/api/branding/template-image` para servir el archivo a Meta, configurada con `cabeceras` de caché para la CDN.
- **Envío (Inbox):** En `TemplateSender`, filtramos del mapeo de variables la etiqueta "Imagen (URL)" para ignorarla en el UI y en el validador `missingValue`. El backend (`templatePayload.ts`) ya está preparado para inyectar `organization.logo` como `fallbackImageUrl` si no viene la variable explícita de imagen.

## 4. Tasks (Tareas)
- [x] Tarea 1: Añadir la consulta de `organization.logo` a la vista servidor de la página de Ajustes de Plantillas.
- [x] Tarea 2: Crear el componente `TemplateImageCard`.
- [x] Tarea 3: Implementar la ruta de carga y borrado `/api/settings/templates/image/route.ts`.
- [x] Tarea 4: Implementar la ruta de servicio pública `/api/branding/template-image/route.ts`.
- [x] Tarea 5: Actualizar `TemplateSender` para ocultar la petición explícita de "Imagen (URL)".
