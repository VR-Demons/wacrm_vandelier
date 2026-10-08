# Cambios

QuÃ© trae cada versiÃ³n de Vocero CRM y quÃ© hacer para actualizar. La versiÃ³n
sigue el SemVer del [README](README.md#versiones): una menor trae funciones
nuevas y actualizar es redesplegar. Desde 1.4.0, cada tag `vX.Y.Z` publica la
imagen `ghcr.io/kevinrivm/vocero-crm:X.Y.Z`.


## Unreleased

- Se añadió la capacidad de eliminar registros:
  - Eliminar conversaciones o mensajes individuales directamente desde la bandeja.
  - Eliminar contactos específicos desde su menú (borrando también sus leads y conversaciones).
  - Eliminación masiva de todos los contactos (y sus datos relacionados) desde Configuración -> Marca, en la nueva 'Zona de peligro'.
- **Bandeja / Detalles:**
  - Se oculta la sección «IA en esta conversación», estado de pausa y avisos de configuración si la configuración principal del agente de IA está apagada o no lista para responder.
  - El botón «Eliminar conversación» se reubicó al final del panel de detalles (debajo de Notas) en su propia sección delimitada.

## 1.4.0 â€” 2026-09-XX

### Actualizar desde 1.3.0

Actualizar es redesplegar: no hay variables obligatorias nuevas ni nada que
reconectar. Respalda la base antes, como en cualquier actualizaciÃ³n.

- **CÃ³mo.** En Coolify, con la app que construye desde el repo (la de la guÃ­a
  hasta 1.3.0), redespliega. Con docker compose, `git pull` y
  `docker compose up -d`: el compose ahora descarga la imagen publicada. Con
  `--build` la sigue construyendo desde el cÃ³digo, que es lo que necesitas en
  un VPS ARM (la imagen es `linux/amd64`) o si tu fork tiene cambios propios.
- **Migraciones.** Corren solas al arrancar el contenedor, sin
  Pre-Deployment Command. Hay dos nuevas, y las dos solo agregan:
  - `0013_nombre_del_contacto`: la columna `contact.name_source`.
  - `0014_anuncio_de_origen`: la columna `ad_attribution.image_asset_id`, su
    llave forÃ¡nea a `media_asset` y un Ã­ndice.

  Van en una sola transacciÃ³n: si una falla no queda ninguna, la app no
  arranca y el log dice `[migrate] fallÃ³ tras varios intentos`. Si tu fork
  tiene migraciones propias posteriores a la `0012`, comprueba despuÃ©s que
  existan esas dos columnas: el migrador salta en silencio toda migraciÃ³n
  cuyo `when` no sea mayor que el de la Ãºltima aplicada. Si falta una, corre a
  mano su SQL de `drizzle/`.
- **Nombres de contacto.** El nombre ahora sigue al perfil de WhatsApp, salvo
  que lo haya escrito una persona en el CRM. La `0013` deja como Â«del perfilÂ»
  todos los contactos que ya existÃ­an: uno que renombraste a mano tomarÃ¡ su
  nombre de WhatsApp la prÃ³xima vez que escriba. Para conservar esos nombres,
  corre esto en la consola de Postgres justo despuÃ©s de actualizar (antes la
  columna no existe; con docker compose,
  `docker compose exec postgres psql -U postgres -d vocero`):

  ```sql
  UPDATE "contact" SET "name_source" = 'manual';
  ```

  Con eso ningÃºn contacto viejo sigue a su perfil; los nuevos, sÃ­. Quien
  escriba entre el arranque y el `UPDATE` ya habrÃ¡ tomado su nombre de perfil.
- **Adjuntos, logo e icono.** La imagen los guarda en `/data/media` (trae
  `MEDIA_DIR=/data/media`) y arranca como root solo para darle el volumen de
  `/data` al usuario de la app. QuÃ© hacer segÃºn cÃ³mo estÃ© tu contenedor:

  | Tu instancia en 1.3.0 | QuÃ© hacer |
  |---|---|
  | `MEDIA_DIR` sin definir o `./.dev-media` (la guÃ­a y el `.env.example` de 1.3.0) | Quita `MEDIA_DIR` si la tienes y monta un volumen en `/data` si aÃºn no hay (en Coolify, un persistent storage). No hay nada que rescatar: esa ruta no era escribible y guardar un adjunto, el logo o el icono fallaba. |
  | Volumen en `/data/media`, con `MEDIA_DIR=/data/media` (la nota del `.env.example` de 1.3.0) | No muevas el volumen: 1.4.0 usa esa misma ruta y le arregla los permisos al arrancar. `MEDIA_DIR` ya sobra. Para montarlo en `/data`, como dice la guÃ­a nueva, primero pasa su contenido a una carpeta `media/` dentro del volumen. |
  | `MEDIA_DIR=/data/media` sin volumen | Tus archivos estÃ¡n dentro del contenedor y el redeploy los borra. SÃ¡calos antes de actualizar (`docker cp <contenedor>:/data/media ./media`); con el volumen ya en `/data`, devuÃ©lvelos (`docker cp ./media/. <contenedor>:/data/media`) y reinicia la app para que el contenedor les dÃ© dueÃ±o. |
  | docker compose | Nada: el compose nuevo monta el volumen `vocero_app_data` en `/data`. El de 1.3.0 no montaba volumen para la app, asÃ­ que no habÃ­a archivos guardados. |

  La imagen ya no declara `USER`: `docker exec` entra como root. Para actuar
  como la app, `docker exec -u vocero â€¦`.
- **Variables.** Ninguna obligatoria nueva.
  - `BRAIN_HEALTH_URL` (opcional): el `/health` de tu cerebro externo, p. ej.
    `http://nea:8000/health`, para la tarjeta Â«QuiÃ©n responde a tus
    clientesÂ». Tiene que ser una URL `http://` o `https://` completa; si no
    lo es, la tarjeta lo marca como problema de configuraciÃ³n y el resto de
    la app sigue funcionando ([#74]). VacÃ­a cuenta como no definida.
  - `SOURCE_COMMIT` escrito a mano en la plataforma: si el build no trae su
    propio commit, la barra lo marca Â«commit sin verificarÂ» y `/api/health`
    responde `"commitVerified":false`. QuÃ­talo, o pÃ¡salo como build arg en
    cada build (README â†’ Versiones). La imagen publicada ya trae el suyo.
  - Solo docker compose: `VOCERO_CRM_VERSION` elige la versiÃ³n de la imagen
    (por defecto, la de esta versiÃ³n). Y el compose ahora le pasa a la app
    `CHANNELS`, `AGENDA`, `ATRIBUCION`, `BOT_API_KEY` y `BRAIN_HEALTH_URL`: en
    1.3.0 no le llegaban, asÃ­ que lo que tengas escrito de ellas en tu `.env`
    empieza a surtir efecto.
- **Banderas.** `AGENDA`, `ATRIBUCION` y `CHANNELS` no cambian de nombre y
  siguen apagadas por defecto. Cambia lo que cubre `ATRIBUCION`: de quÃ©
  anuncio llegÃ³ cada conversaciÃ³n (titular, texto, creativo, enlace) se guarda
  y se ve siempre, con o sin la bandera. Sin ella no se guarda el `ctwa_clid`
  ni se le reporta nada a Meta.
- **Override del webhook (cerebro externo o modo agencia).** En 1.3.0, cada
  vez que guardabas la conexiÃ³n en ConfiguraciÃ³n â†’ WhatsApp (o rotabas el
  token) se re-suscribÃ­a la app sin cuerpo, que es como Meta borra el
  override de callback de la WABA. 1.4.0 ya no lo hace, pero no devuelve uno
  que ya se perdiÃ³: revisa `GET /{WABA_ID}/subscribed_apps` y, si falta
  `override_callback_uri`, vuelve a ponerlo con la URL de quien debe recibir
  los webhooks (la llamada estÃ¡ en README â†’ modo agencia, paso 4).
- **Si conectas tu propio cerebro por `/api/bot/*`.**
  - LÃ­mite nuevo: primero se autentica y despuÃ©s se cuenta. Con la llave
    buena hay 1200 llamadas por minuto (antes 600, contadas antes de mirar la
    llave). Las fallidas, sin llave o con una mala, se frenan por IP: pasadas
    30 en un minuto responden `429 rate_limited` (Â«Demasiados intentos
    fallidosÂ») en vez de `401`. Si tu bot recibe ese 429, revisa su llave.
  - `GET /api/bot/availability` sin `limit`, `perDay` ni `days` ahora
    devuelve los defaults del contrato (12 huecos, 3 por dÃ­a, 5 dÃ­as); antes,
    un solo hueco.
  - Lo demÃ¡s es aditivo (`booking` en el contexto, `date` y `query` en los
    huecos): un bot que no lee los campos nuevos no nota nada.
- **Imagen publicada.** `ghcr.io/kevinrivm/vocero-crm:1.4.0`, solo
  `linux/amd64`, con el commit horneado. Es el camino nuevo para instalar
  ([INSTALL-IA.md](INSTALL-IA.md)). Una instancia que construye desde el repo
  puede seguir asÃ­. Si la pasas a la imagen con otra app de Coolify, su
  volumen de `/data` es otro: copia los archivos antes de apagar la vieja.

### Nuevo

- **Resultados** (`/results`, en el menÃº, sin bandera): ventas, origen y
  anuncios, el agente y lo que se estÃ¡ cayendo, contra el periodo anterior.
  Todo sale de la base propia: sin gasto publicitario ni conectores, y el
  Laboratorio no cuenta. Las citas del agente, solo con `AGENDA`. Los dÃ­as se
  cortan en la zona de la agenda; si no hay agenda configurada, en
  `America/Mexico_City`. ([#70])
- **De quÃ© anuncio llegÃ³ cada conversaciÃ³n**, sin bandera: marca Â«Anuncio Â·
  titularÂ» y filtro Â«AnunciosÂ» en la bandeja; tarjeta con el creativo, el
  texto y el enlace en el panel del contacto y en el cajÃ³n del trato. La
  imagen del creativo se copia al volumen (solo de hosts de Meta, hasta
  300 KB). Solo WhatsApp. ([#67])
- **Calendario de Citas** (con `AGENDA`): vistas DÃ­a, Semana, Mes y Lista en
  la zona del negocio, panel de la cita con Â«Abrir conversaciÃ³nÂ», reprogramar
  con todos los huecos de la ventana y bloquear un horario tocando la
  rejilla. `GET /api/bookings` acepta `from` y `to` (hasta 92 dÃ­as); sin
  ellos responde igual que antes. ([#66])
- **Â«QuiÃ©n responde a tus clientesÂ»**, arriba de la pantalla Agente: el
  agente incluido, tu cerebro externo o los dos, con aviso rojo porque el
  cliente recibirÃ­a dos respuestas. `GET /api/agent/brain-status`. ([#69])
- Para tu bot, con `AGENDA`: `GET /api/bot/context` trae las citas del lead
  (`booking`), y `GET /api/bot/availability` con `date=AAAA-MM-DD` da las
  horas libres de ese dÃ­a, con `query` diciendo hasta dÃ³nde llega lo
  consultado. ([#65], [#71])
- El logo que subes se ve en la barra lateral, en el login y en la vista
  previa de ConfiguraciÃ³n â†’ Marca. ([#64])
- La imagen de Docker se construye en cada PR y se publica en GHCR con cada
  tag. ([#68])
- `/api/health` dice si el commit saliÃ³ del build (`commitVerified`). ([#65])

### CambiÃ³

- La barra lateral es azul marino en los dos temas, y el tema oscuro sube la
  pÃ¡gina un escalÃ³n sobre ella: diÃ¡logos y cajones flotan, su texto pasa AA de
  contraste y el foco por teclado se ve. Con un acento propio claro (verde,
  amarilloâ€¦), la tinta de botones y distintivos pasa de blanco a casi negro
  cuando el blanco no llega a 4.5:1. ([#64], [#72])
- El Agente y Â«IA en esta conversaciÃ³nÂ» usan el mismo interruptor, con el
  pomo dentro de la pista. ([#64])
- El nombre del contacto sigue a su perfil de WhatsApp, salvo que lo haya
  escrito una persona. ([#56])
- `/api/bot/*` autentica antes de contar: 1200 llamadas por minuto con llave
  vÃ¡lida y 30 fallidas por minuto por IP. ([#73])
- `ATRIBUCION` ya no decide si ves el anuncio de origen: solo el `ctwa_clid`,
  la Conversions API y ConfiguraciÃ³n â†’ Anuncios. ([#67])
- La imagen trae `MEDIA_DIR=/data/media` y un entrypoint que deja `/data`
  escribible antes de bajar al usuario de la app. ([#63])
- La insignia de versiÃ³n marca Â«commit sin verificarÂ» cuando el commit no
  saliÃ³ del build. ([#65])
- docker compose usa la imagen publicada, `--build` la construye desde el
  cÃ³digo, y ahora le pasa a la app `CHANNELS`, `AGENDA`, `ATRIBUCION`,
  `BOT_API_KEY` y `BRAIN_HEALTH_URL`.

### Corregido

- Cuando el patrÃ³n de respaldo detecta que el cliente pide un humano, el
  agente le avisa antes del traspaso (Â«Claro, te comunico con una persona del
  equipo. En breve te responden.Â»); antes lo traspasaba sin mandarle nada.
  ([#65])
- El agente incluido reserva el horario que el cliente elige; antes no
  acertaba el instante y la conversaciÃ³n entraba en bucle. ([#54])
- A un contacto sin telÃ©fono (solo BSUID) se le responde; antes Meta
  devolvÃ­a 131026. ([#57])
- Con Postgres fuera de UTC, un saliente enseÃ±aba otra hora en el hilo que en
  la lista. Las filas escritas antes conservan su valor; en Docker nunca
  pasÃ³. ([#58])
- En la instalaciÃ³n por defecto, guardar un adjunto, el logo o el icono
  fallaba por permisos. ([#63])
- Guardar la conexiÃ³n de WhatsApp, o rotar el token, borraba el override de
  callback de la WABA y dejaba sin mensajes a un cerebro externo. ([#63])
- La prueba de conexiÃ³n de Google Calendar daba 403 con credenciales
  correctas, y un cambio de credenciales de Google o Zoom tardaba hasta una
  hora en surtir efecto. ([#55])
- A Â«Â¿maÃ±ana en la tarde?Â» tu bot solo veÃ­a las primeras horas del dÃ­a:
  `/api/bot/availability` ignoraba `date`. ([#71])
- `GET /api/bot/context?waIdentity=bsuid:â€¦` respondÃ­a 404 a quien escribiÃ³
  primero con telÃ©fono. ([#73])
- 600 llamadas por minuto sin llave dejaban a tu bot en 429. ([#73])
- Calendario: el bloqueo tomaba la hora del navegador, reprogramar ofrecÃ­a
  solo 12 huecos, cada evento recalculaba la disponibilidad y la lista se
  quedaba en las Ãºltimas 200 citas. ([#66])
- El pomo del interruptor del Agente no se veÃ­a y, encendido, se salÃ­a de la
  pista. ([#56], [#64])

Gracias a @Diony7004, @federicorv25, @fondeur27-09-73, @dev-bahari,
@davidcaroo y @dean-wya por los reportes, los diagnÃ³sticos y el cÃ³digo.

## 1.3.0 y anteriores

Sin entrada aquÃ­: lo anterior estÃ¡ en el tag
[`v1.3.0`](https://github.com/kevinrivm/vocero-crm/tree/v1.3.0) (2026-09-01).

[#54]: https://github.com/kevinrivm/vocero-crm/pull/54
[#55]: https://github.com/kevinrivm/vocero-crm/pull/55
[#56]: https://github.com/kevinrivm/vocero-crm/pull/56
[#57]: https://github.com/kevinrivm/vocero-crm/pull/57
[#58]: https://github.com/kevinrivm/vocero-crm/pull/58
[#63]: https://github.com/kevinrivm/vocero-crm/pull/63
[#64]: https://github.com/kevinrivm/vocero-crm/pull/64
[#65]: https://github.com/kevinrivm/vocero-crm/pull/65
[#66]: https://github.com/kevinrivm/vocero-crm/pull/66
[#67]: https://github.com/kevinrivm/vocero-crm/pull/67
[#68]: https://github.com/kevinrivm/vocero-crm/pull/68
[#69]: https://github.com/kevinrivm/vocero-crm/pull/69
[#70]: https://github.com/kevinrivm/vocero-crm/pull/70
[#71]: https://github.com/kevinrivm/vocero-crm/pull/71
[#72]: https://github.com/kevinrivm/vocero-crm/pull/72
[#73]: https://github.com/kevinrivm/vocero-crm/pull/73
[#74]: https://github.com/kevinrivm/vocero-crm/pull/74
