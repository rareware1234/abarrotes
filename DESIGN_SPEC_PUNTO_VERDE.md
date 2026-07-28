# PUNTO VERDE — Especificación de Diseño y Comportamiento

**Para el agente que porta a React/Vite.**

Esto NO es una guía de código ni de stack. Es la fotografía completa de cómo se ve, cómo se mueve y cómo se siente la app Swift. Si tu versión React respeta esta espec, la app web se sentirá Punto Verde — sin importar la librería que uses.

Cada vez que tengas una decisión de diseño abierta ("¿qué tipografía? ¿qué espacio? ¿qué animación?"), **vuelve a este documento**. No improvises por defecto a Bootstrap, no uses Material UI sin ajustar, no dejes nada con look genérico.

---

## 0. Filosofía visual

El producto es un **POS para tiendas de barrio mexicanas**. La inspiración visual es deliberada:

1. **Apple Music + iOS 26 + macOS Tahoe.** Browses horizontales de cards, "ventanas" con gradient diagonal, sombras suaves, Liquid Glass donde aplique. Si dudas si algo se ve bien, abre Apple Music y mira la sección "Examinar" — es la referencia directa.
2. **Calidez mexicana sin caer en lo cliché.** Verde de Punto Verde (`#0F4D2E` / `#1A7A48`), tomate rojo (`#E63946`), amarillo cálido (`#F0A500`). Nada de degradados pastel, nada de azul corporate insulso.
3. **Multi-tenant.** La app es un *shell* — los colores, logos y assets cambian según la empresa activa (Punto Verde, Party Kids, próximamente un despacho jurídico). El SHELL siempre es el mismo; solo cambia el branding.
4. **Cards densos pero respirables.** Cada card tiene datos reales (no decorativos), tipografía gruesa para los números, etiquetas pequeñas en tracking alto para los labels. Padding generoso (16-20px lateral, 16-22px vertical).
5. **Glass + sombras grandes y suaves.** No hay sombras duras de 2px. Cuando un card tiene sombra es `color: black/0.18, blur: 14, y: 6`. Para elementos elevados (FAB, sidebar pill flotante) la sombra crece a `radius: 24, y: 8` con un `0.30` de opacidad.
6. **Estados visibles.** Loading = ProgressView blanco centrado. Empty = ilustración + texto motivacional. Error = card rojo translúcido con `red.opacity(0.55)` y texto blanco.

---

## 1. Sistema cromático

### 1.1 Paleta core Punto Verde

| Token | Hex | Uso |
|---|---|---|
| `--pv-verde-oscuro` | `#0F4D2E` | Gradiente `colorDark` de la marca. Header, sidebar Mac, splash. |
| `--pv-verde-medio` | `#1A7A48` | Gradiente `color`. Botones primarios, tab activo, brand fill. |
| `--pv-verde-lima` | `#4ADE80` | Success state. Status dot "Abierto". |
| `--pv-tomate` | `#E63946` | Mascot color. Destructivo. Badges oferta. |
| `--pv-ambar` | `#F0A500` | Warning. Status dot "Cotización". Badge "stock bajo". |
| `--pv-negro` | `#1C1E21` | Texto principal sobre fondo claro. |
| `--pv-bg` | `#F4F5F7` | Fondo neutro de la app (lo que se ve en zonas blancas tipo perfil). |
| `--pv-surface` | `#FFFFFF` | Cards blancos sobre el bg neutro. |
| `--pv-border` | `#E4E6EA` | Línea sutil de borde de card. |
| `--pv-text-muted` | `#6B7C93` | Texto secundario, captions. |

### 1.2 Color por rol (cuando NO hay empresa activa custom)

| Rol | colorDark | color | Uso |
|---|---|---|---|
| `staff` | verde oscuro / color del formato | verde medio / color del formato | Staff hereda el color del formato de su tienda asignada. |
| `manager` | `#1B4D8B` | `#2E6BC4` | Azul corporate. |
| `admin` | `#3A4150` | `#64748B` | Gris pizarra. |

> **El gradiente "ventana"** que cubre toda la pantalla SIEMPRE es `linear-gradient(to bottom right, colorDark, color)`. Si una pantalla principal no tiene este gradiente atrás, está incompleta.

### 1.3 Color por formato de tienda

| Formato | color | colorDark | Mascota |
|---|---|---|---|
| Punto Verde (`PV`) | `#0F4D2E` | `#0A381F` | Tomate. |
| Punto Verde GO | `#F0A500` | `#C68600` | Tomate amarillo. |
| Punto Verde XL | `#1A1A1A` | `#0E0E0E` | Tomate sobre negro. |

> **GO usa texto OSCURO** (verde oscuro de la marca) sobre el amarillo, no blanco. Es una excepción que aplica a CADA card formato GO en toda la app — los stats, el nombre de la tienda, los labels, todo en `#0F4D2E`.

### 1.4 Multi-empresa

Cada empresa tiene sus propios `color`, `colorDark` y `assetKit`. El gradiente ventana, el sidebar Mac, el chrome de los headers — todo respeta la empresa activa. Cuando el admin entra a Party Kids con `color = #FF3D8B / colorDark = #0A0A0F`, **toda la app pinta rosa neón sobre negro**.

**Reglas:**
- El portal de empresa (login → picker) muestra avatares circulares con cada empresa.
- Cuando el admin elige, la sesión arranca con el empresa cargada — todos los queries filtran por `empresaId`.
- El switch entre empresas re-monta la navegación principal (equivale a un "soft restart") — los datos siempre vienen frescos de Firestore filtrados.

---

## 2. Tipografía

**Sistema:** SF Pro (iOS/macOS) → en web usa `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`. Para los formatos especiales (Party Kids = Fredoka One + Nunito), respetar el `font-family` que viene en el `assetKit` de la empresa.

### Jerarquía canónica

| Rol | Tamaño | Peso | Tracking | Color |
|---|---|---|---|---|
| **Hero title** | 34pt | 800 (heavy) | 0 | blanco |
| **Page title** | 30-34pt | 800 | 0 | blanco |
| **Section title** | 20pt | 800 | 0 | blanco |
| **Card title** | 16-18pt | 800 (black rounded) | 0 | blanco / cardTextColor |
| **Subtitle** | 12-14pt | 500-600 (medium/semibold) | 0 | blanco @ 0.65-0.85 |
| **Label uppercase** | 9-11pt | 800 (heavy) | 0.7-1.2 | blanco @ 0.62-0.78 |
| **Stat value** | 16-24pt | 900 (black) + design rounded | 0 | blanco / cardTextColor |
| **Stat label** | 8-10pt | 800 + uppercase | 0.9-1.2 | blanco @ 0.65-0.75 |
| **Body** | 14pt | 500 | 0 | textDark |
| **Caption / footer** | 10-11pt | 500-600 | 0 | textMuted |

### Reglas inviolables
- **Los números siempre son `font-weight: 900` con `font-feature-settings: "tnum"` (tabular nums) y `font-variant-numeric: tabular-nums`**. Sin esto, en cards con varios stats las cifras "bailan" cuando cambia el valor.
- Los labels en TODA CARTA son `text-transform: uppercase; letter-spacing: 0.07em; font-weight: 800`. Tracking alto en labels chicos es lo que da el feel de Apple Music.
- **Nada con `font-weight: 400`** en la UI principal. El peso mínimo es 500 (medium).
- Para `cardTextColor`, en formatos GO usa color oscuro `#0F4D2E`, en el resto blanco.

---

## 3. Spacing y radios

### Spacing scale
```
xs: 4px    sm: 8px    md: 12px    base: 16px    lg: 20px    xl: 24px    xxl: 32px
```
Usar EXACTAMENTE estos valores. NO inventar `15px`, `18px`, `22px` — siempre uno de estos.

### Radius
```
sm: 6px    md: 10px    lg: 14px    xl: 20px    full: 999px
```
- Cards: `xl` (16-20px). Headers grandes con corner radius arriba: `xl`.
- Botones grandes: `full` (capsule). Botones medianos: `md` (10px).
- Avatares: `full`.
- Status pills / chips: `full`.
- Glass overlays / sheets: `xl`.

### Padding canónico de cards
- Card grande (240×240): `padding: 16px`.
- Card brand de empresa: `padding: 24px 20px`.
- Card de stat con label: `padding: 12px 14px`.
- Hero header de página: `padding: 16px 20px 24px`.

---

## 4. Layouts canónicos

### 4.1 Layout BROWSE (Apple Music)

Es el patrón visual más importante de la app. Lo usa Inicio, Sucursales, Productos, Proveedores, Stock.

**Estructura:**
```
[ Fondo: gradient diagonal a pantalla completa ]
[ Hero ]
   - Page title (34pt heavy blanco)
   - Subtítulo (14pt medium blanco/0.7)
   - KPI pills horizontales (opcional)
[ VStack spacing 32px ]
   [ Row "Formatos" / "Marcas" ]
       - Header con título 20pt + chevron + descripción 12pt
       - ScrollView horizontal de cards (310×320 brand cards)
   [ Row "Top X" ]
       - Header
       - ScrollView horizontal de cards 240×240
   [ Row "Sección 1" ]
   [ Row "Sección 2" ]
   ...
```

**Cada row:**
- Padding lateral 20px en el header.
- ScrollView con `scroll-clip: none` para que los cards "se asomen" en el borde derecho.
- Cards con `spacing: 12px` entre ellos.
- Padding lateral 20px dentro del scroll para que el primer card respire del borde.

**Header de row:**
```
[ Título "20px heavy blanco" ] [chevron right 13px heavy blanco/0.65]
[ Descripción "12px medium blanco/0.65" ]                  [conteo "12px semibold blanco/0.65"]
```
El header completo es CLICKABLE — al tocarlo navega al detalle de la sección (grid completo de cards).

### 4.2 Layout DETAIL DE SECCIÓN

Push desde un row del browse. Mismo gradient como fondo. Header con el nombre de la sección 30pt heavy. Debajo, **LazyVGrid adaptivo** con cards 240-280 minimum, separados 12px. Padding lateral 20px.

### 4.3 Layout MASTER-DETAIL (sucursal/empleado/etc.)

Push desde una card. Hero card grande arriba (gradient del color del item, watermark con logo de la marca, datos centrales). Debajo, lista de secciones tipo `Configuración` de iOS:
- Header de sección en `tracking: 0.07em, weight: 800, color: blanco/0.62`.
- Group de rows blancos (rounded card 14px), cada row con icon-circle a la izquierda + título + subtitle + chevron right.

### 4.4 Layout POS (especial)

**Split-view:**
- **Izquierda (60%)**: lista de productos en grid 2-3 cols. Cada card cuadrado con imagen del producto arriba, nombre 14px semibold, precio 16px bold abajo. Tap = agrega al carrito con animación de "bump".
- **Derecha (40%)**: carrito. Lista vertical con ítems, cada uno con thumbnail 40×40, nombre, cantidad (-/+), subtotal. Abajo total grande 28pt heavy. Botón principal "Cobrar" full width con gradient del rol activo + capsule shape.

**Píldora flotante de checkout en iPhone:**
- Vive arriba del tab bar en una capa "bottom accessory".
- 56px de alto, full width menos padding 16px lateral.
- Muestra "Carrito · 3 items" + "$245" + chevron.
- Tap = abre el sheet de pago.

### 4.5 Layout PAYMENT SHEET

Modal grande presentado como sheet con detents `medium` y `large`.
**Estructura:**
1. Header: total grande 48pt heavy + capsule "Aceptamos varios métodos" 12pt.
2. ScrollView horizontal de **method buttons**:
   - Cada uno es un card 90×120 con gradient del método (efectivo=verde, tarjeta=azul, tap to pay=morado, apple pay=negro, transferencia=teal).
   - Ícono SF Symbol grande arriba blanco, nombre del método debajo 12px heavy blanco uppercase.
3. Si el método elegido es efectivo: panel debajo con teclado numérico + sugerencias rápidas (`$200`, `$500`, `$1000`, `Exacto`).
4. Botón "Cobrar" abajo full width con gradient del método.

---

## 5. Componentes signature

### 5.1 BRAND CARD (de empresa)

Card 312×320 con bordes redondeados 18px. Tiene:
- Fondo: gradient diagonal del color → colorDark de la empresa.
- En esquina top-right: logo/wordmark blanco grande (40-60% del card).
- En esquina bottom-left: eyebrow (giro de la empresa) en tracking alto + nombre 22pt heavy + tagline 13px medium.
- Si la empresa está "activa": pill abajo "EMPRESA ACTIVA" con dot verde 6px + texto blanco capsule semi.
- Sombra `cardShadow()`: `color: black/0.22, blur: 14, y: 6`.
- Stroke 1pt blanco/0.18 sobre el corner radius.

### 5.2 TIENDA BRAND CARD

Card 240×240 (o 312×208 cuando es "wide" en row top).
- Fondo: gradient del FORMATO de la tienda (PV verde, GO amarillo, XL negro).
- Watermark del logo en esquina TR (40% opacidad).
- Padding 16px.
- Top: nombre tienda 20px heavy + ciudad/estado 11px semibold/0.75.
- Center: alerta pill si hay stock bajo (capsule amber).
- Bottom: 2 stats compactos lado a lado (valor 16-18pt black rounded + label 8-9pt heavy tracking 0.9):
  - "VALOR INV." | "SKUs BAJOS"  (en Stock)
  - "VENTAS HOY" | "PROM. MENSUAL"  (en Sucursales)
- Esquina bottom-right: badge del formato (PV círculo, GO pastilla, XL pastilla horizontal).
- Status pill arriba TR (cuando la caja está abierta o hay alerta).
- Tap = navega al detail de la tienda.

### 5.3 KPI CARD (Inicio)

Cards rectangulares horizontales, 1 col en iPhone, 2 en iPad, 4 en Mac.
- Fondo blanco con shadow soft `black/0.08, radius: 12, y: 4`.
- Padding 16-20px.
- Layout: ícono circle 38×38 colored a la izquierda + título 11pt heavy uppercase + valor 22pt black rounded + delta (12pt medium green/red con flecha).

### 5.4 EMPLEADO AVATAR

Circular con:
- Si tiene foto: imagen recortada a círculo.
- Si NO: iniciales 2 letras (`primera del nombre + primera del apellido`), tipografía rounded 800 sobre fondo del color del rol (gradient diagonal).
- Stroke 1.2pt blanco/0.4 alrededor del círculo.
- Tamaños estándar: 34 (header), 36 (sidebar footer), 96 (perfil hero).

### 5.5 STATUS DOT + PILL

Dot circular 6-8px de color (verde abierto / rojo cerrado / amber cotización) + texto pequeño en capsule semi-translucent.
- Capsule: `background: white/0.18`, `border: white/0.28 0.6pt`, padding `7px horizontal 3px vertical`.
- Texto: `10pt heavy rounded` uppercase blanco.

### 5.6 FILTER CHIPS

Capsule horizontal scrolleable.
- No seleccionado: `background: white/0.10`, `border: white/0.20 1pt`, texto `12pt heavy blanco`.
- Seleccionado: `background: white/0.25`, `border: white/0.55 1pt`.
- Transition al cambiar selección: spring 0.25s response.

### 5.7 SECTION HEADER (en list/detail)

Pre-encabezado tipo iOS Settings.app:
- Texto `11pt heavy tracking 0.07em` color `white/0.62`.
- Padding lateral `4px`, padding bottom `-4px` (queda pegado a las cards de abajo).

### 5.8 CONFIG ROW (en gestión de empresa/tienda)

Card blanca rounded 14px con stack vertical de rows separados 1px:
- Icon circle 36×36 a la izquierda (color tinted del rol/empresa, opacity 0.18 fill, ícono sólido del color de la empresa).
- Título 15pt semibold textDark + subtitle 12px medium textMuted.
- Chevron right 13pt heavy textMuted/0.55 a la derecha.
- Padding `12px vertical, 16px horizontal`.
- Background `white` (no transparente) con shadow `black/0.04, radius: 8, y: 4`.

### 5.9 GLASS PANEL

Sobre cualquier gradient ventana:
- `background: white/0.10`, `border: white/0.22 1pt`, `border-radius: 18px`.
- Cuando hay scroll: `backdrop-filter: blur(20px)` (Liquid Glass).
- Padding interno 16-20px.

---

## 6. Animaciones y micro-interactions

### 6.1 Springs canónicos

| Caso | response | dampingFraction |
|---|---|---|
| Card tap feedback | 0.28 | 0.7 |
| Section expand/collapse | 0.35 | 0.85 |
| Sheet present/dismiss | (default sheet) | — |
| Filter chip select | 0.25 | 0.78 |
| Sidebar open/close (Mac) | 0.35 | 0.85 |
| Mascota bump al agregar al carrito | 0.4 | 0.6 |

En CSS web esto se traduce a `transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)` (para springs response 0.28 damping 0.7 — el "bouncy" estándar).

### 6.2 Hover (Mac/web desktop)

- Cards: escala `1.04`, shadow se intensifica (`y: 8 → 10`, blur: `14 → 18`).
- Botones: opacity baja a `0.85`.
- Avatares en picker: borde stroke pasa de `0.35` a `0.85` opacity, sombra crece de `radius: 6` a `radius: 14`.

### 6.3 Pressed / active

- Escala `0.96`.
- Opacity `0.85`.
- Si tiene gradient, oscurece a `colorDark`.

### 6.4 Page transitions

- Push de un detail: slide-in desde la derecha 0.4s ease-out.
- Pop de un detail: slide-out a la derecha 0.35s ease-in.
- Cambio de empresa: fade out toda la app 0.3s → mount nueva con fade in 0.4s.

### 6.5 Header fade al scroll

En iPhone, el header de página (título + avatar + acción) se desvanece progresivamente al hacer scroll hacia abajo.
- En el primer 80px de scroll, opacity baja de 1.0 → 0.0.
- Cuando llega a 0, deshabilitar pointer events para que el contenido debajo sea clickable.
- Al volver al top, fade-in suave.

### 6.6 Tab bar minimize (iOS 26)

En iOS 26+: la tab bar se minimiza al hacer scroll DOWN y reaparece al hacer scroll UP. El estilo es `liquid glass` flotante.
En web esto se replica como: tab bar con `position: fixed; bottom: 0` que `translateY(100%)` cuando scroll-direction es down, `translateY(0)` cuando es up. Con `transition: transform 0.25s ease`.

### 6.7 Loading states

- `ProgressView()` circular blanco centrado verticalmente, padding 80px arriba/abajo. NO usar barras de progreso ni skeletons genéricos.
- Cuando el card específico carga, mostrar el card en estado "shimmer" sutil (animación de gradient blanco-translúcido de izquierda a derecha, 2s loop).

### 6.8 Confetti / celebración

Al confirmar un pago aprobado:
- Sheet de éxito con bounce spring 0.6 response 0.5 damping.
- Ícono check verde 80px con animación scale 0 → 1.2 → 1 (overshoot).
- Texto "APROBADO" 28pt black uppercase verde.
- Pequeño confetti animado (10-15 partículas) cayendo 1.5s.
- Cierre automático del sheet a los 2.5s con fade.

### 6.9 Brand color morph (portal de empresa)

Al pasar el mouse sobre un avatar de empresa en el portal, el fondo de la pantalla COMPLETO morphea al color de esa empresa. Animación `easeInOut 0.45s`. Al alejar el mouse, vuelve al gris pizarra default 0.45s.

---

## 7. Estados de UI

### 7.1 Loading

ProgressView blanco circular centrado. Texto opcional debajo "Cargando..." 12pt medium blanco/0.7.

### 7.2 Empty state

Card centrada (o full-screen tipo `ContentUnavailableView`):
- Ícono SF Symbol grande 48-72px blanco/0.5.
- Título 18pt heavy blanco.
- Descripción 13pt medium blanco/0.7.
- CTA opcional capsule abajo.

Ejemplos:
- Stock sin productos: "Esta sucursal aún no tiene productos" con `tray` icon.
- Búsqueda sin resultados: "Sin coincidencias" con `magnifyingglass`.
- Sin acceso: "Sin acceso. Necesitas ser administrador" con `lock.fill`.

### 7.3 Error

Banner rojo translúcido encima del contenido:
- `background: red/0.55`.
- `border-radius: 12px`.
- Padding 12px.
- Texto blanco 13pt semibold.
- Auto-dismiss a los 4s O persiste hasta que el usuario actúe.

### 7.4 Success

Mismo formato que error pero con `background: green/0.55` y check mark icon a la izquierda.

### 7.5 Confirmación destructiva

`confirmationDialog` (en web: modal centrado de 320px de ancho):
- Título: pregunta directa "¿Eliminar empresa?"
- Mensaje: "Esta acción no se puede deshacer." (siempre incluir esa frase)
- Dos botones: "Cancelar" (capsule blanca con borde gris) + "Eliminar" (capsule roja sólida, texto blanco).

---

## 8. Por feature — qué tiene cada pantalla

> Para cada feature: **prioriza el lenguaje visual SOBRE la funcionalidad**. Mismo gradient, mismo browse pattern, mismas cards. La función la vas a entender leyendo el código Swift; el LOOK es lo que se está perdiendo.

### 8.1 LOGIN

**Look:**
- Fondo: gradient verde de Punto Verde a pantalla completa.
- Centro: card glass 400×500 con:
  - Logo wordmark blanco arriba (180×30).
  - Mascota (tomate) 80×80 al lado.
  - Form con 2 campos: `Núm. Empleado` + `Contraseña`. Inputs glass blancos/0.14 con borde blanco/0.22.
  - Botón "Entrar" capsule grande full width gradient verde.
  - Link pequeño "¿Olvidaste tu contraseña?" texto blanco/0.7 subrayado.
- Versión + footer "Tlalpan Studios" abajo en pequeñito blanco/0.35.

**Animaciones:**
- Mascota bounce ligero (spring infinito 3s) que la hace subir/bajar 4px.
- Botón "Entrar" loading: gira flecha → spinner.
- Error: shake del card 0.4s ease (translateX -10 / 10 / -10 / 0).

### 8.2 PORTAL DE EMPRESA (admin)

Solo para admin después del login. Si el rol NO es admin, salta directo a `/inicio`.

**Look:**
- Fondo: gradient gris pizarra (`#11161C → #232938`) que MORPHEA al color de la empresa que el mouse hovereea.
- Header centrado: "¿En cuál vas a operar?" 26pt heavy blanco + "Selecciona la empresa para entrar a su panel." 14pt medium blanco/0.65.
- ScrollView horizontal con avatares de empresa:
  - Círculo 130×130 con gradient de la empresa.
  - Logo emblema centrado 90×90 (con clip a círculo).
  - Stroke 1.5pt blanco/0.35. Al hover crece a 3pt blanco/0.85.
  - Glow shadow color empresa.color/0.45 radius 6 → 14 → 22 según estado (idle/hover/pending).
  - Debajo: nombre 16pt heavy + giro 11pt semibold/0.65.
- Footer: "Conectado como [nombre]" 12pt medium blanco/0.55.
- "Punto Verde · Tlalpan Studios" 10pt semibold tracking blanco/0.35.

**Comportamiento:**
- Click avatar → spring escala 1.08 + glow 22 + 320ms pause → mount de la app temada para esa empresa.
- Mientras la animación corre, deshabilita los otros avatares.

### 8.3 INICIO (Dashboard)

**Para staff:**
- Header con nombre del empleado + tienda asignada + status caja abierta.
- KPIs: "Mi venta hoy" / "Mis horas trabajadas" / "Comisión".
- Charts: línea de "Mis ventas últimos 7 días".
- Browse: "Productos top que vendo" / "Tareas pendientes".

**Para manager/admin:**
- Header "Hola, [nombre]" + subtitle "[empresa activa]".
- Hero KPIs (4 cards en grid 2x2 iPhone, fila 4 en iPad/Mac):
  - Ventas hoy | Ventas mes | # Sucursales | Empleados activos.
- Browse:
  - Row "Top sucursales" (cards horizontales).
  - Row "Productos top" (cards de producto con thumbnail).
  - Row "Categorías" (cards de categoría a color).
  - Row "Acciones rápidas" (chips capsule: Nueva sucursal / Nuevo empleado / Reporte / etc.).
- Charts grandes:
  - Donut "Ventas por formato".
  - Barras horizontales "Top 10 sucursales por ventas".
  - Línea suave (curveCardinal) "Ventas últimos 30 días" con gradient fill abajo del trazado.

**Detalles importantes:**
- Cada chart usa `Chart` de SwiftCharts en Swift; en web usa Chart.js con `responsive: true, maintainAspectRatio: false`.
- Sin grid lines duras — `grid: { display: false }` o muy sutiles `color: 'rgba(255,255,255,0.08)'`.
- Tooltips estilo glass.
- Animación de carga: bars crecen 0.8s ease, line dibuja 1.2s con `stroke-dasharray`.

### 8.4 SUCURSALES

**Estructura visual:**
- Header "Sucursales" 34pt heavy blanco + total "N sucursales" 13pt medium blanco/0.7.
- Avatar circular pequeño (empleado actual) + botón "+" liquid glass arriba derecha.
- **Browse:**
  - Row "Formatos" (3 cards 160×200 con gradient del formato + badge logo: PV, GO, XL).
    - Cada card tap → push a detalle del formato (lista de tiendas de ese formato).
    - Card "+ Nuevo formato" al final (dashed border, glass) → sheet de creación.
  - Row "Top sucursales" (cards 312×208 wide ordenadas por venta).
  - Row "En operación" (cards 240×240 cuadrados).
  - Row "Cerradas" (cards 240×240).
  - Row "Cotizaciones" (cards 240×240 con watermark de tomate cortado encima para diferenciar).
  - Row "Todas" (catch-all).

**Detail de tienda:**
- Hero card grande con gradient del formato + nombre + ubicación + status pill.
- Stat bar: Empleados activos | Caja abierta | Ventas hoy.
- Section "Configuración" con rows: Editar identidad / Horarios / Empleados asignados / Productos / etc.
- Section "Zona peligrosa" con "Eliminar sucursal" (rojo).

**Cards de cotización** tienen un tomate gigante 221×221 en esquina top-right (offset visual notable) para diferenciar visualmente de una sucursal real. Color amber en el status.

### 8.5 STOCK

Similar a Sucursales pero los KPI de las cards muestran:
- "VALOR INV." (suma de unidades × precioVenta).
- "SKUs BAJOS" (productos donde stock ≤ minimo o stock == 0).

**Row "Mayor inventario"** ordena tiendas por valor de inventario DESC.

**Detail de tienda Stock:**
- Hero: nombre + 4 KPIs grid 2x2 (Valor / SKUs / Stock bajo amber / Sin stock rojo).
- Filtros chips: Todos | Bajos | Sin stock.
- SearchBar glass.
- Lista de productos con:
  - Thumbnail 42×42 (placeholder si no hay imagen).
  - Nombre + código + categoría.
  - Valor de stock a la derecha grande: si stock == 0 rojo "AGOTADO", si bajo amarillo "BAJO MÍNIMO", si OK blanco "EN STOCK".

### 8.6 PRODUCTOS

**Browse:**
- Row "Categorías" (cards a color full con ícono SVG centrado + nombre debajo).
  - Categorías estándar: Abarrotes, Aceites, Bebes, Bebidas, Café/Té, Carne, Cereales, Congelados, Conservas, Dulces, Embutidos, Especias, Flores, Frutas, Higiene, Huevos, Lácteos, Limpieza, Mascotas, Ofertas, Panadería, Pescado, Pollo, Salsas, Semillas, Snacks, Suplementos, Tortillas, Verduras, Vinos.
  - Cada categoría tiene su SVG colored único.
- Row "Marcas / Proveedores" (cards 312×320 con logo grande del proveedor).
- Row "Top vendidos" (cards de producto con imagen + nombre + precio + badge).
- Row "Stock bajo" (filtro de productos con stock ≤ mínimo).
- Row "Sin movimiento" (sin ventas últimos 30 días).
- Row "Todos los productos" (catch-all).

**Card de producto:**
- 200×260, fondo blanco con shadow.
- Imagen 200×140 arriba (o "Sin imagen" placeholder).
- Padding 12px abajo.
- Nombre 14pt semibold (line-clamp 2).
- Precio 16pt black + tachado del precio anterior si hay descuento.
- Badge esquina top-left si aplica (NUEVO, OFERTA, AGOTADO, etc.) — capsule 47px de alto color sólido.

### 8.7 EMPLEADOS

**Browse parecido a Sucursales pero con cards de empleado:**
- Row "Mi equipo" (de la tienda del manager).
- Row por rol: Managers / Staff.
- Row "Inactivos".

**Card de empleado** (240×240):
- Fondo: gradient del color del rol.
- Avatar grande 80×80 centrado top con ring stroke blanco.
- Nombre completo 16pt heavy.
- Rol pill capsule abajo "MANAGER" / "STAFF".
- Stats: "Num empleado" + "Tienda" + "Status".
- Tap = push a perfil completo.

### 8.8 POS (Venta)

**Layout split** (iPad/Mac):
- Lateral izquierdo (60%): productos.
- Lateral derecho (40%): carrito.

**Productos panel:**
- SearchBar arriba con scanner button (cámara en iPhone, focus al search en Mac/USB scanner).
- Filtros chips de categoría arriba.
- Grid de cards 2-3 cols con producto.

**Carrito panel:**
- Header "Carrito · N items" + botón limpiar.
- Lista vertical de items: thumb 40×40 + nombre + precio + cantidad (-1/+1) + subtotal.
- Footer fijo:
  - "Subtotal" 14pt
  - "IVA 16%" 14pt
  - "TOTAL" 28pt heavy
  - Botón "Cobrar" capsule full width grande gradient color del rol.

**iPhone:**
- Solo se ve la lista de productos.
- Píldora flotante abajo de carrito con thumbnail amontonado + items + total + chevron.
- Tap píldora = abre sheet del carrito con detents medium/large.

### 8.9 PAGOS

ScrollView horizontal de **método cards** (90×120) en `PaymentSheet`:
- Efectivo (verde, ícono `dollarsign.circle`).
- Tarjeta (azul, ícono `creditcard`).
- Tap to Pay (morado, ícono `wave.3.right.circle`).
- Apple Pay (negro, ícono `apple.logo`).
- Transferencia (teal, ícono `arrow.up.arrow.down`).
- Crédito tienda (amber, ícono `clock`).
- QR (gris, ícono `qrcode`).

**Para efectivo:** teclado numérico debajo + sugerencias `$100 / $200 / $500 / Exacto`.

**Para Tap to Pay:**
- Sheet azul gradient.
- Fases: preparing (circle progress 0-100%), ready, awaitingCard (waves animadas saliendo del centro), authorizing (3 dots pulsando), approved (check verde bouncing).
- Footer: "Cifrado de extremo a extremo · PCI CPoC".
- Badge "MODO DEMO" cuando es mock.

**Para Apple Pay:**
- Botón nativo PKPaymentButton (negro con logo Apple).
- En web: usar Apple Pay JS o un botón mock.

### 8.10 CAJA

**Estados:**
1. **Cerrada**: card central "Abrir caja" con icon dollarsign + botón grande verde.
2. **Abierta**: dashboard con:
   - Hero: monto inicial + ventas hasta ahora + monto esperado.
   - Sección "Movimientos del turno": lista de órdenes con hora + monto.
   - Botón "Cerrar caja" capsule rojo abajo full width.
3. **Cerrando**: sheet de "Resumen de cierre" con:
   - Logo Punto Verde wordmark arriba.
   - Tabla con desglose: Efectivo / Tarjeta / Apple Pay / Etc. (cantidad + monto).
   - Total esperado vs total real (input para que el empleado capture lo que contó).
   - Diferencia: verde si cuadra, rojo si falta o sobra.
   - Botón "Confirmar cierre".

### 8.11 ÓRDENES / PEDIDOS

Lista vertical de órdenes recientes. Cada row:
- Fecha/hora a la izquierda.
- Total grande.
- Método pago badge.
- Status pill (completada / cancelada / pendiente).
- Tap = push a detalle con productos vendidos + recibo.

### 8.12 PROMOCIONES

Browse:
- Row "Promociones activas" (cards grandes con imagen banner promo).
- Row "Por categoría".
- Row "Históricas".

Card de promo: imagen banner 1024×1536 ratio 2:3 portrait con texto overlay arriba.

### 8.13 CRÉDITOS

Dashboard:
- KPIs: Total prestado / Por cobrar / Vencidos.
- Row "Clientes con crédito activo".
- Row "Aprobados pendientes".
- Row "Suspendidos".

Card de cliente: nombre + foto + score circular (0-100, color verde/amarillo/rojo según rango) + crédito asignado + utilizado.

### 8.14 PERFIL (avatar tap)

Sheet o página completa:
- Hero: avatar grande 96×96 + nombre + email + teléfono + cápsula del rol.
- Stat bar: # Empleado / Permisos / Status.
- Sólo admin: card "Cambiar empresa" → vuelve al portal.
- Botón rojo "Cerrar sesión" abajo.

### 8.15 EMPRESAS (admin only)

Browse de cards de empresa (cada empresa es un tile como en el portal pero con más data).
Tap = push a `GestionEmpresaView` con:
- Hero card con gradient + logo empresa.
- Section "Identidad": Editar identidad / Establecer como activa.
- Section "Equipo": Crear manager.
- Section "Operación": Sucursales / Productos / Empleados (disabled hasta activar).
- Section "Zona peligrosa": Eliminar empresa.

**Editar identidad sheet:**
- Cards apilados con:
  - Brand preview card 220px alto con el gradient + logo + nombre.
  - Toggle segmented Paleta / Hex.
  - Si Paleta: grid 7 cols de circulitos de color.
  - Si Hex: input `#RRGGBB`.
  - Slider de brightness (-30% / +30%).
  - Inputs: Nombre / Giro / Descripción.
  - Logo picker.
  - Card "Kit de Assets": botón "Cargar carpeta" + reporte.
  - Card "Logos individuales": grid de slots con thumb + botón cambiar.

---

## 9. Detalles que SE PIERDEN al portar genéricamente

Estos son los detalles que el agente está olvidando y por eso te toca corregir:

### 9.1 Tracking de labels
Sin `letter-spacing: 0.07em` en los labels `uppercase`, el feel Apple Music desaparece. Aplicar SIEMPRE.

### 9.2 Tipografía rounded para números
`font-feature-settings: "tnum", "ss01"` + `font-family: "SF Pro Rounded"` (fallback `-apple-system`). Sin esto los stats se ven "demasiado serios".

### 9.3 Cards con sombras grandes pero suaves
Sombras de 14px de blur son la regla. NO sombras 2px tipo Bootstrap.

### 9.4 Gradientes SIEMPRE diagonales (topLeft → bottomRight)
Nada de gradientes verticales `to bottom`. Esto es crítico — es la marca de la casa.

### 9.5 ScrollViews horizontales sin clip
El primer y último card de un row debe "asomarse" — `overflow: visible` en los containers internos. Solo el ScrollView outer tiene `overflow-x: auto`.

### 9.6 Padding 20px lateral (no 16px)
Casi todas las pantallas usan 20px lateral, no 16px. Bootstrap default es 15px → CAMBIAR.

### 9.7 Hero cards con `clipped` y watermarks que se "asoman"
Los watermarks (logo, tomate, balloon de Party Kids) están POSICIONADOS con offset negativo para asomarse por los bordes del card. NO centrarlos.

### 9.8 Status pills con dots animados
El verde "Abierto" pulsa suave (opacity 0.6 → 1 cada 2s infinite). Sin esto se ve estático.

### 9.9 Push transitions deslizando, NO fade
Los detail screens siempre slide-in desde la derecha. Nunca fade-in.

### 9.10 Glass effect cuando hay sheet abierta
Cuando hay un sheet/modal encima de una página, el background recibe `backdrop-filter: blur(20px) brightness(0.7)`. NO un overlay negro 50%.

### 9.11 Botones primarios SIEMPRE capsule full width
Para los CTAs principales (Cobrar, Crear, Guardar), NUNCA un button rectangular. Capsule (border-radius: 999px) full width, padding 14-18px vertical, peso 700+ blanco.

### 9.12 Botones destructivos en card blanca con texto rojo
NO botón rojo sólido. El patrón iOS es: card blanca rounded 14px + ícono y texto rojo dentro. Tap = confirmation dialog.

### 9.13 Inputs glass sobre gradient
Los inputs en sheets nunca son blancos sólidos. Son `background: white/0.14` + `border: white/0.22 1pt` + texto blanco. Placeholder `white/0.5`.

### 9.14 Confirmation dialog con frase fija
Siempre incluir "Esta acción no se puede deshacer" en confirmaciones destructivas.

### 9.15 Avatares: foto O iniciales colored
NUNCA un avatar genérico tipo "user-circle outline". Siempre la foto del empleado O las 2 iniciales sobre el color del rol.

### 9.16 Charts sin gridlines duras
SwiftCharts no muestra gridlines verticales por default y las horizontales son muy sutiles. Replicar.

### 9.17 Currency en es-MX sin decimales
Formato `$1,234,567` (sin centavos). Locale `es-MX`. Símbolo `$` pegado al número.

### 9.18 SF Symbols → usar react-icons (fi, hi, bi)
SF Symbols no existen en web. Usar Heroicons (`@heroicons/react`) o Feather. EVITAR Font Awesome (estilo no encaja).

### 9.19 Apple Pay / Tap to Pay — sin botones genéricos
Si no se puede usar Apple Pay JS, mostrar un mock visualmente correcto con el logo Apple negro.

### 9.20 Cards de tienda con texto OSCURO en GO
Es la excepción más fácil de olvidar. CADA card formato GO (amarillo) usa color `#0F4D2E` para texto, no blanco. Incluso los labels uppercase. Implementar como variable: `text-color: ${formato === 'GO' ? '#0F4D2E' : 'white'}`.

---

## 10. Multi-empresa runtime — cómo se comporta

1. **Login** con `numEmpleado` + password.
2. Si rol == admin → portal de empresa.
3. Si rol != admin → entra directo a su empresa default.
4. La empresa activa se persiste en localStorage como `empresa.activa.id.v1`.
5. **TODOS** los queries Firestore filtran por `empresaId == empresaActivaId`.
6. Al crear cualquier entidad (tienda, empleado, producto), inyectar `empresaId` automáticamente con el ID de la empresa activa.
7. Cambiar de empresa desde el menú perfil = limpiar localStorage de empresa + recargar la app (o emitir evento al store global que re-fetchea todo).
8. **Assets** (logos, mascota, colores) cambian según la empresa. Cada empresa tiene un `assetKit: { logoBlanco: blob, emblema: blob, mascota: blob, ... }`.
9. Si la empresa NO tiene un asset, cae al asset bundled (Punto Verde) SOLO si es la empresa default. Para empresas custom (Party Kids), usar placeholder genérico (cuadro dashed) o un slot vecino del mismo kit (cascade).
10. **Gradiente "ventana"** SIEMPRE usa los colores de la empresa activa (no del rol). Excepción: staff usa el color del formato de su tienda asignada.

---

## 11. Lista corta de "NO HAGAS"

- ❌ NO uses Bootstrap navbar genérico — el header de cada pantalla es CUSTOM.
- ❌ NO uses `btn btn-primary` sin override de color/padding/border-radius. El botón Bootstrap base se ve mal.
- ❌ NO uses `card card-body` Bootstrap — los cards de Punto Verde son completamente custom con gradients.
- ❌ NO uses tablas HTML para listas — usa flexbox con divs estilizados.
- ❌ NO uses modales centrados con backdrop negro — usa sheets que crecen desde abajo con glass blur.
- ❌ NO uses iconos genéricos — usa los SVG del kit de la empresa para las categorías de producto.
- ❌ NO uses sombras duras `box-shadow: 0 1px 2px black` — usa sombras grandes suaves.
- ❌ NO uses gradientes verticales — siempre diagonales topLeading → bottomTrailing.
- ❌ NO uses Material UI's elevation — implementa el shadow custom.
- ❌ NO uses `position: fixed` para headers — usa scroll-fade.

---

## 12. Checklist para auto-revisar tu port

Marca cada uno. Si falla, vuelve y arregla:

- [ ] El fondo de cada pantalla principal es un gradient diagonal verde Punto Verde.
- [ ] Los headers tienen título 34pt heavy blanco + avatar circular pequeño + botón "+" si aplica.
- [ ] Hay rows horizontales con cards 240×240 / 312×320, separados 12px, scroll horizontal con clip disabled.
- [ ] Los stats numéricos en cards usan `font-weight: 900` + rounded + tabular nums.
- [ ] Los labels uppercase tienen `letter-spacing: 0.07em` y `font-weight: 800`.
- [ ] Los cards tienen `border-radius: 18px` y shadow `0 6px 14px rgba(0,0,0,0.18)`.
- [ ] Botones primarios son capsule full width con gradient del rol activo.
- [ ] Los avatares son circulares con foto O iniciales colored sobre fondo rol.
- [ ] El POS tiene split-view en iPad/desktop y carrito-pill abajo en mobile.
- [ ] El sheet de pago tiene scroll horizontal de método cards con colores únicos.
- [ ] Hay portal de empresa para admin con avatares circulares grandes 130×130.
- [ ] El bg morphea al color de la empresa al hover en el portal.
- [ ] Cambiar de empresa recarga la app sin estado residual.
- [ ] Todos los queries filtran por `empresaId`.
- [ ] Party Kids o cualquier empresa custom empieza en ceros (sin sucursales, sin empleados, sin ventas).
- [ ] Los formatos PV/GO/XL tienen color, badge y mascota específicos.
- [ ] Las cards de formato GO usan texto verde oscuro (no blanco) sobre el amarillo.
- [ ] El status pill tiene dot pulsando suave cuando es "Abierto".
- [ ] Las confirmaciones destructivas dicen "Esta acción no se puede deshacer".
- [ ] Las transitions entre pages son slide-in desde derecha, no fade.
- [ ] Loading state usa ProgressView circular blanco centrado, no spinner Bootstrap.
- [ ] Empty states tienen icon grande + título + descripción + CTA opcional.
- [ ] Errors aparecen como banner rojo translúcido con texto blanco semibold.
- [ ] La tab bar/sidebar se ve glass con backdrop-filter blur cuando hay sheet abierto.
- [ ] El tipo de moneda es `es-MX`, formato `$1,234` sin decimales.
- [ ] Los SF Symbols se sustituyeron por Heroicons/Feather, no Font Awesome.
- [ ] No hay tablas HTML básicas — todo es flex/grid divs.
- [ ] No hay modales Bootstrap con backdrop negro 50%.

---

## 13. Cómo se mueve la app — micro-comportamientos

Para que se sienta viva, además del look, estos comportamientos son canónicos:

1. **Tap feedback siempre.** Cada card/botón al hacer `:active` baja a `scale: 0.96` con transition 0.15s ease.
2. **Hover en desktop.** Cards crecen a `scale: 1.04` y shadow se intensifica.
3. **Scroll suave.** `scroll-behavior: smooth` en TODOS los ScrollViews horizontales.
4. **Animaciones de entrada de cards.** Cuando una lista carga, los cards aparecen con stagger: cada uno se desliza desde abajo + fade-in, con delay incremental de 50ms entre cards. Máximo 8 cards animados (después de 8, aparecen al mismo tiempo).
5. **Búsqueda con debounce 300ms.** El input de búsqueda dispara la query 300ms después de que el usuario deja de escribir.
6. **Refresh con pull-down en mobile.** Implementar pull-to-refresh con la "rosquilla" de iOS — un spinner circular blanco que aparece al jalar hacia abajo.
7. **Status persistente.** Las pills de status (abierto/cerrado) chequean cada 30s para actualizar en vivo si la caja se abrió/cerró desde otro dispositivo.
8. **Toasts efímeros.** Las confirmaciones rápidas (ej. "Producto agregado al carrito") aparecen como toast 3s en la parte inferior, sin requerir acción.

---

## 14. Assets que NECESITAS

Para que la app se vea bien, asegúrate de tener:

- `PuntoVerdeLogoBlanco.png` (600×80, 3 densidades) → wordmark blanco principal.
- `PuntoVerdeLogo.png` → wordmark a color sobre fondo claro.
- `TomatoIcon.svg` → mascota de Punto Verde.
- `FormatoBadgePV.png`, `FormatoBadgeGO.png`, `FormatoBadgeXL.png` → badges de formato.
- `SinImagen.png` (1024×1024) → placeholder de producto.
- `LaunchLogo.png` → splash logo.
- 30 íconos SVG de categoría (`CatIconAbarrotes.svg`, `CatIconFrutas.svg`, etc.).
- 5 íconos color de gestión (`CatStaffColor.svg`, `CatPromocionesColor.svg`, etc.).
- 16 íconos line-art de tab bar (`TabInicio.svg`, `TabProductos.svg`, etc.).
- 7 badges de producto (`badge_agotado.png`, `badge_descuento.png`, etc.).

Estos existen en el repo Swift bajo `PuntoVerde/PuntoVerde/Assets.xcassets/`. Cópialos como están al `src/assets/` del proyecto React.

Para Party Kids: hay un kit aparte (`PartyKids-Assets.zip`) con los mismos nombres pero rebrandeados. Subir desde el panel de empresa.

---

## 15. Cierre

Si tu port se ve **plano** (sin gradients), **uniforme** (todo gris bootstrap), **estático** (sin animaciones), **genérico** (sin las cards 240×240), **rectangular** (sin capsules), o **frío** (sin warmth) — vuelve aquí. Cada item arriba es no-negociable.

El benchmark es: una persona que conoce la versión Swift, al abrir el web, debe sentir **"es la misma app"** en 3 segundos. No "se parece" — **es la misma**.

Tu trabajo no es funcional, es VISUAL+EXPERIENCIAL. La funcionalidad ya la tiene el Swift. Tú estás replicando la sensación.

**Buenas noches.**
