import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import productService from '../services/productService';
import cajaService from '../services/cajaService';
import orderService from '../services/orderService';
import PaymentModal from '../components/PaymentModal';
import BarcodeScanner from '../components/BarcodeScanner';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const CajaModal = ({ caja, onClose, onCerrarCaja }) => {
  const [ventas, setVentas] = useState([]);
  const [loadingVentas, setLoadingVentas] = useState(true);

  useEffect(() => {
    const fetchVentas = async () => {
      setLoadingVentas(true);
      const result = await orderService.getOrdenes('hoy');
      setVentas(result.success ? result.data : []);
      setLoadingVentas(false);
    };
    if (caja) fetchVentas();
  }, [caja]);

  if (!caja) return null;
  
  const formatTime = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const montoInicial = caja.montoInicial || 0;
  const ventasEfectivo = ventas.filter(v => v.metodoPago === 'efectivo').reduce((s, v) => s + v.total, 0);
  const ventasTarjeta = ventas.filter(v => v.metodoPago !== 'efectivo').reduce((s, v) => s + v.total, 0);
  const ventasTotales = ventasEfectivo + ventasTarjeta;
  const montoEsperado = montoInicial + ventasEfectivo;
  const ticketPromedio = ventas.length > 0 ? ventasTotales / ventas.length : 0;
  
  const getTimeOpen = () => {
    const start = caja.createdAt?.toDate ? caja.createdAt.toDate() : new Date(caja.createdAt);
    const diff = Date.now() - start.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };
  
  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', width: '95%' }}>
        
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Caja</h3>
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
              {caja.empleadoNombre || 'Cajero'} · Abierta hace {getTimeOpen()}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7C93', padding: '4px', minHeight: 'auto', minWidth: 'auto' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>

          <div style={{ background: 'var(--role-tinted-bg, #F0FDF4)', padding: '20px', borderRadius: '14px', marginBottom: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#6B7C93', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Monto esperado en caja</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--role-primary)' }}>
              {formatCurrency(montoEsperado)}
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
              Apertura {formatCurrency(montoInicial)} + Efectivo {formatCurrency(ventasEfectivo)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            <div style={{ background: '#F4F5F7', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Ventas</div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>{formatCurrency(ventasTotales)}</div>
            </div>
            <div style={{ background: '#F4F5F7', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Efectivo</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#2563EB' }}>{formatCurrency(ventasEfectivo)}</div>
            </div>
            <div style={{ background: '#F4F5F7', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Tarjeta</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#7C3AED' }}>{formatCurrency(ventasTarjeta)}</div>
            </div>
            <div style={{ background: '#F4F5F7', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Ticket prom.</div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>{formatCurrency(ticketPromedio)}</div>
            </div>
            <div style={{ background: '#F4F5F7', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Operaciones</div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>{ventas.length}</div>
            </div>
            <div style={{ background: '#F4F5F7', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Apertura</div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>{formatTime(caja.createdAt)}</div>
            </div>
          </div>

          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Movimientos del turno
          </div>

          {loadingVentas ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF' }}>
              <div className="spinner-border spinner-border-sm"></div>
            </div>
          ) : ventas.length === 0 ? (
            <div style={{ background: '#F4F5F7', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4, marginBottom: '6px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p style={{ margin: 0, fontSize: '13px' }}>Sin ventas en este turno</p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {ventas.slice(0, 10).map((venta, i) => (
                <div key={venta.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px',
                  borderBottom: i < Math.min(ventas.length, 10) - 1 ? '1px solid #F3F4F6' : 'none'
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                    background: venta.metodoPago === 'efectivo' ? 'rgba(37,99,235,0.08)' : 'rgba(124,58,237,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
                      stroke={venta.metodoPago === 'efectivo' ? '#2563EB' : '#7C3AED'} strokeWidth="2">
                      {venta.metodoPago === 'efectivo'
                        ? <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>
                        : <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>
                      }
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Venta #{venta.id.slice(-6).toUpperCase()}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                      {formatTime(venta.createdAt)} · {venta.metodoPago === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
                      {venta.items ? ` · ${venta.items.length} art.` : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>
                    {formatCurrency(venta.total)}
                  </div>
                </div>
              ))}
              {ventas.length > 10 && (
                <div style={{ padding: '8px 14px', textAlign: 'center', fontSize: '12px', color: '#9CA3AF', borderTop: '1px solid #F3F4F6' }}>
                  +{ventas.length - 10} movimientos más
                </div>
              )}
            </div>
          )}

        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button 
            onClick={() => { onClose(); onCerrarCaja(); }}
            style={{ 
              width: '100%', height: '44px', 
              background: 'rgba(230,57,70,0.06)', color: '#E63946', 
              border: 'none', borderRadius: '10px', 
              fontSize: '15px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Cerrar Caja
          </button>
        </div>
      </div>
    </div>
  );
};

const BloqueoCaja = ({ onAbrirCaja }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'var(--role-light, #F0FDF4)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px'
      }}>
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--role-primary)" strokeWidth="2">
          <rect x="2" y="6" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      </div>
      
      <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 12px 0', color: '#1A2B3C' }}>
        Abre la caja para comenzar a vender
      </h2>
      
      <p style={{ fontSize: '15px', color: '#6B7C93', margin: '0 0 32px 0', textAlign: 'center', maxWidth: '320px' }}>
        Necesitas abrir caja antes de procesar ventas. Esto asocia cada venta a tu turno.
      </p>
      
      <button 
        onClick={onAbrirCaja}
        style={{
          background: 'var(--role-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '14px',
          fontSize: '17px',
          fontWeight: 700,
          height: '56px',
          padding: '0 40px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px var(--role-shadow, rgba(26,122,72,0.3))'
        }}
      >
        Abrir Caja
      </button>
    </div>
  );
};

const AbrirCajaModal = ({ onClose, onAperturaExitosa }) => {
  const { empleado } = useAuth();
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleAbrir = async () => {
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum < 0) {
      setError('Ingresa un monto válido');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const result = await cajaService.abrirCaja(
      empleado.uid,
      empleado.nombre,
      montoNum
    );
    
    setLoading(false);
    
    if (result.success) {
      onAperturaExitosa({ 
        id: result.id, 
        montoInicial: montoNum, 
        montoActual: montoNum,
        empleadoNombre: empleado.nombre,
        createdAt: new Date()
      });
      onClose();
    } else {
      setError('Error al abrir caja');
    }
  };
  
  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Abrir Caja</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6B7C93' }}>×</button>
          </div>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Monto inicial de caja</div>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              style={{
                width: '100%',
                height: '48px',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '0 16px',
                fontSize: '18px'
              }}
            />
          </div>
          
          {error && <div style={{ color: '#EF4444', fontSize: '14px', marginBottom: '12px' }}>{error}</div>}
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={onClose}
              style={{ 
                flex: 1, 
                height: '48px', 
                background: '#F3F4F6', 
                color: '#374151', 
                border: 'none', 
                borderRadius: '12px', 
                fontSize: '15px', 
                fontWeight: 600, 
                cursor: 'pointer' 
              }}
            >
              Cancelar
            </button>
            <button 
              onClick={handleAbrir}
              disabled={loading || !monto}
              style={{ 
                flex: 1, 
                height: '48px', 
                background: loading ? '#9CA3AF' : 'var(--role-primary)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px', 
                fontSize: '15px', 
                fontWeight: 600, 
                cursor: loading ? 'not-allowed' : 'pointer' 
              }}
            >
              {loading ? 'Abriendo...' : 'Abrir Caja'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CerrarCajaModal = ({ caja, onClose, onCerrarExitoso }) => {
  const [montoReal, setMontoReal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const montoEsperado = caja?.montoActual || 0;
  
  const handleCerrar = async () => {
    const montoNum = parseFloat(montoReal);
    if (isNaN(montoNum) || montoNum < 0) {
      setError('Ingresa un monto válido');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const result = await cajaService.cerrarCaja(caja.id, {
      montoReal: montoNum,
      montoEsperado: montoEsperado,
      ventasTotales: 0,
      ventasEfectivo: 0,
      ventasTarjeta: 0,
      numTransacciones: 0
    });
    
    setLoading(false);
    
    if (result.success) {
      onCerrarExitoso();
      onClose();
    } else {
      setError('Error al cerrar caja');
    }
  };
  
  const diferencia = parseFloat(montoReal || 0) - montoEsperado;
  
  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Cerrar Caja</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6B7C93' }}>×</button>
          </div>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div style={{ background: 'var(--role-light, #F0FDF4)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#6B7C93', marginBottom: '4px' }}>Monto esperado</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--role-primary)' }}>
              {formatCurrency(montoEsperado)}
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Monto real en caja</div>
            <input
              type="number"
              value={montoReal}
              onChange={(e) => setMontoReal(e.target.value)}
              placeholder="0.00"
              style={{
                width: '100%',
                height: '48px',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '0 16px',
                fontSize: '18px'
              }}
            />
          </div>
          
          {montoReal && (
            <div style={{ 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '16px',
              background: diferencia === 0 ? '#ECFDF5' : '#FEF2F2',
              color: diferencia === 0 ? '#059669' : '#DC2626'
            }}>
              Diferencia: {diferencia > 0 ? '+' : ''}{formatCurrency(diferencia)}
            </div>
          )}
          
          {error && <div style={{ color: '#EF4444', fontSize: '14px', marginBottom: '12px' }}>{error}</div>}
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={onClose}
              style={{ 
                flex: 1, 
                height: '48px', 
                background: '#F3F4F6', 
                color: '#374151', 
                border: 'none', 
                borderRadius: '12px', 
                fontSize: '15px', 
                fontWeight: 600, 
                cursor: 'pointer' 
              }}
            >
              Cancelar
            </button>
            <button 
              onClick={handleCerrar}
              disabled={loading || !montoReal}
              style={{ 
                flex: 1, 
                height: '48px', 
                background: loading ? '#9CA3AF' : '#E63946', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px', 
                fontSize: '15px', 
                fontWeight: 600, 
                cursor: loading ? 'not-allowed' : 'pointer' 
              }}
            >
              {loading ? 'Cerrando...' : 'Confirmar Cierre'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Venta = () => {
  const navigate = useNavigate();
  const { items, add, updateQuantity, remove, clear, subtotal, iva, total, itemCount, isEmpty, sincronizarPantallaCliente } = useCart();
  const { hasPermission, empleado } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [productsList, setProductsList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isTopProducts, setIsTopProducts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [cajaAbierta, setCajaAbierta] = useState(null);

  useEffect(() => {
    const handler = () => setShowCajaModal(true);
    window.addEventListener('open-caja', handler);
    return () => window.removeEventListener('open-caja', handler);
  }, []);
  const [verificandoCaja, setVerificandoCaja] = useState(true);
  const [showCajaModal, setShowCajaModal] = useState(false);
  const [showAbrirCajaModal, setShowAbrirCajaModal] = useState(false);
  const [showCerrarCajaModal, setShowCerrarCajaModal] = useState(false);

  const searchBarRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { sincronizarPantallaCliente(); }, [items]);
  
  useEffect(() => {
    const verificarCaja = async () => {
      if (!empleado?.uid) return;
      setVerificandoCaja(true);
      const result = await cajaService.cajaAbierta(empleado.uid);
      setCajaAbierta(result.data);
      setVerificandoCaja(false);
    };
    verificarCaja();
  }, [empleado?.uid]);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // En mobile portrait el wrapper es position:fixed — el content-area
  // queda vacío visualmente, pero mantiene su propio scroll. Lo bloqueamos.
  useEffect(() => {
    if (!cajaAbierta || window.innerWidth >= 1024) return;
    const contentArea = document.querySelector('.content-area');
    if (contentArea) contentArea.style.overflow = 'hidden';
    return () => { if (contentArea) contentArea.style.overflow = ''; };
  }, [cajaAbierta]);

  const fetchProducts = async () => {
    setLoading(true);
    const result = await productService.fetchAll();
    if (result.success) setProductsList(result.data);
    setLoading(false);
  };

  const getTopProducts = () => {
    return [...productsList]
      .sort((a, b) => (b.vendidos || 0) - (a.vendidos || 0))
      .slice(0, 6);
  };

  const lastFocusTime = useRef(0);

  // onFocus: siempre muestra sugerencias al enfocar
  const handleSearchFocus = () => {
    lastFocusTime.current = Date.now();
    if (!searchTerm) {
      setIsTopProducts(true);
      setSuggestions(getTopProducts());
      setShowSuggestions(true);
    }
  };

  // onClick: toggle, pero ignora si viene del mismo toque que onFocus
  const handleSearchClick = () => {
    if (Date.now() - lastFocusTime.current < 150) return;
    if (!searchTerm) {
      if (showSuggestions && isTopProducts) {
        setShowSuggestions(false);
      } else {
        setIsTopProducts(true);
        setSuggestions(getTopProducts());
        setShowSuggestions(true);
      }
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (value.length >= 2) {
      setIsTopProducts(false);
      const filtered = productsList.filter(p =>
        p.nombre?.toLowerCase().includes(value.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectProduct = async (product) => {
    setSearchTerm('');
    setShowSuggestions(false);
    const result = await add(product);
    if (result.resultado === 'stockBajo') {
      setToast({ show: true, message: `⚠️ Stock bajo: ${product.nombre}`, type: 'warning' });
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 2500);
    } else if (result.resultado !== 'added') {
      setToast({ show: true, message: `Sin stock: ${product.nombre}`, type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 2500);
    }
  };

  const handleBarcodeScan = async (code) => {
    setShowScanner(false);
    const result = await productService.fetchByBarcode(code);
    if (result.success && result.data) {
      await handleSelectProduct(result.data);
    } else {
      setToast({ show: true, message: 'Producto no encontrado', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 2000);
    }
  };

  const handleQuantityChange = (id, delta) => {
    const item = items.find(i => i.id === id);
    if (item) updateQuantity(id, item.cantidad + delta);
  };

  const handleNewSale = () => {
    clear();
    sincronizarPantallaCliente();
  };

  const handleCobrarClick = () => {
    if (!cajaAbierta) {
      setToast({ show: true, message: 'Debes abrir la caja antes de realizar ventas', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
      return;
    }
    setShowPaymentModal(true);
  };

  const handleAperturaExitosa = (nuevaCaja) => {
    setCajaAbierta(nuevaCaja);
    setToast({ show: true, message: 'Caja abierta correctamente', type: 'success' });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 2000);
  };

  const handleCierreExitoso = () => {
    setCajaAbierta(null);
    setToast({ show: true, message: 'Caja cerrada correctamente', type: 'success' });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 2000);
  };

  if (verificandoCaja) {
    return (
      <div className="venta-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6B7C93' }}>
          <div className="spinner-border" role="status"></div>
          <p style={{ marginTop: '12px' }}>Verificando caja...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!cajaAbierta && <BloqueoCaja onAbrirCaja={() => setShowAbrirCajaModal(true)} />}
      
      <div className={`venta-page-wrapper${cajaAbierta ? ' caja-abierta' : ''}`}>
        {toast.show && (
          <div className={`venta-toast venta-toast-${toast.type}`}>
            {toast.message}
          </div>
        )}

        {/* Header estándar como Sucursales */}
        <div className="tiendas-header">
          <div>
            <h1>Venta</h1>
            <div className="tiendas-subtitle">
              {cajaAbierta ? `Caja abierta · ${cajaAbierta.empleadoNombre || 'Cajero'}` : ''}
            </div>
          </div>
          <div className="tiendas-header-actions">
            <div className="venta-desktop-actions">
              <button className="venta-desktop-btn-caja" onClick={() => setShowCajaModal(true)} title="Caja">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="6" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                  <line x1="6" y1="14" x2="10" y2="14" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <button className="venta-desktop-btn-nueva" onClick={handleNewSale} disabled={isEmpty} title="Nueva Venta">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16" strokeLinecap="round"/><line x1="8" y1="12" x2="16" y2="12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="venta-container">
        {/* === COLUMNA IZQUIERDA: Búsqueda + Carrito === */}
        <div className="venta-left">

          {/* Barra de búsqueda estilo Google */}
          <div className="pos-search-bar" ref={searchBarRef}>
            <div className="search-input-wrapper">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={handleSearchFocus}
                onClick={handleSearchClick}
                placeholder="Buscar producto o escanear código..."
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setShowSuggestions(false); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7C93' }}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            {/* Dropdown de sugerencias */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="pos-suggestions">
                <div className="pos-suggestions-header">{isTopProducts ? 'Más vendidos' : `Resultados (${suggestions.length})`}</div>
                {suggestions.map(product => (
                  <div key={product.id} className="pos-suggestion-item" onClick={() => handleSelectProduct(product)}>
                    <div>
                      <div className="pos-suggestion-name">{product.nombre}</div>
                      <div style={{ fontSize: '12px', color: '#6B7C93' }}>{product.codigo}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="pos-suggestion-price">{formatCurrency(product.precioVenta)}</div>
                      <div style={{ fontSize: '11px', color: product.stock > 5 ? '#1A7A48' : product.stock > 0 ? '#F59E0B' : '#EF4444' }}>
                        Stock: {product.stock}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Carrito — siempre visible como card */}
          <div className="pos-cart-card">
            <div className="pos-cart-header">
              <h5>Artículos</h5>
              <span className="pos-cart-count">{itemCount} items</span>
            </div>
            {isEmpty ? (
              <div className="pos-empty-cart">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <p>Agrega productos para comenzar</p>
              </div>
            ) : (
              <div className="pos-cart-items">
                {items.map(item => (
                  <div key={item.id} className="pos-cart-item">
                    <div className="pos-item-info">
                      <div className="pos-item-name">{item.nombre}</div>
                      <div className="pos-item-price">
                        {formatCurrency(item.precioFinal || item.precio)} c/u
                        {item.precioOriginal > (item.precioFinal || item.precio) && (
                          <span style={{ textDecoration: 'line-through', marginLeft: '8px', color: '#EF4444' }}>
                            {formatCurrency(item.precioOriginal)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pos-item-quantity">
                      <button className="pos-qty-btn" onClick={() => handleQuantityChange(item.id, -1)}>−</button>
                      <span className="pos-qty-value">{item.cantidad}</span>
                      <button className="pos-qty-btn" onClick={() => handleQuantityChange(item.id, 1)}>+</button>
                    </div>
                    <div className="pos-item-total">
                      {formatCurrency((item.precioFinal || item.precio) * item.cantidad)}
                    </div>
                    <button className="pos-item-delete" onClick={() => remove(item.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* === COLUMNA DERECHA: botones + cuadro resumen === */}
        <div className="venta-right-col">

          {/* Cuadro de resumen */}
          <div className="venta-right">
          <div className="pos-summary-panel">
            <div className="pos-summary-header">
              <h3>Resumen de Venta</h3>
            </div>
            <div className="pos-summary-body">
              <div className="pos-summary-row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="pos-summary-row">
                <span>IVA (16%)</span>
                <span>{formatCurrency(iva)}</span>
              </div>
              <div className="pos-summary-divider"></div>
              <div className="pos-summary-total">
                <span className="pos-summary-total-label">Total</span>
                <span className="pos-summary-total-amount">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="pos-summary-actions">
              <button className="pos-checkout-btn" onClick={handleCobrarClick} disabled={isEmpty}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                  <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2" />
                </svg>
                Cobrar {!isEmpty && formatCurrency(total)}
              </button>

              {/* Nueva Venta — solo mobile (desktop usa la barra de arriba) */}
              {!isEmpty && (
                <button className="pos-new-sale-btn pos-new-sale-mobile" onClick={handleNewSale}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  Nueva Venta
                </button>
              )}
            </div>
          </div>
        </div>
        </div>

        {showScanner && (
          <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
        )}

        {showPaymentModal && (
          <PaymentModal
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => {
              setShowPaymentModal(false);
            }}
          />
        )}

        {showCajaModal && (
          <CajaModal 
            caja={cajaAbierta} 
            ventas={items}
            allSales={[]}
            onClose={() => setShowCajaModal(false)} 
            onCerrarCaja={() => { setShowCajaModal(false); setShowCerrarCajaModal(true); }}
          />
        )}

        {showCerrarCajaModal && (
          <CerrarCajaModal
            caja={cajaAbierta}
            onClose={() => setShowCerrarCajaModal(false)}
            onCerrarExitoso={handleCierreExitoso}
          />
        )}
      </div>{/* /venta-container */}
      </div>{/* /venta-page-wrapper */}

      {showAbrirCajaModal && (
        <AbrirCajaModal 
          onClose={() => setShowAbrirCajaModal(false)} 
          onAperturaExitosa={handleAperturaExitosa}
        />
      )}
    </>
  );
};

export default Venta;