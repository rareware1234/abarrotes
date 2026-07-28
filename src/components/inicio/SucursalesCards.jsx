import React from 'react';
import { HeroCard, FormatoAvatar, NumberBubble, RankBadge, formatCompactNumber } from './shared';
import { FORMATOS } from '../../data/formatos';

/* Paleta determinística de estados (igual que estadoGradient de Swift) */
const ESTADO_PALETTE = [
  ['#D98052', '#85381A'], ['#4D9973', '#1A5947'], ['#4D80B8', '#1F3873'],
  ['#C78C4D', '#7A4714'], ['#9E6147', '#592E1A'], ['#8C6BB8', '#4D3373'],
  ['#C7758C', '#7A3852'], ['#528C9E', '#1F4D66'],
];

const estadoInitials = (estado = '') => {
  const words = estado.split(/[^\p{L}]+/u).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (estado.trim()[0] || '?').toUpperCase();
};

const estadoGradient = (estado = '') => {
  const norm = estado.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  let hash = 5381;
  for (let i = 0; i < norm.length; i++) hash = (hash * 33 + norm.charCodeAt(i)) | 0;
  const [a, b] = ESTADO_PALETTE[Math.abs(hash) % ESTADO_PALETTE.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
};

const padTo = (items, n) => {
  const out = items.slice(0, n);
  while (out.length < n) out.push({ _placeholder: true, total: 0, ventasCount: 0 });
  return out;
};

/* ---------- Formatos (pastel con badge + conteo dentro de cada sector) ---------- */
const PIE = { size: 168, cx: 84, cy: 84, r: 80 };
const piePolar = (deg, r) => {
  const rad = (deg * Math.PI) / 180;
  return { x: PIE.cx + r * Math.sin(rad), y: PIE.cy - r * Math.cos(rad) };
};
const pieArc = (start, end) => {
  const p1 = piePolar(start, PIE.r);
  const p2 = piePolar(end, PIE.r);
  const large = end - start > 180 ? 1 : 0;
  return `M ${PIE.cx} ${PIE.cy} L ${p1.x} ${p1.y} A ${PIE.r} ${PIE.r} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
};

export function FormatosCard({ distribucionFormatos, onCardClick }) {
  const datos = distribucionFormatos.filter((d) => d.count > 0);
  const total = datos.reduce((s, d) => s + d.count, 0);

  let acc = 0;
  const sectors = datos.map((d) => {
    const start = (acc / total) * 360;
    acc += d.count;
    const end = (acc / total) * 360;
    const mid = (start + end) / 2;
    const c = datos.length === 1 ? { x: PIE.cx, y: PIE.cy } : piePolar(mid, PIE.r * 0.58);
    return { ...d, start, end, cx: c.x, cy: c.y, fmt: FORMATOS[d.formato] };
  });

  return (
    <HeroCard variant="sucursal" gradient="linear-gradient(135deg, #528C9E 0%, #1F4D66 100%)" emblem onCardClick={onCardClick}>
      <div className="hero-card-title">Formatos</div>
      {total === 0 ? (
        <div className="hero-card-empty">Sin tiendas en tu alcance</div>
      ) : (
        <>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox={`0 0 ${PIE.size} ${PIE.size}`} width="158" height="158">
              {datos.length === 1 ? (
                <circle cx={PIE.cx} cy={PIE.cy} r={PIE.r} fill={sectors[0].fmt.color}
                  stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
              ) : (
                sectors.map((s, i) => (
                  <path key={i} d={pieArc(s.start, s.end)} fill={s.fmt.color}
                    stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
                ))
              )}
              {sectors.map((s, i) => (
                <g key={`l${i}`}>
                  <image href={s.fmt.badge} x={s.cx - 11} y={s.cy - 16} width="22" height="22" />
                  <text x={s.cx} y={s.cy + 15} textAnchor="middle" fontSize="14" fontWeight="900"
                    fill="#fff" stroke="rgba(0,0,0,0.45)" strokeWidth="0.6" style={{ paintOrder: 'stroke' }}>
                    {s.count}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div style={{ textAlign: 'center', paddingTop: 4 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              SUCURSALES
            </div>
          </div>
        </>
      )}
    </HeroCard>
  );
}

/* ---------- Estados ---------- */
export function EstadosCard({ distribucionEstados, onCardClick }) {
  const datos = distribucionEstados.slice(0, 5);
  return (
    <HeroCard variant="sucursal" gradient="linear-gradient(135deg, #AD5294 0%, #66245C 100%)" emblem onCardClick={onCardClick}>
      <div className="hero-card-title">Estados</div>
      {datos.length === 0 ? (
        <div className="hero-card-empty">Sin tiendas con estado</div>
      ) : (
        <div className="rank-list">
          {datos.map((item, idx) => (
            <div className="rank-row" key={item.estado}>
              <div className="rank-avatar" style={{ width: 32, height: 32, background: estadoGradient(item.estado), fontSize: 12 }}>
                {estadoInitials(item.estado)}
                <RankBadge rank={idx + 1} position="br" scale={0.72} />
              </div>
              <div className="rank-row-body">
                <span className="rank-row-name">{item.estado}</span>
              </div>
              <span className="spacer" />
              <NumberBubble small>{formatCompactNumber(item.count)}</NumberBubble>
            </div>
          ))}
        </div>
      )}
    </HeroCard>
  );
}

/* ---------- Fila de tienda ---------- */
function TiendaRankRow({ rank, item, isWorst }) {
  if (item._placeholder) {
    return (
      <div className="rank-row">
        <div className="rank-avatar" style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.15)' }}>
          <i className="bi bi-shop" style={{ fontSize: 14, opacity: 0.6 }} />
        </div>
        <div className="rank-row-body"><span className="rank-row-name" style={{ opacity: 0.6 }}>Sin sucursal</span></div>
        <span className="spacer" />
        <NumberBubble small>—</NumberBubble>
      </div>
    );
  }
  return (
    <div className="rank-row">
      <FormatoAvatar formato={item.tienda?.formato} size={34} rank={rank} isWorst={isWorst} />
      <div className="rank-row-body">
        <span className="rank-row-name">{item.nombre}</span>
        <span className="rank-row-sub">{item.tienda?.estado || '—'}</span>
      </div>
      <span className="spacer" />
      <NumberBubble small>${formatCompactNumber(item.total)}</NumberBubble>
    </div>
  );
}

/* ---------- Sucursal del Mes (golden spotlight) ---------- */
export function SucursalDelMesCard({ topTiendasRanking, onCardClick }) {
  const top = topTiendasRanking?.[0];
  if (!top) return null;
  return (
    <HeroCard variant="sucursal" gradient="linear-gradient(135deg, #C49A1C 0%, #7A5502 100%)" emblem onCardClick={onCardClick}>
      <div className="hero-card-title">Sucursal del Mes</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 8 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <FormatoAvatar formato={top.tienda?.formato} size={52} rank={1} isWorst={false} />
          <span style={{ position: 'absolute', top: -6, right: -8, fontSize: 16 }}>👑</span>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{top.nombre}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{top.tienda?.estado || '—'}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'white', marginTop: 4, lineHeight: 1 }}>
            ${formatCompactNumber(top.total)}
          </div>
        </div>
      </div>
    </HeroCard>
  );
}

/* ---------- Mejor desempeño ---------- */
export function TopTiendasCard({ topTiendasRanking, onCardClick }) {
  const ranking = padTo(topTiendasRanking, 5);
  const empty = topTiendasRanking.length === 0;
  return (
    <HeroCard variant="sucursal" gradient="linear-gradient(135deg, #C78C4D 0%, #7A4714 100%)" emblem onCardClick={onCardClick}>
      <div className="hero-card-title">Mejor desempeño</div>
      {empty ? <div className="hero-card-empty">Sin ventas registradas</div> : (
        <div className="rank-list">
          {ranking.map((item, idx) => <TiendaRankRow key={idx} rank={idx + 1} item={item} isWorst={false} />)}
        </div>
      )}
    </HeroCard>
  );
}

/* ---------- Peor desempeño ---------- */
export function PeoresTiendasCard({ topTiendasRanking, onCardClick }) {
  const sorted = [...topTiendasRanking].sort((a, b) => a.total - b.total);
  const ranking = padTo(sorted, 5);
  const empty = topTiendasRanking.length === 0;
  return (
    <HeroCard variant="sucursal" gradient="linear-gradient(135deg, #857F47 0%, #47421A 100%)" emblem onCardClick={onCardClick}>
      <div className="hero-card-title">Peor desempeño</div>
      {empty ? <div className="hero-card-empty">Sin ventas registradas</div> : (
        <div className="rank-list">
          {ranking.map((item, idx) => <TiendaRankRow key={idx} rank={idx + 1} item={item} isWorst />)}
        </div>
      )}
    </HeroCard>
  );
}
