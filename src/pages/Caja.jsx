import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import cajaService from '../services/cajaService';
import orderService from '../services/orderService';
import StatCard from '../components/StatCard';
import ConfirmModal from '../components/ConfirmModal';

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

  const ventasEfectivo = ventas.filter(v => v.metodoPago === 'efectivo').reduce((sum, v) => sum + v.total, 0);
  const ventasTarjeta = ventas.filter(v => v.metodoPago !== 'efectivo').reduce((sum, v) => sum + v.total, 0);
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Ventas Tarjeta:</span>
            <span>{formatCurrency(ventasTarjeta)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <span>Esperado en Caja:</span>
            <span>{formatCurrency(montoEsperado)}</span>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Monto Real en Caja</label>
          <input
            type="number"
            value={montoReal}
            onChange={(e) => setMontoReal(e.target.value)}
            placeholder="0.00"
            style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '18px' }}
          />
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
    }
  };

  const cerrarCaja = async (data) => {
    const result = await cajaService.cerrarCaja(caja.id, data);
    if (result.success) {
      setCaja(null);
      setVentas([]);
      setShowCloseModal(false);
      fetchHistorial();
    }
  };

  const ventasEfectivo = ventas.filter(v => v.metodoPago === 'efectivo').reduce((sum, v) => sum + v.total, 0);
  const ventasTarjeta = ventas.filter(v => v.metodoPago !== 'efectivo').reduce((sum, v) => sum + v.total, 0);
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
            <div className="tiendas-subtitle">Sin caja abierta</div>
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
              <h3>Abrir Caja</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Monto Inicial</label>
                <input
                  type="number"
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '18px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setShowOpenModal(false)} className="btn btn-outline-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={abrirCaja} className="btn btn-primary" style={{ flex: 1, background: 'var(--role-primary)' }} disabled={!montoInicial}>Abrir</button>
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
          <div className="tiendas-subtitle">
            {caja ? `Abierta por ${caja.empleadoNombre} desde ${formatDate(caja.createdAt)}` : 'Sin caja abierta'}
          </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            <div className="tienda-dash-widget">
              <div className="tienda-dash-icon" style={{ background: 'var(--role-tinted-bg)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--role-primary)" strokeWidth="2"><rect x="2" y="6" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              </div>
              <div className="tienda-dash-value">{formatCurrency(caja.montoInicial || 0)}</div>
              <div className="tienda-dash-labels"><span>Apertura</span></div>
            </div>
            <div className="tienda-dash-widget">
              <div className="tienda-dash-icon" style={{ background: 'var(--role-tinted-bg)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--role-primary)" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <div className="tienda-dash-value">{formatCurrency(ventasTotales)}</div>
              <div className="tienda-dash-labels"><span>Ventas del turno</span></div>
            </div>
            <div className="tienda-dash-widget">
              <div className="tienda-dash-icon" style={{ background: 'rgba(37,99,235,0.1)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div className="tienda-dash-value">{formatCurrency(ventasEfectivo)}</div>
              <div className="tienda-dash-labels"><span>Efectivo</span></div>
            </div>
            <div className="tienda-dash-widget">
              <div className="tienda-dash-icon" style={{ background: 'rgba(124,58,237,0.1)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <div className="tienda-dash-value">{formatCurrency(ventasTarjeta)}</div>
              <div className="tienda-dash-labels"><span>Tarjeta</span></div>
            </div>
            <div className="tienda-dash-widget">
              <div className="tienda-dash-icon" style={{ background: 'rgba(249,115,22,0.1)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div className="tienda-dash-value">{ventas.length}</div>
              <div className="tienda-dash-labels"><span>Transacciones</span></div>
            </div>
            <div className="tienda-dash-widget">
              <div className="tienda-dash-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8l-4 4-4-4"/></svg>
              </div>
              <div className="tienda-dash-value">{ventas.length > 0 ? formatCurrency(ventasTotales / ventas.length) : '$0'}</div>
              <div className="tienda-dash-labels"><span>Ticket promedio</span></div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '14px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#6B7C93', marginBottom: '4px' }}>Monto esperado en caja</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--role-primary)' }}>
                  {formatCurrency((caja.montoInicial || 0) + ventasEfectivo)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#6B7C93' }}>Apertura + Efectivo</div>
                <div style={{ fontSize: '13px', color: '#6B7C93', marginTop: '2px' }}>
                  {formatCurrency(caja.montoInicial || 0)} + {formatCurrency(ventasEfectivo)}
                </div>
              </div>
            </div>
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