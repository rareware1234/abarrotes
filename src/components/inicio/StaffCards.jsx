import React from 'react';
import { HeroCard, InicioAvatar, RankBadge, formatMXNumber } from './shared';

const padTo = (items, n) => {
  const out = items.slice(0, n);
  while (out.length < n) out.push({ _placeholder: true, total: 0, ventasCount: 0 });
  return out;
};

function EmpleadoRow({ item, rank, isWorst }) {
  if (item._placeholder) {
    return (
      <div className="rank-row">
        <div style={{ position: 'relative' }}>
          <div className="inicio-avatar" style={{ width: 30, height: 30, fontSize: 12, opacity: 0.6 }}>
            <i className="bi bi-person-fill" />
          </div>
        </div>
        <div className="rank-row-body"><span className="rank-row-name" style={{ opacity: 0.6 }}>Sin empleado</span></div>
        <span className="spacer" />
      </div>
    );
  }
  return (
    <div className="rank-row">
      <div style={{ position: 'relative' }}>
        <InicioAvatar empleado={item.empleado || { nombre: item.nombre }} size={30} />
        <RankBadge rank={rank} isWorst={isWorst} position="br" scale={0.8} />
      </div>
      <div className="rank-row-body">
        <span className="rank-row-name">{item.nombre}</span>
        <span className="rank-row-sub">{item.ventasCount} ventas · ${formatMXNumber(item.total)}</span>
      </div>
      <span className="spacer" />
    </div>
  );
}

export function TopEmpleadosCard({ topEmpleadosRanking, onCardClick }) {
  const ranking = padTo(topEmpleadosRanking, 4);
  const empty = topEmpleadosRanking.length === 0;
  return (
    <HeroCard variant="wide" gradient="linear-gradient(135deg, #C7758C 0%, #7A3852 100%)" emblem onCardClick={onCardClick}>
      <div className="hero-card-title">Top empleados</div>
      {empty ? <div className="hero-card-empty">Sin ventas registradas</div> : (
        <div className="rank-list">
          {ranking.map((item, i) => <EmpleadoRow key={i} item={item} rank={i + 1} isWorst={false} />)}
        </div>
      )}
    </HeroCard>
  );
}

export function EmpleadoDelMesCard({ topEmpleadosRanking, onCardClick }) {
  const top = topEmpleadosRanking?.[0];
  if (!top) return null;
  const runner1 = topEmpleadosRanking?.[1];
  const runner2 = topEmpleadosRanking?.[2];
  return (
    <HeroCard variant="wide" gradient="linear-gradient(135deg, #C49A1C 0%, #7A5502 100%)" emblem onCardClick={onCardClick}>
      <div className="hero-card-title">Empleado del Mes</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 10 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <InicioAvatar empleado={top.empleado || { nombre: top.nombre }} size={56} />
          <span style={{ position: 'absolute', top: -6, right: -8, fontSize: 16 }}>👑</span>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{top.nombre}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
            ${formatMXNumber(top.total)} · {top.ventasCount} ventas
          </div>
        </div>
      </div>
      {(runner1 || runner2) && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[runner1, runner2].filter(Boolean).map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12 }}>{i === 0 ? '🥈' : '🥉'}</span>
              <InicioAvatar empleado={r.empleado || { nombre: r.nombre }} size={22} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{r.nombre}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginLeft: 'auto' }}>${formatMXNumber(r.total)}</span>
            </div>
          ))}
        </div>
      )}
    </HeroCard>
  );
}

export function AlertaStaffCard({ topEmpleadosRanking, onCardClick }) {
  const sorted = [...topEmpleadosRanking].sort((a, b) => a.total - b.total);
  const ranking = padTo(sorted, 4);
  const empty = topEmpleadosRanking.length === 0;
  return (
    <HeroCard variant="wide" gradient="linear-gradient(135deg, #9E6147 0%, #592E1A 100%)" emblem onCardClick={onCardClick}>
      <div className="hero-card-title">Alerta staff</div>
      {empty ? <div className="hero-card-empty">Sin ventas registradas</div> : (
        <div className="rank-list">
          {ranking.map((item, i) => <EmpleadoRow key={i} item={item} rank={i + 1} isWorst />)}
        </div>
      )}
    </HeroCard>
  );
}
