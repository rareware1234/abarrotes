import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaPlus, FaMinus, FaTrash, FaTimes, FaCreditCard, FaMoneyBill, FaMobileAlt, FaBarcode, FaCheck, FaSpinner } from 'react-icons/fa';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseAuth';

const PAYMENT_METHODS = [
  { id: '01', name: 'Efectivo', icon: FaMoneyBill, color: '#22c55e', desc: 'Pago en efectivo' },
  { id: '04', name: 'Tarjeta Débito', icon: FaCreditCard, color: '#3b82f6', desc: 'Débito' },
  { id: '03', name: 'Tarjeta Crédito', icon: FaCreditCard, color: '#8b5cf6', desc: 'Crédito' },
  { id: '28', name: 'Transferencia', icon: FaMobileAlt, color: '#f59e0b', desc: 'SPEI' },
];

const Pos = () => {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState('01');
  const [montoPagado, setMontoPagado] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState('select');
  const [message, setMessage] = useState({ type: '', text: '' });
  const searchRef = useRef(null);

  useEffect(() => {
    loadProducts();
    if (searchRef.current) searchRef.current.focus();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(products.slice(0, 24));
    } else {
      const term = search.toLowerCase();
      setFiltered(products.filter(p =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.sku || '').toLowerCase().includes(term)
      ).slice(0, 24));
    }
  }, [search, products]);

  const loadProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'productos'));
      if (!snapshot.empty) {
        const data = snapshot.docs.map(d => {
          const p = d.data();
          return {
            id: d.id,
            name: p.nombre || p.name || 'Sin nombre',
            price: parseFloat(p.precio || p.price || 0),
            sku: p.sku || p.barcode || '',
            category: p.categoria || p.category || '',
            stock: p.stock || 999,
            image: p.imagen || ''
          };
        });
        setProducts(data);
        setFiltered(data.slice(0, 24));
      }
    } catch (e) {
      console.error('Error loading products:', e);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existente = cart.find(c => c.id === product.id);
    if (existente) {
      setCart(cart.map(c =>
        c.id === product.id ? { ...c, qty: c.qty + 1 } : c
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        sku: product.sku
      }]);
    }
    setSearch('');
    if (searchRef.current) searchRef.current.focus();
    showToast(`${product.name} agregado`);
  };

  const changeQty = (id, delta) => {
    setCart(cart.map(c => {
      if (c.id !== id) return c;
      const newQty = c.qty + delta;
      if (newQty <= 0) return null;
      return { ...c, qty: newQty };
    }).filter(Boolean));
  };

  const removeFromCart = (id) => setCart(cart.filter(c => c.id !== id));
  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const iva = subtotal * 0.16;
  const total = subtotal * 1.16;
  const cambio = parseFloat(montoPagado || 0) - total;

  const showToast = (text) => {
    setMessage({ type: 'success', text });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const handlePayment = () => {
    if (total === 0) return;
    setShowPayment(true);
    setPaymentStep('select');
  };

  const processPayment = async () => {
    setPaymentStep('processing');
    await new Promise(r => setTimeout(r, 1500));
    setPaymentStep('success');
    await new Promise(r => setTimeout(r, 2000));
    setShowPayment(false);
    setCart([]);
    setMontoPagado('');
    setSelectedPayment('01');
    showToast('Venta completada');
  };

  const quickAmounts = [
    { label: 'Total exacto', value: Math.ceil(total) },
    { label: '+ $20', value: Math.ceil(total + 20) },
    { label: '+ $50', value: Math.ceil(total + 50) },
    { label: '+ $100', value: Math.ceil(total + 100) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
      {message.text && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#22c55e', color: 'white', padding: '10px 20px',
          borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.9rem',
          zIndex: 9999, boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeUp 0.3s ease'
        }}>
          <FaCheck size={16} /> {message.text}
        </div>
      )}

      <div className="search-bar">
        <FaSearch className="search-bar-icon" />
        <input
          ref={searchRef}
          type="text"
          className="form-control"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card card-padded" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {cart.reduce((s, c) => s + c.qty, 0)} producto{cart.length !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            ${total.toFixed(2)}
          </div>
        </div>
        <button className="btn btn-primary" onClick={handlePayment} disabled={cart.length === 0} style={{ padding: '12px 20px' }}>
          <FaCreditCard /> Cobrar
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              style={{
                background: 'white', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)',
                padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                transition: 'var(--transition)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '6px'
              }}
            >
              <div style={{
                width: '44px', height: '44px', background: 'var(--primary-muted)', borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', color: 'var(--primary)'
              }}>
                <FaBarcode />
              </div>
              <div style={{
                fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dark)',
                lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', width: '100%'
              }}>
                {p.name}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>
                ${(p.price * 1.16).toFixed(0)}
              </div>
            </button>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <div className="card">
          <div className="card-header-section">
            <h3 className="card-title">
              <i className="bi bi-cart3" style={{ marginRight: 6, color: 'var(--primary)' }}></i>
              Carrito ({cart.length})
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={clearCart}>
              <FaTrash size={14} /> Limpiar
            </button>
          </div>
          <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
            {cart.map(item => (
              <div key={item.id} className="list-item">
                <div className="list-item-icon" style={{ width: 36, height: 36, fontSize: '0.9rem' }}>
                  <FaBarcode />
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">{item.name}</div>
                  <div className="list-item-subtitle">${(item.price * 1.16).toFixed(2)} c/u</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-icon" onClick={() => changeQty(item.id, -1)}
                    style={{ width: 30, height: 30, background: 'var(--border-light)' }}>
                    <FaMinus size={11} />
                  </button>
                  <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center', fontSize: '0.9rem' }}>{item.qty}</span>
                  <button className="btn btn-ghost btn-icon" onClick={() => changeQty(item.id, 1)}
                    style={{ width: 30, height: 30, background: 'var(--primary-muted)', color: 'var(--primary)' }}>
                    <FaPlus size={11} />
                  </button>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', minWidth: '56px', textAlign: 'right', fontSize: '0.9rem' }}>
                    ${(item.price * item.qty * 1.16).toFixed(0)}
                  </span>
                  <button className="btn btn-ghost btn-icon" onClick={() => removeFromCart(item.id)}
                    style={{ width: 26, height: 26, color: 'var(--danger)' }}>
                    <FaTimes size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 2 }}>
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              <span>IVA (16%)</span><span>${iva.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="payment-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPayment(false)}>
          <div className="payment-bg-circles">
            <div className="payment-circle payment-circle-1"></div>
            <div className="payment-circle payment-circle-2"></div>
            <div className="payment-circle payment-circle-3"></div>
            <div className="payment-circle payment-circle-4"></div>
          </div>
          <div className="payment-modal-container">
            <div className="payment-header">
              <div className="payment-header-left">
                <div className="payment-logo"><i className="bi bi-receipt"></i></div>
                <div>
                  <p className="payment-title-text">Pago</p>
                  <p className="payment-subtitle-text">Total a cobrar</p>
                </div>
              </div>
              <button className="payment-close-btn" onClick={() => setShowPayment(false)}><FaTimes /></button>
            </div>
            <div className="payment-total-section">
              <span className="payment-total-label">Total</span>
              <span className="payment-total-amount">${total.toFixed(2)}</span>
            </div>
            <div className="payment-content">
              {paymentStep === 'select' && (
                <>
                  <p className="payment-cash-label">Método de pago</p>
                  <div className="payment-methods-grid">
                    {PAYMENT_METHODS.map(m => (
                      <button
                        key={m.id}
                        className={`payment-method-card ${selectedPayment === m.id ? 'active' : ''}`}
                        onClick={() => setSelectedPayment(m.id)}
                        style={{ '--method-color': m.color }}
                      >
                        <div className="payment-method-icon" style={{ background: `${m.color}20`, color: m.color }}>
                          <m.icon />
                        </div>
                        <div className="payment-method-name">{m.name}</div>
                      </button>
                    ))}
                  </div>
                  {selectedPayment === '01' && (
                    <div className="payment-cash-section">
                      <p className="payment-cash-label">Monto recibido</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                        {quickAmounts.map((a, i) => (
                          <button key={i} className="payment-bill-btn" onClick={() => setMontoPagado(a.value.toString())}>
                            <span className="bill-value">${a.value}</span>
                            <span className="bill-label">{a.label}</span>
                          </button>
                        ))}
                      </div>
                      <input type="number" className="payment-cash-input" placeholder="$ 0.00"
                        value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)} autoFocus />
                      {cambio > 0 && (
                        <div className="payment-change">
                          <span>Cambio</span>
                          <span className="payment-change-amount">${cambio.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              {paymentStep === 'processing' && (
                <div className="payment-processing">
                  <div className="payment-spinner"></div>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)' }}>Procesando pago...</p>
                </div>
              )}
              {paymentStep === 'success' && (
                <div className="payment-success">
                  <div className="payment-success-icon"><FaCheck size={32} /></div>
                  <h3>¡Venta completada!</h3>
                  <p>El pago fue procesado correctamente</p>
                </div>
              )}
            </div>
            <div className="payment-footer">
              {paymentStep === 'select' && (
                <>
                  <button className="payment-confirm-btn" onClick={processPayment}
                    disabled={selectedPayment === '01' && (!montoPagado || parseFloat(montoPagado) < total)}>
                    <FaCheck /> Confirmar Pago
                  </button>
                  <button className="payment-cancel-btn" onClick={() => setShowPayment(false)}>Cancelar</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pos;
