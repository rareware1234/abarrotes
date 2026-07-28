import React from 'react';
import { useCart } from '../context/CartContext';
import { useEmpresa } from '../context/EmpresaContext';
import { usesPaletteColors, DEFAULT_EMPRESA_ID } from '../lib/empresaTheme';
import { brandColor } from '../lib/brandRoles';
import { emblemaIniciales } from '../lib/logoResolver';

const fmtMoney = (v) =>
  '$' + new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(Math.round(v || 0));

/**
 * Pill flotante inferior estilo Apple Music (mini-player) — muestra el
 * carrito y abre el POS como hoja deslizante. Réplica del bottom accessory
 * del POS en iPad/macOS.
 */
export default function POSPill({ onClick }) {
  const { itemCount, total } = useCart();
  const { empresaActiva } = useEmpresa();
  // Monograma de marca cuando el carrito está vacío en empresa custom (§7.1):
  // iniciales en oro sobre noir + línea dorada.
  const esCustom = empresaActiva && empresaActiva.id !== DEFAULT_EMPRESA_ID && usesPaletteColors(empresaActiva);
  const mostrarMono = esCustom && itemCount === 0;
  return (
    <button className="pos-pill" onClick={onClick} aria-label="Abrir punto de venta">
      <span className="pos-pill-cart">
        {mostrarMono ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, borderRadius: 7,
            background: brandColor(empresaActiva, 'fondosProfundos'),
            color: brandColor(empresaActiva, 'acentoPrincipal'),
            fontWeight: 800, fontSize: 12, letterSpacing: 0.5,
            borderBottom: `2px solid ${brandColor(empresaActiva, 'acentoPrincipal')}`,
          }}>
            {emblemaIniciales(empresaActiva)}
          </span>
        ) : (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        )}
      </span>
      <span className="pos-pill-info">
        <span className="pos-pill-total">{fmtMoney(total)}</span>
        <span className="pos-pill-count">{itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}</span>
      </span>
      <span className="pos-pill-cta">
        Punto de venta
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </span>
    </button>
  );
}
