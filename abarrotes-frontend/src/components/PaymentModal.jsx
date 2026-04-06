import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import orderService from '../services/orderService';
import cajaService from '../services/cajaService';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const PaymentModal = ({ onClose, onSuccess }) => {
  const { total, iva, subtotal, toOrden, clear, marcarCompletada } = useCart();
  const { empleado, hasPermission } = useAuth();
  
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [mostrarCambio, setMostrarCambio] = useState(false);

  const montoRecibido = parseFloat(efectivoRecibido) || 0;
  const cambio = montoRecibido - total;

  const metodos = [
    { id: 'efectivo', label: 'Efectivo', icon: 'bi-cash' },
    { id: 'tarjeta', label: 'Tarjeta', icon: 'bi-credit-card' },
    { id: 'mercadopago', label: 'Mercado Pago', icon: 'bi-qr-code' },
    { id: 'codi', label: 'CoDi', icon: 'bi-phone' }
  ];

  const efectivoRapido = [50, 100, 200, 500];

  const handleQuickAmount = (amount) => {
    setEfectivoRecibido(amount.toString());
  };

  const handleExactAmount = () => {
    setEfectivoRecibido(total.toFixed(2));
  };

  const procesaPago = async () => {
    if (metodoPago === 'efectivo' && montoRecibido < total) {
      setError('El monto recibido es menor al total');
      return;
    }

    setProcesando(true);
    setError('');

    try {
      const orden = toOrden(empleado?.uid || 'empleado', metodoPago, montoRecibido);
      
      const result = await orderService.create(orden);
      
      if (result.success) {
        marcarCompletada();
        
        if (metodoPago === 'efectivo') {
          setMostrarCambio(true);
        }
        
        setTimeout(() => {
          clear();
          onSuccess(result.id, cambio);
        }, 2000);
      } else {
        setError('Error al procesar la orden');
      }
    } catch (err) {
      setError('Error al procesar el pago');
      console.error(err);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-container" onClick={e => e.stopPropagation()}>
        {mostrarCambio ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '64px', color: '#1A7A48', marginBottom: '20px' }}>
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <h2 style={{ margin: '0 0 16px 0' }}>¡Venta Completada!</h2>
            {cambio > 0 && (
              <div style={{ background: '#F4F5F7', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Cambio</div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#1A7A48' }}>
                  {formatCurrency(cambio)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Confirmar Pago</h2>
            </div>
            
            <div style={{ padding: '20px', textAlign: 'center', background: '#F4F5F7' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total a Pagar</div>
              <div style={{ fontSize: '48px', fontWeight: 700, color: '#1A7A48' }}>
                {formatCurrency(total)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {formatCurrency(subtotal)} + IVA {formatCurrency(iva)}
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 500 }}>
                Método de Pago
              </label>
              <div className="payment-methods-grid">
                {metodos.map(m => (
                  <button
                    key={m.id}
                    className={`payment-method-card ${metodoPago === m.id ? 'active' : ''}`}
                    onClick={() => setMetodoPago(m.id)}
                    type="button"
                  >
                    <i className={m.icon} style={{ fontSize: '24px', marginBottom: '8px' }}></i>
                    <span style={{ fontSize: '13px' }}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {metodoPago === 'efectivo' && (
              <div style={{ padding: '0 20px 20px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: 500 }}>
                  Efectivo Recibido
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {efectivoRapido.map(amt => (
                    <button
                      key={amt}
                      onClick={() => handleQuickAmount(amt)}
                      style={{
                        flex: '1 1 auto',
                        minWidth: '60px',
                        padding: '10px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      ${amt}
                    </button>
                  ))}
                  <button
                    onClick={handleExactAmount}
                    style={{
                      flex: '1 1 auto',
                      minWidth: '60px',
                      padding: '10px',
                      border: '1px solid #1A7A48',
                      borderRadius: '8px',
                      background: '#1A7A48',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Exacto
                  </button>
                </div>
                <input
                  type="number"
                  value={efectivoRecibido}
                  onChange={e => setEfectivoRecibido(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '18px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    textAlign: 'right'
                  }}
                />
                {montoRecibido > 0 && (
                  <div style={{ marginTop: '12px', textAlign: 'right' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Cambio: </span>
                    <span style={{ fontSize: '20px', fontWeight: 600, color: cambio >= 0 ? '#1A7A48' : '#EF4444' }}>
                      {formatCurrency(cambio)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div style={{ padding: '0 20px 10px' }}>
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '14px' }}>
                  {error}
                </div>
              </div>
            )}

            <div style={{ padding: '20px', display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                className="btn btn-outline-secondary"
                style={{ flex: 1, padding: '14px' }}
                disabled={procesando}
              >
                Cancelar
              </button>
              <button
                onClick={procesaPago}
                className="btn btn-primary"
                style={{ flex: 1, padding: '14px', background: '#1A7A48' }}
                disabled={procesando || (metodoPago === 'efectivo' && montoRecibido < total)}
              >
                {procesando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-2"></i>
                    Confirmar Pago
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;