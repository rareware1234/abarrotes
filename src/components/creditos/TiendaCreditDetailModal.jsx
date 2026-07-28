import React, { useState, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { calcularSaludTienda } from '../../hooks/useCreditoDashboard';
import creditoService from '../../services/creditoService';

ChartJS.register(ArcElement, Tooltip, Legend);

const fmt = (amount) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);

const formatFecha = (date) => {
  if (!date) return '—';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const FORMATO_GRADIENTS = {
  puntoVerde: 'linear-gradient(135deg, #0F4D2E, var(--role-primary))',
  puntoVerdeGo: 'linear-gradient(135deg, #1E3A5F, #2563EB)',
  puntoVerdeXL: 'linear-gradient(135deg, #4C1D95, #7C3AED)',
};

const SALUD_CONFIG = {
  saludable: { color: '#10B981', label: 'Saludable' },
  enRiesgo:  { color: '#F59E0B', label: 'En Riesgo' },
  critico:   { color: '#EF4444', label: 'Crítico' },
};

const ESTADO_COLORS = {
  activo:    '#10B981',
  vencido:   '#EF4444',
  suspendido:'#F59E0B',
  pagado:    '#2563EB',
};

const getDiasRestantes = (fechaVencimiento) => {
  if (!fechaVencimiento) return null;
  const v = fechaVencimiento.toDate ? fechaVencimiento.toDate() : new Date(fechaVencimiento);
  return Math.ceil((v - new Date()) / (1000 * 60 * 60 * 24));
};

/* ── inline pago modal ── */
function PagoModal({ credito, onClose, onDone }) {
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const usado = credito.montoUsado || 0;
  const montoNum = parseFloat(monto) || 0;
  const nuevo = Math.max(0, usado - montoNum);

  const handlePagar = async () => {
    if (!montoNum || montoNum > usado) return;
    setLoading(true);
    const r = await creditoService.registrarPago(credito.id, montoNum);
    setLoading(false);
    if (r.success) onDone();
    else setErr(r.error || 'Error al registrar pago');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirm-modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ margin:0 }}>Registrar Pago</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:24, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
          Cliente: <strong>{credito.clienteNombre || credito.clienteId}</strong>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, border:'1.5px solid var(--border)', borderRadius:10, padding:'10px 14px', marginBottom:8 }}>
          <span style={{ color:'var(--text-muted)', fontWeight:600 }}>$</span>
          <input type="number" min="0" max={usado} step="0.01" value={monto}
            onChange={e => setMonto(e.target.value)} placeholder="0.00"
            style={{ flex:1, border:'none', outline:'none', fontSize:20, fontWeight:700 }} autoFocus />
        </div>
        <div style={{ display:'flex', gap:6, marginBottom:16 }}>
          {[usado * 0.25, usado * 0.5, usado].map((amt, i) => {
            const label = i === 2 ? 'Total' : `${[25, 50][i]}%`;
            return (
              <button key={i} type="button" onClick={() => setMonto(String(Math.round(amt)))}
                style={{ flex:1, padding:'6px 0', borderRadius:8, border:`1.5px solid ${monto === String(Math.round(amt)) ? 'var(--role-primary)' : 'var(--border,#e5e7eb)'}`, background: monto === String(Math.round(amt)) ? 'var(--role-primary)' : 'white', color: monto === String(Math.round(amt)) ? 'white' : 'inherit', fontWeight:700, fontSize:11, cursor:'pointer' }}>
                {label}
              </button>
            );
          })}
        </div>
        <div style={{ background:'#F4F5F7', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span>Saldo actual</span><span style={{ fontWeight:600 }}>{fmt(usado)}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span>Nuevo saldo</span><span style={{ fontWeight:700, color:'var(--role-primary)' }}>{fmt(nuevo)}</span>
          </div>
        </div>
        {err && <div style={{ color:'#EF4444', fontSize:12, marginBottom:10 }}>{err}</div>}
        <button onClick={handlePagar} disabled={!montoNum || montoNum > usado || loading}
          style={{ width:'100%', padding:12, background: montoNum > 0 && montoNum <= usado ? 'var(--role-primary)' : '#d1d5db', color:'white', border:'none', borderRadius:10, fontWeight:700, fontSize:15, cursor:'pointer' }}>
          {loading ? 'Procesando...' : 'Confirmar Pago'}
        </button>
      </div>
    </div>
  );
}

const TiendaCreditDetailModal = ({ tienda, creditos: creditosProp, onClose }) => {
  const [activeTab, setActiveTab] = useState('resumen');
  const [filtroCreditos, setFiltroCreditos] = useState('todos');
  const [pagoCredito, setPagoCredito] = useState(null);
  const [creditos, setCreditos] = useState(creditosProp);
  const chartRef = useRef(null);

  if (!tienda) return null;

  const refreshCredito = async (id) => {
    const r = await creditoService.getCredito(id);
    if (r.success && r.data) {
      setCreditos(prev => prev.map(c => c.id === id ? r.data : c));
    }
  };

  const salud = calcularSaludTienda(creditos);
  const saludConfig = SALUD_CONFIG[salud] || SALUD_CONFIG.saludable;

  const activos     = creditos.filter(c => c.estado === 'activo');
  const vencidos    = creditos.filter(c => c.estado === 'vencido');
  const porVencer   = activos.filter(c => {
    const dias = getDiasRestantes(c.fechaVencimiento);
    return dias !== null && dias >= 0 && dias <= 7;
  });

  const carteraTotal  = activos.reduce((s, c) => s + (c.montoAprobado || 0), 0);
  const montoUsado    = activos.reduce((s, c) => s + (c.montoUsado || 0), 0);
  const montoDisp     = carteraTotal - montoUsado;
  const montoVencido  = vencidos.reduce((s, c) => s + (c.montoUsado || 0), 0);

  const formato  = tienda.formato?.toLowerCase() || 'puntoverde';
  const gradient = FORMATO_GRADIENTS[formato] || FORMATO_GRADIENTS.puntoVerde;

  const chartData = {
    labels: ['Disponible', 'En uso', 'Vencido'],
    datasets: [{
      data: [Math.max(0, montoDisp), Math.max(0, montoUsado - montoVencido), montoVencido],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 0,
      cutout: '70%',
    }],
  };

  const getFilteredCreditos = () => {
    if (filtroCreditos === 'activo') return creditos.filter(c => c.estado === 'activo');
    if (filtroCreditos === 'vencido') return creditos.filter(c => c.estado === 'vencido');
    if (filtroCreditos === 'porVencer') return porVencer;
    return creditos;
  };
  const creditosFiltrados = getFilteredCreditos();

  const historial = [];
  creditos.forEach(c => {
    if (c.fechaAprobacion) historial.push({ tipo: 'aprobado', fecha: c.fechaAprobacion.toDate ? c.fechaAprobacion.toDate() : new Date(c.fechaAprobacion), monto: c.montoAprobado, clienteId: c.clienteNombre || c.clienteId });
    (c.transacciones || []).forEach(t => historial.push({ tipo: t.tipo, fecha: t.fecha?.toDate ? t.fecha.toDate() : new Date(t.fecha), monto: t.monto, clienteId: c.clienteNombre || c.clienteId }));
  });
  historial.sort((a, b) => b.fecha - a.fecha);

  const FILTER_CHIPS = [
    { key: 'todos', label: 'Todos', count: creditos.length },
    { key: 'activo', label: 'Activos', count: activos.length },
    { key: 'porVencer', label: 'Por vencer', count: porVencer.length },
    { key: 'vencido', label: 'Vencidos', count: vencidos.length },
  ];

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div style={{ background:'white', borderRadius:16, maxWidth:680, width:'95%', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column' }}
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{ background:gradient, padding:'20px', position:'relative', color:'white' }}>
            <button onClick={onClose} style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:32, height:32, color:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>×</button>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{tienda.formato || 'Punto Verde'}</div>
              <div style={{ fontSize:20, fontWeight:700 }}>{tienda.nombre}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', marginTop:4 }}>{tienda.ciudad ? `${tienda.ciudad}, ` : ''}{tienda.estado || ''}</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'#FAFAFA' }}>
            {[{ id:'resumen', label:'Resumen' }, { id:'creditos', label:'Créditos' }, { id:'historial', label:'Historial' }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ flex:1, padding:'12px', background: activeTab === t.id ? 'white' : 'transparent', border:'none', borderBottom: activeTab === t.id ? '2px solid var(--role-primary)' : '2px solid transparent', color: activeTab === t.id ? 'var(--role-primary)' : 'var(--text-muted)', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ flex:1, overflow:'auto', padding:20 }}>
            {/* ── Resumen ── */}
            {activeTab === 'resumen' && (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, marginBottom:24 }}>
                  {[
                    { label:'Cartera', value:fmt(carteraTotal), color:'var(--role-primary)' },
                    { label:'En uso', value:fmt(montoUsado), color:'#F59E0B' },
                    { label:'Vencido', value:fmt(montoVencido), color:'#EF4444' },
                    { label:'Activos', value:activos.length, color:'inherit' },
                  ].map(k => (
                    <div key={k.label} style={{ background:'#F4F5F7', padding:'12px', borderRadius:8, textAlign:'center' }}>
                      <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>{k.label}</div>
                      <div style={{ fontSize:18, fontWeight:700, color:k.color }}>{k.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display:'flex', gap:20, alignItems:'center', marginBottom:24 }}>
                  <div style={{ width:140, height:140, position:'relative' }}>
                    <Doughnut data={chartData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:(c) => fmt(c.raw) } } } }} ref={chartRef} />
                    <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
                      <div style={{ fontSize:14, fontWeight:700 }}>{fmt(carteraTotal)}</div>
                      <div style={{ fontSize:10, color:'var(--text-muted)' }}>Total</div>
                    </div>
                  </div>
                  <div style={{ flex:1 }}>
                    {[{ color:'#10B981', label:`Disponible: ${fmt(montoDisp)}` }, { color:'#F59E0B', label:`En uso: ${fmt(montoUsado - montoVencido)}` }, { color:'#EF4444', label:`Vencido: ${fmt(montoVencido)}` }].map(l => (
                      <div key={l.color} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                        <div style={{ width:12, height:12, borderRadius:3, background:l.color, flexShrink:0 }} />
                        <span style={{ fontSize:13 }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding:12, background:`${saludConfig.color}15`, borderRadius:8, borderLeft:`3px solid ${saludConfig.color}` }}>
                  <div style={{ fontSize:13, fontWeight:600, color:saludConfig.color, marginBottom:4 }}>Estado: {saludConfig.label}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                    {activos.length} activo{activos.length !== 1 ? 's' : ''} · {vencidos.length} vencido{vencidos.length !== 1 ? 's' : ''} · {porVencer.length} por vencer
                  </div>
                </div>
              </div>
            )}

            {/* ── Créditos ── */}
            {activeTab === 'creditos' && (
              <div>
                <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                  {FILTER_CHIPS.map(chip => (
                    <button key={chip.key} onClick={() => setFiltroCreditos(chip.key)}
                      style={{ padding:'6px 12px', border:`1.5px solid ${filtroCreditos === chip.key ? 'var(--role-primary)' : 'var(--border,#e5e7eb)'}`, borderRadius:16, background: filtroCreditos === chip.key ? 'var(--role-primary)' : 'white', color: filtroCreditos === chip.key ? 'white' : 'inherit', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      {chip.label} ({chip.count})
                    </button>
                  ))}
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {creditosFiltrados.length === 0 ? (
                    <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
                      <i className="bi bi-credit-card-2-front" style={{ fontSize:40, opacity:0.3 }} /><br/>
                      Sin créditos en este filtro
                    </div>
                  ) : creditosFiltrados.map(credito => {
                    const dias = getDiasRestantes(credito.fechaVencimiento);
                    const estadoColor = ESTADO_COLORS[credito.estado] || '#64748B';
                    const pct = credito.montoAprobado > 0 ? Math.min(1, (credito.montoUsado || 0) / credito.montoAprobado) : 0;
                    return (
                      <div key={credito.id} style={{ border:'1px solid var(--border)', borderRadius:12, padding:14, background:'white' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                          <div>
                            <div style={{ fontWeight:700, fontSize:14 }}>{credito.clienteNombre || credito.clienteId}</div>
                            <div style={{ fontFamily:'monospace', fontSize:11, color:'var(--text-muted)' }}>#{credito.id?.slice(-6).toUpperCase()}</div>
                          </div>
                          <span style={{ background:`${estadoColor}20`, color:estadoColor, padding:'4px 10px', borderRadius:12, fontSize:11, fontWeight:700 }}>
                            {credito.estado}
                          </span>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:12, marginBottom:10 }}>
                          <div><span style={{ color:'var(--text-muted)' }}>Usado:</span> <strong>{fmt(credito.montoUsado)}</strong></div>
                          <div><span style={{ color:'var(--text-muted)' }}>Aprobado:</span> <strong>{fmt(credito.montoAprobado)}</strong></div>
                          <div><span style={{ color:'var(--text-muted)' }}>Vence:</span> <strong style={{ color: dias !== null && dias <= 7 ? '#F59E0B' : dias !== null && dias <= 0 ? '#EF4444' : 'inherit' }}>{dias !== null ? (dias > 0 ? `${dias} días` : 'Vencido') : '—'}</strong></div>
                          <div><span style={{ color:'var(--text-muted)' }}>Tasa:</span> <strong>{credito.tasaMensual != null ? `${credito.tasaMensual}%` : '—'}</strong></div>
                        </div>
                        <div style={{ height:4, background:'var(--border,#e5e7eb)', borderRadius:2, overflow:'hidden', marginBottom: credito.estado === 'activo' ? 10 : 0 }}>
                          <div style={{ height:'100%', width:`${pct * 100}%`, background: pct > 0.75 ? '#EF4444' : pct > 0.5 ? '#F97316' : 'var(--role-primary)', borderRadius:2 }} />
                        </div>
                        {credito.estado === 'activo' && (
                          <button onClick={() => setPagoCredito(credito)}
                            style={{ width:'100%', padding:'8px 0', background:'var(--role-primary)', color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                            <i className="bi bi-cash-coin" /> Registrar Pago
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Historial ── */}
            {activeTab === 'historial' && (
              <div>
                {historial.length === 0 ? (
                  <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No hay historial</div>
                ) : historial.slice(0, 30).map((ev, idx) => {
                  const colorMap = { aprobado:'#10B981', pago:'#2563EB', compra:'#EF4444', suspendido:'#F59E0B' };
                  const iconMap  = { aprobado:'bi-check-circle-fill', pago:'bi-arrow-down-circle-fill', compra:'bi-arrow-up-circle-fill', suspendido:'bi-pause-circle-fill' };
                  const color = colorMap[ev.tipo] || '#64748B';
                  return (
                    <div key={idx} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom: idx < historial.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <i className={`bi ${iconMap[ev.tipo] || 'bi-circle'}`} style={{ fontSize:18, color, flexShrink:0 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:500 }}>{{ aprobado:'Crédito aprobado', pago:'Pago registrado', compra:'Compra realizada', suspendido:'Suspendido' }[ev.tipo] || ev.tipo}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{ev.clienteId} · {fmt(ev.monto)}</div>
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', flexShrink:0 }}>{formatFecha(ev.fecha)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {pagoCredito && (
        <PagoModal
          credito={pagoCredito}
          onClose={() => setPagoCredito(null)}
          onDone={() => {
            refreshCredito(pagoCredito.id);
            setPagoCredito(null);
          }}
        />
      )}
    </>
  );
};

export default TiendaCreditDetailModal;
