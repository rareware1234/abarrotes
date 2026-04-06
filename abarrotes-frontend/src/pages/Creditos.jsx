import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import creditoService from '../services/creditoService';
import { getNivelColor, getNivelTasa, getMontoMaximo, calcularPago } from '../services/creditScoreEngine';
import StatCard from '../components/StatCard';
import FilterChips from '../components/FilterChips';
import ConfirmModal from '../components/ConfirmModal';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const Creditos = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [showEvaluarModal, setShowEvaluarModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [selectedCredito, setSelectedCredito] = useState(null);
  const [clienteId, setClienteId] = useState('');
  const [evalResult, setEvalResult] = useState(null);
  const [evaluando, setEvaluando] = useState(false);
  const [montoSeleccionado, setMontoSeleccionado] = useState(0);
  const [plazoSeleccionado, setPlazoSeleccionado] = useState(4);

  const puedeAprobar = hasPermission('creditos_aprobar');
  const puedeVer = hasPermission('creditos_ver');

  useEffect(() => {
    if (puedeVer) fetchCreditos();
  }, [filtro]);

  const fetchCreditos = async () => {
    setLoading(true);
    const result = await creditoService.listarCreditos();
    if (result.success) {
      let filtered = result.data;
      if (filtro === 'activo') filtered = result.data.filter(c => c.estado === 'activo');
      else if (filtro === 'vencido') filtered = result.data.filter(c => c.estado === 'vencido');
      else if (filtro === 'suspendido') filtered = result.data.filter(c => c.estado === 'suspendido');
      else if (filtro === 'pagado') filtered = result.data.filter(c => c.estado === 'pagado');
      setCreditos(filtered);
    }
    setLoading(false);
  };

  const getStats = () => {
    const activos = creditos.filter(c => c.estado === 'activo');
    const totalActivo = activos.reduce((sum, c) => sum + (c.montoUsado || 0), 0);
    const porVencer = activos.filter(c => {
      if (!c.fechaVencimiento) return false;
      const vencimiento = c.fechaVencimiento.toDate ? c.fechaVencimiento.toDate() : new Date(c.fechaVencimiento);
      const dias = Math.ceil((vencimiento - new Date()) / (1000 * 60 * 60 * 24));
      return dias <= 7 && dias > 0;
    }).length;
    const tasaPromedio = activos.length > 0 ? activos.reduce((sum, c) => sum + (c.tasaMensual || 0), 0) / activos.length : 0;
    return { totalActivo, porVencer, tasaPromedio: Math.round(tasaPromedio) };
  };

  const evaluarCliente = async () => {
    if (!clienteId) return;
    setEvaluando(true);
    const result = await creditoService.evaluarCliente(clienteId);
    if (result.success) {
      setEvalResult(result.data);
      setMontoSeleccionado(result.data.oferta.montoMaximo || 0);
    }
    setEvaluando(false);
  };

  const aprobarCredito = async () => {
    const result = await creditoService.aprobarCredito(
      clienteId,
      montoSeleccionado,
      plazoSeleccionado,
      evalResult.oferta.tasa
    );
    if (result.success) {
      setShowEvaluarModal(false);
      setEvalResult(null);
      setClienteId('');
      fetchCreditos();
    }
  };

  const verDetalle = (credito) => {
    setSelectedCredito(credito);
    setShowDetalleModal(true);
  };

  const getDiasRestantes = (fechaVencimiento) => {
    if (!fechaVencimiento) return null;
    const vencimiento = fechaVencimiento.toDate ? fechaVencimiento.toDate() : new Date(fechaVencimiento);
    return Math.ceil((vencimiento - new Date()) / (1000 * 60 * 60 * 24));
  };

  const filterOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'activo', label: 'Activo' },
    { value: 'vencido', label: 'Vencido' },
    { value: 'suspendido', label: 'Suspendido' },
    { value: 'pagado', label: 'Pagado' }
  ];

  const stats = getStats();
  const pagoCalculado = evalResult ? calcularPago(montoSeleccionado, evalResult.oferta.tasa, plazoSeleccionado) : null;

  if (!puedeVer) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>No tienes acceso a Créditos</div>;
  }

  return (
    <div className="creditos-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Créditos</h1>
        {puedeAprobar && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/creditos/dashboard')} style={{ padding: '10px 16px', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="bi bi-heart-pulse"></i> Ver Dashboard
            </button>
            <button onClick={() => { setEvalResult(null); setClienteId(''); setShowEvaluarModal(true); }} style={{ padding: '10px 20px', background: 'var(--role-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              <i className="bi bi-plus-lg me-2"></i>Evaluar Cliente
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard titulo="Total Activo" valor={formatCurrency(stats.totalActivo)} icono={<i className="bi bi-cash-stack"></i>} color="#1A7A48" />
        <StatCard titulo="Por Vencer" valor={stats.porVencer} icono={<i className="bi bi-exclamation-circle"></i>} color="#F59E0B" />
        <StatCard titulo="Tasa Promedio" valor={`${stats.tasaPromedio}%`} icono={<i className="bi bi-percent"></i>} color="#2563EB" />
      </div>

      <FilterChips opciones={filterOptions} seleccionado={filtro} onChange={setFiltro} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><span className="spinner-border spinner-border-lg"></span></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px', marginTop: '20px' }}>
          {creditos.map(credito => {
            const diasRestantes = getDiasRestantes(credito.fechaVencimiento);
            const nivelColor = credito.nivel ? getNivelColor(credito.nivel) : '#64748B';
            const porcentajeUsado = credito.montoAprobado ? (credito.montoUsado / credito.montoAprobado) * 100 : 0;
            
            return (
              <div key={credito.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>Cliente: {credito.clienteId}</h3>
                    {credito.nivel && (
                      <span style={{ background: nivelColor, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>{credito.nivel}</span>
                    )}
                  </div>
                  <span style={{ 
                    background: credito.estado === 'activo' ? '#dcfce7' : credito.estado === 'vencido' ? '#fee2e2' : '#FEF3C7',
                    color: credito.estado === 'activo' ? '#1A7A48' : credito.estado === 'vencido' ? '#EF4444' : '#F59E0B',
                    padding: '4px 12px', borderRadius: '12px', fontSize: '12px'
                  }}>
                    {credito.estado}
                  </span>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Usado</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(credito.montoUsado)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Disponible</span>
                    <span style={{ fontWeight: 600, color: '#1A7A48' }}>{formatCurrency(credito.montoDisponible)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Aprobado</span>
                    <span>{formatCurrency(credito.montoAprobado)}</span>
                  </div>
                  <div style={{ height: '8px', background: '#E5E7EB', borderRadius: '4px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${porcentajeUsado}%`, background: porcentajeUsado > 80 ? '#EF4444' : porcentajeUsado > 50 ? '#F59E0B' : '#1A7A48', borderRadius: '4px' }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <span>{credito.tasaMensual}% mensual</span>
                  {diasRestantes !== null && (
                    <span style={{ color: diasRestantes <= 7 ? '#F59E0B' : diasRestantes <= 0 ? '#EF4444' : 'inherit' }}>
                      {diasRestantes > 0 ? `${diasRestantes} días` : 'Vencido'}
                    </span>
                  )}
                </div>

                <button onClick={() => verDetalle(credito)} style={{ width: '100%', marginTop: '16px', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>
                  Ver Detalle
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showEvaluarModal && (
        <div className="modal-overlay" onClick={() => setShowEvaluarModal(false)}>
          <div className="confirm-modal" style={{ maxWidth: '500px', textAlign: 'left', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Evaluar Cliente</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <input type="text" placeholder="ID de Cliente" value={clienteId} onChange={e => setClienteId(e.target.value)} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <button onClick={evaluarCliente} disabled={evaluando} className="btn btn-primary" style={{ background: 'var(--role-primary)' }}>
                {evaluando ? <span className="spinner-border spinner-border-sm"></span> : 'Evaluar'}
              </button>
            </div>

            {evalResult && (
              <div style={{ marginTop: '20px', padding: '16px', background: '#F4F5F7', borderRadius: '8px' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: `${getNivelColor(evalResult.nivel)}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '32px', fontWeight: 700, color: getNivelColor(evalResult.nivel) }}>
                    {evalResult.score}
                  </div>
                  <div style={{ marginTop: '8px', fontWeight: 600, color: getNivelColor(evalResult.nivel) }}>{evalResult.nivel}</div>
                </div>

                {evalResult.oferta.tasa && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Monto: {formatCurrency(montoSeleccionado)}</label>
                      <input type="range" min="1000" max={evalResult.oferta.montoMaximo} value={montoSeleccionado} onChange={e => setMontoSeleccionado(parseInt(e.target.value))} style={{ width: '100%' }} />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Plazo: {plazoSeleccionado} semanas</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[4, 8, 12].map(p => (
                          <button key={p} onClick={() => setPlazoSeleccionado(p)} style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', background: plazoSeleccionado === p ? 'var(--role-primary)' : 'white', color: plazoSeleccionado === p ? 'white' : 'inherit' }}>{p} sem</button>
                        ))}
                      </div>
                    </div>
                    {pagoCalculado && (
                      <div style={{ padding: '12px', background: 'white', borderRadius: '8px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Total:</span><span style={{ fontWeight: 600 }}>{formatCurrency(pagoCalculado.total)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}><span>Semanal:</span><span>{formatCurrency(pagoCalculado.semanal)}</span></div>
                      </div>
                    )}
                    {puedeAprobar && (
                      <button onClick={aprobarCredito} className="btn btn-primary" style={{ width: '100%', background: '#1A7A48' }}>
                        Aprobar Crédito
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showDetalleModal && selectedCredito && (
        <div className="modal-overlay" onClick={() => setShowDetalleModal(false)}>
          <div className="confirm-modal" style={{ maxWidth: '500px', textAlign: 'left', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Detalle del Crédito</h3>
            <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cliente:</span><span>{selectedCredito.clienteId}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Estado:</span><span>{selectedCredito.estado}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Aprobado:</span><span>{formatCurrency(selectedCredito.montoAprobado)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Usado:</span><span>{formatCurrency(selectedCredito.montoUsado)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Disponible:</span><span style={{ color: '#1A7A48' }}>{formatCurrency(selectedCredito.montoDisponible)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tasa:</span><span>{selectedCredito.tasaMensual}%</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Plazo:</span><span>{selectedCredito.plazoSemanas} semanas</span></div>
            </div>
            <h4 style={{ marginBottom: '12px' }}>Historial</h4>
            {selectedCredito.transacciones?.length > 0 ? (
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                {selectedCredito.transacciones.map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span>{t.tipo === 'compra' ? 'Compra' : 'Pago'}</span>
                    <span style={{ fontWeight: 600, color: t.tipo === 'pago' ? '#1A7A48' : 'inherit' }}>{formatCurrency(t.monto)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Sin transacciones</p>
            )}
            <button onClick={() => setShowDetalleModal(false)} className="btn btn-primary" style={{ width: '100%', marginTop: '20px', background: 'var(--role-primary)' }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Creditos;