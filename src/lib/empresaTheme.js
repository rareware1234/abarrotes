// ============================================================
// Branding multi-empresa — temas, color de fuente, feature toggles.
// Réplica de EmpresaTheme.swift / AppTab.isAllowed / ContentView (macOS).
// Ver guía "Branding multi-empresa, temas, fuentes, config y roles".
// ============================================================
import { rgbCss, clamp01 } from './brandColor';
import { brandColor } from './brandRoles';

export const DEFAULT_EMPRESA_ID = 'default-pv';

/* ── §1.2 Empresas accesibles del empleado ─────────────────────────────── */
export const empresasAccesibles = (emp) => {
  if (!emp) return [DEFAULT_EMPRESA_ID];
  if (emp.empresasAsignadas && emp.empresasAsignadas.length > 0) {
    return [...new Set(emp.empresasAsignadas)];
  }
  return [emp.empresaId || DEFAULT_EMPRESA_ID];
};

/* ── §8 Sincronizar empresa activa al iniciar sesión / cambiar empleado ─── */
export const syncEmpresaActiva = (emp, empresaActivaId, setActiva) => {
  if (!emp || emp.rol === 'admin') return; // admin usa el portal
  const acc = empresasAccesibles(emp);
  if (acc.length === 0) return;
  if (empresaActivaId && acc.includes(empresaActivaId)) return; // ya válida
  if (acc.length === 1) setActiva(acc[0]);
  else setActiva(null);
};

/* ── §3.1 Color de marca (ya cubierto por lib/brandColor: rgbCss) ───────── */
export const empresaColor = (e) => rgbCss(e, 0);
export const empresaColorDark = (e) => rgbCss(e, -0.18);

/* ── §3.2 Tema con auto-detección legacy ─────────────────────────────────── */
export const resolveTheme = (e) => {
  if (!e) return 'original';
  if (e.theme === 'original' || e.theme === 'elegantLight' || e.theme === 'neonParty') return e.theme;
  const n = (e.nombre || '').toLowerCase();
  if (n.includes('party')) return 'neonParty';
  if (n.includes('kaal') || n.includes('käal')) return 'elegantLight';
  return 'original';
};

/* ── §3.3 Luminancia percibida / marca clara ─────────────────────────────── */
export const perceivedLuminance = (e) => {
  if (!e) return 0;
  const b = e.brightness || 0;
  const r = clamp01((e.colorR || 0) + b);
  const g = clamp01((e.colorG || 0) + b);
  const bl = clamp01((e.colorB || 0) + b);
  return 0.299 * r + 0.587 * g + 0.114 * bl;
};
export const isLightBranded = (e) => perceivedLuminance(e) > 0.72;

/* ── §4 Color de la fuente (texto) ───────────────────────────────────────── */
export const usesDarkText = (e) => {
  const mode = e?.textColorMode || 'auto';
  if (mode === 'light') return false;
  if (mode === 'dark') return true;
  return isLightBranded(e);
};
export const brandInk = (e) => (usesDarkText(e) ? '#000000' : '#FFFFFF');
export const brandInkMuted = (e, alpha = 0.7) =>
  usesDarkText(e) ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;

/* ── §5 Tokens exactos por tema ───────────────────────────────────────────── */
export const THEMES = {
  original: {
    cardGradient: (e) => `linear-gradient(135deg, ${empresaColorDark(e)}, ${empresaColor(e)})`,
    pageGradient: (e) => `linear-gradient(135deg, ${empresaColorDark(e)}, ${empresaColor(e)})`,
    border: 'rgba(255,255,255,0.18)',
    borderWidth: '1px',
    glow: 'none',
    fixedTextColor: null, // decidido por luminancia (brandInk)
    titleFont: '"Inter", system-ui, sans-serif',
    textFont: '"Inter", system-ui, sans-serif',
    fontWeight: 800,
  },
  elegantLight: {
    // Derivado de la paleta semántica (doc §8): brandCardChrome en elegantLight
    // pinta el FONDO PLANO de paleta (fondoGeneral) + marco/acentos de oro.
    // Con stops iguales queda plano (paletteBackground = [fondoGeneral, fondoGeneral]).
    cardGradient: (e) => {
      const bg = brandColor(e, 'fondoGeneral');
      return `linear-gradient(135deg, ${bg}, ${bg})`;
    },
    pageGradient: (e) => {
      const bg = brandColor(e, 'fondoGeneral');
      return `linear-gradient(135deg, ${bg}, ${bg})`;
    },
    border: (e) => brandColor(e, 'acentoPrincipal'),
    borderWidth: '1.5px',
    glow: 'none',
    fixedTextColor: (e) => brandColor(e, 'textoFondos'),
    accent: (e) => brandColor(e, 'acentoPrincipal'),
    titleFont: '"Cinzel", Georgia, serif',
    textFont: 'Georgia, serif',
    fontWeight: 900,
  },
  neonParty: {
    cardGradient: () => 'linear-gradient(135deg, #170F1F, #0F0A14, #0A080D)',
    pageGradient: () => 'linear-gradient(135deg, #170F1F, #0A080D)',
    border: 'conic-gradient(from 0deg, #FF2E8C, #00D4EB, #FFEB3B, #BD4CEB, #FF2E8C)',
    borderWidth: '6px',
    glow: '0 0 24px rgba(255,46,140,0.55)',
    fixedTextColor: 'rgba(255,255,255,0.90)',
    tintCycle: ['#FF2E8C', '#BD4CEB', '#FFEB3B', '#3B8CFF'],
    titleFont: '"Fredoka", system-ui, sans-serif',
    textFont: '"Fredoka", system-ui, sans-serif',
    fontWeight: 900,
  },
};

/** Resuelve un token de tema que puede ser un valor plano o `(empresa) => valor`. */
export const resolveToken = (tok, e) => (typeof tok === 'function' ? tok(e) : tok);

/** Color de texto fijo del tema, respetando el override textColorMode. */
export const themeTextColor = (e) => {
  const mode = e?.textColorMode || 'auto';
  if (mode !== 'auto') return brandInk(e);
  const t = THEMES[resolveTheme(e)];
  const fixed = resolveToken(t.fixedTextColor, e);
  if (fixed) return fixed;
  return brandInk(e); // 'original' → luminancia
};

/** Wash de tinte neón por índice de card (ciclo de 4 colores). */
export const neonTintWash = (index = 0) => {
  const c = THEMES.neonParty.tintCycle[index % THEMES.neonParty.tintCycle.length];
  return `linear-gradient(135deg, ${c}6B 0%, ${c}2E 35%, transparent 60%)`;
};

/* ── §6 Restricciones por rol + feature toggles ──────────────────────────── */
export const TOGGLEABLE_MODULES = new Set([
  'pos', 'products', 'proveedores', 'orders', 'pagos', 'caja', 'tareas',
  'empleados', 'tiendas', 'horarios', 'promociones', 'creditos', 'stock',
]);

const REQUIRES_ROLE = {
  proveedores: 'MANAGER',
  empleados: 'MANAGER',
  tiendas: 'MANAGER',
  empresas: 'ADMIN',
  configuracion: 'MANAGER',
  horarios: 'MANAGER',
  promociones: 'MANAGER',
  creditos: 'MANAGER',
  stock: 'MANAGER',
};

/** rol esperado en mayúsculas ("STAFF"/"MANAGER"/"ADMIN") o interno lowercase. */
const normRol = (rol) => (rol || '').toString().toUpperCase();

export const isModuleVisible = (moduleId, rol, empresa) => {
  const R = normRol(rol);
  if (TOGGLEABLE_MODULES.has(moduleId) && (empresa?.disabledModules || []).includes(moduleId)) {
    return false;
  }
  if (moduleId === 'inicio') return true;
  if (moduleId === 'pos') return R === 'STAFF' || R === 'MANAGER';
  if (['logout', 'buscar', 'busquedaProductos'].includes(moduleId)) return false;
  const required = REQUIRES_ROLE[moduleId];
  if (!required) return true;
  if (required === 'ADMIN') return R === 'ADMIN';
  return R === 'MANAGER' || R === 'ADMIN';
};

/* ── §7 Cards por ventana (cardConfigs) ──────────────────────────────────── */
export const cardScale = (e, tab) => e?.cardConfigs?.[tab]?.logoScale ?? e?.cardLogoScale ?? 1;
export const cardOffX = (e, tab) => e?.cardConfigs?.[tab]?.logoOffsetX ?? e?.cardLogoOffsetX ?? 0;
export const cardOffY = (e, tab) => e?.cardConfigs?.[tab]?.logoOffsetY ?? e?.cardLogoOffsetY ?? 0;
export const cardAsset = (e, tab, slot) => e?.cardConfigs?.[tab]?.assets?.[slot] ?? e?.assetKit?.[slot];

/* ════════════════════════════════════════════════════════════════════════
   §8 — Cómo se aplica la marca en TODA la app (helpers clave del doc).
   "Replicarlas es el 80% del port." Réplica 1:1 de Empresa.swift.
   ════════════════════════════════════════════════════════════════════════ */

/** ¿La empresa tiene al menos un rol customizado en su paleta? */
const hasPalette = (e) => {
  const p = e?.brandPalette;
  return !!p && typeof p === 'object' && Object.keys(p).length > 0;
};

/**
 * Switch maestro (doc §8): si es true, la empresa pinta con su paleta (fondos
 * planos, acentos de rol); si es false, usa su color legacy / lógica de formato.
 * `theme === elegantLight || brandPalette no vacío`.
 */
export const usesPaletteColors = (e) =>
  resolveTheme(e) === 'elegantLight' || hasPalette(e);

/**
 * Fondo de marca PLANO (doc §8): [fondoGeneral, fondoGeneral]. Se duplica el
 * color porque los consumidores arman un gradient; con stops iguales queda plano.
 * Devuelve `{ colors: [c, c], css }`.
 */
export const paletteBackground = (e) => {
  const bg = brandColor(e, 'fondoGeneral');
  return { colors: [bg, bg], css: `linear-gradient(135deg, ${bg} 0%, ${bg} 100%)` };
};

/**
 * Acento de marca (doc §8): si usesPaletteColors ⇒ acentoPrincipal (Oro); si no
 * ⇒ el `fallback` (color del rol/formato). Se usa en POS y Caja para que botones,
 * cobro y highlights respeten la marca en vez del verde de Punto Verde.
 */
export const brandAccent = (e, fallback) =>
  usesPaletteColors(e) ? brandColor(e, 'acentoPrincipal') : (fallback ?? empresaColor(e));

/**
 * Override de fondo para pantallas que por default pintan por formato (POS/Caja).
 * Empresa custom (id ≠ default) ⇒ su fondo (paletteBackground o [colorDark, color]);
 * default PV ⇒ null (la pantalla usa su lógica de formato). Devuelve CSS o null.
 */
export const brandBackgroundOverride = (e) => {
  if (!e || e.id === DEFAULT_EMPRESA_ID) return null;
  if (usesPaletteColors(e)) return paletteBackground(e).css;
  return `linear-gradient(135deg, ${empresaColorDark(e)} 0%, ${empresaColor(e)} 100%)`;
};

/**
 * Chips de sucursal/emblema en POS (doc §8). Marca custom ⇒ fondo
 * [fondosProfundos, sombras] + monograma de iniciales en acentoPrincipal;
 * Punto Verde ⇒ gradient del formato + tomate (emblem: 'tomate').
 */
export const brandChipColors = (e) => {
  if (e && e.id !== DEFAULT_EMPRESA_ID && usesPaletteColors(e)) {
    return {
      css: `linear-gradient(135deg, ${brandColor(e, 'fondosProfundos')} 0%, ${brandColor(e, 'sombras')} 100%)`,
      ink: brandColor(e, 'acentoPrincipal'),
    };
  }
  return {
    css: `linear-gradient(135deg, ${empresaColorDark(e)} 0%, ${empresaColor(e)} 100%)`,
    ink: '#FFFFFF',
  };
};

/** Emblema del chip: iniciales (custom con paleta) o 'tomate' (Punto Verde). */
export const brandChipEmblem = (e, iniciales) => {
  if (e && e.id !== DEFAULT_EMPRESA_ID && usesPaletteColors(e)) {
    return { kind: 'iniciales', text: iniciales, color: brandColor(e, 'acentoPrincipal') };
  }
  return { kind: 'tomate' };
};

/* ── Logos: assetKit (Bytes de Firestore, subidos desde macOS) → data URL ──
   El web SDK entrega los campos `Bytes` con `.toUint8Array()`. La app nativa
   sube logos ahí (no a Storage), así que sin esto los logos de empresas
   creadas en macOS nunca aparecen en la web. */
export const bytesToDataUrl = (bytes, mime = 'image/png') => {
  if (!bytes) return null;
  try {
    const arr = typeof bytes.toUint8Array === 'function' ? bytes.toUint8Array() : bytes;
    let binary = '';
    for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
    return `data:${mime};base64,${btoa(binary)}`;
  } catch {
    return null;
  }
};

/** Logo a mostrar para una empresa: `logoUrl` (Storage, subido desde web) si
 *  existe, si no el slot correspondiente de `assetKit` (Bytes, subido desde
 *  macOS) según si el fondo es claro u oscuro. */
export const resolveEmpresaLogo = (e, isLight = false) => {
  if (e?.logoUrl) return e.logoUrl;
  const kit = e?.assetKit;
  if (!kit) return null;
  const preferred = isLight ? kit.logoColor : kit.logoBlanco;
  const bytes = preferred || kit.cardLogo || kit.logoColor || kit.logoBlanco || kit.portalLogo;
  return bytesToDataUrl(bytes);
};
