// ============================================================
// Paleta semántica de marca — BrandColorRole (doc §3).
// Réplica 1:1 de BrandColorRole.swift.
//
// 8 roles de color con un hex default (tokens de Kaal). El admin puede
// sobreescribir cada rol por empresa en `empresa.brandPalette`
// (map<string,string> = { role.rawValue : hexSin# }). Un rol ausente cae a
// su default.
//
// IMPORTANTE (doc §3): para CUALQUIER empresa (incluida Punto Verde),
// `brandColor` devuelve el default de Kaal si el rol no se ha customizado.
// Los roles son un vocabulario común. Lo que decide si la empresa *usa* la
// paleta como look es `usesPaletteColors` (ver empresaTheme.js §8).
// ============================================================

/** rawValue → { nombre UI, función, defaultHex } (sin '#'). */
export const BRAND_ROLES = {
  acentoPrincipal: { nombre: 'Oro',        funcion: 'Acento principal, marcos, botones, "Dorado"', defaultHex: 'C6A052' },
  sombras:         { nombre: 'Oro oscuro', funcion: 'Sombras, gradientes',                          defaultHex: '9A7B33' },
  highlights:      { nombre: 'Champán',    funcion: 'Highlights, detalles',                         defaultHex: 'E6D2A2' },
  acentoCalido:    { nombre: 'Nude',       funcion: 'Acento cálido suave',                          defaultHex: 'D9C4B5' },
  textoFondos:     { nombre: 'Carbón',     funcion: 'Texto sobre fondos, "Negro"',                  defaultHex: '1B1B1B' },
  fondosProfundos: { nombre: 'Noir',       funcion: 'Fondos profundos',                             defaultHex: '0E0E0E' },
  textoSecundario: { nombre: 'Piedra',     funcion: 'Texto secundario',                             defaultHex: '8C8579' },
  fondoGeneral:    { nombre: 'Crema',      funcion: 'Fondo general (plano), "Blanco"',              defaultHex: 'F3F1EC' },
};

/** Orden estable de roles para pintar la UI del panel de Colores. */
export const BRAND_ROLE_ORDER = [
  'acentoPrincipal', 'sombras', 'highlights', 'acentoCalido',
  'textoFondos', 'fondosProfundos', 'textoSecundario', 'fondoGeneral',
];

/** Normaliza un hex de la paleta a `#rrggbb`. Acepta con o sin '#', 3 o 6 chars. */
const toHex = (raw) => {
  if (!raw) return null;
  let h = String(raw).trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return `#${h.toUpperCase()}`;
};

/**
 * Color resuelto de un rol para una empresa.
 * brandColor(empresa, role) = hex(brandPalette[role] ?? role.defaultHex).
 */
export const brandColor = (empresa, role) => {
  const def = BRAND_ROLES[role];
  const fallback = def ? `#${def.defaultHex}` : '#000000';
  const custom = empresa?.brandPalette?.[role];
  return toHex(custom) || fallback;
};

/** Hex default (#rrggbb) de un rol, sin considerar empresa. */
export const roleDefault = (role) => {
  const def = BRAND_ROLES[role];
  return def ? `#${def.defaultHex}` : '#000000';
};

/**
 * Gradiente dorado de 3 oros (doc §6.2) — highlights → acentoPrincipal →
 * sombras, diagonal topLeading→bottomTrailing (135deg). Es el color "Dorado"
 * del título de categoría y el fill de los íconos de joyería.
 */
export const goldGradient = (empresa) =>
  `linear-gradient(135deg, ${brandColor(empresa, 'highlights')} 0%, ` +
  `${brandColor(empresa, 'acentoPrincipal')} 50%, ` +
  `${brandColor(empresa, 'sombras')} 100%)`;

/** Los 3 stops del gradiente dorado (para SVG <linearGradient> / gradientes de texto). */
export const goldStops = (empresa) => [
  brandColor(empresa, 'highlights'),
  brandColor(empresa, 'acentoPrincipal'),
  brandColor(empresa, 'sombras'),
];

/* ── Mapeo "Negro / Blanco / Dorado" → rol (doc §7.3) ────────────────────── */

export const TITLE_COLOR_KEYS = ['negro', 'blanco', 'dorado'];

/**
 * Estilo del color de título de categoría. Devuelve `{ kind, color?, gradient? }`:
 *  - negro  → sólido textoFondos
 *  - blanco → sólido fondoGeneral
 *  - dorado → gradiente dorado (3 stops)
 */
export const titleColorStyle = (empresa, key) => {
  switch (key) {
    case 'blanco': return { kind: 'solid', color: brandColor(empresa, 'fondoGeneral') };
    case 'dorado': return { kind: 'gradient', gradient: goldGradient(empresa), stops: goldStops(empresa) };
    case 'negro':
    default:       return { kind: 'solid', color: brandColor(empresa, 'textoFondos') };
  }
};

/* ── Luminancia / contraste (doc §7.2) ───────────────────────────────────── */

/** Luminancia perceptual [0..1] de un hex `#rrggbb`. */
export const hexLuminance = (hex) => {
  const h = toHex(hex);
  if (!h) return 0;
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Color de título por contraste cuando la categoría tiene color de fondo (doc §7.2):
 * blanco sobre oscuro, casi-negro sobre claro (umbral de luminancia ≈ 0.72).
 */
export const contrastTitleColor = (bgHex, threshold = 0.72) =>
  hexLuminance(bgHex) > threshold ? '#141414' : '#FFFFFF';

export { toHex as normalizeHex };
