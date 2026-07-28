// ============================================================
// Logo / wordmark / emblema (doc §5). Réplica 1:1 de la lógica de Swift.
// En web el wordmark NO se rasteriza: se renderiza como texto CSS.
// ============================================================
import { brandColor } from './brandRoles';
import { logoFontFamily } from './brandFont';
import { bytesToDataUrl, DEFAULT_EMPRESA_ID } from './empresaTheme';

/**
 * Iniciales del monograma/emblema (doc §5.2):
 * logoIniciales si no vacío (1–3 chars), si no la 1ª letra de logoTexto o del nombre.
 */
export const emblemaIniciales = (empresa) => {
  const raw = (empresa?.logoIniciales || '').trim();
  if (raw) return raw.slice(0, 3).toUpperCase();
  const base = (empresa?.logoTexto || empresa?.nombre || '').trim();
  return base ? base.charAt(0).toUpperCase() : '';
};

/** Slots del assetKit considerados "wordmark" (imagen que hace de logo). */
const WORDMARK_SLOTS = ['logoColor', 'logoBlanco', 'logoDark', 'logoLight', 'logoSolidoBlanco', 'cardLogo', 'portalLogo'];

/**
 * Estilo CSS del wordmark de texto (doc §5.1):
 *  - familia: logoFontRaw (o la de titulares si vacío)
 *  - peso: logoPeso (100–900, escala CSS directa)
 *  - tracking: logoTracking × tamaño de fuente = em (proporcional)
 *  - color: rol textoFondos por default (el panel de logo usa textoFondos)
 * `opts.fontSize` en px (número) o CSS; `opts.color` sobreescribe el color.
 */
export const wordmarkStyle = (empresa, theme, opts = {}) => {
  const size = opts.fontSize ?? 40;
  return {
    fontFamily: logoFontFamily(empresa, theme),
    fontWeight: empresa?.logoPeso ?? 700,
    letterSpacing: `${empresa?.logoTracking ?? 0}em`,
    color: opts.color ?? brandColor(empresa, 'textoFondos'),
    fontSize: typeof size === 'number' ? `${size}px` : size,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  };
};

export const wordmarkText = (empresa) => (empresa?.logoTexto || '').trim();

/**
 * Resuelve qué logo mostrar (doc §5, prioridad de mayor a menor):
 *   1. Wordmark de texto (logoTexto no vacío) → { kind:'wordmark', text }
 *   2. Imagen del assetKit (slot preferido → wordmark slots) → { kind:'image', url }
 *   3. Fallback: default PV → asset bundled (caller); custom → iniciales
 *      → { kind:'iniciales', text } (o { kind:'bundled' } para default PV).
 * `opts.slot` fuerza un slot; `opts.isLight` elige logoColor vs logoBlanco.
 */
export const resolveLogo = (empresa, { slot, isLight = false } = {}) => {
  const text = wordmarkText(empresa);
  if (text) return { kind: 'wordmark', text };

  const kit = empresa?.assetKit;
  if (kit) {
    const order = slot ? [slot] : [isLight ? 'logoColor' : 'logoBlanco', ...WORDMARK_SLOTS];
    for (const s of order) {
      const bytes = kit[s];
      if (bytes) {
        const url = typeof bytes === 'string' ? `data:image/png;base64,${bytes}` : bytesToDataUrl(bytes);
        if (url) return { kind: 'image', url, slot: s };
      }
    }
  }

  if (empresa?.logoUrl) return { kind: 'image', url: empresa.logoUrl };

  if (empresa && empresa.id === DEFAULT_EMPRESA_ID) return { kind: 'bundled' };
  return { kind: 'iniciales', text: emblemaIniciales(empresa) };
};
