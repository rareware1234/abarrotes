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
          <button onClick={handleConfirm} className="btn btn-primary" style={{ flex: 1, background: '#1A7A48' }} disabled={loading || !montoReal}>
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
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <i className="bi bi-cash-stack" style={{ fontSize: '64px', color: 'var(--text-muted)', opacity: 0.3 }}></i>
          <h2 style={{ marginTop: '20px' }}>Caja Cerrada</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Abre la caja para comenzar a operar</p>
          {puedeOperar && (
            <button onClick={() => setShowOpenModal(true)} className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '16px', background: 'var(--role-primary)' }}>
              <i className="bi bi-lock-open me-2"></i>Abrir Caja
            </button>
          )}
        </div>

        {historial.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h3 style={{ marginBottom: '16px' }}>Historial de Cierres</h3>
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F4F5F7' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Fecha</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>Ventas</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.slice(0, 5).map(cierre => (
                    <tr key={cierre.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>{formatDate(cierre.closedAt)}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(cierre.ventasTotales || 0)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: cierre.diferencia >= 0 ? '#1A7A48' : '#EF4444', fontWeight: 600 }}>
                        {formatCurrency(cierre.diferencia || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Caja</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Abierta por {caja.empleadoNombre} desde {formatDate(caja.createdAt)}
          </p>
        </div>
        {puedeOperar && (
          <button onClick={() => setShowCloseModal(true)} className="btn btn-outline-danger" style={{ borderColor: '#EF4444', color: '#EF4444' }}>
            <i className="bi bi-lock me-2"></i>Cerrar Caja
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard titulo="Ventas del Turno" valor={formatCurrency(ventasTotales)} icono={<i className="bi bi-cash-stack"></i>} color="#1A7A48" />
        <StatCard titulo="Efectivo" valor={formatCurrency(ventasEfectivo)} icono={<i className="bi bi-cash"></i>} color="#2563EB" />
        <StatCard titulo="Tarjeta" valor={formatCurrency(ventasTarjeta)} icono={<i className="bi bi-credit-card"></i>} color="#7C3AED" />
        <StatCard titulo="Transacciones" valor={ventas.length} icono={<i className="bi bi-receipt"></i>} color="#F97316" />
      </div>

      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F4F5F7' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Hora</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Método</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map(venta => (
              <tr key={venta.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px', fontFamily: 'monospace' }}>{venta.id.slice(-8)}</td>
                <td style={{ padding: '12px', fontSize: '13px' }}>{formatDate(venta.createdAt)}</td>
                <td style={{ padding: '12px' }}><i className={`bi ${venta.metodoPago === 'efectivo' ? 'bi-cash' : 'bi-credit-card'}`}></i> {venta.metodoPago}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(venta.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCloseModal && (
        <CierreCajaModal caja={caja} ventas={ventas} onClose={() => setShowCloseModal(false)} onConfirm={cerrarCaja} />
      )}
    </div>
  );
};

export default Caja;