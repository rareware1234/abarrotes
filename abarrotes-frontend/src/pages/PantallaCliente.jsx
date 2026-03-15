import React, { useState, useEffect } from 'react';

const PantallaCliente = () => {
  const [productos, setProductos] = useState([]);
  const [productoActual, setProductoActual] = useState(null);
  const [total, setTotal] = useState(0);
  const [animacion, setAnimacion] = useState(false);
  const [fechaHora, setFechaHora] = useState(new Date());
  const [config, setConfig] = useState({
    nombreEmpresa: 'Abarrotes Digitales',
    clabeInterbancaria: '044185002754631919',
    banco: 'BBVA',
    bannerUrl: 'https://via.placeholder.com/800x400/006241/ffffff?text=¡Bienvenido+a+Abarrotes+Digitales!',
    bannerText: '¡Bienvenido a Abarrotes Digitales!'
  });

  // Escuchar productos del Dashboard
  useEffect(() => {
    // Cargar configuración
    const savedConfig = localStorage.getItem('sistemaConfig');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      console.log('Config loaded:', parsed);
      setConfig({
        nombreEmpresa: parsed.nombreEmpresa || 'Abarrotes Digitales',
        clabeInterbancaria: parsed.clabeInterbancaria || '044185002754631919',
        banco: parsed.banco || 'BBVA',
        bannerUrl: parsed.bannerUrl || 'https://via.placeholder.com/800x400/006241/ffffff?text=¡Bienvenido+a+Abarrotes+Digitales!',
        bannerText: parsed.bannerText || '¡Bienvenido a Abarrotes Digitales!'
      });
    }

    // Actualizar fecha y hora cada segundo
    const intervaloFecha = setInterval(() => {
      setFechaHora(new Date());
    }, 1000);

    // Escuchar eventos de BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('pantalla_cliente');
      channel.onmessage = (event) => {
        if (event.data.type === 'product_scanned') {
          agregarProducto(event.data.product);
        }
      };
    }

    // También escuchar cambios en localStorage (como fallback)
    const handleStorageChange = (e) => {
      if (e.key === 'cliente_pantalla' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.type === 'product_scanned') {
            agregarProducto(data.product);
          }
        } catch (error) {
          console.error('Error parsing storage data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Leer datos iniciales del localStorage
    const initialData = localStorage.getItem('cliente_pantalla');
    if (initialData) {
      try {
        const data = JSON.parse(initialData);
        if (data.type === 'product_scanned') {
          agregarProducto(data.product);
        }
      } catch (error) {
        console.error('Error parsing initial data:', error);
      }
    }

    return () => {
      clearInterval(intervaloFecha);
      window.removeEventListener('storage', handleStorageChange);
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('pantalla_cliente');
        channel.close();
      }
    };
  }, []);

  const agregarProducto = (producto) => {
    // Animación
    setAnimacion(true);
    setTimeout(() => setAnimacion(false), 300);

    // Actualizar producto actual
    setProductoActual({
      ...producto,
      timestamp: new Date()
    });

    // Agregar al carrito
    setProductos(prev => {
      const existente = prev.find(p => p.id === producto.id);
      if (existente) {
        return prev.map(p => 
          p.id === producto.id 
            ? { ...p, cantidad: p.cantidad + 1, subtotal: p.precio * (p.cantidad + 1) }
            : p
        );
      } else {
        return [...prev, { ...producto, cantidad: 1, subtotal: producto.precio }];
      }
    });

    // Actualizar total
    setTotal(prev => prev + producto.precio);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="container-fluid p-0" style={{ 
      backgroundColor: '#ffffff', 
      minHeight: '100vh',
      color: '#333',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center px-5 py-3 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
        <div className="d-flex align-items-center">
          <img 
            src="/src/assets/logo.png" 
            alt="Logo" 
            style={{ height: '50px', marginRight: '15px', filter: 'brightness(0)' }}
          />
          <h2 className="mb-0 fw-bold" style={{ color: '#006241' }}>
            {config.nombreEmpresa}
          </h2>
        </div>
        <div className="text-end">
          <div className="h5 mb-0" style={{ color: '#666' }}>
            {fechaHora.toLocaleDateString('es-MX', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="h4 mb-0 fw-bold" style={{ color: '#006241' }}>
            {formatTime(fechaHora)}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="row g-0" style={{ minHeight: 'calc(100vh - 80px)' }}>
        {/* Columna Izquierda: Banner (50%) */}
        <div className="col-md-6 d-flex align-items-center justify-content-center p-4" style={{ backgroundColor: '#ffffff' }}>
          {/* Banner desde configuración */}
          <div style={{ 
            width: '100%', 
            height: '100%', 
            minHeight: '400px',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            backgroundColor: '#006241',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {config.bannerUrl ? (
              <img 
                src={config.bannerUrl} 
                alt="Banner promocional"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  console.log('Error loading banner image:', config.bannerUrl);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div style={{ color: 'white', textAlign: 'center' }}>
                <i className="bi bi-image display-4"></i>
                <p>Sin imagen configurada</p>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Resumen (50%) */}
        <div className="col-md-6 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          {/* Resumen de Compra */}
          <div className="card mb-4 shadow-sm" style={{ borderRadius: '15px', border: 'none' }}>
            <div className="card-header" style={{ backgroundColor: '#006241', color: 'white', borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
              <h5 className="mb-0">
                <i className="bi bi-receipt me-2"></i> Resumen de Compra
              </h5>
            </div>
            <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <ul className="list-unstyled mb-0">
                {productos.map((item, index) => (
                  <li key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                      <span className="fw-medium">{item.nombre}</span>
                      <br />
                      <small className="text-muted">x {item.cantidad}</small>
                    </div>
                    <span className="fw-bold" style={{ color: '#006241' }}>
                      {formatCurrency(item.subtotal)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-footer bg-light" style={{ borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px' }}>
              <div className="d-flex justify-content-between align-items-center">
                <span className="fs-5">Total:</span>
                <span className="fs-2 fw-bold" style={{ color: '#006241' }}>
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="text-center text-muted">
            <p className="mb-1">
              <i className="bi bi-info-circle me-2"></i> Escanea los productos en la caja
            </p>
          </div>
        </div>
      </div>

      {/* Animaciones */}
      <style>{`
        @keyframes pop {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-pop {
          animation: pop 0.3s ease-out;
        }
        
        /* Scrollbar personalizado */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #006241;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #008855;
        }
      `}</style>
    </div>
  );
};

export default PantallaCliente;
