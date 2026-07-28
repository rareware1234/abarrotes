// ============================================================
// Fuentes de marca — BrandFont (doc §4). Réplica 1:1 de BrandFont.swift.
//
// 6 valores. Cada uno mapea a un "design" del sistema; cinzel/montserrat son
// fuentes empaquetadas (variables). En web se cargan como webfonts (Google
// Fonts en index.html). El wordmark NO se rasteriza: se renderiza como texto
// CSS (font-family, font-weight, letter-spacing, color) — doc §5.1.
// ============================================================

/** rawValue → familia CSS (con fallbacks del "design" del sistema). */
export const FONT_FAMILY = {
  serif:      'Georgia, "Times New Roman", serif',
  sans:       '"Inter", system-ui, -apple-system, sans-serif',
  rounded:    '"Fredoka", ui-rounded, "SF Pro Rounded", system-ui, sans-serif',
  mono:       'ui-monospace, "SF Mono", Menlo, monospace',
  cinzel:     '"Cinzel", Georgia, serif',
  montserrat: '"Montserrat", "Inter", system-ui, sans-serif',
};

/** Etiqueta legible para los selectores del panel. */
export const FONT_LABEL = {
  serif: 'Serif', sans: 'Sans', rounded: 'Redondeada', mono: 'Mono',
  cinzel: 'Cinzel', montserrat: 'Montserrat',
};

export const BRAND_FONT_ORDER = ['serif', 'sans', 'rounded', 'mono', 'cinzel', 'montserrat'];

/** Default por tema (doc §4): elegantLight→serif, neonParty→rounded, original→sans. */
export const themeDefaultFont = (theme) => {
  if (theme === 'elegantLight') return 'serif';
  if (theme === 'neonParty') return 'rounded';
  return 'sans';
};

/** Familia CSS de un BrandFont.rawValue (o default si vacío/desconocido). */
export const fontFamily = (raw, fallback = 'sans') =>
  FONT_FAMILY[raw] || FONT_FAMILY[fallback] || FONT_FAMILY.sans;

/**
 * Fuente de titulares/wordmark de la empresa. `brandFontTitleRaw` vacío ⇒
 * default del tema. (doc §2, campo brandFontTitleRaw)
 */
export const titleFontFamily = (empresa, theme) =>
  fontFamily(empresa?.brandFontTitleRaw, themeDefaultFont(theme));

/** Fuente de textos/labels (base app-wide). `brandFontBodyRaw` vacío ⇒ default del tema. */
export const bodyFontFamily = (empresa, theme) =>
  fontFamily(empresa?.brandFontBodyRaw, themeDefaultFont(theme));

/**
 * Fuente SOLO del wordmark (doc §5.1). `logoFontRaw` vacío ⇒ usa la de titulares.
 */
export const logoFontFamily = (empresa, theme) =>
  empresa?.logoFontRaw
    ? fontFamily(empresa.logoFontRaw, themeDefaultFont(theme))
    : titleFontFamily(empresa, theme);

/**
 * Estilo CSS de fuente para un tamaño/peso dados. Para cinzel/montserrat
 * (variables) respeta el peso; para las de sistema también. Devuelve un objeto
 * de estilo listo para React.
 */
export const fontStyle = (raw, { size, weight, fallback = 'sans' } = {}) => {
  const style = { fontFamily: fontFamily(raw, fallback) };
  if (size != null) style.fontSize = typeof size === 'number' ? `${size}px` : size;
  if (weight != null) style.fontWeight = weight;
  return style;
};
