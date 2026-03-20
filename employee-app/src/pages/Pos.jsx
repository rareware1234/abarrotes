import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaTrash, FaPlus, FaMinus, FaCreditCard, FaBarcode, FaTimes, FaCheck, FaSync, FaMoneyBillWave, FaMobileAlt, FaPrint, FaPhone, FaUniversity, FaUser, FaReceipt, FaCheckCircle, FaArrowLeft, FaSearch, FaCamera, FaLightbulb, FaFire, FaSpinner, FaCopy, FaCheckCircle as FaCheckCircleAlt } from 'react-icons/fa';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { getProfileColor } from '../data/employeeProfiles';
import { useSharedOrders } from '../hooks/useSharedOrders';

const Pos = () => {
  const navigate = useNavigate();
  const { addOrder } = useSharedOrders();
  
  // Colores dinámicos basados en el perfil
  const [colors, setColors] = useState({
    primary: '#1e7f5c',
    primaryDark: '#165f45',
    primaryLight: '#2fbf8c',
    secondary: '#2c3e50',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    border: '#dee2e6'
  });

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
      secondary: '#2c3e50',
      success: '#28a745',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
      light: '#f8f9fa',
      dark: '#343a40',
      border: '#dee2e6'
    });
  }, []);
  
  // Estado del carrito
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = sessionStorage.getItem('posCart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error parsing cart from sessionStorage:', error);
      return [];
    }
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanInstructions, setScanInstructions] = useState('Apunta la cámara al código de barras');
  const [cameraSupported, setCameraSupported] = useState(false);
  const [cameraDenied, setCameraDenied] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('01');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentStep, setPaymentStep] = useState('select'); // select, qr, processing, success
  const [qrData, setQrData] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState(null);
  const [ticketMethod, setTicketMethod] = useState('digital');
  const [phoneNumber, setPhoneNumber] = useState('');
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  // Estado para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);

  // Guardar carrito en sessionStorage cuando cambia
  useEffect(() => {
    sessionStorage.setItem('posCart', JSON.stringify(cart));
  }, [cart]);

  // Calcular totales
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;
  const change = paidAmount ? parseFloat(paidAmount) - total : 0;

  // Cargar lista de productos para búsqueda (misma lista que escritorio)
  useEffect(() => {
    const loadProducts = async () => {
      // Productos de prueba locales (MISMA LISTA QUE ESCRITORIO)
      const productosPrueba = [
        // Lácteos y Refrigerados
        { id: 1, name: 'Leche Entera Lala 1L', price: 22.50, sku: '7501055301011', salesCount: 150 },
        { id: 2, name: 'Yogurt Natural 1L', price: 25.00, sku: '7501055301101', salesCount: 120 },
        { id: 3, name: 'Queso Fresco 500g', price: 35.00, sku: '7501055301111', salesCount: 80 },
        { id: 4, name: 'Crema Ácida 200ml', price: 18.50, sku: '7501055301121', salesCount: 75 },
        { id: 5, name: 'Mantequilla 200g', price: 22.00, sku: '7501055301131', salesCount: 90 },
        { id: 6, name: 'Huevos Jumbo Dozen', price: 45.00, sku: '7501055301031', salesCount: 200 },
        
        // Panadería y Grano
        { id: 7, name: 'Pan Bimbo Blanco 680g', price: 32.90, sku: '7501055301021', salesCount: 180 },
        { id: 8, name: 'Arroz White 1kg', price: 18.00, sku: '7501055301051', salesCount: 140 },
        { id: 9, name: 'Frijoles Negros La Costeña 1kg', price: 24.00, sku: '7501055301061', salesCount: 95 },
        { id: 10, name: 'Azúcar Blanca 1kg', price: 16.50, sku: '7501055301161', salesCount: 110 },
        { id: 11, name: 'Sal de Mesa 1kg', price: 8.00, sku: '7501055301171', salesCount: 60 },
        { id: 12, name: 'Pasta San Marcos 500g', price: 14.00, sku: '7501055301181', salesCount: 70 },
        
        // Bebidas
        { id: 13, name: 'Agua Natural 1.5L', price: 12.00, sku: '7501055301191', salesCount: 250 },
        { id: 14, name: 'Refresco Coca Cola 600ml', price: 15.00, sku: '7501055301201', salesCount: 220 },
        { id: 15, name: 'Jugo de Naranja 1L', price: 20.00, sku: '7501055301211', salesCount: 85 },
        
        // Abarrotes
        { id: 16, name: 'Aceite Vegetal 1L', price: 28.00, sku: '7501055301221', salesCount: 100 },
        { id: 17, name: 'Salsa de Tomate 1kg', price: 15.00, sku: '7501055301231', salesCount: 55 },
        { id: 18, name: 'Café de Olla 250g', price: 35.00, sku: '7501055301241', salesCount: 65 },
      ];
      
      setProductsList(productosPrueba);
      
      // Cargar productos populares desde localStorage
      const savedPopular = localStorage.getItem('posPopularProducts');
      if (savedPopular) {
        setPopularProducts(JSON.parse(savedPopular));
      } else {
        // Ordenar por ventas y tomar los primeros 6
        const sorted = [...productosPrueba].sort((a, b) => b.salesCount - a.salesCount);
        setPopularProducts(sorted.slice(0, 6));
      }
    };
    loadProducts();
  }, []);

  // Resaltar texto coincidente
  const highlightMatch = (text, term) => {
    if (!term) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background: #d4edda; padding: 0 2px; border-radius: 2px;">$1</mark>');
  };

  // Manejar búsqueda con sugerencias predictivas
  const handleSearch = (e) => {
    const term = e.target.value.trim();
    setSearchTerm(term);
    
    if (term.length > 0) {
      const lowerTerm = term.toLowerCase();
      
      // Filtrar y ordenar por relevancia
      const filtered = productsList
        .map(product => {
          const name = product.name.toLowerCase();
          const sku = (product.sku || '').toLowerCase();
          
          let relevance = 0;
          
          // Coincidencia exacta al inicio del nombre (mayor prioridad)
          if (name.startsWith(lowerTerm)) relevance = 3;
          // El nombre contiene la palabra completa al inicio
          else if (name.split(' ').some(word => word.startsWith(lowerTerm))) relevance = 2;
          // El nombre contiene el término en cualquier parte
          else if (name.includes(lowerTerm)) relevance = 1;
          // Coincidencia en SKU
          else if (sku.includes(lowerTerm)) relevance = 0.5;
          
          return { ...product, relevance };
        })
        .filter(product => product.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 10);
      
      setSearchResults(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSearchResults([]);
    }
  };

  // Seleccionar producto de búsqueda
  const selectSearchResult = (product) => {
    addToCart(product);
    setSearchTerm('');
    setShowSuggestions(false);
    
    // Actualizar productos populares
    const updatedPopular = popularProducts.map(p => {
      if (p.id === product.id) {
        return { ...p, salesCount: (p.salesCount || 0) + 1 };
      }
      return p;
    });
    const sorted = [...updatedPopular].sort((a, b) => b.salesCount - a.salesCount);
    setPopularProducts(sorted.slice(0, 6));
    localStorage.setItem('posPopularProducts', JSON.stringify(sorted.slice(0, 6)));
  };

  // Función para agregar producto al carrito
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Función para actualizar cantidad
  const updateQuantity = (id, delta) => {
    setCart(prevCart =>
      prevCart
        .map(item => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(item => item !== null)
    );
  };

  // Función para eliminar item
  const removeItem = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  // Verificar soporte de cámara
  useEffect(() => {
    const checkCameraSupport = async () => {
      // Verificar si el protocolo es seguro
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        console.log('Cámara requiere HTTPS o localhost');
        setCameraSupported(false);
        setScanInstructions('Cámara requiere HTTPS. Usa la entrada manual.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        stream.getTracks().forEach(track => track.stop());
        setCameraSupported(true);
        console.log('Cámara disponible y lista');
      } catch (err) {
        console.log('Error verificando cámara:', err);
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraDenied(true);
          setScanInstructions('Permiso de cámara denegado. Ve a Configuración > Permisos > Cámara.');
        } else {
          setCameraSupported(false);
          setScanInstructions('Cámara no disponible. Usa la entrada manual.');
        }
      }
    };
    
    checkCameraSupport();
  }, []);

  // Lógica de escaneo de código de barras mejorada
  const startScanner = async () => {
    if (!videoRef.current || !cameraSupported) return;
    
    setIsScanning(true);
    setScanError('');
    setScanInstructions('Apunta la cámara al código de barras del producto');

    try {
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      await codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (result) {
          const barcode = result.getText();
          
          // Evitar escanear el mismo código múltiples veces muy rápido
          if (lastScannedCode === barcode) return;
          setLastScannedCode(barcode);
          setTimeout(() => setLastScannedCode(null), 2000);

          handleProductScan(barcode);
        }
      });
    } catch (err) {
      console.error('Error iniciando escáner:', err);
      setScanError('Error al iniciar la cámara');
      setScanInstructions('No se pudo iniciar la cámara. Usa la entrada manual.');
    }
  };

  const stopScanner = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsScanning(false);
    setScanInstructions('Apunta la cámara al código de barras');
  };

  const handleProductScan = async (barcode) => {
    try {
      // Buscar en la lista local
      const product = productsList.find(p => p.sku === barcode || p.barcode === barcode);
      
      if (product) {
        addToCart(product);
        
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
        
        // Mostrar feedback visual
        setScanInstructions('¡Producto agregado al carrito!');
        
        // Esperar un momento antes de detener el escaneo
        setTimeout(() => {
          stopScanner();
        }, 1000);
      } else {
        setScanError(`Producto con código ${barcode} no encontrado`);
        setScanInstructions('Intenta con otro código o usa la entrada manual');
        
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (error) {
      console.log('Error buscando producto:', error);
      setScanError(`Producto con código ${barcode} no encontrado`);
      setScanInstructions('Intenta con otro código o usa la entrada manual');
      
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  };

  const toggleScanner = () => {
    if (isScanning) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  // Manejar pago
  const handlePayment = () => {
    if (cart.length === 0) {
      return;
    }

    // Para métodos QR, el flujo es diferente
    if (paymentMethod === '06' || paymentMethod === '07') {
      setPaymentStep('success');
      completeSale();
      return;
    }

    if (paymentMethod === '01' && parseFloat(paidAmount || 0) < total) {
      return;
    }

    setPaymentStep('success');
    completeSale();
  };

  // Completar la venta
  const completeSale = () => {
    const ticketUuid = 'TKT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const totalWithIVA = total.toFixed(2);
    
    if (ticketMethod === 'impreso') {
      const ticketHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ticket - ${ticketUuid}</title>
          <style>
            body { font-family: monospace; text-align: center; padding: 20px; }
            .ticket { max-width: 300px; margin: 0 auto; border: 1px dashed #000; padding: 15px; }
            h4 { margin-bottom: 10px; }
            p { margin: 5px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <h4>Abarrotes Digitales</h4>
            <p>RFC: AAD980314XXX</p>
            <p>${new Date().toLocaleString('es-MX')}</p>
            <p>Ticket: ${ticketUuid}</p>
            <hr/>
            ${cart.map(item => `
              <div class="item">
                <span>${item.name} x${item.quantity}</span>
                <span>$${(item.price * item.quantity * 1.16).toFixed(2)}</span>
              </div>
            `).join('')}
            <hr/>
            <div class="total">
              <span>TOTAL: $${totalWithIVA}</span>
            </div>
            <p style="margin-top: 10px;">¡Gracias por su compra!</p>
          </div>
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(ticketHtml);
      printWindow.document.close();
      printWindow.onload = function() {
        printWindow.print();
      };
    }

    addOrder({
      uuid: ticketUuid,
      items: cart,
      total: parseFloat(totalWithIVA),
      montoPagado: parseFloat(paidAmount || 0),
      cambio: paidAmount ? parseFloat(paidAmount) - parseFloat(totalWithIVA) : 0,
      metodoPago: paymentMethod,
      fecha: new Date().toISOString()
    });
    
    setCart([]);
    sessionStorage.removeItem('posCart');
    setPaidAmount('');
    setPhoneNumber('');
  };

  // Generar QR para MercadoPago o CoDi
  const generateQRPayment = (type) => {
    setPaymentLoading(true);
    setPaymentStep('processing');
    
    // Simular generación de QR
    setTimeout(() => {
      const reference = Math.floor(1000000 + Math.random() * 9000000);
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        type === 'mercadopago' 
          ? `mercadopago://pay?amount=${total}&ref=${reference}` 
          : `codi://pay?amount=${total}&ref=${reference}`
      )}`;
      
      setQrData({
        qrCode: qrCodeUrl,
        referencia: reference.toString(),
        tipo: type === 'mercadopago' ? 'MercadoPago QR' : 'CoDi'
      });
      setPaymentStep('qr');
      setPaymentLoading(false);
    }, 1500);
  };

  return (
    <div 
      className="fade-in pos-container"
      style={{ 
        maxWidth: '100%', 
        margin: '0 auto',
        padding: '0 12px 85px',
        minHeight: '100vh'
      }}
    >
      {/* Header vacio */}

      {/* Mensaje si la cámara no está disponible */}
      {cameraDenied && (
        <div className="alert alert-warning mb-3">
          <FaExclamationTriangle className="me-2" />
          Permiso de cámara denegado. Habilita el permiso en la configuración del dispositivo.
        </div>
      )}

      {/* Barra de búsqueda estilo Amazon/MercadoLibre */}
      <div className="position-relative mb-3">
        <div 
          className="d-flex align-items-center rounded overflow-hidden shadow-sm"
          style={{ 
            backgroundColor: '#fff',
            border: '2px solid ' + colors.primary,
            borderRadius: '8px'
          }}
        >
          <div 
            className="px-3 py-2"
            style={{ backgroundColor: '#f8f9fa', borderRight: '1px solid #eee' }}
          >
            <FaSearch style={{ color: colors.primary, fontSize: '1.1rem' }} />
          </div>
          <input
            type="text"
            className="flex-grow-1 border-0 px-3 py-2"
            placeholder="Buscar producto por nombre o SKU..."
            value={searchTerm}
            onChange={handleSearch}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            style={{ 
              borderRadius: '0',
              outline: 'none',
              fontSize: '0.95rem'
            }}
          />
          {searchTerm && (
            <button 
              className="btn btn-link p-2 m-1 rounded"
              onClick={() => {
                setSearchTerm('');
                setShowSuggestions(false);
                setSearchResults([]);
              }}
              style={{ color: '#666' }}
            >
              <FaTimes />
            </button>
          )}
          <div 
            className="px-3 py-2"
            style={{ backgroundColor: colors.primary, color: 'white' }}
          >
            <FaBarcode style={{ fontSize: '1.2rem' }} />
          </div>
        </div>
        
        {/* Dropdown de búsqueda estilo Amazon/MercadoLibre */}
        {showSuggestions && (
          <div 
            className="position-absolute w-100 bg-white shadow-lg rounded overflow-hidden" 
            style={{ 
              zIndex: 1000, 
              maxHeight: '450px', 
              overflowY: 'auto',
              border: '1px solid #eee',
              marginTop: '4px'
            }}
          >
            {/* Productos más vendidos - Header estilo MercadoLibre */}
            {!searchTerm && (
              <div>
                <div 
                  className="px-3 py-2 d-flex align-items-center"
                  style={{ backgroundColor: colors.primary, color: 'white' }}
                >
                  <FaFire className="me-2" />
                  <small className="fw-bold">Los mas vendidos</small>
                </div>
                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {popularProducts.map((product, index) => (
                    <div 
                      key={product.id} 
                      className="px-3 py-2 d-flex align-items-center"
                      style={{ 
                        cursor: 'pointer',
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background 0.2s'
                      }}
                      onClick={() => selectSearchResult(product)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Ranking badge */}
                      <div 
                        className="me-3 d-flex align-items-center justify-content-center rounded"
                        style={{ 
                          width: '28px', 
                          height: '28px',
                          backgroundColor: '#e0e0e0',
                          color: '#666',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {index + 1}
                      </div>
                      
                      {/* Product info */}
                      <div className="flex-grow-1 me-2">
                        <div className="fw-medium" style={{ fontSize: '0.9rem' }}>
                          {product.name}
                        </div>
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <span 
                            className="fw-bold" 
                            style={{ color: colors.primary, fontSize: '0.95rem' }}
                          >
                            ${product.price.toFixed(2)}
                          </span>
                          <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                            SKU: {product.sku}
                          </span>
                        </div>
                      </div>
                      
                      {/* Quick add button */}
                      <FaPlus 
                        className="me-2" 
                        style={{ 
                          color: colors.primary, 
                          cursor: 'pointer',
                          fontSize: '1.2rem'
                        }}
                        onClick={() => selectSearchResult(product)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Resultados de búsqueda con sugerencias predictivas */}
            {searchTerm && searchResults.length > 0 && (
              <div>
                <div 
                  className="px-3 py-2 d-flex align-items-center justify-content-between"
                  style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #eee' }}
                >
                  <small className="text-muted fw-bold">
                    {searchResults.length} resultado{searchResults.length > 1 ? 's' : ''} para "{searchTerm}"
                  </small>
                </div>
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {searchResults.map((product, index) => (
                    <div 
                      key={product.id} 
                      className="px-3 py-2 d-flex align-items-center"
                      style={{ 
                        cursor: 'pointer',
                        borderBottom: '1px solid #f0f0f0'
                      }}
                      onClick={() => selectSearchResult(product)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Product initial avatar */}
                      <div 
                        className="me-3 d-flex align-items-center justify-content-center rounded"
                        style={{ 
                          width: '40px', 
                          height: '40px',
                          backgroundColor: '#e8e8e8',
                          color: '#666',
                          fontSize: '1rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Product info */}
                      <div className="flex-grow-1 me-2">
                        <div 
                          className="fw-medium" 
                          style={{ fontSize: '0.9rem' }}
                          dangerouslySetInnerHTML={{
                            __html: highlightMatch(product.name, searchTerm)
                          }}
                        />
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <span 
                            className="fw-bold" 
                            style={{ color: colors.primary, fontSize: '1rem' }}
                          >
                            ${product.price.toFixed(2)}
                          </span>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                            SKU: {product.sku}
                          </span>
                        </div>
                      </div>
                      
                      {/* Quick add button */}
                      <FaPlus 
                        style={{ 
                          color: colors.primary, 
                          cursor: 'pointer',
                          fontSize: '1.1rem'
                        }}
                        onClick={() => selectSearchResult(product)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Sin resultados */}
            {searchTerm && searchResults.length === 0 && (
              <div className="p-4 text-center">
                <div 
                  className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                  style={{ 
                    width: '60px', 
                    height: '60px',
                    backgroundColor: '#f8f8f8'
                  }}
                >
                  <FaSearch style={{ fontSize: '1.5rem', color: '#ccc' }} />
                </div>
                <p className="mb-1 fw-medium">Sin resultados</p>
                <small className="text-muted">
                  No encontramos "{searchTerm}"<br/>
                  Intenta con otro termino de busqueda
                </small>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scanner View */}
      {isScanning && (
        <div className="card mb-3 shadow-sm">
          <div className="card-body p-2">
            <div className="position-relative" style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000' }}>
              <video 
                ref={videoRef} 
                style={{ 
                  width: '100%', 
                  height: '250px', 
                  objectFit: 'cover',
                  backgroundColor: '#000'
                }} 
                autoPlay 
                playsInline 
              />
              <div className="scanner-overlay">
                <div className="scan-line"></div>
                <div className="scan-corners">
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>
                </div>
                <div className="scan-hints">
                  <div className="hint-top">Apunta al código de barras</div>
                  <div className="hint-bottom">Se detectará automáticamente</div>
                </div>
              </div>
            </div>
            {scanError && (
              <div className="alert alert-warning mt-2 mb-0 py-2 text-center" style={{ fontSize: '0.9rem' }}>
                {scanError}
              </div>
            )}
            <p className="text-muted small text-center mb-0 mt-2">
              <FaLightbulb className="me-1" />
              {scanInstructions}
            </p>
          </div>
        </div>
      )}

      {/* Carrito */}
      <div className="card shadow-sm mb-3">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-2">
          <h6 className="mb-0 fw-bold">
            <FaShoppingCart className="me-2" style={{ color: colors.primary }} />
            Carrito ({cart.length} items)
          </h6>
          {cart.length > 0 && (
            <button className="btn btn-link text-danger btn-sm p-0" onClick={() => setCart([])}>
              Limpiar
            </button>
          )}
        </div>
        <div className="card-body p-0" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {cart.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FaShoppingCart size={32} className="mb-2 opacity-50" />
              <p className="mb-0">El carrito está vacío</p>
            </div>
          ) : (
            <ul className="list-group list-group-flush">
              {cart.map((item, index) => (
                <li key={index} className="list-group-item px-3 py-2 d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="fw-medium" style={{ fontSize: '0.9rem' }}>{item.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                      ${item.price.toFixed(2)} x {item.quantity}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-sm btn-outline-secondary p-1" style={{ width: '28px', height: '28px' }} onClick={() => updateQuantity(item.id, -1)}>
                      <FaMinus size={10} />
                    </button>
                    <span style={{ minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button className="btn btn-sm btn-outline-secondary p-1" style={{ width: '28px', height: '28px' }} onClick={() => updateQuantity(item.id, 1)}>
                      <FaPlus size={10} />
                    </button>
                    <button className="btn btn-sm btn-outline-danger p-1 ms-2" style={{ width: '28px', height: '28px' }} onClick={() => removeItem(item.id)}>
                      <FaTrash size={10} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Total y Botón de Pago - FIJO ARRIBA de la navegación */}
      <div 
        className="position-fixed bg-white shadow-lg"
        style={{ 
          left: 0,
          right: 0,
          bottom: '65px',
          borderTop: `3px solid ${colors.primary}`, 
          zIndex: 1150,
          padding: '10px 16px'
        }}
      >
        <div className="d-flex align-items-center justify-content-between">
          {/* Totales */}
          <div>
            <div className="fw-bold" style={{ color: colors.primary, fontSize: '1.4rem' }}>
              ${total.toFixed(2)}
            </div>
            <small className="text-muted">
              {cart.length} prod{cart.length !== 1 ? 's' : ''}
            </small>
          </div>
          
          {/* Botón Cobrar */}
          <button 
            className="btn d-flex align-items-center justify-content-center rounded-pill fw-bold"
            style={{ 
              backgroundColor: colors.primary, 
              color: 'white',
              height: '46px',
              padding: '0 28px',
              fontSize: '1.1rem',
              boxShadow: '0 4px 12px rgba(30, 127, 92, 0.4)'
            }}
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
          >
            <FaCreditCard className="me-2" />
            Cobrar
          </button>
        </div>
      </div>

      {/* Modal de Pago - MercadoLibre Style */}
      {showPaymentModal && (
        <div className="payment-modal-overlay">
          {/* Background Circles */}
          <div className="payment-bg-circles">
            <div className="payment-circle payment-circle-1"></div>
            <div className="payment-circle payment-circle-2"></div>
            <div className="payment-circle payment-circle-3"></div>
            <div className="payment-circle payment-circle-4"></div>
          </div>

          <div className="payment-modal-container">
            {/* Header */}
            <div className="payment-header">
              <div className="payment-header-content">
                <div className="payment-logo">
                  <FaReceipt />
                </div>
                <div>
                  <h2 className="payment-title">Método de Pago</h2>
                  <p className="payment-subtitle">Total a pagar</p>
                </div>
              </div>
              <button className="payment-close-btn" onClick={() => { setShowPaymentModal(false); setPaymentStep('select'); }}>
                <FaTimes />
              </button>
            </div>

            {/* Total */}
            <div className="payment-total-section">
              <span className="payment-total-label">Total</span>
              <span className="payment-total-amount">${total.toFixed(2)}</span>
            </div>

            {/* Content */}
            <div className="payment-content">
              {/* Payment Methods Grid */}
              {paymentStep === 'select' && (
                <>
                  <div className="payment-methods-grid">
                    <button 
                      className={`payment-method-card ${paymentMethod === '01' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('01')}
                      style={{ '--method-color': '#22c55e' }}
                    >
                      <div className="payment-method-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}>
                        <FaMoneyBillWave style={{ color: '#22c55e' }} />
                      </div>
                      <span className="payment-method-name">Efectivo</span>
                      <span className="payment-method-desc">Pago en moneda</span>
                    </button>

                    <button 
                      className={`payment-method-card ${paymentMethod === '06' ? 'active' : ''}`}
                      onClick={() => { setPaymentMethod('06'); generateQRPayment('mercadopago'); }}
                      style={{ '--method-color': '#00b1ea' }}
                    >
                      <div className="payment-method-icon" style={{ backgroundColor: 'rgba(0, 177, 234, 0.15)' }}>
                        <FaMobileAlt style={{ color: '#00b1ea' }} />
                      </div>
                      <span className="payment-method-name">MercadoPago</span>
                      <span className="payment-method-desc">QR Code</span>
                    </button>

                    <button 
                      className={`payment-method-card ${paymentMethod === '07' ? 'active' : ''}`}
                      onClick={() => { setPaymentMethod('07'); generateQRPayment('codi'); }}
                      style={{ '--method-color': '#f59e0b' }}
                    >
                      <div className="payment-method-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                        <FaMobileAlt style={{ color: '#f59e0b' }} />
                      </div>
                      <span className="payment-method-name">CoDi</span>
                      <span className="payment-method-desc">BANXICO</span>
                    </button>

                    <button 
                      className={`payment-method-card ${paymentMethod === '03' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('03')}
                      style={{ '--method-color': '#3b82f6' }}
                    >
                      <div className="payment-method-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                        <FaCreditCard style={{ color: '#3b82f6' }} />
                      </div>
                      <span className="payment-method-name">Tarjeta</span>
                      <span className="payment-method-desc">Débito/Crédito</span>
                    </button>

                    <button 
                      className={`payment-method-card ${paymentMethod === '04' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('04')}
                      style={{ '--method-color': '#10b981' }}
                    >
                      <div className="payment-method-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                        <FaUniversity style={{ color: '#10b981' }} />
                      </div>
                      <span className="payment-method-name">Transferencia</span>
                      <span className="payment-method-desc">SPEI</span>
                    </button>
                  </div>

                  {/* Cash Input */}
                  {paymentMethod === '01' && (
                    <div className="payment-cash-section">
                      <label className="payment-cash-label">Monto recibido</label>
                      <div className="payment-quick-amounts payment-bills">
                        <button className="payment-bill-btn" onClick={() => setPaidAmount('50')}>
                          <span className="bill-icon">$</span>
                          <span className="bill-value">50</span>
                        </button>
                        <button className="payment-bill-btn" onClick={() => setPaidAmount('100')}>
                          <span className="bill-icon">$</span>
                          <span className="bill-value">100</span>
                        </button>
                        <button className="payment-bill-btn" onClick={() => setPaidAmount('200')}>
                          <span className="bill-icon">$</span>
                          <span className="bill-value">200</span>
                        </button>
                        <button className="payment-bill-btn" onClick={() => setPaidAmount('500')}>
                          <span className="bill-icon">$</span>
                          <span className="bill-value">500</span>
                        </button>
                      </div>
                      <div className="payment-quick-total">
                        <button className="payment-total-btn" onClick={() => setPaidAmount(Math.ceil(total).toString())}>
                          Exacta: ${total.toFixed(2)}
                        </button>
                      </div>
                      <input 
                        type="number" 
                        className="payment-cash-input"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        placeholder="0.00"
                      />
                      {paidAmount && parseFloat(paidAmount) >= total && (
                        <div className="payment-change">
                          <span>Cambio:</span>
                          <span className="payment-change-amount">${(parseFloat(paidAmount) - total).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ticket Type */}
                  <div className="payment-ticket-section">
                    <label className="payment-ticket-label">Tipo de ticket</label>
                    <div className="payment-ticket-options">
                      <button 
                        className={`payment-ticket-btn ${ticketMethod === 'digital' ? 'active' : ''}`}
                        onClick={() => setTicketMethod('digital')}
                      >
                        <FaMobileAlt className="me-2" />Digital
                      </button>
                      <button 
                        className={`payment-ticket-btn ${ticketMethod === 'impreso' ? 'active' : ''}`}
                        onClick={() => setTicketMethod('impreso')}
                      >
                        <FaPrint className="me-2" />Impreso
                      </button>
                    </div>
                    {ticketMethod === 'digital' && (
                      <input 
                        type="tel" 
                        className="payment-phone-input"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Teléfono a 10 dígitos"
                        maxLength="10"
                      />
                    )}
                  </div>
                </>
              )}

              {/* QR Section */}
              {paymentStep === 'qr' && qrData && (
                <div className="payment-qr-section">
                  <div className="payment-qr-header">
                    <div className="payment-qr-icon-wrapper">
                      <FaMobileAlt style={{ fontSize: '1.5rem', color: paymentMethod === '06' ? '#00b1ea' : '#f59e0b' }} />
                    </div>
                    <span className="payment-qr-title">
                      {paymentMethod === '06' ? 'MercadoPago QR' : 'CoDi'}
                    </span>
                  </div>
                  <p className="payment-qr-instruction">Muestra el QR al cliente para cobrar</p>
                  <div className="payment-qr-container">
                    <img src={qrData.qrCode} alt="QR Code" className="payment-qr-image" />
                  </div>
                  <div className="payment-qr-reference">
                    <span className="payment-qr-ref-label">Referencia:</span>
                    <span className="payment-qr-ref-value">{qrData.referencia}</span>
                    <button className="payment-copy-btn" onClick={() => navigator.clipboard.writeText(qrData.referencia)}>
                      <FaCopy />
                    </button>
                  </div>
                  <div className="payment-qr-time">
                    <FaSync className="me-1" />
                    El cliente tiene 30 min para pagar
                  </div>
                </div>
              )}

              {/* Processing */}
              {paymentStep === 'processing' && (
                <div className="payment-processing">
                  <div className="payment-spinner"></div>
                  <p>Generando código QR...</p>
                </div>
              )}

              {/* Success */}
              {paymentStep === 'success' && (
                <div className="payment-success">
                  <div className="payment-success-icon">
                    <FaCheckCircle style={{ fontSize: '2.5rem' }} />
                  </div>
                  <h3>¡Pago Exitoso!</h3>
                  <p>Venta completada correctamente</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="payment-footer">
              {paymentStep === 'select' && (
                <>
                  <button 
                    className="payment-confirm-btn"
                    onClick={handlePayment}
                    disabled={paymentMethod === '01' && parseFloat(paidAmount || 0) < total}
                  >
                    <FaCheckCircle />
                    Confirmar Pago
                  </button>
                  <button 
                    className="payment-cancel-btn"
                    onClick={() => { setShowPaymentModal(false); setPaymentStep('select'); }}
                  >
                    Cancelar
                  </button>
                </>
              )}
              {paymentStep === 'qr' && (
                <button 
                  className="payment-confirm-btn" 
                  style={{ backgroundColor: '#22c55e' }}
                  onClick={() => setPaymentStep('success')}
                >
                  <FaCheckCircle />
                  Pago Recibido
                </button>
              )}
              {paymentStep === 'success' && (
                <button 
                  className="payment-confirm-btn"
                  onClick={() => { 
                    setShowPaymentModal(false); 
                    setPaymentStep('select'); 
                    setCart([]);
                    sessionStorage.removeItem('posCart');
                  }}
                >
                  Nueva Venta
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scan-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }
        .scan-line {
          position: absolute;
          top: 50%;
          left: 10%;
          right: 10%;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, ${colors.danger} 20%, ${colors.danger} 80%, transparent 100%);
          animation: scan 2s linear infinite;
          box-shadow: 0 0 10px ${colors.danger};
        }
        @keyframes scan {
          0% { top: 20%; }
          50% { top: 80%; }
          100% { top: 20%; }
        }
        .scan-corners {
          position: absolute;
          top: 20%;
          left: 10%;
          right: 10%;
          bottom: 20%;
        }
        .corner {
          position: absolute;
          width: 20px;
          height: 20px;
          border-color: ${colors.primary};
          border-style: solid;
          border-width: 0;
        }
        .top-left { top: 0; left: 0; border-top-width: 3px; border-left-width: 3px; }
        .top-right { top: 0; right: 0; border-top-width: 3px; border-right-width: 3px; }
        .bottom-left { bottom: 0; left: 0; border-bottom-width: 3px; border-left-width: 3px; }
        .bottom-right { bottom: 0; right: 0; border-bottom-width: 3px; border-right-width: 3px; }
        
        .scan-hints {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 10px;
          color: white;
          font-size: 0.8rem;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }
        .hint-top, .hint-bottom {
          text-align: center;
          background: rgba(0,0,0,0.5);
          padding: 4px 8px;
          border-radius: 4px;
        }
        
        /* Estilos para botones de selección */
        .btn.active {
          box-shadow: 0 0 0 2px ${colors.primaryLight};
        }
        
        /* Responsive para landscape y tablets */
        @media (min-width: 768px) {
          .pos-container {
            max-width: 600px;
            margin: 0 auto;
          }
        }
        
        /* Landscape mode */
        @media (orientation: landscape) and (max-height: 500px) {
          .pos-header {
            padding: 4px 0;
          }
          .pos-search {
            margin-bottom: 8px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Pos;