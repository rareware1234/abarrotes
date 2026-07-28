// ============================================================
// Normalización — réplica 1:1 de las funciones de Swift. CRÍTICO que sea
// idéntica en todas las plataformas (doc §8.1, §9.2), porque las claves y los
// enlaces de ícono se leen/escriben con esta misma normalización.
// ============================================================

/** Quita diacríticos (NFD + strip combining marks). */
const stripDiacritics = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Normalización de CLAVE (doc §9.2 — MarcaCustomizationStore):
 * diacrit-insensitive, minúsculas, trim. Se aplica al string COMPLETO
 * incluyendo el prefijo (`cat::…`, `caticonasset::…`, etc.). NO quita plural.
 */
export const normalizarClave = (s) => stripDiacritics(s).toLowerCase().trim();

/** Alias usado por marcas/proveedores (misma regla que la clave). */
export const normalizarMarca = normalizarClave;

/**
 * Normalización de CATEGORÍA (doc §8.1 — normalizarCategoria):
 * quita diacríticos, minúsculas, trim, y quita la 's' final si la palabra
 * resultante tiene >3 chars (para casar plural/singular). Ej: "Anillos" ≈ "anillo".
 */
export const normalizarCategoria = (s) => {
  let n = stripDiacritics(s).toLowerCase().trim();
  if (n.length > 3 && n.endsWith('s')) n = n.slice(0, -1);
  return n;
};
