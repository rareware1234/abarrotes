// ============================================================
// Helpers de color de marca — FUENTE ÚNICA.
// Antes estaban duplicados en Empresas.jsx, NuevoFormatoModal.jsx,
// CotizarSucursal.jsx, Tiendas.jsx y data/formatos.js. Réplica de
// `brandClamped` + `color`/`colorDark` de CustomFormato (Swift).
//
// Convención de entrada: objetos con { colorR, colorG, colorB, brightness }
// en rango 0–1 (igual que Firestore / Swift). `delta` desplaza el brillo
// (p.ej. -0.18 para colorDark, -0.12 para el stop oscuro del gradiente).
// ============================================================

export const clamp01 = (v) => Math.max(0, Math.min(1, v));

const _hx = (v01) => Math.round(clamp01(v01) * 255).toString(16).padStart(2, '0');
const _ch = (v01) => Math.round(clamp01(v01) * 255);

/** Color HEX (#rrggbb) aplicando brightness + delta. */
export const rgbHex = (c, delta = 0) => {
  const b = (c.brightness || 0) + delta;
  return `#${_hx((c.colorR || 0) + b)}${_hx((c.colorG || 0) + b)}${_hx((c.colorB || 0) + b)}`;
};

/** Color CSS rgb(...) aplicando brightness + delta. */
export const rgbCss = (c, delta = 0) => {
  const b = (c.brightness || 0) + delta;
  return `rgb(${_ch((c.colorR || 0) + b)}, ${_ch((c.colorG || 0) + b)}, ${_ch((c.colorB || 0) + b)})`;
};

/** Gradiente diagonal dark→base en rgb() (las "ventanas" de la app). */
export const brandGradient = (c, darkDelta = -0.12) =>
  `linear-gradient(135deg, ${rgbCss(c, darkDelta)} 0%, ${rgbCss(c, 0)} 100%)`;

/** Gradiente diagonal dark→base en HEX (para concatenar alfa, p.ej. `${x}40`). */
export const brandGradientHex = (c, darkDelta = -0.12) =>
  `linear-gradient(135deg, ${rgbHex(c, darkDelta)} 0%, ${rgbHex(c, 0)} 100%)`;

/** Luminancia perceptual base (sin brightness). */
export const brandLuminance = (c) =>
  0.2126 * (c.colorR || 0) + 0.7152 * (c.colorG || 0) + 0.0722 * (c.colorB || 0);

/** ¿El color (con su brightness) es claro? Umbral configurable. */
export const isLightColor = (c, threshold = 0.45) =>
  brandLuminance(c) + (c.brightness || 0) > threshold;
