import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import creditoService from '../services/creditoService';
import logoBlanco from '../assets/logo-blanco.png';
import './Creditos.css';

const ESTADO_GRADIENTS = {
  activo:     'linear-gradient(135deg, var(--role-primary) 0%, #0A4A2A 100%)',
  vencido:    'linear-gradient(135deg, #DC2626 0%, #7F1D1D 100%)',
  pagado:     'linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)',
  suspendido: 'linear-gradient(135deg, #EA580C 0%, #7C2D12 100%)',
  rechazado:  'linear-gradient(135deg, #6B7280 0%, #374151 100%)',
};

const fmt = (amount) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);

const fmtDate = (date) => {
  if (!date) return '—';
  const d = date.toDate ? date.toDate() : new Date(date);
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
};

const diasRestantes = (fechaVencimiento) => {
  if (!fechaVencimiento) return null;
  const v = fechaVencimiento.toDate ? fechaVencimiento.toDate() : new Date(fechaVencimiento);
  return Math.ceil((v - new Date()) / (1000 * 60 * 60 * 24));
};

const porcentaje = (c) => {
  const aprobado = c.montoAprobado || c.montoOriginal || 1;
  return Math.min(1, (c.montoUsado || 0) / aprobado);
};

const progColor = (pct) => pct > 0.75 ? '#EF4444' : pct > 0.5 ? '#F97316' : 'var(--role-primary)';

const ESTADO_CFG = {
  activo:     { label: 'Activo',     color: 'var(--role-primary)', bg: '#D1FAE5', icon: 'bi-check-circle-fill' },
  vencido:    { label: 'Vencido',    color: '#EF4444', bg: '#FEE2E2', icon: 'bi-exclamation-circle-fill' },
  pagado:     { label: 'Pagado',     color: '#2563EB', bg: '#DBEAFE', icon: 'bi-credit-card-fill' },
  suspendido: { label: 'Suspendido', color: '#F97316', bg: '#FFF7ED', icon: 'bi-pause-circle-fill' },
  rechazado:  { label: 'Rechazado', color: '#6B7280', bg: '#F3F4F6', icon: 'bi-x-circle-fill' },
};

const EstadoBadge = ({ estado }) => {
  const cfg = ESTADO_CFG[estado] || { label: estado || '—', color: '#6B7280', bg: '#F3F4F6', icon: 'bi-circle' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      <i className={`bi ${cfg.icon}`} style={{ fontSize: 9 }} />
      {cfg.label}
    </span>
  );
};

const riesgoInfo = (c) => {
  const pct = porcentaje(c);
  const dias = diasRestantes(c.fechaVencimiento);
  if (pct > 0.75 || (dias !== null && dias < 7))  return { label: 'Alto',  color: '#EF4444', bg: '#FEE2E2', icon: 'bi-exclamation-triangle-fill', desc: 'Requiere atención urgente' };
  if (pct > 0.5  || (dias !== null && dias < 14)) return { label: 'Medio', color: '#F97316', bg: '#FFF7ED', icon: 'bi-exclamation-circle-fill',  desc: 'Requiere atención pronto' };
  return { label: 'Bajo', color: 'var(--role-primary)', bg: '#D1FAE5', icon: 'bi-check-circle-fill', desc: 'El crédito está en buen estado' };
};

/* ── Credit detail panel ──────────────────────────────────────────────────── */
function CreditoDetalle({ credito, onClose, onPagoRegistrado, onSuspender, canEdit }) {
  const [showPago, setShowPago] = useState(false);
  const [showSuspender, setShowSuspender] = useState(false);
  const [montoPago, setMontoPago] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loadingPago, setLoadingPago] = useState(false);
  const [loadingSuspender, setLoadingSuspender] = useState(false);
  const [errorPago, setErrorPago] = useState('');

  const aprobado = credito.montoAprobado || credito.montoOriginal || 0;
  const usado = credito.montoUsado || 0;
  const disponible = credito.montoDisponible ?? (aprobado - usado);
  const pct = Math.min(1, aprobado > 0 ? usado / aprobado : 0);
  const dias = diasRestantes(credito.fechaVencimiento);
  const riesgo = riesgoInfo(credito);

  const transacciones = [...(credito.transacciones || [])].sort((a, b) => {
    const fa = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha || 0);
    const fb = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha || 0);
    return fb - fa;
  });

  const montoNum = parseFloat(montoPago) || 0;
  const nuevoSaldo = Math.max(0, usado - montoNum);
  const puedePagar = montoNum > 0 && montoNum <= usado;

  const handlePago = async () => {
    if (!puedePagar) return;
    setLoadingPago(true);
    setErrorPago('');
    const result = await creditoService.registrarPago(credito.id, montoNum);
    setLoadingPago(false);
    if (result.success) {
      setShowPago(false);
      setMontoPago('');
      onPagoRegistrado();
    } else {
      setErrorPago(result.error || 'Error al registrar el pago');
    }
  };

  const handleSuspender = async () => {
    if (!motivo.trim()) return;
    setLoadingSuspender(true);
    const result = await creditoService.suspenderCredito(credito.id, motivo);
    setLoadingSuspender(false);
    if (result.success) {
      setShowSuspender(false);
      setMotivo('');
      onSuspender();
    }
  };

  return (
    <>
      <div className="cr-detail-overlay" onClick={onClose} />
      <div className="cr-detail-panel">
        <div className="cr-detail-header">
          <div>
            <div className="cr-detail-nombre">{credito.clienteNombre || credito.clienteId || 'Cliente'}</div>
            <div className="cr-detail-id">Crédito #{credito.id?.slice(-6).toUpperCase()}</div>
          </div>
          <button className="cr-detail-close" onClick={onClose}><i className="bi bi-x" /></button>
        </div>

        <div className="cr-detail-body">
          {/* Resumen */}
          <div className="cr-detail-card">
            <div className="cr-detail-row-top">
              <div>
                <div className="cr-lbl">Crédito Aprobado</div>
                <div className="cr-amount">{fmt(aprobado)}</div>
              </div>
              <EstadoBadge estado={credito.estado} />
            </div>
            <div className="cr-metric-row">
              <div className="cr-metric"><span className="cr-lbl">Pendiente</span><span style={{ color: '#EF4444', fontWeight: 700 }}>{fmt(usado)}</span></div>
              <div className="cr-metric"><span className="cr-lbl">Disponible</span><span style={{ color: 'var(--role-primary)', fontWeight: 700 }}>{fmt(disponible)}</span></div>
              <div className="cr-metric"><span className="cr-lbl">Tasa mens.</span><span style={{ fontWeight: 700 }}>{credito.tasaMensual != null ? `${credito.tasaMensual * 100}%` : '—'}</span></div>
            </div>
            <div>
              <div className="cr-prog-label"><span>Uso del crédito</span><span>{Math.round(pct * 100)}%</span></div>
              <div className="cr-prog-track"><div className="cr-prog-fill" style={{ width: `${pct * 100}%`, background: progColor(pct) }} /></div>
            </div>
            <div className="cr-detail-dates">
              <div><div className="cr-lbl">Vencimiento</div><div className="cr-val">{fmtDate(credito.fechaVencimiento)}</div></div>
              <div style={{ textAlign: 'right' }}>
                <div className="cr-lbl">Días restantes</div>
                <div className="cr-val" style={{ color: dias !== null && dias < 7 ? '#EF4444' : 'inherit' }}>{dias !== null ? `${dias} días` : '—'}</div>
              </div>
            </div>
          </div>

          {/* Riesgo */}
          <div className="cr-detail-card">
            <div className="cr-section-title">Indicador de Riesgo</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: riesgo.bg, borderRadius: 10 }}>
              <i className={`bi ${riesgo.icon}`} style={{ color: riesgo.color, fontSize: 20 }} />
              <div>
                <div style={{ fontWeight: 700, color: riesgo.color }}>{riesgo.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{riesgo.desc}</div>
              </div>
            </div>
          </div>

          {/* Historial */}
          <div className="cr-detail-card">
            <div className="cr-section-title">Historial de Transacciones</div>
            {transacciones.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>Sin transacciones aún</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {transacciones.map((t, idx) => {
                  const esPago = t.tipo === 'pago';
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: idx < transacciones.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <i className={`bi ${esPago ? 'bi-arrow-down-circle-fill' : 'bi-arrow-up-circle-fill'}`} style={{ fontSize: 20, color: esPago ? 'var(--role-primary)' : '#EF4444' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{esPago ? 'Pago registrado' : 'Compra realizada'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(t.fecha)}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: esPago ? 'var(--role-primary)' : '#EF4444' }}>{esPago ? '+' : '-'}{fmt(t.monto)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {credito.estado === 'activo' && (
          <div className="cr-detail-actions">
            {canEdit && (
              <button className="cr-btn-danger" onClick={() => setShowSuspender(true)}>
                <i className="bi bi-pause-circle-fill" /> Suspender
              </button>
            )}
            <button className="cr-btn-primary" onClick={() => setShowPago(true)}>
              <i className="bi bi-cash-coin" /> Registrar Pago
            </button>
          </div>
        )}
      </div>

      {/* Pago modal */}
      {showPago && (
        <div className="modal-overlay" onClick={() => { setShowPago(false); setMontoPago(''); setErrorPago(''); }}>
          <div className="confirm-modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Registrar Pago</h3>
              <button onClick={() => { setShowPago(false); setMontoPago(''); }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Monto del pago</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>$</span>
                <input type="number" min="0" max={usado} step="0.01" value={montoPago} onChange={e => setMontoPago(e.target.value)}
                  placeholder="0.00" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 18, fontWeight: 700 }} autoFocus />
              </div>
            </div>
            <div style={{ background: '#F4F5F7', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Saldo pendiente</span><span style={{ fontWeight: 600 }}>{fmt(usado)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Nuevo saldo</span><span style={{ fontWeight: 700, color: 'var(--role-primary)' }}>{fmt(nuevoSaldo)}</span></div>
            </div>
            {errorPago && <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{errorPago}</div>}
            <button onClick={handlePago} disabled={!puedePagar || loadingPago}
              style={{ width: '100%', background: puedePagar ? 'var(--role-primary)' : '#d1d5db', color: '#fff', border: 'none', padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: puedePagar ? 'pointer' : 'not-allowed' }}>
              {loadingPago ? <><span className="spinner-border spinner-border-sm me-2" />Procesando...</> : 'Confirmar Pago'}
            </button>
          </div>
        </div>
      )}

      {/* Suspender modal */}
      {showSuspender && (
        <div className="modal-overlay" onClick={() => { setShowSuspender(false); setMotivo(''); }}>
          <div className="confirm-modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Suspender Crédito</h3>
              <button onClick={() => setShowSuspender(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Motivo de suspensión</label>
              <textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Explica el motivo..."
                style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 14, minHeight: 80, resize: 'vertical', boxSizing: 'border-box' }} autoFocus />
            </div>
            <button onClick={handleSuspender} disabled={!motivo.trim() || loadingSuspender}
              style={{ width: '100%', background: '#EF4444', color: '#fff', border: 'none', padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: !motivo.trim() || loadingSuspender ? 0.5 : 1 }}>
              {loadingSuspender ? <><span className="spinner-border spinner-border-sm me-2" />Procesando...</> : 'Confirmar Suspensión'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Nuevo Crédito form ────────────────────────────────────────────────────── */
function NuevoCreditoForm({ onCreditoCreado }) {
  const { empleado } = useAuth();
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [monto, setMonto] = useState('');
  const [plazo, setPlazo] = useState(4);
  const [tasaPct, setTasaPct] = useState(5);
  const [loading, setLoading] = useState(false);
  const [evaluando, setEvaluando] = useState(false);
  const [evaluacion, setEvaluacion] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const evaluar = async () => {
    if (!clienteId.trim()) return;
    setEvaluando(true);
    setError('');
    const result = await creditoService.evaluarCliente(clienteId.trim());
    setEvaluando(false);
    if (result.success && result.data) {
      if (result.data.score < 40) {
        setError(`El cliente no califica para crédito. Score insuficiente (${result.data.score}/100 — mínimo 40)`);
        setEvaluacion(null);
        return;
      }
      setEvaluacion(result.data);
      if (result.data.oferta?.montoMaximo) setMonto(String(result.data.oferta.montoMaximo));
      if (result.data.oferta?.tasa) setTasaPct(result.data.oferta.tasa);
    }
  };

  const nivelColor = (n) => n === 'Excelente' ? 'var(--role-primary)' : n === 'Bueno' ? '#2563EB' : n === 'Regular' ? '#F97316' : '#EF4444';

  const ScoreGauge = ({ score, nivel }) => {
    const color = nivelColor(nivel);
    const r = 38;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(score / 100, 1);
    const dash = pct * circ;
    return (
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="800" fill={color}>{score}</text>
        <text x="50" y="60" textAnchor="middle" fontSize="9" fontWeight="700" fill={color} letterSpacing="0.5">/100</text>
      </svg>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (!clienteNombre.trim() || !montoNum || montoNum <= 0) {
      setError('Ingresa el nombre del cliente y un monto válido');
      return;
    }
    setLoading(true);
    setError('');
    const idFinal = clienteId.trim() || clienteNombre.trim().toLowerCase().replace(/\s+/g, '_');
    const result = await creditoService.aprobarCredito(idFinal, montoNum, plazo, tasaPct / 100, empleado?.uid || null);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setClienteNombre(''); setClienteId(''); setMonto(''); setPlazo(4); setTasaPct(5); setEvaluacion(null);
        onCreditoCreado();
      }, 1500);
    } else {
      setError(result.error || 'Error al crear el crédito');
      setLoading(false);
    }
  };

  return (
    <form className="cr-new-form" onSubmit={handleSubmit}>
      <h3 className="cr-new-title">Nuevo Crédito</h3>

      <div className="cr-new-section">
        <div className="cr-new-group-title">Cliente</div>
        <div className="cr-new-field">
          <label>Nombre del cliente</label>
          <input type="text" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Nombre completo" required />
        </div>
        <div className="cr-new-field">
          <label>ID del cliente <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>(opcional — para evaluar historial)</span></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={clienteId} onChange={e => setClienteId(e.target.value)} placeholder="UID del cliente" style={{ flex: 1 }} />
            <button type="button" className="cr-eval-btn" onClick={evaluar} disabled={!clienteId.trim() || evaluando}>
              {evaluando ? <span className="spinner-border spinner-border-sm" /> : 'Evaluar'}
            </button>
          </div>
        </div>
        {evaluacion && (
          <div className="cr-eval-result" style={{ borderColor: nivelColor(evaluacion.nivel), padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ScoreGauge score={evaluacion.score} nivel={evaluacion.nivel} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: nivelColor(evaluacion.nivel), marginBottom: 6 }}>
                  {evaluacion.nivel}
                </div>
                {evaluacion.factores && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px', fontSize: 11, color: 'var(--text-muted)' }}>
                    {[
                      ['Frecuencia',   evaluacion.factores.frecuencia,   30],
                      ['Consistencia', evaluacion.factores.consistencia, 25],
                      ['Monto prom.',  evaluacion.factores.monto,        25],
                      ['Historial',    evaluacion.factores.historial,    20],
                    ].map(([label, val, max]) => (
                      <div key={label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span>{label}</span><span style={{ fontWeight: 700 }}>{val}/{max}</span>
                        </div>
                        <div style={{ height: 3, background: 'var(--border,#e5e7eb)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(val / max) * 100}%`, background: nivelColor(evaluacion.nivel), borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {evaluacion.oferta?.montoMaximo > 0 && (
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                    Sugerido: <strong style={{ color: nivelColor(evaluacion.nivel) }}>{fmt(evaluacion.oferta.montoMaximo)}</strong> al <strong>{evaluacion.oferta.tasa}%</strong> mens.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="cr-new-section">
        <div className="cr-new-group-title">Términos</div>
        <div className="cr-new-field">
          <label>Monto aprobado</label>
          <div className="cr-currency-input">
            <span>$</span>
            <input type="number" min="1" step="0.01" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" required />
          </div>
        </div>
        <div className="cr-new-field">
          <label>Plazo</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[2, 4, 8].map(s => (
              <button key={s} type="button"
                onClick={() => setPlazo(s)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: `1.5px solid ${plazo === s ? 'var(--role-primary)' : 'var(--border,#e5e7eb)'}`, background: plazo === s ? 'var(--role-primary)' : 'white', color: plazo === s ? 'white' : 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {s}sem
              </button>
            ))}
          </div>
        </div>
        <div className="cr-new-field">
          <label>Tasa mensual (%)</label>
          <input type="number" min="0" max="100" step="0.5" value={tasaPct} onChange={e => setTasaPct(Number(e.target.value))} />
        </div>
      </div>

      {error && <div style={{ color: '#EF4444', fontSize: 13 }}>{error}</div>}

      <button type="submit" className="cr-submit-btn" disabled={loading || success || !clienteNombre.trim() || !monto}
        style={{ background: success ? 'var(--role-primary)' : 'var(--role-primary)' }}>
        {success ? <><i className="bi bi-check-circle-fill" /> Crédito aprobado</>
          : loading ? <><span className="spinner-border spinner-border-sm me-2" />Procesando...</>
          : <><i className="bi bi-check2-circle" /> Aprobar Crédito</>}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════
   MACOS-MATCHING DESIGN — CreditosView.swift port
═══════════════════════════════════════════════════════ */

/* ── Punto·Verde wordmark ───────────────────────────────────────────────────── */
function PVWordmark() {
  return <img src={logoBlanco} alt="" className="hero-card-emblem" />;
}

/* ── SVG sparkline (Recuperado chart) ──────────────────────────────────────── */
function Sparkline({ data, width = 220, height = 44 }) {
  if (!data || data.length < 2 || data.every(v => v === 0)) {
    return <div style={{ height, borderBottom: '2px solid rgba(255,255,255,0.5)', marginTop: 'auto' }} />;
  }
  const max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const fillPts = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill="url(#sparkFill)" />
      <polyline points={pts} fill="none" stroke="rgba(255,255,255,0.92)"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── SVG bar chart (Prestado card) ────────────────────────────────────────── */
function BarChart({ data, width = 220, height = 44 }) {
  const max = Math.max(...data, 1);
  const count = data.length;
  const gap = 2;
  const barW = Math.max(2, (width - gap * (count - 1)) / count);
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const h = Math.max(2, (v / max) * height);
        return (
          <rect key={i} x={i * (barW + gap)} y={height - h}
            width={barW} height={h} rx="1.5" fill="rgba(255,255,255,0.82)" />
        );
      })}
    </svg>
  );
}

/* ── Ring gauge (Salud crediticia cards) ───────────────────────────────────── */
function RingGauge({ pct, size = 120 }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(Math.max(pct, 0), 1) * circ;
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(255,255,255,0.18)" strokeWidth={size * 0.083} />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="white" strokeWidth={size * 0.083}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.22} fontWeight="900" fill="white">
        {Math.round(Math.min(Math.max(pct, 0), 1) * 100)}%
      </text>
    </svg>
  );
}

/* ── Cartera card (280×320) ────────────────────────────────────────────────── */
function CarteraCard({ title, value, s1v, s1l, s2v, s2l, footer, gradient, chart }) {
  return (
    <div className="hero-card" style={{
      background: gradient, width: 280, height: 320,
      justifyContent: 'space-between', flexShrink: 0,
    }}>
      <PVWordmark />
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.1, paddingRight: 72, marginTop: 6 }}>
          {title}
        </div>
        <div style={{ fontSize: 34, fontWeight: 900, color: '#fff', marginTop: 6, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{s1v}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.78)' }}>{s1l}</div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{s2v}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.78)' }}>{s2l}</div>
          </div>
        </div>
      </div>
      {chart && <div style={{ marginTop: 'auto' }}>{chart}</div>}
      {footer && (
        <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.78)', lineHeight: 1.4 }}>
          {footer}
        </div>
      )}
    </div>
  );
}

/* ── Salud card (240×260, ring gauge) ──────────────────────────────────────── */
function SaludCard({ title, pct, statusLabel, gradient }) {
  return (
    <div className="hero-card" style={{
      background: gradient, width: 240, height: 260,
      alignItems: 'center', flexShrink: 0,
    }}>
      <PVWordmark />
      <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', width: '100%', marginTop: 6, paddingRight: 60 }}>
        {title}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RingGauge pct={pct} size={120} />
      </div>
      <div style={{
        fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.88)',
        textTransform: 'uppercase', letterSpacing: 1.2, paddingBottom: 4,
      }}>
        {statusLabel}
      </div>
    </div>
  );
}

/* ── Estado count card (160×190) ───────────────────────────────────────────── */
function EstadoCard({ count, label, icon, gradient }) {
  return (
    <div className="hero-card" style={{
      background: gradient, width: 160, height: 190,
      justifyContent: 'space-between', flexShrink: 0,
    }}>
      <PVWordmark />
      <i className={`bi ${icon}`} style={{ fontSize: 22, color: '#fff', marginTop: 6 }} />
      <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.78)' }}>
        {count === 1 ? label.replace(/s$/, '') : label}
      </div>
    </div>
  );
}

/* ── Top deudores card (360×340) ───────────────────────────────────────────── */
function DeudoresCard({ items, onSelect }) {
  const GRADIENT = 'linear-gradient(135deg, rgb(191,82,77) 0%, rgb(102,20,26) 100%)';
  return (
    <div className="hero-card" style={{
      background: GRADIENT, width: 360, height: 340,
      justifyContent: 'flex-start', flexShrink: 0,
    }}>
      <PVWordmark />
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginTop: 6, marginBottom: 8 }}>
        Top deudores
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {items.length === 0 ? (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', paddingTop: 12 }}>Sin deudores activos</div>
        ) : items.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onSelect && onSelect(item.credito)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 0',
              borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none',
              cursor: onSelect ? 'pointer' : 'default',
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              {idx + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.nombre}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)' }}>{item.estado}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{fmt(item.monto)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Credito section wrapper (matches Inicio Section) ──────────────────────── */
function CreditoSection({ title, children }) {
  return (
    <section className="inicio-section">
      <div className="inicio-section-head" style={{ cursor: 'default' }}>
        <h2>{title}</h2>
      </div>
      <div className="inicio-carousel inicio-carousel--tight">
        {children}
      </div>
    </section>
  );
}


/* ── Root — macOS CreditosView.swift port ──────────────────────────────────── */
export default function Creditos() {
  const { hasPermission } = useAuth();
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredito, setSelectedCredito] = useState(null);
  const [showNuevo, setShowNuevo] = useState(false);

  const canEdit   = hasPermission('creditos_editar') || hasPermission('creditos_suspender');
  const canCreate = hasPermission('creditos_aprobar');

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await creditoService.listarCreditos();
    if (res.success) setCreditos(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handlePagoRegistrado = async () => {
    await cargar();
    if (selectedCredito) {
      const res = await creditoService.getCredito(selectedCredito.id);
      if (res.success && res.data) setSelectedCredito(res.data);
    }
  };
  const handleSuspender = async () => { await cargar(); setSelectedCredito(null); };

  // — Cartera stats —
  const activos     = creditos.filter(c => c.estado === 'activo');
  const vencidos    = creditos.filter(c => c.estado === 'vencido');
  const suspendidos = creditos.filter(c => c.estado === 'suspendido');
  const pagados     = creditos.filter(c => c.estado === 'pagado');

  const totalOtorgado   = creditos.reduce((s, c) => s + (c.montoAprobado || c.montoOriginal || 0), 0);
  const totalUsado      = [...activos, ...vencidos].reduce((s, c) => s + (c.montoUsado || 0), 0);
  const carteraVencida  = vencidos.reduce((s, c) => s + (c.montoUsado || 0), 0);
  const totalRecuperado = creditos.reduce((s, c) =>
    s + (c.transacciones || []).filter(t => t.tipo === 'pago').reduce((ss, t) => ss + (t.monto || 0), 0), 0);

  const hace30 = new Date(); hace30.setDate(hace30.getDate() - 30);
  const nuevos30d = creditos.filter(c => {
    const f = c.fechaCreacion?.toDate ? c.fechaCreacion.toDate() : new Date(c.fechaCreacion || 0);
    return f >= hace30;
  }).length;

  // — Salud crediticia —
  const pctUso = totalOtorgado > 0 ? totalUsado / totalOtorgado : 0;
  const totalActVenc = activos.length + vencidos.length;
  const pctMorosidad = totalActVenc > 0 ? vencidos.length / totalActVenc : 0;
  const alDia = activos.filter(c => { const d = diasRestantes(c.fechaVencimiento); return d === null || d > 7; });
  const pctCumplimiento = activos.length > 0 ? alDia.length / activos.length : 1;

  const saludLabel = (pct, invert) => {
    if (invert) return pct < 0.10 ? 'EXCELENTE' : pct < 0.25 ? 'ACEPTABLE' : 'ATENCIÓN';
    return pct < 0.50 ? 'EXCELENTE' : pct < 0.75 ? 'ACEPTABLE' : 'ATENCIÓN';
  };
  const cumplimientoLabel = (pct) => pct > 0.85 ? 'EXCELENTE' : pct > 0.60 ? 'ACEPTABLE' : 'ATENCIÓN';

  // — Charts data —
  const weeklyRecovery = Array.from({ length: 8 }, (_, i) => {
    const end = new Date(); end.setDate(end.getDate() - i * 7);
    const start = new Date(end); start.setDate(start.getDate() - 7);
    return creditos.reduce((s, c) =>
      s + (c.transacciones || []).filter(t => {
        if (t.tipo !== 'pago') return false;
        const f = t.fecha?.toDate ? t.fecha.toDate() : new Date(t.fecha || 0);
        return f >= start && f < end;
      }).reduce((ss, t) => ss + (t.monto || 0), 0), 0);
  }).reverse();

  const dailyApprovals = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const ds = d.toISOString().split('T')[0];
    return creditos.filter(c => {
      const f = c.fechaCreacion?.toDate ? c.fechaCreacion.toDate() : new Date(c.fechaCreacion || 0);
      return f.toISOString().split('T')[0] === ds;
    }).length;
  });

  // — Ranking —
  const topDeudores = [...activos, ...vencidos]
    .sort((a, b) => (b.montoUsado || 0) - (a.montoUsado || 0))
    .slice(0, 8)
    .map(c => ({ nombre: c.clienteNombre || c.clienteId || 'Cliente', monto: c.montoUsado || 0, estado: ESTADO_CFG[c.estado]?.label || c.estado, credito: c }));

  // Compact money format (matches Swift formatCompactNumber)
  const fmtCompact = (v) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}K`;
    return fmt(v);
  };
  const pctStr = (v) => `${Math.round(v * 100)}%`;

  return (
    <div className="credito-dashboard inicio-page">
      <div className="inicio-inner" style={{ gap: 32 }}>

        {/* ── Header ── */}
        <header className="inicio-header">
          <h1>Crédito</h1>
          {canCreate && (
            <button
              onClick={() => setShowNuevo(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.18)',
                border: '1.2px solid rgba(255,255,255,0.4)',
                borderRadius: 20, padding: '7px 16px',
                color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800 }}>+</span> Evaluar
            </button>
          )}
        </header>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="spinner-border" style={{ color: 'rgba(255,255,255,0.7)', width: 28, height: 28, borderWidth: 3 }} />
          </div>
        ) : (
          <>
            {/* ── Cartera ── */}
            <CreditoSection title="Cartera">
              <CarteraCard
                title="Deuda total"
                value={fmtCompact(totalUsado)}
                s1v={totalActVenc} s1l="créditos"
                s2v={pctStr(pctUso)} s2l="uso cartera"
                footer="Saldo vivo de clientes activos y vencidos."
                gradient="linear-gradient(135deg, rgb(224,97,82) 0%, rgb(140,36,26) 100%)"
              />
              <CarteraCard
                title="Prestado"
                value={fmtCompact(totalOtorgado)}
                s1v={creditos.length} s1l="otorgados"
                s2v={nuevos30d} s2l="últimos 30d"
                gradient="linear-gradient(135deg, rgb(77,128,199) 0%, rgb(26,56,122) 100%)"
                chart={<BarChart data={dailyApprovals} width={220} height={44} />}
              />
              <CarteraCard
                title="Recuperado"
                value={fmtCompact(totalRecuperado)}
                s1v={pctStr(totalOtorgado > 0 ? totalRecuperado / totalOtorgado : 0)} s1l="de la cartera"
                s2v={pagados.length} s2l="pagados"
                gradient="linear-gradient(135deg, rgb(77,179,128) 0%, rgb(26,107,82) 100%)"
                chart={<Sparkline data={weeklyRecovery} width={220} height={44} />}
              />
              <CarteraCard
                title="Cartera vencida"
                value={fmtCompact(carteraVencida)}
                s1v={vencidos.length} s1l="créditos"
                s2v={pctStr(pctMorosidad)} s2l="morosidad"
                footer={vencidos.length === 0 ? 'Sin vencidos. Cartera limpia.' : 'Saldo que excedió su fecha de vencimiento.'}
                gradient="linear-gradient(135deg, rgb(191,82,77) 0%, rgb(102,20,26) 100%)"
              />
            </CreditoSection>

            {/* ── Salud crediticia ── */}
            <CreditoSection title="Salud crediticia">
              <SaludCard
                title="En uso"
                pct={pctUso}
                statusLabel={saludLabel(pctUso, false)}
                gradient="linear-gradient(135deg, rgb(77,128,199) 0%, rgb(26,56,122) 100%)"
              />
              <SaludCard
                title="Morosidad"
                pct={pctMorosidad}
                statusLabel={saludLabel(pctMorosidad, true)}
                gradient="linear-gradient(135deg, rgb(224,97,82) 0%, rgb(140,36,26) 100%)"
              />
              <SaludCard
                title="Cumplimiento"
                pct={pctCumplimiento}
                statusLabel={cumplimientoLabel(pctCumplimiento)}
                gradient="linear-gradient(135deg, rgb(77,179,128) 0%, rgb(26,107,82) 100%)"
              />
            </CreditoSection>

            {/* ── Estado ── */}
            <CreditoSection title="Estado">
              <EstadoCard count={activos.length}     label="activos"     icon="bi-credit-card-fill"    gradient="linear-gradient(135deg, rgb(77,179,128) 0%, rgb(26,107,82) 100%)" />
              <EstadoCard count={vencidos.length}    label="vencidos"    icon="bi-x-octagon-fill"      gradient="linear-gradient(135deg, rgb(224,97,82) 0%, rgb(140,36,26) 100%)" />
              <EstadoCard count={nuevos30d}           label="nuevos 30d"  icon="bi-person-badge-fill"   gradient="linear-gradient(135deg, rgb(77,128,199) 0%, rgb(26,56,122) 100%)" />
              <EstadoCard count={pagados.length}     label="pagados"     icon="bi-check-circle-fill"   gradient="linear-gradient(135deg, rgb(120,90,200) 0%, rgb(60,30,140) 100%)" />
              <EstadoCard count={suspendidos.length} label="suspendidos" icon="bi-pause-circle-fill"   gradient="linear-gradient(135deg, rgb(240,120,50) 0%, rgb(160,60,10) 100%)" />
            </CreditoSection>

            {/* ── Ranking ── */}
            {topDeudores.length > 0 && (
              <CreditoSection title="Ranking">
                <DeudoresCard items={topDeudores} onSelect={setSelectedCredito} />
              </CreditoSection>
            )}
          </>
        )}
      </div>

      {selectedCredito && (
        <CreditoDetalle
          credito={selectedCredito}
          onClose={() => setSelectedCredito(null)}
          onPagoRegistrado={handlePagoRegistrado}
          onSuspender={handleSuspender}
          canEdit={canEdit}
        />
      )}

      {showNuevo && (
        <div className="modal-overlay" onClick={() => setShowNuevo(false)}>
          <div className="confirm-modal" style={{ maxWidth: 520, textAlign: 'left', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <NuevoCreditoForm onCreditoCreado={() => { cargar(); setShowNuevo(false); }} />
          </div>
        </div>
      )}
    </div>
  );
}
