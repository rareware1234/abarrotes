// ============================================================
// Tokens de diseño — valores EXACTOS de UI_LAYOUT_SPEC §0 (constantes del
// código Swift, pt≈px @1x). Fuente única para web y React Native.
// ============================================================

/** Escala de espaciado (Spacing). */
export const SPACING = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32 };

/** Escala de radios (Radius). `card`/`panel` son radios propios de marca. */
export const RADIUS = { sm: 6, md: 10, lg: 14, xl: 20, full: 999, card: 18, panel: 22 };

/** Colores nombrados (default Punto Verde). Para empresas con paleta, usar brandColor(role). */
export const COLORS = {
  verdeOscuro: '#0F4D2E', primaryDark: '#0F4D2E',
  verdeMedio: '#1A7A48', primary: '#1A7A48',
  primaryHover: '#166040',
  verdeLima: '#4ADE80', success: '#4ADE80',
  tomate: '#E63946', danger: '#E63946',
  ambar: '#F0A500', warning: '#F0A500',
  textDark: '#1C1E21',
  textMuted: '#6B7C93',
  background: '#F4F5F7',
  surface: '#FFFFFF',
  border: '#E4E6EA',
};

/** Jerarquía tipográfica (tamaño px + peso CSS). */
export const TYPO = {
  pageTitle: { size: 34, weight: 800 },   // heavy
  sectionBig: { size: 26, weight: 800 },
  sectionHeader: { size: 20, weight: 700 },
  body: { size: 17, weight: 600 },
  eyebrow: { size: 12, weight: 800, letterSpacing: 0.8, textTransform: 'uppercase' },
};

/** Layout consistente en todas las pantallas (UI_LAYOUT_SPEC §1). */
export const LAYOUT = {
  contentPaddingX: 20,
  sectionGap: 32,
  sectionInnerGap: 12,
  sectionCardPadding: 20,
  backButton: 36,      // círculo 36×36
  backGap: 12,
  headerPaddingX: 16,
  headerPaddingY: 10,
  shelfBreakpoint: 1300, // ≥1300px → carruseles multi-columna
};

/** Fórmula del glass card (triple capa) — helper de estilos CSS. */
export const glass = ({ radius = RADIUS.panel, blur = 18, frost = 0.18, borderAlpha = 0.30 } = {}) => ({
  backdropFilter: `blur(${blur}px)`,
  WebkitBackdropFilter: `blur(${blur}px)`,
  background: `rgba(255,255,255,${frost})`,
  border: `0.5px solid rgba(255,255,255,${borderAlpha})`,
  borderRadius: radius,
});

/** Curvas de spring (response, damping) — UI_LAYOUT_SPEC §5. */
export const SPRINGS = {
  sidebar: { response: 0.35, damping: 0.85 },
  posOpen: { response: 0.42, damping: 0.86 },
  cartPulseExpand: { response: 0.18, damping: 0.55 },
  cartPulseRelease: { response: 0.32, damping: 0.70 },
  general: { response: 0.35, damping: 0.85 },
};

export default { SPACING, RADIUS, COLORS, TYPO, LAYOUT, glass, SPRINGS };
