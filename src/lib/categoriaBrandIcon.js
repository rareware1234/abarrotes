// ============================================================
// Resolución del ícono de una categoría — CategoriaBrandIcon (doc §8.1).
// Réplica 1:1 del orden de resolución de Swift. Es lo que evita que reaparezcan
// íconos viejos al reabrir/re-subir: el enlace por NOMBRE sobrevive porque el
// nombre es estable (el id cambia al re-subir).
// ============================================================
import { normalizarCategoria } from './normalizar';
import { bytesToDataUrl } from './empresaTheme';

export const ICONOGRAFIA_ID = 'iconografia';

/**
 * Todos los assets de la colección de iconografía de la empresa, aplanando
 * carpetas legacy. Cada asset: { id (UUID estable), nombre, data }.
 */
export const iconografiaAssets = (empresa) => {
  const cols = empresa?.colecciones;
  if (!Array.isArray(cols)) return [];
  const col = cols.find((c) => c?.id === ICONOGRAFIA_ID);
  if (!col) return [];
  const flat = [...(col.assets || [])];
  for (const carpeta of col.carpetas || []) {
    for (const a of carpeta.assets || []) flat.push(a);
  }
  return flat;
};

/** data URL PNG de un ColeccionAsset (`data` = Bytes de Firestore o base64/Uint8Array). */
export const assetDataUrl = (asset) => {
  if (!asset?.data) return null;
  if (typeof asset.data === 'string') return `data:image/png;base64,${asset.data}`;
  return bytesToDataUrl(asset.data);
};

/**
 * Resuelve el asset de MARCA para una categoría (pasos 1–2 del doc §8.1):
 *   1. Enlace explícito `caticonasset::<cat>` (parámetro `explicitLink`):
 *      a) asset cuyo id == valor (links legacy), o
 *      b) asset cuyo nombre normalizado == valor normalizado (links durables).
 *   2. Match por nombre: asset cuyo nombre normalizado == categoría normalizada.
 * Devuelve el asset o null (el paso 3 —fallback bundled— lo resuelve el consumidor
 * con su ícono empaquetado de plataforma).
 */
export const resolveCategoriaBrandAsset = (empresa, categoria, explicitLink) => {
  const assets = iconografiaAssets(empresa);
  if (assets.length === 0) return null;

  // 1) Enlace explícito.
  if (explicitLink) {
    const byId = assets.find((a) => a.id === explicitLink);
    if (byId) return byId;
    const linkNorm = normalizarCategoria(explicitLink);
    const byName = assets.find((a) => normalizarCategoria(a.nombre) === linkNorm);
    if (byName) return byName;
  }

  // 2) Match por nombre categoría ↔ asset.
  const catNorm = normalizarCategoria(categoria);
  return assets.find((a) => normalizarCategoria(a.nombre) === catNorm) || null;
};
