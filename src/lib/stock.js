// ============================================================
// Stock por tienda — fuente de verdad `stockPorTienda` (biblia §3.1).
// Réplica 1:1 de Producto.stockEn(_:) de Swift. `stock` es legacy.
// Puro (sin DOM/Firebase) → reutilizable en web y React Native.
// ============================================================

/**
 * Stock disponible de un producto en una tienda:
 *  - si stockPorTienda tiene la key de la tienda → ese valor;
 *  - si no existe y tiendaId == producto.tiendaId (legacy) → `stock` legacy;
 *  - si stockPorTienda vacío/ausente → `stock` legacy;
 *  - si no → 0.
 */
export const stockEn = (producto, tiendaId) => {
  if (!producto) return 0;
  const spt = producto.stockPorTienda;
  const hasMap = spt && typeof spt === 'object' && Object.keys(spt).length > 0;
  if (hasMap && tiendaId != null && Object.prototype.hasOwnProperty.call(spt, tiendaId)) {
    return spt[tiendaId] || 0;
  }
  if (tiendaId != null && tiendaId === producto.tiendaId) return producto.stock ?? 0;
  if (!hasMap) return producto.stock ?? 0;
  return 0;
};

/** Stock total del producto sumando todas las tiendas (fallback a legacy). */
export const stockTotal = (producto) => {
  const spt = producto?.stockPorTienda;
  if (spt && typeof spt === 'object' && Object.keys(spt).length > 0) {
    return Object.values(spt).reduce((s, v) => s + (v || 0), 0);
  }
  return producto?.stock ?? 0;
};
