import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useCart } from '../context/CartContext';
import orderService from '../services/orderService';
import cajaService from '../services/cajaService';
import creditoService from '../services/creditoService';
import { useAuth } from '../context/AuthContext';
import { emit, CAJA_ACTUALIZADA } from '../lib/appEvents';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const generateRef = () =>
  'PV-' + Date.now().toString(36).toUpperCase().slice(-6);

/* ── Icons ── */
const IconCash = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="6" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
    <circle cx="12" cy="15" r="2"/>
  </svg>
);
const IconCard = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="1" y="4" width="22" height="16" rx="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconQR = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <path d="M14 14h1v1h-1zM18 14h3v1h-3zM14 18h1v3h-1zM16 16h2v2h-2zM19 19h2v2h-2z"/>
  </svg>
);
const IconPhone = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="5" y="2" width="14" height="20" rx="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);
const IconCredit = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="1" y="4" width="22" height="16" rx="2"/>
    <path d="M7 15h4M15 15h2"/>
    <circle cx="7" cy="11" r="1.5"/>
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);

/* ── Spinner animado ── */
const Spinner = ({ size = 36, color = 'var(--role-primary)' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" style={{ animation: 'spin 1s linear infinite' }}>
    <circle cx="18" cy="18" r="15" fill="none" stroke="#E5E7EB" strokeWidth="3"/>
    <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3"
      strokeDasharray="50 45" strokeLinecap="round" strokeDashoffset="10"/>
  </svg>
);

/* ── Timer hook ── */
const useTimer = (running) => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

/* ═══════════════════════════════════════════════════════════
   MODAL PRINCIPAL
═══════════════════════════════════════════════════════════ */
const PaymentModal = ({ onClose, onSuccess }) => {
  const { total, iva, subtotal, toOrden, clear, marcarCompletada } = useCart();
  const { empleado } = useAuth();

  // screen: 'select' | 'cash' | 'qr' | 'credito-search' | 'credito-confirm' | 'processing' | 'success'
  const [screen, setScreen] = useState('select');
  const [metodoPago, setMetodoPago] = useState(null);
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [error, setError] = useState('');
  const [cambioFinal, setCambioFinal] = useState(0);
  const [referencia] = useState(generateRef);
  const [clienteId, setClienteId] = useState('');
  const [buscandoCredito, setBuscandoCredito] = useState(false);
  const [creditoEncontrado, setCreditoEncontrado] = useState(null);

  const montoRecibido = parseFloat(efectivoRecibido) || 0;
  const cambio = montoRecibido - total;
  const timer = useTimer(screen === 'qr');

  const metodos = [
    { id: 'efectivo',    label: 'Efectivo',      icon: <IconCash />,    desc: 'Billetes y monedas' },
    { id: 'tarjeta',     label: 'Tarjeta',        icon: <IconCard />,    desc: 'Débito o crédito' },
    { id: 'mercadopago', label: 'Mercado Pago',   icon: <IconQR />,      desc: 'Código QR' },
    { id: 'codi',        label: 'CoDi',           icon: <IconPhone />,   desc: 'Código QR bancario' },
    { id: 'credito',     label: 'Crédito',        icon: <IconCredit />,  desc: 'Cargo a cuenta de crédito' },
  ];

  /* ── Datos del QR ── */
  const buildQRData = (metodo) => {
    const base = {
      referencia,
      monto: total.toFixed(2),
      moneda: 'MXN',
      comercio: 'PuntoVerde',
      cajero: empleado?.nombre || 'POS',
      ts: new Date().toISOString(),
    };
    if (metodo === 'codi') {
      return JSON.stringify({ ...base, tipo: 'CODI', clabe: '000000000000000000' });
    }
    return JSON.stringify({ ...base, tipo: 'MP', alias: 'puntoverde.mx' });
  };

  /* ── Seleccionar método ── */
  const handleSelect = (id) => {
    setMetodoPago(id);
    setError('');
    if (id === 'efectivo') setScreen('cash');
    else if (id === 'tarjeta') setScreen('cash');
    else if (id === 'credito') setScreen('credito-search');
    else setScreen('qr');
  };

  /* ── Buscar crédito activo del cliente ── */
  const handleBuscarCredito = async () => {
    const id = clienteId.trim();
    if (!id) return;
    setBuscandoCredito(true);
    setError('');
    const res = await creditoService.creditoActivo(id);
    setBuscandoCredito(false);
    if (res.success && res.data) {
      if ((res.data.montoDisponible || 0) < total) {
        setError(`Crédito insuficiente. Disponible: $${(res.data.montoDisponible || 0).toFixed(2)}`);
      } else {
        setCreditoEncontrado(res.data);
        setScreen('credito-confirm');
      }
    } else {
      setError('No se encontró crédito activo para este cliente.');
    }
  };

  /* ── Confirmar pago con crédito ── */
  const confirmarPagoCredito = async () => {
    if (!creditoEncontrado) return;
    setError('');
    setScreen('processing');
    try {
      const cajaResult = await cajaService.cajaAbierta(empleado?.uid);
      const cajaId = cajaResult.data?.id;
      const orden = toOrden(empleado?.uid || 'pos', 'credito', 0);
      orden.cajaId = cajaId;
      orden.tiendaId = cajaResult.data?.tiendaId || null;
      orden.tiendaNombre = cajaResult.data?.tiendaNombre || null;
      orden.clienteId = clienteId.trim();
      orden.creditoId = creditoEncontrado.id;
      const result = await orderService.create(orden);
      if (result.success) {
        await creditoService.usarCredito(creditoEncontrado.id, total, result.id);
        if (cajaId) {
          await cajaService.addVentaToCaja(cajaId, {
            ordenId: result.id, total, metodoPago: 'credito',
            empleadoId: empleado?.uid, empleadoNombre: empleado?.nombre,
            referencia, createdAt: new Date(),
          });
        }
        marcarCompletada();
        emit(CAJA_ACTUALIZADA);
        setCambioFinal(0);
        setScreen('success');
        setTimeout(() => { clear(); onSuccess(result.id, 0); }, 2200);
      } else {
        setError('No se pudo procesar la orden. Intenta de nuevo.');
        setScreen('credito-confirm');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión.');
      setScreen('credito-confirm');
    }
  };

  /* ── Confirmar pago (tarjeta / QR) ── */
  const confirmarPago = async (metodo = metodoPago, montoEfectivo = 0) => {
    setError('');
    setScreen('processing');
    try {
      const cajaResult = await cajaService.cajaAbierta(empleado?.uid);
      const cajaId = cajaResult.data?.id;
      const orden = toOrden(empleado?.uid || 'pos', metodo, montoEfectivo);
      orden.cajaId = cajaId;
      orden.tiendaId = cajaResult.data?.tiendaId || null;
      orden.tiendaNombre = cajaResult.data?.tiendaNombre || null;
      orden.referencia = referencia;

      const result = await orderService.create(orden);
      if (result.success) {
        if (cajaId) {
          await cajaService.addVentaToCaja(cajaId, {
            ordenId: result.id,
            total,
            metodoPago: metodo,
            empleadoId: empleado?.uid,
            empleadoNombre: empleado?.nombre,
            referencia,
            createdAt: new Date(),
          });
        }
        marcarCompletada();
        emit(CAJA_ACTUALIZADA);
        const cambio = Math.round(Math.max(montoEfectivo - total, 0) / 0.05) * 0.05; // redondeo 0.05
        setCambioFinal(cambio);
        setScreen('success');
        setTimeout(() => { clear(); onSuccess(result.id, cambio); }, 2200);
      } else {
        setError('No se pudo procesar la orden. Intenta de nuevo.');
        setScreen(metodo === 'efectivo' || metodo === 'tarjeta' ? 'cash' : 'qr');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión. Verifica tu red.');
      setScreen(metodoPago === 'efectivo' || metodoPago === 'tarjeta' ? 'cash' : 'qr');
    }
  };

  /* ── Cobrar efectivo ── */
  const handleCobrarEfectivo = () => {
    if (metodoPago === 'efectivo' && montoRecibido < total) {
      setError('El monto recibido es menor al total');
      return;
    }
    confirmarPago(metodoPago, metodoPago === 'efectivo' ? montoRecibido : total);
  };

  /* ══════════════════ PANTALLAS ══════════════════ */

  /* ── Header compartido ── */
  const Header = ({ title, onBack }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '14px 16px', borderBottom: '1px solid #F0F1F3', flexShrink: 0,
    }}>
      {onBack && (
        <button onClick={onBack} style={{
          background: '#F4F5F7', border: 'none', borderRadius: '50%',
          width: 32, height: 32, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#1a2b3c" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      )}
      <span style={{ flex: 1, fontSize: 16, fontWeight: 700, color: '#1a2b3c' }}>{title}</span>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 4,
        color: '#9CA3AF', minHeight: 'auto', minWidth: 'auto', display: 'flex',
      }}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );

  /* ── Chip de total ── */
  const TotalChip = () => (
    <div style={{
      margin: '16px 16px 0',
      background: 'var(--role-tinted-bg, #F0FDF4)',
      borderRadius: 14, padding: '14px 20px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    }}>
      <span style={{ fontSize: 13, color: '#6B7C93' }}>Total a cobrar</span>
      <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--role-primary)' }}>
        {formatCurrency(total)}
      </span>
    </div>
  );

  /* ─────────── SELECCIÓN DE MÉTODO ─────────── */
  if (screen === 'select') return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-container" onClick={e => e.stopPropagation()}
        style={{ maxWidth: 420, display: 'flex', flexDirection: 'column' }}>
        <Header title="Cobrar" />
        <TotalChip />

        <div style={{ padding: '16px 16px 0', fontSize: 12, fontWeight: 600,
          color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Método de pago
        </div>

        <div style={{ padding: '10px 16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {metodos.map(m => (
            <button key={m.id} onClick={() => handleSelect(m.id)} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 14,
              background: 'white', border: '1.5px solid #E5E7EB',
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--role-primary)'; e.currentTarget.style.background = 'var(--role-tinted-bg, #F0FDF4)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = 'white'; }}
            >
              <span style={{ color: 'var(--role-primary)', flexShrink: 0 }}>{m.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1a2b3c' }}>{m.label}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{m.desc}</div>
              </div>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#D1D5DB" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /* ─────────── EFECTIVO / TARJETA ─────────── */
  if (screen === 'cash') {
    const isCard = metodoPago === 'tarjeta';
    return (
      <div className="payment-modal-overlay" onClick={onClose}>
        <div className="payment-modal-container" onClick={e => e.stopPropagation()}
          style={{ maxWidth: 420, display: 'flex', flexDirection: 'column' }}>
          <Header title={isCard ? 'Pago con Tarjeta' : 'Pago en Efectivo'}
            onBack={() => setScreen('select')} />
          <TotalChip />

          {isCard ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#6B7C93' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%',
                background: 'var(--role-tinted-bg)', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--role-primary)' }}>
                <IconCard />
              </div>
              <p style={{ margin: 0, fontSize: 14 }}>
                Pasa la tarjeta en la terminal y confirma cuando el pago sea aprobado.
              </p>
            </div>
          ) : (
            <div style={{ padding: '16px 16px 0' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF',
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Efectivo recibido
              </div>
              {/* Botones rápidos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                {[50, 100, 200, 500].map(amt => (
                  <button key={amt} onClick={() => setEfectivoRecibido(String(amt))} style={{
                    height: 40, border: '1.5px solid #E5E7EB', borderRadius: 10,
                    background: efectivoRecibido === String(amt) ? 'var(--role-primary)' : 'white',
                    color: efectivoRecibido === String(amt) ? 'white' : '#1a2b3c',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
                  }}>${amt}</button>
                ))}
              </div>
              <button onClick={() => setEfectivoRecibido(total.toFixed(2))} style={{
                width: '100%', height: 40, marginBottom: 10,
                border: '1.5px solid var(--role-primary)', borderRadius: 10,
                background: 'var(--role-tinted-bg)', color: 'var(--role-primary)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>Monto exacto</button>
              <input
                type="number" value={efectivoRecibido}
                onChange={e => setEfectivoRecibido(e.target.value)}
                placeholder="0.00"
                style={{ width: '100%', height: 52, border: '1.5px solid #E5E7EB',
                  borderRadius: 12, padding: '0 16px', fontSize: 22, fontWeight: 700,
                  textAlign: 'right', outline: 'none', background: '#FAFAFA' }}
              />
              {montoRecibido > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginTop: 12, padding: '10px 14px',
                  borderRadius: 10,
                  background: cambio >= 0 ? '#F0FDF4' : '#FEF2F2' }}>
                  <span style={{ fontSize: 14, color: '#6B7C93' }}>Cambio</span>
                  <span style={{ fontSize: 20, fontWeight: 700,
                    color: cambio >= 0 ? 'var(--role-primary)' : '#EF4444' }}>
                    {formatCurrency(Math.max(cambio, 0))}
                  </span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ margin: '8px 16px', padding: '10px 14px',
              background: '#FEE2E2', color: '#DC2626', borderRadius: 10, fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ padding: '16px', display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setScreen('select')} style={{
              flex: 1, height: 50, background: '#F4F5F7', color: '#374151',
              border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}>Volver</button>
            <button onClick={handleCobrarEfectivo}
              disabled={!isCard && (montoRecibido < total)}
              style={{ flex: 2, height: 50, background: 'var(--role-primary)', color: 'white',
                border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer',
                opacity: (!isCard && montoRecibido < total) ? 0.4 : 1,
                boxShadow: '0 4px 12px var(--role-shadow, rgba(26,122,72,0.3))',
              }}>
              {isCard ? 'Confirmar Pago' : 'Cobrar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────── QR — CoDi / MercadoPago ─────────── */
  if (screen === 'qr') {
    const isCodi = metodoPago === 'codi';
    const qrData = buildQRData(metodoPago);
    const accentColor = isCodi ? '#00A3E0' : '#009EE3'; // CoDi azul Banxico / MP azul
    const brandName  = isCodi ? 'CoDi' : 'Mercado Pago';
    const instructions = isCodi
      ? 'Abre tu app bancaria, escanea el código y confirma el pago.'
      : 'Abre Mercado Pago, toca el lector QR y escanea el código.';

    return (
      <div className="payment-modal-overlay" onClick={onClose}>
        <div className="payment-modal-container" onClick={e => e.stopPropagation()}
          style={{ maxWidth: 420, display: 'flex', flexDirection: 'column' }}>
          <Header title={`Pagar con ${brandName}`} onBack={() => setScreen('select')} />

          {/* Monto prominente */}
          <div style={{ textAlign: 'center', padding: '20px 16px 0' }}>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Total a cobrar</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#1a2b3c', letterSpacing: '-1px' }}>
              {formatCurrency(total)}
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
              Ref: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{referencia}</span>
            </div>
          </div>

          {/* QR code */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 16px' }}>
            <div style={{
              background: 'white', borderRadius: 20, padding: 16,
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              border: `2px solid ${accentColor}20`,
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}>
              <QRCodeSVG
                value={qrData}
                size={200}
                level="M"
                fgColor="#1a2b3c"
                bgColor="white"
                includeMargin={false}
              />
              {/* Badge de marca */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 14px', borderRadius: 20,
                background: `${accentColor}15`,
                color: accentColor, fontSize: 12, fontWeight: 700,
              }}>
                {isCodi
                  ? <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" strokeLinecap="round"/></svg>
                  : <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h1v1h-1zM19 19h2v2h-2z"/></svg>
                }
                {brandName}
              </div>
            </div>
          </div>

          {/* Instrucción + timer */}
          <div style={{ padding: '0 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#6B7C93', margin: '0 0 8px', lineHeight: 1.5 }}>
              {instructions}
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 20, background: '#F4F5F7',
              fontSize: 13, color: '#6B7C93', fontFamily: 'monospace',
            }}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {timer}
            </div>
          </div>

          {error && (
            <div style={{ margin: '12px 16px 0', padding: '10px 14px',
              background: '#FEE2E2', color: '#DC2626', borderRadius: 10, fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Acciones */}
          <div style={{ padding: '16px', display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setScreen('select')} style={{
              flex: 1, height: 50, background: '#F4F5F7', color: '#6B7C93',
              border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>Cancelar</button>
            <button onClick={() => confirmarPago(metodoPago, total)} style={{
              flex: 2, height: 50, background: accentColor, color: 'white',
              border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 4px 12px ${accentColor}40`,
            }}>
              ✓ Confirmar Pago Recibido
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────── CRÉDITO — BUSCAR CLIENTE ─────────── */
  if (screen === 'credito-search') return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <Header title="Pago con Crédito" onBack={() => { setScreen('select'); setError(''); setClienteId(''); }} />
        <TotalChip />
        <div style={{ padding: '20px 16px' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>ID del cliente</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={clienteId}
                onChange={e => { setClienteId(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleBuscarCredito()}
                placeholder="Ingresa el ID del cliente"
                autoFocus
                style={{ flex: 1, height: 44, border: '1.5px solid #D1D5DB', borderRadius: 10, padding: '0 12px', fontSize: 15 }}
              />
              <button
                onClick={handleBuscarCredito}
                disabled={!clienteId.trim() || buscandoCredito}
                style={{ height: 44, padding: '0 16px', background: 'var(--role-primary)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: !clienteId.trim() ? 0.5 : 1 }}
              >
                {buscandoCredito ? '...' : 'Buscar'}
              </button>
            </div>
          </div>
          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>{error}</div>}
        </div>
      </div>
    </div>
  );

  /* ─────────── CRÉDITO — CONFIRMAR ─────────── */
  if (screen === 'credito-confirm' && creditoEncontrado) {
    const disponible = creditoEncontrado.montoDisponible || 0;
    const usado = creditoEncontrado.montoUsado || 0;
    const aprobado = creditoEncontrado.montoAprobado || 0;
    const pct = aprobado > 0 ? Math.min(1, (usado + total) / aprobado) : 0;
    return (
      <div className="payment-modal-overlay" onClick={onClose}>
        <div className="payment-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
          <Header title="Confirmar Crédito" onBack={() => { setScreen('credito-search'); setCreditoEncontrado(null); setError(''); }} />
          <TotalChip />
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}>Cliente: <strong style={{ color: '#1e293b' }}>{clienteId}</strong></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12 }}>
                {[
                  { label: 'Disponible', value: `$${disponible.toFixed(2)}`, color: '#16A34A' },
                  { label: 'Este cargo', value: `$${total.toFixed(2)}`, color: '#DC2626' },
                  { label: 'Aprobado', value: `$${aprobado.toFixed(2)}`, color: '#1e293b' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2, textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 6, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct * 100}%`, background: pct > 0.9 ? '#EF4444' : '#16A34A', borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, textAlign: 'right' }}>Uso tras cargo: {Math.round(pct * 100)}%</div>
              </div>
            </div>
            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 12 }}>{error}</div>}
          </div>
          <div style={{ padding: '12px 16px 20px', display: 'flex', gap: 10 }}>
            <button onClick={() => { setScreen('credito-search'); setCreditoEncontrado(null); setError(''); }} style={{ flex: 1, height: 48, background: '#F3F4F6', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
              Cancelar
            </button>
            <button onClick={confirmarPagoCredito} style={{ flex: 2, height: 48, background: 'var(--role-primary)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              Cargar ${total.toFixed(2)} al crédito
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────── PROCESANDO ─────────── */
  if (screen === 'processing') return (
    <div className="payment-modal-overlay">
      <div className="payment-modal-container" onClick={e => e.stopPropagation()}
        style={{ maxWidth: 420, textAlign: 'center', padding: '48px 32px' }}>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        <Spinner size={52} />
        <p style={{ marginTop: 20, fontSize: 16, fontWeight: 600, color: '#1a2b3c' }}>
          Registrando pago…
        </p>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '4px 0 0' }}>
          {formatCurrency(total)} · {metodoPago}
        </p>
      </div>
    </div>
  );

  /* ─────────── ÉXITO ─────────── */
  if (screen === 'success') return (
    <div className="payment-modal-overlay">
      <style>{`@keyframes popIn { from{transform:scale(0.7);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
      <div className="payment-modal-container" onClick={e => e.stopPropagation()}
        style={{ maxWidth: 420, textAlign: 'center', padding: '48px 32px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
          background: 'var(--role-tinted-bg, #F0FDF4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--role-primary)',
          animation: 'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <IconCheck />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', color: '#1a2b3c' }}>
          ¡Pago completado!
        </h2>
        <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 20px' }}>
          {formatCurrency(total)} · {referencia}
        </p>

        {metodoPago === 'efectivo' && cambioFinal > 0 && (
          <div style={{
            background: '#F0FDF4', borderRadius: 14, padding: '16px 24px', marginBottom: 8,
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          }}>
            <span style={{ fontSize: 14, color: '#6B7C93' }}>Cambio al cliente</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--role-primary)' }}>
              {formatCurrency(cambioFinal)}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return null;
};

export default PaymentModal;
