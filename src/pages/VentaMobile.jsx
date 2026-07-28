import React, { useState, useEffect } from 'react';
import POSMobileLayout from '../components/POSMobileLayout';
import productService from '../services/productService';
import orderService from '../services/orderService';
import { useAuth } from '../context/AuthContext';

const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const METODOS = [
  { id: 'efectivo',    label: 'Efectivo',     icon: '💵' },
  { id: 'tarjeta',     label: 'Tarjeta',      icon: '💳' },
  { id: 'mercadopago', label: 'Mercado Pago', icon: '📱' },
  { id: 'codi',        label: 'CoDi',         icon: '🏦' },
];

function MobilePaymentModal({ cart, onSuccess, onCancel }) {
  const { empleado } = useAuth();
  const [screen, setScreen] = useState('select'); // 'select' | 'processing' | 'success'
  const [metodo, setMetodo] = useState(null);
  const [efectivo, setEfectivo] = useState('');
  const [error, setError] = useState('');

  const subtotal = cart.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;
  const montoRecibido = parseFloat(efectivo) || 0;
  const cambio = montoRecibido - total;

  const confirmar = async (m = metodo, monto = 0) => {
    setScreen('processing');
    setError('');
    try {
      const productos = cart.map(i => ({
        id: i.id || '',
        codigo: i.sku || '',
        nombre: i.name || i.nombreProducto || '',
        precioUnitario: i.price || 0,
        cantidad: i.quantity,
        imagenUrl: i.imagenUrl || null,
        categoria: i.categoria || '',
      }));
      const orden = {
        empleadoId: empleado?.uid || '',
        tiendaId: empleado?.tiendaId || '',
        productos,
        subtotal,
        iva,
        total,
        metodoPago: m,
        montoPagado: m === 'efectivo' ? monto : null,
        cambio: m === 'efectivo' ? Math.max(monto - total, 0) : 0,
        estado: 'completada',
        fuente: 'mobile',
      };
      const res = await orderService.create(orden);
      if (!res.success) throw new Error(res.error || 'Error al guardar');
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setScreen('success');
    } catch (e) {
      setError(e.message);
      setScreen('select');
    }
  };

  if (screen === 'processing') {
    return (
      <div style={overlay}>
        <div style={{ color: 'white', fontSize: 40, marginBottom: 16 }}>⏳</div>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>Procesando...</p>
      </div>
    );
  }

  if (screen === 'success') {
    return (
      <div style={overlay}>
        <div style={{ fontSize: 72, marginBottom: 12 }}>✅</div>
        <p style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>¡Venta completada!</p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 18, margin: '0 0 32px' }}>{fmt(total)}</p>
        {metodo === 'efectivo' && cambio > 0 && (
          <p style={{ color: '#4ade80', fontSize: 17, margin: '0 0 32px', fontWeight: 700 }}>
            Cambio: {fmt(Math.max(montoRecibido - total, 0))}
          </p>
        )}
        <button onClick={onSuccess} style={btnGreen}>Nueva Venta</button>
      </div>
    );
  }

  // screen === 'select'
  if (metodo === 'efectivo') {
    return (
      <div style={overlay}>
        <div style={sheet}>
          <p style={sheetTitle}>Efectivo — {fmt(total)}</p>
          <input
            type="number"
            inputMode="decimal"
            value={efectivo}
            onChange={e => setEfectivo(e.target.value)}
            placeholder="Monto recibido"
            autoFocus
            style={numInput}
          />
          {montoRecibido >= total && (
            <p style={{ color: '#4ade80', fontWeight: 700, margin: '4px 0 12px', fontSize: 15 }}>
              Cambio: {fmt(montoRecibido - total)}
            </p>
          )}
          {error && <p style={{ color: '#f87171', fontSize: 13, margin: '0 0 8px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setMetodo(null)} style={btnSecondary}>← Atrás</button>
            <button
              onClick={() => montoRecibido >= total && confirmar('efectivo', montoRecibido)}
              disabled={montoRecibido < total}
              style={{ ...btnGreen, flex: 2, opacity: montoRecibido < total ? 0.5 : 1 }}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlay}>
      <div style={sheet}>
        <p style={sheetTitle}>Cobrar {fmt(total)}</p>
        {error && <p style={{ color: '#f87171', fontSize: 13, margin: '0 0 10px' }}>{error}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {METODOS.map(m => (
            <button key={m.id} onClick={() => {
              setMetodo(m.id);
              if (m.id !== 'efectivo') confirmar(m.id);
            }} style={btnMetodo}>
              <span style={{ fontSize: 22 }}>{m.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{m.label}</span>
            </button>
          ))}
        </div>
        <button onClick={onCancel} style={btnSecondary}>Cancelar</button>
      </div>
    </div>
  );
}

// styles
const overlay = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(0,0,0,0.85)',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', padding: 24,
};
const sheet = {
  width: '100%', maxWidth: 340,
  background: '#1e2d26', borderRadius: 20,
  padding: '24px 20px',
};
const sheetTitle = {
  color: 'white', fontSize: 18, fontWeight: 700,
  textAlign: 'center', margin: '0 0 18px',
};
const btnGreen = {
  flex: 1, height: 52, borderRadius: 12, border: 'none',
  background: '#00843D', color: 'white', fontSize: 16,
  fontWeight: 700, cursor: 'pointer',
};
const btnSecondary = {
  flex: 1, height: 48, borderRadius: 12,
  border: '1.5px solid rgba(255,255,255,0.25)',
  background: 'transparent', color: 'rgba(255,255,255,0.8)',
  fontSize: 15, fontWeight: 600, cursor: 'pointer',
};
const btnMetodo = {
  display: 'flex', alignItems: 'center', gap: 14,
  width: '100%', height: 56, borderRadius: 12,
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: 'white', padding: '0 18px', cursor: 'pointer',
};
const numInput = {
  width: '100%', height: 52, borderRadius: 12,
  border: '1.5px solid rgba(255,255,255,0.25)',
  background: 'rgba(255,255,255,0.08)', color: 'white',
  fontSize: 20, fontWeight: 700, padding: '0 16px',
  marginBottom: 12, outline: 'none', boxSizing: 'border-box',
};

const VentaMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setEmployeeName(sessionStorage.getItem('desktop_employeeName') || '');
  }, []);

  if (!window.ventaCart) window.ventaCart = [];

  const [cart, setCart] = useState(window.ventaCart || []);

  const updateCart = (update) => {
    const next = typeof update === 'function' ? update(window.ventaCart || []) : update;
    setCart(next);
    window.ventaCart = next;
  };

  useEffect(() => { window.ventaCart = cart; }, [cart]);

  const [scanCode, setScanCode] = useState('');
  const [productsList, setProductsList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [toast, setToast] = useState('');
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    productService.fetchAll().then(res => {
      if (res.success && res.data) setProductsList(res.data);
    });
  }, []);

  const addToCart = (product) => {
    updateCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const vibrate = () => navigator.vibrate && navigator.vibrate(100);

  const addProductByBarcode = async (barcode) => {
    const res = await productService.fetchByBarcode(barcode);
    if (!res.success || !res.data) {
      showToast('Producto no encontrado: ' + barcode);
      return;
    }
    const p = res.data;
    addToCart({
      id: p.id,
      name: p.nombre,
      price: p.precioConIVA || p.precio || 0,
      sku: p.codigo || barcode,
    });
    vibrate();
    showToast(p.nombre + ' agregado');
  };

  const normalizeProduct = (p) => ({
    id: p.id,
    name: p.nombre || p.name || p.nombreProducto || '',
    price: p.precioConIVA || p.precioVenta || p.precio || p.price || 0,
    sku: p.codigo || p.sku || '',
    imagenUrl: p.imagenUrl || null,
    categoria: p.categoria || '',
  });

  const handleSearch = (q) => {
    setScanCode(q);
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    const filtered = productsList.filter(p => {
      const name = (p.nombre || p.name || p.nombreProducto || '').toLowerCase();
      const sku = (p.codigo || p.sku || '').toLowerCase();
      return name.includes(q.toLowerCase()) || sku.includes(q.toLowerCase());
    }).slice(0, 6);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  const handleAddProduct = async () => {
    if (!scanCode.trim()) return;
    const exact = productsList.find(p =>
      (p.codigo || p.sku || '').toLowerCase() === scanCode.toLowerCase()
    );
    if (exact) { addToCart(normalizeProduct(exact)); setScanCode(''); setSuggestions([]); setShowSuggestions(false); vibrate(); return; }
    await addProductByBarcode(scanCode);
    setScanCode(''); setSuggestions([]); setShowSuggestions(false);
  };

  const handleSelectSuggestion = (p) => {
    addToCart(normalizeProduct(p)); setScanCode(''); setSuggestions([]); setShowSuggestions(false); vibrate();
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    updateCart([]);
    window.ventaCart = [];
    setShowPayment(false);
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    updateCart([]);
    window.ventaCart = [];
  };

  if (!isMobile) return null;

  return (
    <>
      <POSMobileLayout
        cart={cart}
        updateCart={updateCart}
        onCheckout={handleCheckout}
        onClearCart={handleClearCart}
        addProductByBarcode={addProductByBarcode}
        scanCode={scanCode}
        setScanCode={setScanCode}
        suggestions={suggestions}
        showSuggestions={showSuggestions}
        onSearch={handleSearch}
        onAddProduct={handleAddProduct}
        onSelectSuggestion={handleSelectSuggestion}
        employeeName={employeeName}
      />
      {showPayment && (
        <MobilePaymentModal
          cart={cart}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      )}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)', color: 'white', padding: '10px 20px',
          borderRadius: 20, fontSize: 14, fontWeight: 600, zIndex: 9999,
          whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>{toast}</div>
      )}
    </>
  );
};

export default VentaMobile;
