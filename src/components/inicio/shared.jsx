import React from 'react';
import logoBlanco from '../../assets/logo-blanco.png';
import sinImagen from '../../assets/sin-imagen.png';
import { FORMATOS, normalizeFormato } from '../../data/formatos';

/* ---- Formato de números (es-MX), igual que AppTheme.swift ---- */
export const formatMXNumber = (value) =>
  new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(Math.round(value || 0));

export const formatCompactNumber = (value) => {
  const v = Math.abs(value || 0);
  const sign = value < 0 ? '-' : '';
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return m >= 10 ? `${sign}${Math.floor(m)}m` : `${sign}${m.toFixed(1)}m`;
  }
  if (v >= 1_000) {
    const k = v / 1_000;
    return k >= 10 ? `${sign}${Math.floor(k)}k` : `${sign}${k.toFixed(1)}k`;
  }
  return `${sign}${Math.floor(v)}`;
};

/* ---- Colores de tier por ranking (staffTierColors de Swift) ---- */
export const staffTierColors = (rank) => {
  const score = Math.max(100 - (rank - 1) * 18, 10);
  if (score >= 80) return { start: '#FFD138', end: '#F58C1A' };
  if (score >= 50) return { start: '#33C780', end: '#0D8C6B' };
  if (score >= 25) return { start: '#528CF2', end: '#2E52C7' };
  return { start: '#8C94AD', end: '#525973' };
};

/* ---- Iniciales de un nombre ---- */
const initials = (nombre = '') =>
  nombre.trim().split(/\s+/).slice(0, 2).map((n) => n[0] || '').join('').toUpperCase() || '?';

/* ---- Avatar de empleado (foto o iniciales) ---- */
export function InicioAvatar({ empleado, size = 34, style = {} }) {
  const foto = empleado?.fotoUrl;
  return (
    <div
      className="inicio-avatar"
      style={{
        width: size, height: size, fontSize: size * 0.4,
        backgroundImage: foto ? `url(${foto})` : undefined,
        ...style,
      }}
    >
      {!foto && initials(empleado?.nombre)}
    </div>
  );
}

/* ---- Emblema (wordmark blanco) de la esquina del card ---- */
export function CardEmblem({ large = false }) {
  return (
    <img
      src={logoBlanco}
      alt=""
      className={`hero-card-emblem${large ? ' hero-card-emblem--lg' : ''}`}
    />
  );
}

/* ---- Icono de corona / pulgar para el #1 ---- */
const Crown = ({ s = 9 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="#5A3800">
    <path d="M3 7l4 4 5-7 5 7 4-4-2 12H5L3 7z" />
  </svg>
);
const ThumbDown = ({ s = 9 }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="#fff">
    <path d="M6.5 14.5l.9-3.5H3a1 1 0 0 1-1-1.2l1-5A1.5 1.5 0 0 1 4.5 3.5H12V11l-3.5 4a1.3 1.3 0 0 1-2-.5zM13 3.5h1.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5H13v-7z" />
  </svg>
);

/* ---- Badge de rango (corona/medalla/pulgar o número) ---- */
export function RankBadge({ rank, isWorst = false, position = 'br', scale = 1 }) {
  const base = { transform: scale !== 1 ? `scale(${scale})` : undefined };
  if (rank === 1 && isWorst) {
    return (
      <span className={`rank-badge ${position}`} style={{ ...base, background: 'linear-gradient(135deg,#F24D6B,#C72E52)' }}>
        <ThumbDown s={10} />
      </span>
    );
  }
  if (rank === 1) {
    return (
      <span className={`rank-badge ${position}`} style={{ ...base, background: 'linear-gradient(135deg,#FFD95A,#F2B226)' }}>
        <Crown s={10} />
      </span>
    );
  }
  return (
    <span className={`rank-badge ${position}`} style={{ ...base, background: 'rgba(255,255,255,0.95)', color: '#1f1300' }}>
      {rank}
    </span>
  );
}

/* ---- Burbuja con número/monto ---- */
export function NumberBubble({ children, small = false }) {
  return <span className={`number-bubble${small ? ' number-bubble--sm' : ''}`}>{children}</span>;
}

/* ---- Avatar circular del formato (PV/GO/XL) ---- */
export function FormatoAvatar({ formato, size = 34, rank, isWorst }) {
  const fmt = FORMATOS[normalizeFormato(formato)] || FORMATOS['Punto Verde'];
  return (
    <div className="rank-avatar" style={{ width: size, height: size, background: fmt.gradient }}>
      {fmt.badge
        ? <img src={fmt.badge} alt={fmt.short} />
        : <i className="bi bi-shop" style={{ fontSize: size * 0.4 }} />}
      {rank != null && <RankBadge rank={rank} isWorst={isWorst} position="br" scale={0.8} />}
    </div>
  );
}

/* ---- Avatar de producto (imagen + rank + emblema de marca) ---- */
export function ProductoAvatar({ item, rank, isWorst, size = 38 }) {
  const prov = item.proveedor;
  return (
    <div className="rank-avatar product" style={{ width: size, height: size }}>
      <img src={item.imagenUrl || sinImagen} alt="" onError={(e) => { e.currentTarget.src = sinImagen; }} />
      <RankBadge rank={rank} isWorst={isWorst} position="tl" scale={0.8} />
      {prov && (
        <span className="brand-emblem" style={{ background: '#33A680' }}>
          {prov.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

/* ---- Wrapper de hero card ---- */
export function HeroCard({ variant = 'sucursal', gradient, emblem, emblemLarge, children, onClick, onCardClick }) {
  const handleClick = onCardClick ? () => onCardClick(gradient) : onClick;
  return (
    <div
      className={`hero-card hero-card--${variant}`}
      style={{ background: gradient, cursor: handleClick ? 'pointer' : undefined }}
      onClick={handleClick}
    >
      {emblem && <CardEmblem large={emblemLarge} />}
      {children}
    </div>
  );
}
