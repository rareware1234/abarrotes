import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaBarcode, FaCheck, FaSearch, FaHistory, FaCamera, FaLightbulb, FaExclamationTriangle, FaFire, FaShoppingCart } from 'react-icons/fa';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { getProfileColor } from '../data/employeeProfiles';

const Scanner = () => {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanInstructions, setScanInstructions] = useState('Apunta la cámara al código de barras');
  const [cameraSupported, setCameraSupported] = useState(false);
  const [cameraDenied, setCameraDenied] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState(null);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [scanHistory, setScanHistory] = useState(() => {
    // Cargar historial desde localStorage al iniciar
    const savedHistory = localStorage.getItem('scannerHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const streamRef = useRef(null);

  // Guardar historial en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem('scannerHistory', JSON.stringify(scanHistory));
  }, [scanHistory]);

  // Verificar soporte de cámara al cargar el componente
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
        // Intentar obtener acceso a la cámara
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        // Detener el stream inmediatamente
        stream.getTracks().forEach(track => track.stop());
        
        setCameraSupported(true);
        console.log('Cámara disponible y lista');
      } catch (err) {
        console.log('Error verificando cámara:', err);
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraDenied(true);
          setScanInstructions('Permiso de cámara denegado. Habilita el permiso en la configuración del dispositivo.');
        } else {
          setCameraSupported(false);
          setScanInstructions('Cámara no disponible. Usa la entrada manual.');
        }
      }
    };
    
    checkCameraSupport();
  }, []);

  // Cargar lista de productos para búsqueda
  useEffect(() => {
    const loadProducts = async () => {
      // Productos de prueba locales
      const productosPrueba = [
        { id: 1, name: 'Leche Entera Lala 1L', price: 22.50, sku: '7501055301011', stock: 45, salesCount: 150 },
        { id: 2, name: 'Yogurt Natural 1L', price: 25.00, sku: '7501055301101', stock: 32, salesCount: 120 },
        { id: 3, name: 'Queso Fresco 500g', price: 35.00, sku: '7501055301111', stock: 28, salesCount: 80 },
        { id: 4, name: 'Crema Ácida 200ml', price: 18.50, sku: '7501055301121', stock: 20, salesCount: 75 },
        { id: 5, name: 'Mantequilla 200g', price: 22.00, sku: '7501055301131', stock: 15, salesCount: 90 },
        { id: 6, name: 'Huevos Jumbo Dozen', price: 45.00, sku: '7501055301031', stock: 60, salesCount: 200 },
        { id: 7, name: 'Pan Bimbo Blanco 680g', price: 32.90, sku: '7501055301021', stock: 25, salesCount: 180 },
        { id: 8, name: 'Arroz White 1kg', price: 18.00, sku: '7501055301051', stock: 50, salesCount: 140 },
        { id: 9, name: 'Frijoles Negros La Costeña 1kg', price: 24.00, sku: '7501055301061', stock: 40, salesCount: 95 },
        { id: 10, name: 'Azúcar Blanca 1kg', price: 16.50, sku: '7501055301161', stock: 35, salesCount: 110 },
        { id: 11, name: 'Sal de Mesa 1kg', price: 8.00, sku: '7501055301171', stock: 55, salesCount: 60 },
        { id: 12, name: 'Pasta San Marcos 500g', price: 14.00, sku: '7501055301181', stock: 30, salesCount: 70 },
        { id: 13, name: 'Agua Natural 1.5L', price: 12.00, sku: '7501055301191', stock: 80, salesCount: 250 },
        { id: 14, name: 'Refresco Coca Cola 600ml', price: 15.00, sku: '7501055301201', stock: 45, salesCount: 220 },
        { id: 15, name: 'Jugo de Naranja 1L', price: 20.00, sku: '7501055301211', stock: 25, salesCount: 85 },
        { id: 16, name: 'Aceite Vegetal 1L', price: 28.00, sku: '7501055301221', stock: 35, salesCount: 100 },
        { id: 17, name: 'Salsa de Tomate 1kg', price: 15.00, sku: '7501055301231', stock: 40, salesCount: 55 },
        { id: 18, name: 'Café de Olla 250g', price: 35.00, sku: '7501055301241', stock: 20, salesCount: 65 },
      ];
      
      setProductsList(productosPrueba);
      
      // Cargar productos populares
      const savedPopular = localStorage.getItem('scannerPopularProducts');
      if (savedPopular) {
        setPopularProducts(JSON.parse(savedPopular));
      } else {
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
          if (name.startsWith(lowerTerm)) relevance = 3;
          else if (name.split(' ').some(word => word.startsWith(lowerTerm))) relevance = 2;
          else if (name.includes(lowerTerm)) relevance = 1;
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
    selectProduct(product);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  // Seleccionar producto (desde escáner o historial)
  const selectProduct = (product) => {
    setScannedProduct(product);
    setScanHistory(prev => [...prev, { ...product, timestamp: new Date() }]);
    
    // Detener escaneo si está activo
    if (isScanning) {
      stopScanner();
    }
  };

  // Iniciar escaneo de código de barras
  const startScanner = async () => {
    if (!cameraSupported) {
      setScanError('Cámara no disponible o no soportada');
      return;
    }
    
    if (!videoRef.current) return;
    
    setIsScanning(true);
    setScanError('');
    setScanInstructions('Apunta la cámara al código de barras del producto');
    setScannedProduct(null);

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
      setScanInstructions('No se pudo iniciar la cámara. Intenta nuevamente.');
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
      // Primero buscar en la lista local
      let product = productsList.find(p => p.sku === barcode || p.barcode === barcode);
      
      // Si no se encuentra el producto, mostrar error
      if (!product) {
        setError(`Producto no encontrado: ${barcode}`);
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      if (product) {
        selectProduct(product);
        
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
        
        // Mostrar feedback visual
        setScanInstructions('¡Producto encontrado!');
        
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

  const handleReset = () => {
    setScannedProduct(null);
    setSearchTerm('');
    setShowSuggestions(false);
    setScanError('');
  };

  return (
    <div className="fade-in px-3 pb-5">
      {/* Header vacío */}

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
                        borderBottom: '1px solid #f0f0f0'
                      }}
                      onClick={() => selectSearchResult(product)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
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
                        </div>
                      </div>
                      
                      <FaShoppingCart 
                        style={{ color: colors.primary, cursor: 'pointer', fontSize: '1.1rem' }}
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
                          <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                            SKU: {product.sku}
                          </span>
                        </div>
                      </div>
                      
                      <FaShoppingCart 
                        style={{ color: colors.primary, cursor: 'pointer', fontSize: '1.1rem' }}
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

      {/* Vista del escáner */}
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

      {/* Producto encontrado */}
      {scannedProduct && (
        <div className="card fade-in mb-3 shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center py-2">
            <h6 className="mb-0 fw-bold" style={{ color: colors.primary }}>
              <FaCheck className="me-2" />
              Producto Encontrado
            </h6>
            <button 
              className="btn btn-link text-danger btn-sm p-0"
              onClick={handleReset}
            >
              <FaTimes />
            </button>
          </div>
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-grow-1">
                <h5 className="fw-bold mb-1">{scannedProduct.name}</h5>
                <p className="text-primary fw-bold mb-1" style={{ fontSize: '1.3rem' }}>
                  ${scannedProduct.price?.toFixed(2) || '0.00'}
                </p>
                <div className="d-flex align-items-center mb-2">
                  {scannedProduct.stock !== undefined && (
                    <span className={`badge me-2 ${scannedProduct.stock > 0 ? 'bg-success' : 'bg-danger'}`}>
                      {scannedProduct.stock} unidades
                    </span>
                  )}
                  {scannedProduct.stock > 0 && scannedProduct.stock <= 10 && (
                    <span className="badge bg-warning text-dark">
                      ¡Últimas unidades!
                    </span>
                  )}
                </div>
                {scannedProduct.sku && (
                  <p className="text-muted small mb-0">
                    <FaBarcode className="me-1" />
                    Código: {scannedProduct.sku}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historial de escaneos recientes - siempre visible */}
      <div className="card shadow-sm">
        <div className="card-header bg-white py-2">
          <h6 className="mb-0 fw-bold" style={{ color: colors.primary }}>
            <FaHistory className="me-2" />
            Recientes
          </h6>
        </div>
        <div className="card-body p-2">
          {scanHistory.length > 0 ? (
            scanHistory.slice(-5).reverse().map((item, index) => (
              <div 
                key={index} 
                className={`d-flex justify-content-between align-items-center py-2 ${index > 0 ? 'border-top' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => selectProduct(item)}
              >
                <div className="d-flex align-items-center">
                  <small className="text-truncate" style={{ maxWidth: '200px' }}>
                    {item.name}
                  </small>
                </div>
                <div className="d-flex align-items-center">
                  {item.stock !== undefined && (
                    <span className={`badge me-2 ${item.stock > 0 ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.7rem' }}>
                      {item.stock} ud.
                    </span>
                  )}
                  <small className="text-primary fw-bold">
                    ${item.price?.toFixed(2)}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted text-center mb-0 py-2">
              Sin productos recientes
            </p>
          )}
        </div>
      </div>

      <style>{`
        .scanner-overlay {
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
      `}</style>
    </div>
  );
};

export default Scanner;
