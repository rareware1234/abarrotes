import React from 'react';
import { HeroCard, ProductoAvatar, formatMXNumber } from './shared';

const nombreCorto = (nombre = '') => nombre.split(' ').slice(0, 4).join(' ');

function ProductoRow({ item, rank, isWorst }) {
  return (
    <div className="rank-row">
      <ProductoAvatar item={item} rank={rank} isWorst={isWorst} />
      <div className="rank-row-body">
        <span className="rank-row-name">{nombreCorto(item.nombre)}</span>
        <span className="rank-row-sub">${formatMXNumber(item.total)}</span>
      </div>
      <span className="spacer" />
      <div>
        <div className="rank-units-num">{item.cantidad}</div>
        <div className="rank-units-suffix">uds</div>
      </div>
    </div>
  );
}

export function MasVendidosCard({ topProductos, onCardClick }) {
  const top = topProductos.slice(0, 4);
  return (
    <HeroCard variant="wide" gradient="linear-gradient(135deg, #33A680 0%, #0D6147 100%)" emblem onCardClick={onCardClick}>
      <div className="hero-card-title">Más vendidos</div>
      {top.length === 0
        ? <div className="hero-card-empty">Sin ventas registradas</div>
        : <div className="rank-list">{top.map((item, i) => <ProductoRow key={i} item={item} rank={i + 1} isWorst={false} />)}</div>}
    </HeroCard>
  );
}

export function MenosVendidosCard({ topProductos, onCardClick }) {
  const menos = topProductos.filter((p) => p.cantidad > 0).sort((a, b) => a.cantidad - b.cantidad).slice(0, 4);
  return (
    <HeroCard variant="wide" gradient="linear-gradient(135deg, #8C94A6 0%, #474D66 100%)" emblem onCardClick={onCardClick}>
      <div className="hero-card-title">Menos vendidos</div>
      {menos.length === 0
        ? <div className="hero-card-empty">Sin ventas registradas</div>
        : <div className="rank-list">{menos.map((item, i) => <ProductoRow key={i} item={item} rank={i + 1} isWorst={i === 0} />)}</div>}
    </HeroCard>
  );
}
