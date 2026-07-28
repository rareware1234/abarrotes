# PUNTO VERDE — Especificación de Diseño y Comportamiento

> **Referencia maestra de diseño.** Fotografía de cómo se ve, se mueve y se siente la app Swift.
> Ante cualquier decisión de diseño abierta, vuelve a este documento. No improvisar a Bootstrap/Material genérico.
>
> _Guardado como referencia del port React/Vite (`punto-verde-web`)._

---

## 0. Filosofía visual

POS para tiendas de barrio mexicanas. Inspiración:
1. **Apple Music + iOS 26 + macOS Tahoe** — browses horizontales de cards, "ventanas" con gradient diagonal, sombras suaves, Liquid Glass. Referencia directa: sección "Examinar" de Apple Music.
2. **Calidez mexicana sin cliché** — verde PV (`#0F4D2E` / `#1A7A48`), tomate (`#E63946`), amarillo cálido (`#F0A500`). Nada de pastel ni azul corporate insulso.
3. **Multi-tenant** — la app es un *shell*; colores/logos/assets cambian por empresa activa. El shell es el mismo, cambia el branding.
4. **Cards densos pero respirables** — datos reales, tipografía gruesa para números, labels chicos en tracking alto. Padding 16-20px lateral, 16-22px vertical.
5. **Glass + sombras grandes y suaves** — nada de sombras duras 2px. Card: `black/0.18, blur 14, y 6`. Elevados (FAB, pill): `radius 24, y 8, 0.30`.
6. **Estados visibles** — Loading = ProgressView blanco centrado. Empty = ilustración + texto. Error = card rojo translúcido `red/0.55` texto blanco.

---

## 1. Sistema cromático

### 1.1 Paleta core
| Token | Hex | Uso |
|---|---|---|
| `--pv-verde-oscuro` | `#0F4D2E` | colorDark marca. Header, sidebar, splash. |
| `--pv-verde-medio` | `#1A7A48` | color. Botones primarios, tab activo. |
| `--pv-verde-lima` | `#4ADE80` | Success. Dot "Abierto". |
| `--pv-tomate` | `#E63946` | Mascota. Destructivo. Badges oferta. |
| `--pv-ambar` | `#F0A500` | Warning. Dot "Cotización". "Stock bajo". |
| `--pv-negro` | `#1C1E21` | Texto sobre fondo claro. |
| `--pv-bg` | `#F4F5F7` | Fondo neutro. |
| `--pv-surface` | `#FFFFFF` | Cards blancos. |
| `--pv-border` | `#E4E6EA` | Borde sutil. |
| `--pv-text-muted` | `#6B7C93` | Texto secundario. |

### 1.2 Color por rol (sin empresa custom)
| Rol | colorDark | color |
|---|---|---|
| staff | color del formato de su tienda | color del formato |
| manager | `#1B4D8B` | `#2E6BC4` |
| admin | `#3A4150` | `#64748B` |

> El **gradiente "ventana"** a pantalla completa SIEMPRE es `linear-gradient(to bottom right, colorDark, color)`. Si falta, la pantalla está incompleta.

### 1.3 Color por formato
| Formato | color | colorDark |
|---|---|---|
| PV | `#0F4D2E` | `#0A381F` |
| GO | `#F0A500` | `#C68600` |
| XL | `#1A1A1A` | `#0E0E0E` |

> **GO usa texto OSCURO** (`#0F4D2E`) sobre el amarillo, no blanco. Aplica a CADA card GO: stats, nombre, labels, todo.

### 1.4 Multi-empresa
Cada empresa tiene `color`, `colorDark`, `assetKit`. El gradiente, sidebar, headers respetan la empresa activa. Party Kids (`#FF3D8B / #0A0A0F`) → toda la app rosa neón sobre negro.
- Portal (login → picker) con avatares circulares por empresa.
- Al elegir, la sesión arranca con esa empresa; queries filtran por `empresaId`.
- Cambiar de empresa re-monta la navegación (soft restart), datos frescos.

---

## 2. Tipografía

SF Pro → web `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`. Formatos especiales respetan `font-family` del assetKit (Party Kids = Fredoka One + Nunito).

| Rol | Tamaño | Peso | Tracking | Color |
|---|---|---|---|---|
| Hero title | 34pt | 800 | 0 | blanco |
| Page title | 30-34pt | 800 | 0 | blanco |
| Section title | 20pt | 800 | 0 | blanco |
| Card title | 16-18pt | 800 rounded | 0 | blanco/cardText |
| Subtitle | 12-14pt | 500-600 | 0 | blanco 0.65-0.85 |
| Label uppercase | 9-11pt | 800 | 0.7-1.2 | blanco 0.62-0.78 |
| Stat value | 16-24pt | 900 rounded | 0 | blanco/cardText |
| Stat label | 8-10pt | 800 upper | 0.9-1.2 | blanco 0.65-0.75 |
| Body | 14pt | 500 | 0 | textDark |
| Caption | 10-11pt | 500-600 | 0 | textMuted |

**Inviolables:** números siempre `font-weight: 900` + tabular-nums. Labels `uppercase + letter-spacing: 0.07em + weight 800`. Nada `font-weight: 400` (mínimo 500). cardTextColor = `#0F4D2E` en GO, blanco en el resto.

---

## 3. Spacing y radios

Spacing: `xs 4 · sm 8 · md 12 · base 16 · lg 20 · xl 24 · xxl 32`. Usar EXACTO, no `15/18/22`.
Radius: `sm 6 · md 10 · lg 14 · xl 20 · full 999`.
- Cards xl (16-20). Botones grandes full (capsule). Medianos md. Avatares/pills/chips full. Sheets xl.
- Padding cards: grande 16; brand empresa `24 20`; stat `12 14`; hero header `16 20 24`.

---

## 4. Layouts canónicos

**4.1 BROWSE (Apple Music):** fondo gradient diagonal full + Hero (título 34pt + subtítulo + KPI pills) + VStack 32px de rows. Cada row: header 20px + chevron + desc 12px + conteo; ScrollView horizontal `scroll-clip:none`, cards spacing 12, padding lateral 20. Header de row clickable → detalle.

**4.2 DETAIL DE SECCIÓN:** mismo gradient, título 30pt + LazyVGrid adaptivo (min 240-280, gap 12, padding 20).

**4.3 MASTER-DETAIL:** hero card grande (gradient + watermark logo) + secciones tipo Settings (header tracking 0.07em + rows blancos rounded 14 con icon-circle + título + subtitle + chevron).

**4.4 POS:** split izquierda 60% (grid productos 2-3 col) + derecha 40% (carrito, total 28pt, "Cobrar" capsule full gradient). iPhone: píldora flotante de checkout sobre tab bar (56px, "Carrito · 3 items" + total + chevron).

**4.5 PAYMENT SHEET:** sheet detents medium/large. Total 48pt + ScrollView horizontal de method cards 90×120 (gradient por método) + (efectivo: teclado + sugerencias) + "Cobrar" full gradient método.

---

## 5. Componentes signature
- **Brand card empresa** 312×320 r18: gradient diagonal, logo TR grande, eyebrow giro + nombre 22pt + tagline, pill "EMPRESA ACTIVA" con dot, shadow `black/0.22 14 6`, stroke `white/0.18`.
- **Tienda brand card** 240×240 (o 312×208 wide): gradient del formato, watermark logo TR 40%, nombre 20pt + ciudad, alerta pill, 2 stats (valor 16-18pt black + label 8-9pt), badge formato BR, status pill TR.
- **KPI card** blanco shadow soft: icon-circle 38 + título 11pt upper + valor 22pt black + delta.
- **Empleado avatar** circular foto o iniciales sobre gradient rol, stroke `white/0.4`. Tamaños 34/36/96.
- **Status dot + pill** dot 6-8px + capsule `white/0.18` border `white/0.28` texto 10pt heavy upper.
- **Filter chips** capsule scroll: off `white/0.10`+`white/0.20`; on `white/0.25`+`white/0.55`; spring 0.25.
- **Section header** 11pt heavy tracking 0.07em `white/0.62`.
- **Config row** card blanca r14, icon-circle 36 tinted + título 15 + subtitle 12 + chevron, padding `12 16`, shadow `black/0.04 8 4`.
- **Glass panel** `white/0.10` + border `white/0.22` r18 + `backdrop-filter: blur(20px)`.

---

## 6. Animaciones (springs canónicos)
| Caso | response | damping |
|---|---|---|
| Card tap | 0.28 | 0.7 |
| Section expand | 0.35 | 0.85 |
| Filter chip | 0.25 | 0.78 |
| Sidebar (Mac) | 0.35 | 0.85 |
| Mascota bump | 0.4 | 0.6 |

Web: `transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1)`.
- **Hover** card scale 1.04 + shadow ↑; botones opacity 0.85; avatares stroke 0.35→0.85.
- **Pressed** scale 0.96, opacity 0.85, gradient→colorDark.
- **Page transitions** push slide-in derecha 0.4s; pop slide-out 0.35s; cambio empresa fade 0.3/0.4.
- **Header fade al scroll** (iPhone) primeros 80px opacity 1→0, pointer-events off al llegar a 0.
- **Tab bar minimize** scroll down `translateY(100%)`, up `translateY(0)`, 0.25s.
- **Loading** ProgressView blanco centrado (NO skeleton genérico) + shimmer en cards.
- **Confetti** al pago aprobado: check verde scale 0→1.2→1, "APROBADO" 28pt, 10-15 partículas 1.5s, cierre 2.5s.
- **Brand color morph** portal: bg morphea al color de empresa en hover, easeInOut 0.45s.

---

## 7. Estados de UI
- **Loading** ProgressView blanco + "Cargando..." 12pt blanco/0.7.
- **Empty** icon 48-72px blanco/0.5 + título 18pt + desc 13pt + CTA opcional.
- **Error** banner `red/0.55` r12 padding 12 texto blanco 13pt, auto-dismiss 4s.
- **Success** igual con `green/0.55` + check.
- **Confirmación destructiva** modal 320px: pregunta + "Esta acción no se puede deshacer." + Cancelar (capsule blanca) + Eliminar (capsule roja).

---

## 8. Por feature (resumen del LOOK)
- **8.1 Login:** gradient verde full, card glass 400×500, wordmark + tomate, 2 inputs glass, "Entrar" capsule verde, link olvido, footer Tlalpan. Mascota bounce 3s, shake en error.
- **8.2 Portal empresa (admin):** gradient gris que morphea al hover, "¿En cuál vas a operar?", scroll horizontal avatares 130×130 con glow, footer "Conectado como…". Click → escala 1.08 + glow + 320ms → app temada.
- **8.3 Inicio:** staff (mis KPIs, ventas 7d) / manager-admin (KPIs 2x2, rows top sucursales/productos/categorías/acciones, charts donut+barras+línea). Charts sin gridlines duras, tooltips glass, animación de carga.
- **8.4 Sucursales:** header + rows Formatos (PV/GO/XL + "+ nuevo") / Top / En operación / Cerradas / Cotizaciones (watermark tomate) / Todas. Detail: hero + statbar + Config + Zona peligrosa. Cotización: tomate gigante 221×221 TR + amber.
- **8.5 Stock:** KPIs "VALOR INV." | "SKUs BAJOS", row mayor inventario, detail con filtros chips + search + lista (AGOTADO/BAJO/EN STOCK).
- **8.6 Productos:** rows Categorías (SVG colored) / Marcas / Top / Stock bajo / Sin movimiento / Todos. Card 200×260 blanca, imagen 200×140, nombre 14, precio 16 black + badge.
- **8.7 Empleados:** rows Mi equipo / por rol / Inactivos. Card 240×240 gradient rol, avatar 80, rol pill, stats.
- **8.8 POS:** split productos/carrito; iPhone píldora flotante.
- **8.9 Pagos:** method cards 90×120 (efectivo verde, tarjeta azul, tap morado, apple negro, transfer teal, crédito amber, QR gris). Efectivo: teclado + sugerencias. Tap to Pay: fases preparing/ready/awaiting/authorizing/approved.
- **8.10 Caja:** cerrada (abrir) / abierta (dashboard + movimientos + cerrar rojo) / cerrando (resumen, esperado vs real, diferencia).
- **8.11 Órdenes:** lista con fecha + total + método badge + status pill.
- **8.12 Promociones:** rows activas/categoría/históricas, banner 2:3.
- **8.13 Créditos:** KPIs prestado/cobrar/vencidos, card cliente con score circular.
- **8.14 Perfil:** hero avatar 96 + rol pill + statbar + (admin: cambiar empresa) + cerrar sesión rojo.
- **8.15 Empresas (admin):** browse de cards → GestionEmpresaView (Identidad / Equipo / Operación / Zona peligrosa). Editar identidad sheet con brand preview + paleta/hex + brightness + inputs + logo picker + assets kit.

---

## 9. Detalles que SE PIERDEN (corregir SIEMPRE)
1. Labels uppercase con `letter-spacing: 0.07em`.
2. Números rounded + `tabular-nums`.
3. Sombras grandes suaves (blur 14), no 2px.
4. Gradientes SIEMPRE diagonales (topLeft→bottomRight), nunca verticales.
5. ScrollViews horizontales sin clip (cards se asoman).
6. Padding 20px lateral (no 16/15).
7. Hero cards `clipped` con watermarks que se asoman (offset negativo).
8. Status pills con dots animados (verde "Abierto" pulsa opacity 0.6→1 cada 2s).
9. Push transitions deslizando, no fade.
10. Glass blur en background cuando hay sheet (no overlay negro 50%).
11. Botones primarios capsule full width.
12. Destructivos en card blanca con texto rojo (no botón rojo sólido).
13. Inputs glass sobre gradient (`white/0.14` + border `white/0.22`).
14. Confirmación destructiva con "Esta acción no se puede deshacer".
15. Avatares foto O iniciales colored (nunca user-circle genérico).
16. Charts sin gridlines duras.
17. Currency es-MX sin decimales (`$1,234`).
18. SF Symbols → Heroicons/Feather (no Font Awesome).
19. Apple/Tap to Pay: mock visual correcto si no hay API.
20. **Cards GO con texto oscuro `#0F4D2E`** (la excepción más olvidada).

---

## 10. Multi-empresa runtime
1. Login `numEmpleado` + password. 2. admin → portal; no-admin → su empresa default.
4. Empresa activa en localStorage `empresa.activa.id.v1`.
5. TODOS los queries filtran por `empresaId == empresaActivaId`.
6. Al crear entidad, inyectar `empresaId` de la activa.
7. Cambiar empresa = limpiar localStorage + recargar / re-fetch global.
8. Assets por empresa (`assetKit`). Fallback a bundled solo para default; custom usa placeholder.
10. Gradiente ventana usa colores de la empresa activa (staff usa el formato de su tienda).

---

## 11. NO HAGAS
Navbar/btn/card Bootstrap genéricos · tablas HTML para listas · modales centrados con backdrop negro · iconos genéricos · sombras duras · gradientes verticales · MUI elevation · `position: fixed` para headers (usar scroll-fade).

---

## 12. Checklist de auto-revisión
Fondo gradient diagonal · headers 34pt + avatar + "+" · rows cards 240/312 gap 12 sin clip · stats 900 rounded tnum · labels 0.07em 800 · cards r18 shadow suave · botones capsule full · avatares foto/iniciales · POS split + pill mobile · pago method cards · portal empresa · bg morph hover · cambio empresa sin estado residual · queries por empresaId · empresa custom en ceros · PV/GO/XL color+badge+mascota · **GO texto verde oscuro** · status dot pulsa · destructivas "no se puede deshacer" · transitions slide-in · loading ProgressView · empty con icon+texto · errors banner rojo · tab/sidebar glass blur con sheet · moneda es-MX `$1,234` · SF→Heroicons · sin tablas HTML · sin modales backdrop negro.

---

## 13. Micro-comportamientos
Tap `:active` scale 0.96 0.15s · hover scale 1.04 · `scroll-behavior: smooth` · entrada de cards stagger 50ms (máx 8) · búsqueda debounce 300ms · pull-to-refresh mobile · status persistente (poll 30s) · toasts efímeros 3s.

---

## 14. Assets necesarios
`PuntoVerdeLogoBlanco.png`, `PuntoVerdeLogo.png`, `TomatoIcon.svg`, `FormatoBadge{PV,GO,XL}.png`, `SinImagen.png`, `LaunchLogo.png`, 30 SVG de categoría, 5 íconos color de gestión, 16 line-art de tab bar, 7 badges de producto. Origen Swift: `PuntoVerde/PuntoVerde/Assets.xcassets/`. Party Kids: kit aparte rebrandeado.

---

## 15. Cierre
Benchmark: quien conoce la versión Swift, al abrir la web, debe sentir **"es la misma app"** en 3 segundos. El trabajo es VISUAL + EXPERIENCIAL.
