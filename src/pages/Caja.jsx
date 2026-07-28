import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import cajaService from '../services/cajaService';
import orderService from '../services/orderService';
import StatCard from '../components/StatCard';
import ConfirmModal from '../components/ConfirmModal';
import registroActividadService from '../services/registroActividadService';
import { emit, CAJA_ACTUALIZADA } from '../lib/appEvents';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const formatDate = (date) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d);
};

const CierreCajaModal = ({ caja, ventas, onClose, onConfirm }) => {
  const [montoReal, setMontoReal] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  const ventasEfectivo    = ventas.filter(v => v.metodoPago === 'efectivo').reduce((sum, v) => sum + v.total, 0);
  const ventasTarjeta     = ventas.filter(v => v.metodoPago === 'tarjeta').reduce((sum, v) => sum + v.total, 0);
  const ventasMercadoPago = ventas.filter(v => v.metodoPago === 'mercadopago').reduce((sum, v) => sum + v.total, 0);
  const ventasCodi        = ventas.filter(v => v.metodoPago === 'codi').reduce((sum, v) => sum + v.total, 0);
  const ventasCredito     = ventas.filter(v => v.metodoPago === 'credito').reduce((sum, v) => sum + v.total, 0);
  const ventasTotales = ventas.reduce((sum, v) => sum + v.total, 0);

  const montoEsperado = (caja?.montoInicial || 0) + ventasEfectivo;
  const diferencia = (parseFloat(montoReal) || 0) - montoEsperado;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm({
      montoReal: parseFloat(montoReal),
      montoEsperado,
      ventasTotales,
      ventasEfectivo,
      ventasTarjeta,
      ventasMercadoPago,
      ventasCodi,
      ventasCredito,
      numTransacciones: ventas.length,
      notas
    });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirm-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: '20px' }}>Cierre de Caja</h3>
        
        <div style={{ background: '#F4F5F7', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Monto Apertura:</span>
            <span>{formatCurrency(caja?.montoInicial || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Ventas Efectivo:</span>
            <span>{formatCurrency(ventasEfectivo)}</span>
          </div>
          {ventasTarjeta > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Ventas Tarjeta:</span>
              <span>{formatCurrency(ventasTarjeta)}</span>
            </div>
          )}
          {ventasMercadoPago > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Mercado Pago:</span>
              <span>{formatCurrency(ventasMercadoPago)}</span>
            </div>
          )}
          {ventasCodi > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>CoDi:</span>
              <span>{formatCurrency(ventasCodi)}</span>
            </div>
          )}
          {ventasCredito > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Crédito:</span>
              <span>{formatCurrency(ventasCredito)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <span>Esperado en Caja:</span>
            <span>{formatCurrency(montoEsperado)}</span>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Monto Real en Caja</label>
          <div style={{ display:'flex', alignItems:'center', gap:8, border:'1.5px solid var(--border)', borderRadius:10, padding:'10px 14px', background:'white', marginBottom:8 }}>
            <span style={{ color:'var(--text-muted)', fontWeight:600, fontSize:16 }}>$</span>
            <input
              type="number"
              value={montoReal}
              onChange={(e) => setMontoReal(e.target.value)}
              placeholder="0.00"
              style={{ flex:1, border:'none', outline:'none', fontSize:20, fontWeight:700 }}
              autoFocus
            />
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {[500, 1000, 2000, 5000].map(amt => (
              <button key={amt} type="button"
                onClick={() => setMontoReal(String(amt))}
                style={{ flex:1, padding:'6px 0', borderRadius:8, border:`1.5px solid ${montoReal === String(amt) ? '#1A7A48' : 'var(--border,#e5e7eb)'}`, background: montoReal === String(amt) ? '#1A7A48' : 'white', color: montoReal === String(amt) ? 'white' : 'inherit', fontWeight:700, fontSize:11, cursor:'pointer' }}>
                ${(amt).toLocaleString()}
              </button>
            ))}
            {montoEsperado > 0 && (
              <button type="button"
                onClick={() => setMontoReal(String(montoEsperado.toFixed(0)))}
                style={{ flex:1, padding:'6px 0', borderRadius:8, border:`1.5px solid ${montoReal === String(montoEsperado.toFixed(0)) ? '#1A7A48' : 'var(--border,#e5e7eb)'}`, background: montoReal === String(montoEsperado.toFixed(0)) ? '#1A7A48' : 'white', color: montoReal === String(montoEsperado.toFixed(0)) ? 'white' : 'inherit', fontWeight:700, fontSize:11, cursor:'pointer' }}>
                Exacto
              </button>
            )}
          </div>
        </div>

        {montoReal && (
          <div style={{ padding: '16px', background: diferencia >= 0 ? '#dcfce7' : '#fee2e2', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
              <span>{diferencia >= 0 ? 'Sobrante:' : 'Faltante:'}</span>
              <span style={{ color: diferencia >= 0 ? '#1A7A48' : '#EF4444' }}>{formatCurrency(Math.abs(diferencia))}</span>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Notas (opcional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Agrega alguna nota..."
            style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', minHeight: '80px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} className="btn btn-outline-secondary" style={{ flex: 1 }} disabled={loading}>Cancelar</button>
          <button onClick={handleConfirm} className="btn btn-primary" style={{ flex: 1, background: 'var(--role-primary)' }} disabled={loading || !montoReal}>
            {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Confirmar Cierre'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Caja = () => {
  const { empleado, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [caja, setCaja] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [montoInicial, setMontoInicial] = useState('');
  const [historial, setHistorial] = useState([]);

  const puedeOperar = hasPermission('caja_operar');

  useEffect(() => {
    checkCaja();
    fetchHistorial();
  }, []);

  const checkCaja = async () => {
    setLoading(true);
    if (empleado?.uid) {
      const result = await cajaService.cajaAbierta(empleado.uid);
      if (result.success && result.data) {
        setCaja(result.data);
        fetchVentasCaja(result.data.id);
      }
    }
    setLoading(false);
  };

  const fetchVentasCaja = async (cajaId) => {
    const result = await orderService.getOrdenes('hoy');
    if (result.success) {
      setVentas(result.data);
    }
  };

  const fetchHistorial = async () => {
    const result = await cajaService.fetchHistorial();
    if (result.success) {
      setHistorial(result.data);
    }
  };

  const abrirCaja = async () => {
    if (!montoInicial) return;
    const result = await cajaService.abrirCaja(empleado.uid, empleado.nombre, parseFloat(montoInicial));
    if (result.success) {
      setCaja({ id: result.id, empleadoId: empleado.uid, empleadoNombre: empleado.nombre, montoInicial: parseFloat(montoInicial), abierta: true });
      setShowOpenModal(false);
      setMontoInicial('');
      emit(CAJA_ACTUALIZADA);
    }
  };

  const cerrarCaja = async (data) => {
    const result = await cajaService.cerrarCaja(caja.id, data);
    if (result.success) {
      const tiendaId = empleado?.tiendaId || empleado?.tiendaAsignada || '';
      const tiendaNombre = empleado?.tiendaNombre || '';
      registroActividadService.registrar({
        tiendaId,
        tiendaNombre,
        accion: 'caja_cerrada',
        descripcion: `Caja cerrada — ${ventas.length} ventas · Total ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.totalVentas || ventas.reduce((s, v) => s + v.total, 0))}`,
        realizadoPor: empleado?.nombre || 'Sistema',
        realizadoPorId: empleado?.uid || '',
      });
      setCaja(null);
      setVentas([]);
      setShowCloseModal(false);
      fetchHistorial();
      emit(CAJA_ACTUALIZADA);
    }
  };

  const ventasEfectivo    = ventas.filter(v => v.metodoPago === 'efectivo').reduce((sum, v) => sum + v.total, 0);
  const ventasTarjeta     = ventas.filter(v => v.metodoPago === 'tarjeta').reduce((sum, v) => sum + v.total, 0);
  const ventasMercadoPago = ventas.filter(v => v.metodoPago === 'mercadopago').reduce((sum, v) => sum + v.total, 0);
  const ventasCodi        = ventas.filter(v => v.metodoPago === 'codi').reduce((sum, v) => sum + v.total, 0);
  const ventasCredito     = ventas.filter(v => v.metodoPago === 'credito').reduce((sum, v) => sum + v.total, 0);
  const ventasTotales = ventas.reduce((sum, v) => sum + v.total, 0);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}><span className="spinner-border spinner-border-lg"></span></div>;
  }

  if (!caja) {
    return (
      <div className="caja-container">
        <div className="tiendas-header">
          <div>
            <h1>Caja</h1>
          </div>
          <div className="tiendas-header-actions">
            {puedeOperar && (
              <button className="tiendas-add-btn" onClick={() => setShowOpenModal(true)} style={{ borderRadius: '12px', width: 'auto', padding: '0 16px', gap: '6px', display: 'flex', alignItems: 'center' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Abrir
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3, marginBottom: '12px', color: '#6B7C93' }}>
            <rect x="2" y="6" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
          <p style={{ color: '#6B7C93', margin: 0 }}>Abre la caja para comenzar a operar</p>
        </div>

        {historial.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-dark)' }}>Historial de cierres</h4>
            <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              {historial.slice(0, 5).map((cierre, i) => (
                <div key={cierre.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px',
                  borderBottom: i < Math.min(historial.length, 5) - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: (cierre.diferencia || 0) >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                      stroke={(cierre.diferencia || 0) >= 0 ? '#10B981' : '#EF4444'} strokeWidth="2">
                      <polyline points={(cierre.diferencia || 0) >= 0 ? '20 6 9 17 4 12' : '18 6 6 18'}/>
                      {(cierre.diferencia || 0) < 0 && <line x1="6" y1="6" x2="18" y2="18"/>}
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{formatDate(cierre.closedAt)}</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                      {cierre.numTransacciones || 0} transacciones · {cierre.empleadoNombre || 'Cajero'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{formatCurrency(cierre.ventasTotales || 0)}</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: (cierre.diferencia || 0) >= 0 ? '#10B981' : '#EF4444' }}>
                      {(cierre.diferencia || 0) >= 0 ? '+' : ''}{formatCurrency(cierre.diferencia || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showOpenModal && (
          <div className="modal-overlay" onClick={() => setShowOpenModal(false)}>
            <div className="confirm-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'rgba(26,122,72,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className="bi bi-cash-coin" style={{ fontSize:22, color:'var(--role-primary,#1A7A48)' }} />
                </div>
                <div>
                  <h3 style={{ margin:0 }}>Abrir Caja</h3>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>Ingresa el fondo inicial</div>
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Monto Inicial</label>
                <div style={{ display:'flex', alignItems:'center', gap:8, border:'1.5px solid var(--border)', borderRadius:10, padding:'10px 14px', background:'white' }}>
                  <span style={{ color:'var(--text-muted)', fontWeight:600, fontSize:16 }}>$</span>
                  <input
                    type="number"
                    value={montoInicial}
                    onChange={(e) => setMontoInicial(e.target.value)}
                    placeholder="0.00"
                    style={{ flex:1, border:'none', outline:'none', fontSize:20, fontWeight:700 }}
                    autoFocus
                  />
                </div>
              </div>
              <div style={{ display:'flex', gap:8, marginBottom:20 }}>
                {[500, 1000, 2000, 5000].map(amt => (
                  <button key={amt} type="button"
                    onClick={() => setMontoInicial(String(amt))}
                    style={{ flex:1, padding:'8px 0', borderRadius:10, border:`1.5px solid ${montoInicial === String(amt) ? 'var(--role-primary,#1A7A48)' : 'var(--border,#e5e7eb)'}`, background: montoInicial === String(amt) ? 'var(--role-primary,#1A7A48)' : 'white', color: montoInicial === String(amt) ? 'white' : 'inherit', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                    ${(amt).toLocaleString()}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setShowOpenModal(false)} className="btn btn-outline-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={abrirCaja} className="btn btn-primary" style={{ flex: 1, background: 'var(--role-primary)' }} disabled={!montoInicial}>Abrir Caja</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="caja-container">
      <div className="tiendas-header">
        <div>
          <h1>Caja</h1>
        </div>
        <div className="tiendas-header-actions">
          {puedeOperar && caja && (
            <button className="tiendas-filter-chip danger" onClick={() => setShowCloseModal(true)}>
              <i className="bi bi-lock"></i>
              Cerrar Caja
            </button>
          )}
        </div>
      </div>

      {caja && (
        <>
          {/* ── Hero card turno activo ── */}
          <div style={{
            borderRadius: 20, padding: '22px 24px', marginBottom: 16,
            background: 'linear-gradient(135deg, var(--role-dark, #0F4D2E), var(--role-primary, #1A7A48))',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}>
            {/* Decorative orb */}
            <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />
            {/* Badges */}
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              <span style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.18)', borderRadius:20, padding:'4px 10px', fontSize:11, fontWeight:800, color:'white', letterSpacing:1.1 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ADE80', display:'inline-block' }} />
                TURNO ACTIVO
              </span>
              {caja.tiendaNombre && (
                <span style={{ background:'rgba(255,255,255,0.28)', borderRadius:20, padding:'4px 10px', fontSize:11, fontWeight:800, color:'white', letterSpacing:0.9 }}>
                  {caja.tiendaNombre.toUpperCase()}
                </span>
              )}
            </div>
            {/* Main figure */}
            <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.8)', marginBottom:4 }}>Total del turno</div>
            <div style={{ fontSize:42, fontWeight:900, color:'white', letterSpacing:-1, lineHeight:1, marginBottom:20, fontVariantNumeric:'tabular-nums' }}>
              {formatCurrency(ventasTotales)}
            </div>
            {/* Sub-metrics row */}
            <div style={{ display:'flex', gap:0, flexWrap:'wrap' }}>
              {[
                { label:'Apertura', value: caja.createdAt ? (caja.createdAt.toDate ? caja.createdAt.toDate() : new Date(caja.createdAt)).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' }) : '—' },
                { label:'Inicial', value: formatCurrency(caja.montoInicial || 0) },
                { label:'Ventas', value: ventas.length },
                { label:'Ticket prom.', value: ventas.length > 0 ? formatCurrency(ventasTotales / ventas.length) : '—' },
              ].map((m, i, arr) => (
                <div key={m.label} style={{ paddingRight: i < arr.length-1 ? 20 : 0, marginRight: i < arr.length-1 ? 20 : 0, borderRight: i < arr.length-1 ? '1px solid rgba(255,255,255,0.25)' : 'none' }}>
                  <div style={{ fontSize:17, fontWeight:700, color:'white', lineHeight:1 }}>{m.value}</div>
                  <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.65)', marginTop:3, textTransform:'uppercase', letterSpacing:0.5 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Payment method breakdown ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:10, marginBottom:16 }}>
            {[
              { label:'Efectivo', value:ventasEfectivo, color:'#2563EB', bg:'rgba(37,99,235,0.08)' },
              { label:'Tarjeta',  value:ventasTarjeta,  color:'#7C3AED', bg:'rgba(124,58,237,0.08)' },
              ...(ventasMercadoPago > 0 ? [{ label:'MercadoPago', value:ventasMercadoPago, color:'#009EE3', bg:'rgba(0,158,227,0.08)' }] : []),
              ...(ventasCodi > 0       ? [{ label:'CoDi',        value:ventasCodi,        color:'#22C55E', bg:'rgba(34,197,94,0.08)' }]  : []),
              ...(ventasCredito > 0    ? [{ label:'Crédito',     value:ventasCredito,     color:'#EF4444', bg:'rgba(239,68,68,0.08)' }]  : []),
              { label:'Esperado', value:(caja.montoInicial||0)+ventasEfectivo, color:'#10B981', bg:'rgba(16,185,129,0.08)' },
            ].map(m => (
              <div key={m.label} style={{ background:'white', borderRadius:12, padding:'12px 14px', boxShadow:'0 1px 6px rgba(0,0,0,0.04)', borderTop:`3px solid ${m.color}` }}>
                <div style={{ fontSize:16, fontWeight:800, color:'#1C1E21', marginBottom:3 }}>{formatCurrency(m.value)}</div>
                <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:0.4 }}>{m.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-dark)' }}>Movimientos del turno</h4>
            {ventas.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '14px', padding: '40px', textAlign: 'center', color: '#6B7C93', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3, marginBottom: '8px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <p style={{ margin: 0 }}>Sin ventas en este turno</p>
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                {ventas.map((venta, i) => (
                  <div key={venta.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px',
                    borderBottom: i < ventas.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: venta.metodoPago === 'efectivo' ? 'rgba(37,99,235,0.08)' : 'rgba(124,58,237,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                        stroke={venta.metodoPago === 'efectivo' ? '#2563EB' : '#7C3AED'} strokeWidth="2">
                        {venta.metodoPago === 'efectivo'
                          ? <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>
                          : <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>
                        }
                      </svg>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>
                        Venta #{venta.id.slice(-6).toUpperCase()}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '1px' }}>
                        {formatDate(venta.createdAt)} · {venta.metodoPago === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
                        {venta.items ? ` · ${venta.items.length} artículo${venta.items.length !== 1 ? 's' : ''}` : ''}
                      </div>
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-dark)', flexShrink: 0 }}>
                      {formatCurrency(venta.total)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showCloseModal && (
        <CierreCajaModal caja={caja} ventas={ventas} onClose={() => setShowCloseModal(false)} onConfirm={cerrarCaja} />
      )}
    </div>
  );
};

export default Caja;