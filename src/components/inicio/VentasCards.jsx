import React from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { HeroCard, formatMXNumber } from './shared';

const GRAD = {
  hoy: 'linear-gradient(135deg, #D98052 0%, #85381A 100%)',
  mes: 'linear-gradient(135deg, #4D80B8 0%, #1F3873 100%)',
  balancePos: 'linear-gradient(135deg, #4D9973 0%, #1A5947 100%)',
  balanceNeg: 'linear-gradient(135deg, #806B61 0%, #40332E 100%)',
  metodos: 'linear-gradient(135deg, #475C94 0%, #1F2E61 100%)',
  meta: 'linear-gradient(135deg, #CC4D4D 0%, #8C2633 100%)',
  mesPasado: 'linear-gradient(135deg, #7B6BAE 0%, #3B2A73 100%)',
  tendencia: 'linear-gradient(135deg, #2A7A8C 0%, #0F3D4D 100%)',
};

const Sidebar = ({ value, label }) => (
  <div>
    <div className="hero-sidebar-value">{value}</div>
    <div className="hero-sidebar-label">{label}</div>
  </div>
);

const moneyTooltip = {
  callbacks: { label: (ctx) => '$' + formatMXNumber(ctx.raw) },
};

/* ---------- Ventas Hoy (barras por hora) ---------- */
export function VentasHoyCard({ totalHoy, ventasHoyCount, ticketPromedio, ventasPorHoraHoy, onCardClick }) {
  const data = {
    labels: ventasPorHoraHoy.map((p) => `${p.hora}h`),
    datasets: [{
      data: ventasPorHoraHoy.map((p) => p.total),
      backgroundColor: 'rgba(255,255,255,0.92)',
      borderRadius: 3,
      categoryPercentage: 0.85,
      barPercentage: 0.9,
    }],
  };
  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: moneyTooltip },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.18)', drawTicks: false },
        ticks: {
          color: 'rgba(255,255,255,0.8)', font: { size: 10, weight: 700 },
          autoSkip: false,
          callback: (val, i) => (i % 4 === 0 ? `${i}h` : ''),
        },
      },
      y: { display: false, beginAtZero: true },
    },
  };
  return (
    <HeroCard variant="ventas" gradient={GRAD.hoy} emblem emblemLarge onCardClick={onCardClick}>
      <div className="hero-card-title hero-card-title--lg">Hoy</div>
      <div className="hero-card-value">${formatMXNumber(totalHoy)}</div>
      <div className="hero-sidebars">
        <Sidebar value={ventasHoyCount} label="ventas hoy" />
        <Sidebar value={`$${formatMXNumber(ticketPromedio)}`} label="ticket promedio" />
      </div>
      {ventasHoyCount === 0
        ? <div className="hero-card-empty">Sin ventas hoy</div>
        : <div className="hero-chart"><Bar data={data} options={options} /></div>}
    </HeroCard>
  );
}

/* ---------- Ventas Mes (área) ---------- */
export function VentasMesCard({ totalMes, promedioDiario, ventasMesCount, ventasPorDiaDelMes, onCardClick }) {
  const data = {
    labels: ventasPorDiaDelMes.map((p) => p.dia),
    datasets: [{
      data: ventasPorDiaDelMes.map((p) => p.total),
      borderColor: 'rgba(255,255,255,0.95)',
      backgroundColor: 'rgba(255,255,255,0.28)',
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    }],
  };
  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: moneyTooltip },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.18)', drawTicks: false },
        ticks: {
          color: 'rgba(255,255,255,0.8)', font: { size: 10, weight: 700 },
          autoSkip: false,
          callback: (val, i) => ((i + 1) % 5 === 0 ? i + 1 : ''),
        },
      },
      y: { display: false, beginAtZero: true },
    },
  };
  return (
    <HeroCard variant="ventas" gradient={GRAD.mes} emblem emblemLarge onCardClick={onCardClick}>
      <div className="hero-card-title hero-card-title--lg">Mes</div>
      <div className="hero-card-value">${formatMXNumber(totalMes)}</div>
      <div className="hero-sidebars">
        <Sidebar value={`$${formatMXNumber(promedioDiario)}`} label="promedio diario" />
        <Sidebar value={ventasMesCount} label="ventas mes" />
      </div>
      <div className="hero-chart"><Line data={data} options={options} /></div>
    </HeroCard>
  );
}

/* ---------- Ingresos vs Egresos ---------- */
export function BalanceCard({ totalMes, egresosEstimadosMes, onCardClick }) {
  const ingresos = totalMes;
  const egresos = egresosEstimadosMes;
  const balance = ingresos - egresos;
  const positivo = balance >= 0;
  const totalMov = Math.max(ingresos + egresos, 1);
  const propIngresos = (ingresos / totalMov) * 100;
  return (
    <HeroCard variant="ventas" gradient={positivo ? GRAD.balancePos : GRAD.balanceNeg} emblem emblemLarge onCardClick={onCardClick}>
      <div className="hero-card-title hero-card-title--lg">Balance</div>
      <div className="hero-card-value">{positivo ? '+' : ''}${formatMXNumber(balance)}</div>
      <div className="hero-sidebars">
        <Sidebar value={`$${formatMXNumber(ingresos)}`} label="ingresos mes" />
        <Sidebar value={`$${formatMXNumber(egresos)}`} label="egresos mes" />
      </div>
      <div style={{ flex: 1 }} />
      <div className="balance-bar">
        <span className="ingresos" style={{ width: `${Math.max(propIngresos, 5)}%` }} />
        <span className="egresos" />
      </div>
      <div className="balance-legend">
        <span><i />Ingresos</span>
        <span className="muted"><i />Egresos</span>
      </div>
    </HeroCard>
  );
}

/* ---------- Métodos de pago (donut) ---------- */
export function MetodosPagoCard({ metodosPagoBreakdown, onCardClick }) {
  const total = metodosPagoBreakdown.reduce((s, m) => s + m.cantidad, 0);
  const data = {
    labels: metodosPagoBreakdown.map((m) => m.metodo),
    datasets: [{
      data: metodosPagoBreakdown.map((m) => m.cantidad),
      backgroundColor: metodosPagoBreakdown.map((m) => m.color),
      borderWidth: 0,
    }],
  };
  const options = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
  };
  return (
    <HeroCard variant="ventas" gradient={GRAD.metodos} emblem emblemLarge onCardClick={onCardClick}>
      <div className="hero-card-title hero-card-title--lg">Métodos de pago</div>
      <div className="ring-wrap" style={{ height: 130, margin: '0 auto' }}>
        {total === 0
          ? <div style={{ width: 130, height: 130, borderRadius: '50%', border: '12px solid rgba(255,255,255,0.25)' }} />
          : <div style={{ width: 130, height: 130 }}><Doughnut data={data} options={options} /></div>}
        <div className="ring-center">
          <div className="ring-center-value">{total}</div>
          <div className="ring-center-label">VENTAS HOY</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {total === 0
          ? <div className="hero-card-empty">Sin ventas hoy</div>
          : metodosPagoBreakdown.slice(0, 3).map((m) => (
            <div key={m.metodo} className="metodo-row">
              <span className="metodo-dot" style={{ background: m.color }} />
              <span className="metodo-name">{m.metodo}</span>
              <span className="metodo-count">{m.cantidad}</span>
            </div>
          ))}
      </div>
    </HeroCard>
  );
}

/* ---------- Meta del mes (anillo de progreso) ---------- */
export function MetaMesCard({ totalMes, metaMes, onCardClick }) {
  const pct = Math.min((totalMes / metaMes) * 100, 100);
  const restante = Math.max(metaMes - totalMes, 0);
  const now = new Date();
  const diasMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const diasRestantes = diasMes - now.getDate();

  const R = 59, C = 2 * Math.PI * R;
  return (
    <HeroCard variant="ventas" gradient={GRAD.meta} emblem emblemLarge onCardClick={onCardClick}>
      <div className="hero-card-title hero-card-title--lg">Meta del mes</div>
      <div className="ring-wrap" style={{ height: 140, margin: '0 auto' }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="12" />
          <circle
            cx="70" cy="70" r={R} fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)}
            transform="rotate(-90 70 70)"
          />
        </svg>
        <div className="ring-center">
          <div className="ring-center-value">{Math.round(pct)}%</div>
          <div className="ring-center-label">META</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="meta-stat-row"><span className="label">Vendido</span><span className="value">${formatMXNumber(totalMes)}</span></div>
        <div className="meta-stat-row"><span className="label">Restante</span><span className="value">${formatMXNumber(restante)}</span></div>
        <div className="meta-stat-row"><span className="label">Días</span><span className="value">{diasRestantes}</span></div>
      </div>
    </HeroCard>
  );
}

/* ---------- Mes anterior (comparación vs. mes actual) ---------- */
export function VentasMesPasadoCard({ totalMes, totalMesPasado, ventasMesCount, ventasMesPasadoCount, deltaMes, promedioDiarioMesPasado, onCardClick }) {
  const now = new Date();
  const mesPasadoNombre = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toLocaleDateString('es-MX', { month: 'long' });
  const deltaPos = deltaMes >= 0;

  return (
    <HeroCard variant="ventas" gradient={GRAD.mesPasado} emblem emblemLarge onCardClick={onCardClick}>
      <div className="hero-card-title hero-card-title--lg">
        {mesPasadoNombre.charAt(0).toUpperCase() + mesPasadoNombre.slice(1)}
      </div>
      <div className="hero-main-value">${formatMXNumber(totalMesPasado)}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <span style={{
          background: deltaPos ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)',
          color: deltaPos ? '#4ADE80' : '#F87171',
          padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        }}>
          {deltaPos ? '▲' : '▼'} {Math.abs(deltaMes).toFixed(1)}% vs este mes
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="meta-stat-row">
          <span className="label">Ticket prom.</span>
          <span className="value">
            ${ventasMesPasadoCount > 0 ? formatMXNumber(totalMesPasado / ventasMesPasadoCount) : '—'}
          </span>
        </div>
        <div className="meta-stat-row">
          <span className="label">Transacciones</span>
          <span className="value">{ventasMesPasadoCount}</span>
        </div>
        <div className="meta-stat-row">
          <span className="label">Prom. diario</span>
          <span className="value">${formatMXNumber(promedioDiarioMesPasado)}</span>
        </div>
      </div>
    </HeroCard>
  );
}

/* ---------- Tendencia 6 meses (línea) ---------- */
export function Tendencia6MesesCard({ comparativo6Meses = [], onCardClick }) {
  const data = {
    labels: comparativo6Meses.map((p) => p.label),
    datasets: [{
      data: comparativo6Meses.map((p) => p.total),
      borderColor: 'rgba(255,255,255,0.9)',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderWidth: 2.5,
      pointRadius: 3,
      pointBackgroundColor: '#fff',
      fill: true,
      tension: 0.45,
    }],
  };

  const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => '$' + formatMXNumber(ctx.raw) } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.65)', font: { size: 10 } } },
      y: { display: false },
    },
  };

  const totalAcum = comparativo6Meses.reduce((s, p) => s + p.total, 0);
  const promedioMes = comparativo6Meses.length > 0 ? totalAcum / comparativo6Meses.length : 0;
  const last = comparativo6Meses[comparativo6Meses.length - 1]?.total || 0;
  const prev = comparativo6Meses[comparativo6Meses.length - 2]?.total || 0;
  const tendPos = last >= prev;

  return (
    <HeroCard variant="ventas" gradient={GRAD.tendencia} emblem emblemLarge onCardClick={onCardClick}>
      <div className="hero-card-title hero-card-title--lg">Tendencia 6 meses</div>
      <div className="hero-main-value">${formatMXNumber(totalAcum)}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <span style={{
          background: tendPos ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)',
          color: tendPos ? '#4ADE80' : '#F87171',
          padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        }}>
          {tendPos ? '▲' : '▼'} Último vs anterior
        </span>
      </div>
      <div style={{ height: 80 }}>
        <Line data={data} options={opts} />
      </div>
      <div className="meta-stat-row" style={{ marginTop: 8 }}>
        <span className="label">Promedio mensual</span>
        <span className="value">${formatMXNumber(promedioMes)}</span>
      </div>
    </HeroCard>
  );
}
