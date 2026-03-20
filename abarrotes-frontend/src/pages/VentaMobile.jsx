import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import POSMobileLayout from '../components/POSMobileLayout';

const VentaMobile = () => {
  const navigate = useNavigate();
  
  // Detectar si es dispositivo móvil
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Estado de la Venta Actual
  // Usar variable global para persistir carrito entre montajes
  if (!window.ventaCart) {
    window.ventaCart = [];
  }
  
  // Función para actualizar el carrito y guardar en variable global
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

  // Guardar carrito en variable global cuando cambie
  useEffect(() => {
    window.ventaCart = cart;
  }, [cart]);

  // Agregar producto al carrito
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

  // Función para agregar producto desde escáner
  const addProductByBarcode = async (barcode) => {
    try {
      const response = await fetch(`http://localhost:8080/api/scanner/product/${barcode}`);
      if (response.ok) {
        const product = await response.json();
        const cartItem = {
          id: product.id || product.sku || barcode,
          name: product.nombreProducto || product.name,
          price: product.precio || product.price || 0,
          sku: product.sku || barcode,
          quantity: 1,
          subtotal: (product.precio || product.price || 0)
        };
        addToCart(cartItem);
        // Vibración al agregar
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
      } else {
        alert('Producto no encontrado');
      }
    } catch (error) {
      console.error('Error buscando producto:', error);
      alert('Error al buscar producto');
    }
  };

  // Lógica de pago (simplificada para móvil)
  const handleCheckout = () => {
    // Aquí iría la lógica de pago
    // Por ahora, solo mostramos un mensaje
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalConIVA = total * 1.16;
    
    const confirmar = window.confirm(`Total a pagar: $${totalConIVA.toFixed(2)}\n¿Confirmar pago?`);
    if (confirmar) {
      // Limpiar carrito
      updateCart([]);
      window.ventaCart = [];
      alert('Venta completada exitosamente');
    }
  };

  // Limpiar carrito
  const handleClearCart = () => {
    if (window.confirm('¿Estás seguro de limpiar el carrito?')) {
      updateCart([]);
      window.ventaCart = [];
    }
  };

  return (
    <div style={{ display: isMobile ? 'block' : 'none' }}>
      <POSMobileLayout
        cart={cart}
        updateCart={updateCart}
        onCheckout={handleCheckout}
        onClearCart={handleClearCart}
        addProductByBarcode={addProductByBarcode}
      />
    </div>
  );
};

export default VentaMobile;