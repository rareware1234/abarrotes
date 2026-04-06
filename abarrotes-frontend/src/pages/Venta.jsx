import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import productService from '../services/productService';
import PaymentModal from '../components/PaymentModal';
import BarcodeScanner from '../components/BarcodeScanner';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const Venta = () => {
  const navigate = useNavigate();
  const { items, add, updateQuantity, remove, clear, subtotal, iva, total, itemCount, isEmpty, sincronizarPantallaCliente } = useCart();
  const { hasPermission } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [productsList, setProductsList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  const searchRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    sincronizarPantallaCliente();
  }, [items]);

  const fetchProducts = async () => {
    setLoading(true);
    const result = await productService.fetchAll();
    if (result.success) {
      setProductsList(result.data);
    }
    setLoading(false);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (value.length >= 2) {
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
    
    if (result.resultado === 'added') {
      setToast({ show: true, message: `${product.nombre} agregado`, type: 'success' });
    } else if (result.resultado === 'stockBajo') {
      setToast({ show: true, message: `Stock bajo: ${product.nombre}`, type: 'warning' });
    } else {
      setToast({ show: true, message: `Sin stock: ${product.nombre}`, type: 'error' });
    }
    
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 2000);
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
    if (item) {
      updateQuantity(id, item.cantidad + delta);
    }
  };

  const handleNewSale = () => {
    clear();
    sincronizarPantallaCliente();
  };

  const isMobile = window.innerWidth < 768;

  return (
    <div className="venta-container" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ flex: isMobile ? 1 : '60%', display: 'flex', flexDirection: 'column', padding: '16px', overflow: 'hidden' }}>
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar producto o escanear código..."
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 44px',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  fontSize: '16px'
                }}
              />
              <i className="bi bi-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
            </div>
            <button
              onClick={() => setShowScanner(true)}
              style={{
                padding: '14px',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <i className="bi bi-upc" style={{ fontSize: '20px' }}></i>
            </button>
          </div>
          
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100,
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              {suggestions.map(product => (
                <div
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{product.nombre}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{product.codigo}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: 'var(--role-primary)' }}>{formatCurrency(product.precioVenta)}</div>
                    <div style={{ fontSize: '12px', color: product.stock > 5 ? '#1A7A48' : product.stock > 0 ? '#F59E0B' : '#EF4444' }}>
                      Stock: {product.stock}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {isEmpty ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <i className="bi bi-cart" style={{ fontSize: '64px', opacity: 0.3 }}></i>
              <p style={{ marginTop: '16px' }}>Agrega productos para comenzar</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'white',
                    borderRadius: '10px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{item.nombre}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {formatCurrency(item.precioFinal || item.precio)} c/u
                      {item.precioOriginal > (item.precioFinal || item.precio) && (
                        <span style={{ textDecoration: 'line-through', marginLeft: '8px', color: '#EF4444' }}>
                          {formatCurrency(item.precioOriginal)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer' }}
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: 600 }}>{item.cantidad}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer' }}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                  <div style={{ minWidth: '80px', textAlign: 'right', fontWeight: 600, marginLeft: '16px' }}>
                    {formatCurrency((item.precioFinal || item.precio) * item.cantidad)}
                  </div>
                  <button
                    onClick={() => remove(item.id)}
                    style={{ marginLeft: '8px', width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#EF4444', cursor: 'pointer' }}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ 
        width: isMobile ? '100%' : '40%', 
        background: 'white', 
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px' }}>Resumen</h2>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Subtotal ({itemCount} items)</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>IVA (16%)</span>
            <span>{formatCurrency(iva)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
            <span style={{ fontSize: '18px', fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--role-primary)' }}>{formatCurrency(total)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={isEmpty}
            style={{
              width: '100%',
              padding: '16px',
              background: isEmpty ? '#ccc' : 'var(--role-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '18px',
              fontWeight: 600,
              cursor: isEmpty ? 'not-allowed' : 'pointer'
            }}
          >
            <i className="bi bi-cash-stack me-2"></i>
            Cobrar
          </button>
          <button
            onClick={handleNewSale}
            disabled={isEmpty}
            style={{
              width: '100%',
              padding: '14px',
              background: 'white',
              color: 'var(--role-primary)',
              border: '1px solid var(--role-primary)',
              borderRadius: '10px',
              fontSize: '16px',
              cursor: isEmpty ? 'not-allowed' : 'pointer'
            }}
          >
            Nueva Venta
          </button>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
      )}

      {showPaymentModal && (
        <PaymentModal 
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(id, cambio) => {
            setShowPaymentModal(false);
            setToast({ show: true, message: `Venta ${id.slice(-8)} completada`, type: 'success' });
            setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
          }}
        />
      )}

      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 20px',
          borderRadius: '8px',
          background: toast.type === 'success' ? '#1A7A48' : toast.type === 'warning' ? '#F59E0B' : '#EF4444',
          color: 'white',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Venta;