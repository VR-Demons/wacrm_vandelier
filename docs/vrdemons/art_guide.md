# Guía de Estilo Visual - Vandelier AI

Esta guía de estilo documenta los colores, fuentes, iconos, animaciones y efectos visuales de la interfaz de la página de aterrizaje (Landing Page) y del sistema en general.

## 1. Tipografía

La aplicación utiliza la fuente **Outfit** obtenida de Google Fonts.
- **Fuente Principal:** `Outfit`, sans-serif
- **Pesos Utilizados:** 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)

## 2. Paleta de Colores

El sistema usa una temática oscura ("Dark Theme") con una paleta de colores rojos para brindar acentos y advertencias, en contraste con grises/pizarras oscuros.

### Colores Base
- **Fondo (Dark / Slate 950):** `#020617`
- **Superficie (Surface / Slate 900):** `#0f172a`
- **Texto Principal (Slate 50):** `#f8fafc` o `#ffffff`

### Colores Primarios y Secundarios
- **Primary (Red 500):** `#ef4444`
- **Primary Light (Red 400):** `#f87171`
- **Primary Dark (Red 700):** `#b91c1c`
- **Secondary (Red 300):** `#fca5a5`
- **Secondary Light (Red 100):** `#fee2e2`

### Colores de Estado y Acentos
- **Accento (Amber):** `#f59e0b`
- **Peligro / Danger (Red):** `#ef4444`
- **Éxito / Success (Emerald):** `#10b981`
- **Resaltado / Highlight (Purple 500):** `#a855f7`

## 3. Componentes Visuales y Efectos

### Efectos de Cristal y Superficies (Glassmorphism)
Los contenedores principales, como las tarjetas de características en la página de inicio, utilizan un fondo semitransparente con desenfoque para dar un efecto de profundidad.
- **Fondo de tarjeta:** `bg-slate-900/40 backdrop-blur-md`
- **Bordes:** `border border-slate-800`, transiciones al pasar el cursor `hover:border-secondary/50`.

### Destellos y Sombras (Glows & Shadows)
La estética destaca el color primario usando sombras para dar la sensación de iluminación de neón.
- **Botones y Texto Destacado:** `drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]`
- **Iconos y Contenedores:** `shadow-[0_0_15px_rgba(239,68,68,0.1)]` y sombras de interacción mayores reactivas al ratón `hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]`.

### Iconografía
El proyecto implementa un set de iconos personalizados SVG importados desde `./Icons`:
- `SendIcon`
- `CheckCircleIcon`
- `ClockIcon`

**Estilos Comunes de Iconos:**
- Tamaño base: `w-7 h-7` (aprox. 28x28px).
- Fondo del contenedor de ícono: `bg-slate-800 rounded-xl`.
- Color principal: Heredado como `text-primary`.
- Animaciones interactivas: `group-hover:scale-110` para aumentar la escala un 10% cuando se pasa el ratón por encima del contenedor padre.

## 4. Animaciones CSS y Clases Keyframes

Las animaciones personalizadas definidas en la configuración (`tailwind.config.js`) se asocian con prefijos `animate-`:

- **Fade In Up (`animate-fade-in-up`)**: Revelación de elementos moviendo suavemente hacia arriba (`fadeInUp 0.8s ease-out forwards`).
- **Float (`animate-float`)**: Animación cíclica e infinita de 6 segundos que sumerge y eleva un objeto para dar la ilusión de estar flotando (`float 6s ease-in-out infinite`).
- **Pulse Glow (`animate-pulse-glow`)**: Intermitencia y cambios en el brillo de una fuente de luz o aura cada 2 segundos (`pulseGlow 2s infinite`).
- **Blob**: Efecto en bucle asimétrico para formas abstractas (`blob 7s infinite`).

## 5. Animación de Fondo (Partículas interactivas - LandingPage)

El componente `LandingPage.tsx` utiliza una animación de fondo atractiva e interactiva de vértices a través del motor `@tsparticles/react`.

### Detalles de renderizado
- **Color de fondo base:** `#020617`.
- **Desempeño:** Tasa de cuadros limitada a 120 FPS (`fpsLimit: 120`) y detección de pantallas retina activada.
- **Densidad:** 80 partículas con una proporción de área de densidad ajustada a 800 píxeles adaptables a la pantalla.

### Comportamiento de las Partículas (Nodos)
- **Visualización:** Nodos de forma circular con un tamaño variante entre 1 y 5 píxeles con 50% de opacidad (`0.5`). Color blanco (`#ffffff`).
- **Líneas Conectoras (Links):** Red que une nodos cercanos; se dibujan líneas blancas hasta una distancia de 150px, un ancho de 1px y 50% de opacidad.
- **Movimiento Autónomo:** Las partículas viajan libremente con una velocidad de `2` y "rebotan" (`outModes.default: "bounce"`) cuando tocan el margen del navegador. No avanzan sólo en líneas rectas y no son aleatorias en cada cuadro.

### Interacción de las Partículas con el Usuario
- **Efecto Hover (Repulse):** Al posicionar y mover el ratón sobre la ventana, se crea un campo repelente ("repulse"). Las partículas se apartan del puntero si están dentro de un radio de `200px` de forma temporal con una duración de transición de `0.4` segundos.
- **Efecto Click (Push):** Al hacer clic, se expulsa una ráfaga que crea e integra `4` partículas de manera localizada.
