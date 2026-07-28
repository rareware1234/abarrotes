// Singleton de la empresa activa — espejo de EmpresaStore.activaId (Swift).
// Los servicios lo leen para filtrar `empresaId == activaId` e inyectar
// `empresaId` al crear, sin depender del árbol de React.
// Persistido en localStorage bajo la misma clave que macOS/iOS.

export const EMPRESA_ACTIVA_KEY = 'empresa.activa.id.v1';
export const DEFAULT_EMPRESA_ID = 'default-pv';

/** ID de la empresa activa. Default `default-pv` para que los docs legacy
 *  sin `empresaId` (que se mapean a default al parsear) sigan visibles. */
export const getActivaId = () => {
  try {
    return localStorage.getItem(EMPRESA_ACTIVA_KEY) || DEFAULT_EMPRESA_ID;
  } catch {
    return DEFAULT_EMPRESA_ID;
  }
};

export const setActivaId = (id) => {
  try {
    if (id) localStorage.setItem(EMPRESA_ACTIVA_KEY, id);
    else localStorage.removeItem(EMPRESA_ACTIVA_KEY);
  } catch {
    /* ignore */
  }
};

/** Filtra una lista de entidades por la empresa activa. Réplica de
 *  `fetchAllForActiveEmpresa` (Swift): los docs sin `empresaId` cuentan
 *  como `default-pv`, así no quedan invisibles en Punto Verde. */
export const filterByActiveEmpresa = (items, activaId = getActivaId()) =>
  (items || []).filter((it) => (it.empresaId || DEFAULT_EMPRESA_ID) === activaId);

/** IDs de las tiendas de la empresa activa (para scoping de órdenes/productos). */
export const tiendaIdsDeEmpresa = (tiendas, activaId = getActivaId()) =>
  new Set(filterByActiveEmpresa(tiendas, activaId).map((t) => t.id));

/** Órdenes de la empresa activa — réplica de `Orden.fetchAllForActiveEmpresa`
 *  (Swift): si la orden tiene `tiendaId`, se incluye si esa tienda es de la
 *  empresa; si no tiene tiendaId (legacy), solo se ve en `default-pv`. */
export const scopeOrdenes = (ordenes, empresaTiendaIds, activaId = getActivaId()) =>
  (ordenes || []).filter((o) => {
    const tid = o.tiendaId;
    if (tid) return empresaTiendaIds.has(tid);
    return activaId === DEFAULT_EMPRESA_ID;
  });

/** Productos de la empresa activa — réplica de `Producto.fetchAllForActiveEmpresa`
 *  (catálogo GLOBAL): la creó ella (`empresaId`) O tiene stock en una de sus
 *  tiendas (`stockPorTienda`). */
export const scopeProductos = (productos, empresaTiendaIds, activaId = getActivaId()) =>
  (productos || []).filter((p) => {
    if ((p.empresaId || DEFAULT_EMPRESA_ID) === activaId) return true;
    const spt = p.stockPorTienda;
    return spt && typeof spt === 'object' && Object.keys(spt).some((tid) => empresaTiendaIds.has(tid));
  });
