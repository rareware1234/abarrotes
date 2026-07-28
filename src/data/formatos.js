// Mapeo de formatos de tienda — sincronizado con FormatoTienda (Swift).
// Colores, gradientes y badges idénticos a la app macOS/iOS.
import formatoPV from '../assets/formato-pv.png';
import formatoGO from '../assets/formato-go.png';
import formatoXL from '../assets/formato-xl.png';
import logoBlanco from '../assets/logo-blanco.png';
import { rgbHex, isLightColor } from '../lib/brandColor';

// Re-export para compatibilidad con imports existentes (EmpresaContext, etc.).
export { rgbHex };

export const FORMATOS = {
  'Punto Verde': {
    key: 'Punto Verde',
    label: 'Punto Verde',
    short: 'PV',
    color: '#0F4D2D',
    colorDark: '#09381E',
    gradient: 'linear-gradient(135deg, #09381E 0%, #0F4D2D 100%)',
    badge: formatoPV,
  },
  'Punto Verde GO': {
    key: 'Punto Verde GO',
    label: 'Punto Verde GO',
    short: 'GO',
    color: '#EFA400',
    colorDark: '#C68700',
    gradient: 'linear-gradient(135deg, #C68700 0%, #EFA400 100%)',
    badge: formatoGO,
  },
  'Punto Verde XL': {
    key: 'Punto Verde XL',
    label: 'Punto Verde XL',
    short: 'XL',
    color: '#1A1A1A',
    colorDark: '#0E0E0E',
    gradient: 'linear-gradient(135deg, #0E0E0E 0%, #1A1A1A 100%)',
    badge: formatoXL,
  },
};

// Alias para variantes de nombre que llegan desde Firestore.
const ALIASES = {
  'PuntoVerde': 'Punto Verde',
  'PuntoVerde GO': 'Punto Verde GO',
  'PuntoVerde XL': 'Punto Verde XL',
  'Punto Verde Express': 'Punto Verde GO',
  'Punto Verde Go': 'Punto Verde GO',
};

/** Normaliza el string de formato de una tienda a una de las 3 claves canónicas. */
export const normalizeFormato = (formato) => {
  if (!formato) return 'Punto Verde';
  if (FORMATOS[formato]) return formato;
  if (ALIASES[formato]) return ALIASES[formato];
  return 'Punto Verde';
};

/** Devuelve el objeto de formato (con color, badge, etc.) para una tienda. */
export const getFormato = (tienda) =>
  FORMATOS[normalizeFormato(tienda?.formato)] || FORMATOS['Punto Verde'];

/** Orden canónico de los formatos (igual que FormatoTienda.allCases). */
export const FORMATOS_ORDEN = ['Punto Verde', 'Punto Verde GO', 'Punto Verde XL'];

/**
 * Gradiente de fondo de la pantalla según el rol/formato.
 * - manager → azul, admin → gris, staff → color de su formato.
 * Replica `heroGradientColors` de InicioView.swift.
 */
export const heroGradientForRole = (rol, staffFormato) => {
  switch (rol) {
    case 'manager':
      return 'linear-gradient(135deg, #1E4F8F 0%, #2E6BC4 100%)';
    case 'admin':
      return 'linear-gradient(135deg, #475569 0%, #64748B 100%)';
    case 'staff':
    default: {
      const fmt = FORMATOS[normalizeFormato(staffFormato)] || FORMATOS['Punto Verde'];
      // GO usa un fondo ámbar pastel para no cansar la vista (igual que Swift).
      if (fmt.key === 'Punto Verde GO') {
        return 'linear-gradient(135deg, rgb(255,217,140) 0%, rgb(255,247,217) 100%)';
      }
      return `linear-gradient(135deg, ${fmt.colorDark} 0%, ${fmt.color} 100%)`;
    }
  }
};

// ════════════════════════════════════════════════════════════════════════════
// PERFILES DE SISTEMA — réplica exacta de CustomFormato.systemPV/GO/XL (Swift).
// Usado como baseline en NuevoFormatoModal y como referencia de cotización.
// `caracteristicas[].icono` guarda el nombre del SF Symbol para mantener
// compatibilidad con macOS/iOS (que comparten la misma colección Firestore).
// ════════════════════════════════════════════════════════════════════════════
export const SYSTEM_PERFILES = {
  'Punto Verde': {
    tagline: 'Tienda de barrio',
    areaMin: 48, areaMax: 120, anchoSugerido: 8, largoSugerido: 10,
    empleadosMin: 3, empleadosMax: 5, cajas: 1,
    inventarioSugerido: 220000, rentaTipica: 22000, serviciosTipicos: 7000,
    ventasTipicaMensual: 320000,
    caracteristicas: [
      { icono: 'basket.fill', titulo: 'Surtido esencial', detalle: 'Abarrotes y básicos del hogar' },
      { icono: 'cart.fill', titulo: 'Formato enfocado en amas de casa', detalle: 'Compras diarias de abarrotes' },
      { icono: 'leaf.fill', titulo: 'Perecederos', detalle: 'Refrigeración y congelados' },
      { icono: 'shippingbox.fill', titulo: 'Bodega', detalle: 'Espacio dedicado al almacén' },
    ],
  },
  'Punto Verde GO': {
    tagline: 'Formato intermedio con mayor variedad',
    areaMin: 120, areaMax: 220, anchoSugerido: 12, largoSugerido: 15,
    empleadosMin: 6, empleadosMax: 10, cajas: 2,
    inventarioSugerido: 450000, rentaTipica: 38000, serviciosTipicos: 12000,
    ventasTipicaMensual: 720000,
    caracteristicas: [
      { icono: 'square.stack.3d.up.fill', titulo: 'Catálogo ampliado', detalle: 'Más SKUs y categorías' },
      { icono: 'creditcard.fill', titulo: '2 cajas de cobro', detalle: 'Reduce tiempos de espera' },
      { icono: 'moon.stars.fill', titulo: 'Horario extendido', detalle: 'Cobertura todo el día' },
      { icono: 'person.3.fill', titulo: 'Equipo dedicado', detalle: '6 a 10 personas' },
    ],
  },
  'Punto Verde XL': {
    tagline: 'Supermercado de formato grande',
    areaMin: 220, areaMax: 450, anchoSugerido: 16, largoSugerido: 20,
    empleadosMin: 12, empleadosMax: 20, cajas: 4,
    inventarioSugerido: 950000, rentaTipica: 75000, serviciosTipicos: 25000,
    ventasTipicaMensual: 1650000,
    caracteristicas: [
      { icono: 'building.2.fill', titulo: 'Multi-categoría', detalle: 'Despensa, hogar y línea blanca' },
      { icono: 'creditcard.fill', titulo: '4+ cajas de cobro', detalle: 'Alto volumen de operaciones' },
      { icono: 'fork.knife.circle.fill', titulo: 'Carnicería y panadería', detalle: 'Áreas de servicio en sitio' },
      { icono: 'car.fill', titulo: 'Estacionamiento', detalle: 'Acceso vehicular propio' },
    ],
  },
};

/** Perfil baseline para clonar al crear un formato custom (= Punto Verde). */
export const perfilBaseline = () => ({
  ...SYSTEM_PERFILES['Punto Verde'],
  caracteristicas: SYSTEM_PERFILES['Punto Verde'].caracteristicas.map((c) => ({ ...c })),
});

// ── Catálogo de íconos de servicio (los 27 de NuevoFormatoSheet.swift) ──────
// `sf` = nombre del SF Symbol que se persiste en Firestore (lo lee macOS/iOS).
// `bi` = clase de Bootstrap Icons equivalente para renderizar en web.
export const SERVICE_ICONS = [
  { sf: 'basket.fill', bi: 'bi-basket-fill', label: 'Canasta' },
  { sf: 'cart.fill', bi: 'bi-cart-fill', label: 'Carrito' },
  { sf: 'leaf.fill', bi: 'bi-tree-fill', label: 'Perecederos' },
  { sf: 'shippingbox.fill', bi: 'bi-box-seam-fill', label: 'Bodega' },
  { sf: 'square.stack.3d.up.fill', bi: 'bi-stack', label: 'Catálogo' },
  { sf: 'creditcard.fill', bi: 'bi-credit-card-fill', label: 'Cajas de cobro' },
  { sf: 'moon.stars.fill', bi: 'bi-moon-stars-fill', label: 'Horario extendido' },
  { sf: 'person.3.fill', bi: 'bi-people-fill', label: 'Equipo' },
  { sf: 'building.2.fill', bi: 'bi-buildings-fill', label: 'Multi-categoría' },
  { sf: 'fork.knife.circle.fill', bi: 'bi-egg-fried', label: 'Comida en sitio' },
  { sf: 'car.fill', bi: 'bi-car-front-fill', label: 'Estacionamiento' },
  { sf: 'bag.fill', bi: 'bi-bag-fill', label: 'Bolsa' },
  { sf: 'gift.fill', bi: 'bi-gift-fill', label: 'Regalos' },
  { sf: 'wifi', bi: 'bi-wifi', label: 'WiFi' },
  { sf: 'snowflake', bi: 'bi-snow', label: 'Congelados' },
  { sf: 'drop.fill', bi: 'bi-droplet-fill', label: 'Agua' },
  { sf: 'checkmark.seal.fill', bi: 'bi-patch-check-fill', label: 'Calidad' },
  { sf: 'star.fill', bi: 'bi-star-fill', label: 'Premium' },
  { sf: 'heart.fill', bi: 'bi-heart-fill', label: 'Favoritos' },
  { sf: 'bolt.fill', bi: 'bi-lightning-charge-fill', label: 'Rápido' },
  { sf: 'clock.fill', bi: 'bi-clock-fill', label: 'Horario' },
  { sf: 'phone.fill', bi: 'bi-telephone-fill', label: 'Teléfono' },
  { sf: 'tag.fill', bi: 'bi-tag-fill', label: 'Ofertas' },
  { sf: 'scalemass.fill', bi: 'bi-speedometer2', label: 'Báscula' },
  { sf: 'wallet.bifold', bi: 'bi-wallet2', label: 'Crédito' },
  { sf: 'qrcode', bi: 'bi-qr-code', label: 'Código QR' },
  { sf: 'barcode', bi: 'bi-upc-scan', label: 'Código de barras' },
];

const _SF_TO_BI = SERVICE_ICONS.reduce((m, i) => { m[i.sf] = i.bi; return m; }, {});

/** Convierte un nombre de SF Symbol (guardado en Firestore) a clase bi-*. */
export const sfToBi = (icono) => {
  if (!icono) return 'bi-patch-check-fill';
  if (icono.startsWith('bi-')) return icono;      // ya es bootstrap-icon
  return _SF_TO_BI[icono] || 'bi-patch-check-fill';
};


/**
 * Construye el "meta" de un formato custom con la MISMA forma que las entradas
 * de FORMATOS (color, colorDark, gradient, logo, badge, textColor, etc.) para
 * que cualquier renderer de tarjeta/hero funcione sin ramas especiales.
 * Réplica de CustomFormato.color/colorDark + logoData fallback (Swift).
 */
export const customFormatoMeta = (f) => {
  const color = rgbHex(f, 0);
  const colorDark = rgbHex(f, -0.18);
  const gradDark = rgbHex(f, -0.12);
  const isLight = isLightColor(f, 0.6);
  return {
    key: f.nombre,
    label: f.nombre,
    short: (f.shortName || f.nombre || '').toUpperCase(),
    subtitle: f.nombre,
    color,
    colorDark,
    gradient: `linear-gradient(135deg, ${gradDark} 0%, ${color} 100%)`,
    logo: f.logoUrl || logoBlanco,
    logoBlend: 'normal',
    badge: f.logoUrl || null,
    tagline: f.tagline || 'Formato personalizado',
    textColor: isLight ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.92)',
    isLight,
    isCustom: true,
    perfil: f.perfilData || null,
    caracteristicas: f.caracteristicas || f.perfilData?.caracteristicas || [],
    raw: f,
  };
};

/**
 * Resuelve un string de formato (de `tienda.formato`) a su meta, buscando
 * primero en los 3 system y luego en los custom (match case-insensitive por
 * nombre). Réplica de UserFormatosStore.resolve(formatoString) (Swift).
 */
export const resolveFormatoMeta = (formato, customFormatos = []) => {
  if (FORMATOS[formato]) return FORMATOS[formato];
  const alias = ALIASES[formato];
  if (alias && FORMATOS[alias]) return FORMATOS[alias];
  const target = (formato || '').trim().toLowerCase();
  if (target) {
    const cust = customFormatos.find((c) => (c.nombre || '').trim().toLowerCase() === target);
    if (cust) return customFormatoMeta(cust);
  }
  return FORMATOS['Punto Verde'];
};
