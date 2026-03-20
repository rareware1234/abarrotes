import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaBarcode, FaTimes, FaPlus, FaMinus, FaCreditCard, FaPrint } from 'react-icons/fa';
import BarcodeScanner from './BarcodeScanner';

const POSMobileLayout = ({ cart, updateCart, onCheckout, onClearCart, addProductByBarcode }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalConIVA, setTotalConIVA] = useState(0);

  // Calcular totales
  useEffect(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(subtotal);
    setTotalConIVA(subtotal * 1.16);
  }, [cart]);

  // Manejar detección de producto desde escáner
  const handleProductDetected = async (code) => {
    if (addProductByBarcode) {
      addProductByBarcode(code);
    } else {
      // Fallback si no se pasa la función
      try {
        const response = await fetch(`http://localhost:8080/api/scanner/product/${code}`);
        if (response.ok) {
          const product = await response.json();
          const cartItem = {
            id: product.id || product.sku || code,
            name: product.nombreProducto || product.name,
            price: product.precio || product.price || 0,
            sku: product.sku || code,
            quantity: 1,
            subtotal: (product.precio || product.price || 0)
          };
          addToCart(cartItem);
        } else {
          alert('Producto no encontrado');
        }
      } catch (error) {
        console.error('Error buscando producto:', error);
        alert('Error al buscar producto');
      }
    }
  };

  // Agregar producto al carrito
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      updateCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: item.price * (item.quantity + 1) }
          : item
      ));
    } else {
      updateCart([...cart, { ...product, quantity: 1, subtotal: product.price }]);
    }
    
    // Vibración al agregar
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  // Actualizar cantidad
  const updateQuantity = (id, delta) => {
    updateCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return null;
        return { ...item, quantity: newQuantity, subtotal: item.price * newQuantity };
      }
      return item;
    }).filter(item => item !== null));
  };

  // Eliminar item
  const removeItem = (id) => {
    updateCart(cart.filter(item => item.id !== id));
  };

  return (
    <div className="pos-mobile-layout">
      {/* Header */}
      <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0 fw-bold">POS</h5>
          <small className="opacity-75">Caja activa</small>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-light"
            onClick={() => setShowScanner(!showScanner)}
            title="Escanear producto"
          >
            <FaBarcode />
          </button>
        </div>
      </div>

      {/* Scanner */}
      {showScanner && (
        <div className="scanner-section p-3 bg-light border-bottom">
          <BarcodeScanner
            onProductDetected={handleProductDetected}
            onClose={() => setShowScanner(false)}
          />
        </div>
      )}

      {/* Carrito */}
      <div className="cart-section p-3" style={{ paddingBottom: '200px' }}>
        <h6 className="mb-3 fw-bold">
          <FaShoppingCart className="me-2" />
          Carrito ({cart.length} items)
        </h6>
        
        {cart.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FaShoppingCart size={48} className="mb-3 opacity-50" />
            <p>El carrito está vacío</p>
            <small>Escanea un producto para comenzar</small>
          </div>
        ) : (
          <div className="list-group">
            {cart.map(item => (
              <div key={item.id} className="list-group-item p-2 d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="fw-medium small">{item.name}</div>
                  <div className="text-muted small">
                    $ {(item.price * 1.16).toFixed(2)} c/u
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <FaMinus size={10} />
                  </button>
                  <span className="fw-bold" style={{ minWidth: '20px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <FaPlus size={10} />
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeItem(item.id)}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total Panel - Fijo en la parte inferior */}
      <div className="total-panel position-fixed bottom-0 start-0 end-0 bg-white border-top p-3 shadow-lg">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="text-muted">Subtotal:</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="text-muted">IVA (16%):</span>
          <span>${(totalConIVA - total).toFixed(2)}</span>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-3 fw-bold fs-5">
          <span>Total:</span>
          <span className="text-primary">${totalConIVA.toFixed(2)}</span>
        </div>
        <div className="d-grid gap-2">
          <button
            className="btn btn-primary btn-lg"
            style={{ backgroundColor: '#006241', borderColor: '#006241' }}
            onClick={onCheckout}
            disabled={cart.length === 0}
          >
            <FaCreditCard className="me-2" />
            Cobrar
          </button>
          {cart.length > 0 && (
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={onClearCart}
            >
              Limpiar carrito
            </button>
          )}
        </div>
      </div>

      {/* Estilos */}
      <style>{`
        .pos-mobile-layout {
          max-width: 100%;
          padding-bottom: 250px;
        }
        
        .list-group-item {
          border-left: 3px solid #1e7f5c;
          margin-bottom: 4px;
        }
        
        .total-panel {
          border-top: 3px solid #1e7f5c;
          z-index: 1000;
        }
      `}</style>
    </div>
  );
};

export default POSMobileLayout;