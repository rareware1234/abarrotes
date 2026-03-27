import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { useSharedOrders } from '../hooks/useSharedOrders';
import { getProfileColor } from '../data/employeeProfiles';
import { FaCreditCard, FaTimes, FaCheck, FaMoneyBillWave, FaMobileAlt, FaPrint, FaUniversity, FaReceipt, FaCheckCircle, FaCopy } from 'react-icons/fa';
import POSLayout, { BarcodeIcon, PlusIcon, MinusIcon, TrashIcon, CartIcon, CreditCardIcon } from '../components/POSLayout';
import '../styles/pos-layout.css';

const Venta = () => {
  const inputRef = useRef(null);
  const { addOrder } = useSharedOrders();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [colors, setColors] = useState({
    primary: '#1B5E35',
    primaryDark: '#154a2c',
    primaryLight: '#2E7D52',
  });

  if (!window.ventaCart) {
    window.ventaCart = [];
  }
  
  const updateCart = (update) => {
    let nextCart;
    if (typeof update === 'function') {
      const currentCart = window.ventaCart || cart;
      nextCart = update(currentCart);
    } else {
      nextCart = update;
    }
    setCart(nextCart);
    window.ventaCart = nextCart;
  };
  
  const [cart, setCart] = useState(window.ventaCart || []);
  const [scanCode, setScanCode] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [productsList, setProductsList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('01');
  const [montoPagado, setMontoPagado] = useState('');
  const [paymentStep, setPaymentStep] = useState('select');
  const [qrData, setQrData] = useState(null);
  const [ticketMethod, setTicketMethod] = useState('digital');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [config, setConfig] = useState({
    clabeInterbancaria: '044185002754631919',
    nombreEmpresa: 'Abarrotes Digitales',
    banco: 'BBVA',
    regimenFiscal: '612',
    lugarExpedicion: '06000',
    rfcEmpresa: 'AAD980314XXX',
    direccionEmpresa: 'Av. Principal #123, Col. Centro, CDMX'
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('sistemaConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  useEffect(() => {
    const profileColor = getProfileColor(localStorage.getItem('employeeProfile') || 'staff');
    const adjustColor = (color, amount) => {
      const hex = color.replace('#', '');
      const num = parseInt(hex, 16);
      const r = Math.min(255, Math.max(0, (num >> 16) + amount));
      const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
      const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
      return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    };

    setColors({
      primary: profileColor,
      primaryDark: adjustColor(profileColor, -20),
      primaryLight: adjustColor(profileColor, 20),
    });
  }, []);

  useEffect(() => {
    window.ventaCart = cart;
  }, [cart]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      const productosPrueba = [
        { id: 1, name: 'Leche Entera Lala 1L', price: 22.50, sku: '7501055301011' },
        { id: 2, name: 'Yogurt Natural 1L', price: 25.00, sku: '7501055301101' },
        { id: 3, name: 'Queso Fresco 500g', price: 35.00, sku: '7501055301111' },
        { id: 4, name: 'Crema Acida 200ml', price: 18.50, sku: '7501055301121' },
        { id: 5, name: 'Mantequilla 200g', price: 22.00, sku: '7501055301131' },
        { id: 6, name: 'Huevos Jumbo Dozen', price: 45.00, sku: '7501055301031' },
        { id: 7, name: 'Pan Bimbo Blanco 680g', price: 32.90, sku: '7501055301021' },
        { id: 8, name: 'Arroz White 1kg', price: 18.00, sku: '7501055301051' },
        { id: 9, name: 'Frijoles Negros 1kg', price: 24.00, sku: '7501055301061' },
        { id: 10, name: 'Azucar Blanca 1kg', price: 16.50, sku: '7501055301161' },
        { id: 11, name: 'Sal de Mesa 1kg', price: 8.00, sku: '7501055301171' },
        { id: 12, name: 'Pasta San Marcos 500g', price: 14.00, sku: '7501055301181' },
        { id: 13, name: 'Aceite Capullo 1L', price: 28.50, sku: '7501055301041' },
        { id: 14, name: 'Refresco Cola 2L', price: 18.00, sku: '7501055301221' },
        { id: 15, name: 'Agua Purificada 1.5L', price: 10.00, sku: '7501055301211' },
        { id: 16, name: 'Sabritas Original 150g', price: 18.50, sku: '7501055301231' },
      ];
      
      setProductsList(productosPrueba);
      try {
        await api.get('/products');
      } catch (error) {
        console.log('Using local products');
      }
    };
    loadProducts();
  }, []);

  const getTopSellingProducts = () => {
    return productsList.slice(0, 8);
  };

  const handleInputChange = (value) => {
    setScanCode(value);
    
    if (value.length > 0) {
      const filtered = productsList.filter(product => 
        product.name.toLowerCase().includes(value.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(value.toLowerCase()))
      );
      setSuggestions(filtered.slice(0, 8));
      setShowSuggestions(true);
    } else {
      const topSelling = getTopSellingProducts();
      setSuggestions(topSelling);
      setShowSuggestions(true);
    }
  };

  const selectSuggestion = (product) => {
    setScanCode('');
    setShowSuggestions(false);
    addToCart(product);
  };

  const handleScan = () => {
    const code = scanCode.trim();
    if (!code) return;

    const product = productsList.find(p => 
      p.name.toLowerCase() === code.toLowerCase() || 
      p.name.toLowerCase().includes(code.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase() === code.toLowerCase())
    );

    if (product) {
      addToCart(product);
      setScanCode('');
      setShowSuggestions(false);
      setMessage({ type: 'success', text: product.name + ' agregado' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } else {
      setMessage({ type: 'error', text: 'Producto no encontrado' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const addToCart = (product) => {
    updateCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: item.price * (item.quantity + 1) }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1, subtotal: product.price }];
      }
    });
  };

  const updateQuantity = (id, delta) => {
    updateCart(prevCart => {
      const newCart = prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty, subtotal: item.price * newQty };
        }
        return item;
      }).filter(Boolean);
      
      window.ventaCart = newCart;
      return newCart;
    });
  };

  const removeItem = (id) => {
    updateCart(prevCart => {
      const newCart = prevCart.filter(item => item.id !== id);
      window.ventaCart = newCart;
      return newCart;
    });
  };

  const calculateTotalsWithIVA = () => {
    const subtotalBase = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const totalConIVA = subtotalBase * 1.16;
    const iva = subtotalBase * 0.16;
    return { subtotalBase, totalConIVA, iva };
  };

  const { subtotalBase, totalConIVA, iva } = calculateTotalsWithIVA();

  const openPaymentModal = () => {
    if (cart.length === 0) {
      setMessage({ type: 'error', text: 'El carrito esta vacio' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      return;
    }
    setSelectedPaymentMethod('01');
    setShowPaymentModal(true);
  };

  const confirmPayment = () => {
    if (selectedPaymentMethod === '01' && (!montoPagado || parseFloat(montoPagado) < totalConIVA)) {
      setMessage({ type: 'error', text: 'Monto insuficiente' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      return;
    }

    updateCart([]);
    setScanCode('');
    setShowSuggestions(false);
    setMontoPagado('');
    setSelectedPaymentMethod('01');
    setShowPaymentModal(false);
    setMessage({ type: 'success', text: 'Venta completada' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    
    window.ventaCart = [];
  };

  const generateQRPayment = (type) => {
    setPaymentStep('processing');
    
    setTimeout(() => {
      const reference = Math.floor(1000000 + Math.random() * 9000000);
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        type === 'mercadopago' 
          ? `mercadopago://pay?amount=${totalConIVA}&ref=${reference}` 
          : `codi://pay?amount=${totalConIVA}&ref=${reference}`
      )}`;
      
      setQrData({
        qrCode: qrCodeUrl,
        referencia: reference.toString(),
        tipo: type === 'mercadopago' ? 'MercadoPago QR' : 'CoDi'
      });
      setPaymentStep('qr');
    }, 1500);
  };

  const cancelPayment = () => {
    setShowPaymentModal(false);
    setMontoPagado('');
    setSelectedPaymentMethod('01');
    setPaymentStep('select');
    setQrData(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <POSLayout
      title="Punto de Venta"
      onToggleSidebar={toggleMenu}
      searchValue={scanCode}
      onSearchChange={handleInputChange}
      onSearchSubmit={handleScan}
      showSuggestions={showSuggestions && suggestions.length > 0}
      suggestions={suggestions}
      onSelectSuggestion={selectSuggestion}
    >
      {message.text && (
        <div className={`pos-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="pos-suggestions">
          <div className="pos-suggestions-header">
            {scanCode ? `${suggestions.length} resultados` : `${suggestions.length} opciones populares`}
          </div>
          {suggestions.map((product) => (
            <div 
              key={product.id} 
              className="pos-suggestion-item"
              onClick={() => selectSuggestion(product)}
            >
              <span className="pos-suggestion-name">{product.name}</span>
              <span className="pos-suggestion-price">${(product.price * 1.16).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* CARRITO */}
      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
        <div className="pos-cart-header">
          <h5>Articulos ({cart.length})</h5>
          <span className="pos-cart-count">{cart.reduce((sum, i) => sum + i.quantity, 0)} items</span>
        </div>
        
        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div className="pos-empty-cart">
              <CartIcon />
              <div>Carrito vacio</div>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="pos-cart-item">
                <div className="pos-item-info">
                  <div className="pos-item-name">{item.name}</div>
                  <div className="pos-item-price">${(item.price * 1.16).toFixed(2)} c/u</div>
                </div>
                
                <div className="pos-item-quantity">
                  <button className="pos-qty-btn" onClick={() => updateQuantity(item.id, -1)}>
                    <MinusIcon />
                  </button>
                  <span className="pos-qty-value">{item.quantity}</span>
                  <button className="pos-qty-btn" onClick={() => updateQuantity(item.id, 1)}>
                    <PlusIcon />
                  </button>
                </div>
                
                <div className="pos-item-total">
                  ${(item.subtotal * 1.16).toFixed(2)}
                </div>
                
                <button className="pos-item-delete" onClick={() => removeItem(item.id)}>
                  <TrashIcon />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RESUMEN */}
      <div className="pos-summary">
        <div className="pos-summary-row">
          <span>Subtotal</span>
          <span>${subtotalBase.toFixed(2)}</span>
        </div>
        <div className="pos-summary-row">
          <span>IVA (16%)</span>
          <span>${iva.toFixed(2)}</span>
        </div>
        <div className="pos-summary-total">
          <span className="pos-summary-label">Total</span>
          <span className="pos-summary-amount">${totalConIVA.toFixed(2)}</span>
        </div>

        <button 
          className="pos-checkout-btn"
          onClick={openPaymentModal}
          disabled={cart.length === 0}
        >
          <CreditCardIcon />
          Proceder a Pago
        </button>

        {cart.length > 0 && (
          <button 
            className="pos-new-sale-btn"
            onClick={() => { updateCart([]); window.ventaCart = []; }}
          >
            Nueva Venta
          </button>
        )}

        <div className="pos-employee">
          <small>
            Empleado: <strong>{localStorage.getItem('employeeName') || 'No identificado'}</strong>
          </small>
        </div>
      </div>

      {/* MODAL DE PAGO */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px', height: '48px',
                  background: 'rgba(27,94,53,0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaReceipt style={{ color: '#1B5E35' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Metodo de Pago</h2>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6B7C93' }}>Total a pagar</p>
                </div>
              </div>
              <button 
                onClick={cancelPayment}
                style={{
                  width: '40px', height: '40px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ padding: '24px', background: 'rgba(27,94,53,0.05)', textAlign: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6B7C93' }}>Total</span>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#1B5E35' }}>
                ${totalConIVA.toFixed(2)}
              </div>
            </div>

            <div style={{ padding: '16px' }}>
              {paymentStep === 'select' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    <button 
                      onClick={() => setSelectedPaymentMethod('01')}
                      style={{
                        padding: '16px',
                        border: selectedPaymentMethod === '01' ? '2px solid #1B5E35' : '1.5px solid #E5E7EB',
                        background: selectedPaymentMethod === '01' ? 'rgba(27,94,53,0.05)' : 'white',
                        borderRadius: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <FaMoneyBillWave style={{ fontSize: '24px', color: '#22c55e', marginBottom: '8px' }} />
                      <div style={{ fontWeight: 600 }}>Efectivo</div>
                    </button>

                    <button 
                      onClick={() => { setSelectedPaymentMethod('06'); generateQRPayment('mercadopago'); }}
                      style={{
                        padding: '16px',
                        border: selectedPaymentMethod === '06' ? '2px solid #1B5E35' : '1.5px solid #E5E7EB',
                        background: selectedPaymentMethod === '06' ? 'rgba(27,94,53,0.05)' : 'white',
                        borderRadius: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <FaMobileAlt style={{ fontSize: '24px', color: '#00b1ea', marginBottom: '8px' }} />
                      <div style={{ fontWeight: 600 }}>MercadoPago</div>
                    </button>

                    <button 
                      onClick={() => setSelectedPaymentMethod('03')}
                      style={{
                        padding: '16px',
                        border: selectedPaymentMethod === '03' ? '2px solid #1B5E35' : '1.5px solid #E5E7EB',
                        background: selectedPaymentMethod === '03' ? 'rgba(27,94,53,0.05)' : 'white',
                        borderRadius: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <FaCreditCard style={{ fontSize: '24px', color: '#3b82f6', marginBottom: '8px' }} />
                      <div style={{ fontWeight: 600 }}>Tarjeta</div>
                    </button>

                    <button 
                      onClick={() => setSelectedPaymentMethod('04')}
                      style={{
                        padding: '16px',
                        border: selectedPaymentMethod === '04' ? '2px solid #1B5E35' : '1.5px solid #E5E7EB',
                        background: selectedPaymentMethod === '04' ? 'rgba(27,94,53,0.05)' : 'white',
                        borderRadius: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <FaUniversity style={{ fontSize: '24px', color: '#10b981', marginBottom: '8px' }} />
                      <div style={{ fontWeight: 600 }}>Transferencia</div>
                    </button>
                  </div>

                  {selectedPaymentMethod === '01' && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
                        Monto recibido
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {[50, 100, 200, 500].map(amount => (
                          <button 
                            key={amount}
                            onClick={() => setMontoPagado(amount.toString())}
                            style={{
                              padding: '8px 16px',
                              border: '1.5px solid #E5E7EB',
                              background: 'white',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 500
                            }}
                          >
                            ${amount}
                          </button>
                        ))}
                        <button 
                          onClick={() => setMontoPagado(Math.ceil(totalConIVA).toString())}
                          style={{
                            padding: '8px 16px',
                            border: '1.5px solid #1B5E35',
                            background: 'rgba(27,94,53,0.05)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            color: '#1B5E35'
                          }}
                        >
                          Exacta: ${totalConIVA.toFixed(2)}
                        </button>
                      </div>
                      <input 
                        type="number"
                        value={montoPagado}
                        onChange={(e) => setMontoPagado(e.target.value)}
                        placeholder="0.00"
                        style={{
                          width: '100%',
                          height: '48px',
                          padding: '0 16px',
                          border: '1.5px solid #E5E7EB',
                          borderRadius: '10px',
                          fontSize: '16px'
                        }}
                      />
                      {montoPagado && parseFloat(montoPagado) >= totalConIVA && (
                        <div style={{
                          marginTop: '12px',
                          padding: '12px',
                          background: '#E8F5EC',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <span>Cambio:</span>
                          <span style={{ fontWeight: 600, color: '#166534' }}>
                            ${(parseFloat(montoPagado) - totalConIVA).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={confirmPayment}
                    disabled={selectedPaymentMethod === '01' && (!montoPagado || parseFloat(montoPagado) < totalConIVA)}
                    className="pos-checkout-btn"
                  >
                    <FaCheck /> Confirmar Pago
                  </button>
                </>
              )}

              {paymentStep === 'processing' && (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                  <p>Generando codigo QR...</p>
                </div>
              )}

              {paymentStep === 'qr' && qrData && (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <p style={{ marginBottom: '24px', color: '#6B7C93' }}>
                    Muestra el QR al cliente para cobrar
                  </p>
                  <img 
                    src={qrData.qrCode} 
                    alt="QR Code" 
                    style={{ width: '200px', height: '200px', margin: '0 auto', display: 'block' }} 
                  />
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#6B7C93' }}>Referencia:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{qrData.referencia}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(qrData.referencia)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1B5E35' }}
                    >
                      <FaCopy />
                    </button>
                  </div>
                  <button
                    onClick={() => { confirmPayment(); setPaymentStep('success'); }}
                    className="pos-checkout-btn"
                    style={{ marginTop: '24px', background: '#22c55e' }}
                  >
                    <FaCheck /> Pago Recibido
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </POSLayout>
  );
};

export default Venta;
