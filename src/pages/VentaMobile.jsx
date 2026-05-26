import React, { useState, useEffect } from 'react';
import POSMobileLayout from '../components/POSMobileLayout';

const VentaMobile = () => {
  // Detectar móvil
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Nombre del empleado
  const [employeeName, setEmployeeName] = useState('');

  useEffect(() => {
    const name = sessionStorage.getItem('desktop_employeeName') || '';
    setEmployeeName(name);
  }, []);

  // Estado del carrito con persistencia global
  if (!window.ventaCart) {
    window.ventaCart = [];
  }

  const updateCart = (update) => {
    let nextCart;
    if (typeof update === 'function') {
      nextCart = update(window.ventaCart || []);
    } else {
      nextCart = update;
    }
    setCart(nextCart);
    window.ventaCart = nextCart;
  };

  const [cart, setCart] = useState(window.ventaCart || []);

  useEffect(() => {
    window.ventaCart = cart;
  }, [cart]);

  // Estado de búsqueda
  const [scanCode, setScanCode] = useState('');
  const [productsList, setProductsList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Cargar productos al iniciar
  useEffect(() => {
    const saved = localStorage.getItem('productsList');
    if (saved) {
      try {
        setProductsList(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing products:', e);
      }
    }
  }, []);

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
      }
      return [...prevCart, { ...product, quantity: 1, subtotal: product.price || product.precio }];
    });
  };

  // Buscar productos en lista local
  const handleSearch = (query) => {
    setScanCode(query);
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = productsList.filter(p => {
      const name = (p.nombreProducto || p.name || '').toLowerCase();
      const sku = (p.sku || p.codigo || '').toLowerCase();
      const q = query.toLowerCase();
      return name.includes(q) || sku.includes(q);
    }).slice(0, 6);

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  // Agregar desde input
  const handleAddProduct = async () => {
    if (!scanCode.trim()) return;

    // Buscar código exacto en lista local
    const exactMatch = productsList.find(p =>
      (p.sku || '').toLowerCase() === scanCode.toLowerCase() ||
      (p.codigo || '').toLowerCase() === scanCode.toLowerCase()
    );

    if (exactMatch) {
      addToCart(exactMatch);
      setScanCode('');
      setSuggestions([]);
      setShowSuggestions(false);
      vibrate();
      return;
    }

    // Intentar API si no hay coincidencia local
    await addProductByBarcode(scanCode);
    setScanCode('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Seleccionar del autocomplete
  const handleSelectSuggestion = (product) => {
    addToCart(product);
    setScanCode('');
    setSuggestions([]);
    setShowSuggestions(false);
    vibrate();
  };

  // Vibración
  const vibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  // Agregar producto por barcode desde API
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
          subtotal: product.precio || product.price || 0
        };
        addToCart(cartItem);
        vibrate();
      } else {
        alert('Producto no encontrado');
      }
    } catch (error) {
      console.error('Error buscando producto:', error);
      alert('Error al buscar producto');
    }
  };

  // Abrir cámara (placeholder)
  const handleOpenCamera = () => {
    // Aquí se abriría el scanner de cámara
    alert('Scanner de cámara en desarrollo');
  };

  // Checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    const total = cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
    const totalConIVA = total * 1.16;

    const confirmar = window.confirm(
      `Total a pagar: $${totalConIVA.toFixed(2)}\n¿Confirmar pago?`
    );

    if (confirmar) {
      updateCart([]);
      window.ventaCart = [];
      alert('Venta completada');
    }
  };

  // Limpiar carrito
  const handleClearCart = () => {
    if (window.confirm('¿Limpiar el carrito?')) {
      updateCart([]);
      window.ventaCart = [];
    }
  };

  if (!isMobile) {
    return null;
  }

  return (
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
      onOpenCamera={handleOpenCamera}
      employeeName={employeeName}
    />
  );
};

export default VentaMobile;
