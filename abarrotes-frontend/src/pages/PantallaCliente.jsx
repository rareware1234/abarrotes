import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const PantallaCliente = () => {
  const [productos, setProductos] = useState([]);
  const [productoActual, setProductoActual] = useState(null);
  const [total, setTotal] = useState(0);
  const [animacion, setAnimacion] = useState(false);
  const [fechaHora, setFechaHora] = useState(new Date());
  const [config, setConfig] = useState({
    nombreEmpresa: 'Abarrotes Digitales',
    clabeInterbancaria: '044185002754631919',
    banco: 'BBVA'
  });

  // Escuchar productos del Dashboard
  useEffect(() => {
    // Cargar configuración
    const savedConfig = localStorage.getItem('sistemaConfig');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig({
        nombreEmpresa: parsed.nombreEmpresa || 'Abarrotes Digitales',
        clabeInterbancaria: parsed.clabeInterbancaria || '044185002754631919',
        banco: parsed.banco || 'BBVA'
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
      backgroundColor: '#1a1a2e', 
      minHeight: '100vh',
      color: 'white',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center px-5 py-3" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
        <div>
          <h2 className="mb-0 fw-bold" style={{ color: '#00d4ff' }}>
            <i className="bi bi-shop me-2"></i> {config.nombreEmpresa}
          </h2>
        </div>
        <div className="text-end">
          <div className="h4 mb-0" style={{ color: '#00d4ff' }}>
            {fechaHora.toLocaleDateString('es-MX', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="h3 mb-0 fw-bold">
            {formatTime(fechaHora)}
          </div>
        </div>
      </div>

      <div className="row g-0" style={{ minHeight: 'calc(100vh - 80px)' }}>
        {/* Columna Izquierda: Producto Actual */}
        <div className="col-md-8 d-flex align-items-center justify-content-center p-5">
          {productoActual ? (
            <div className={`text-center ${animacion ? 'animate-pop' : ''}`} style={{ animation: animacion ? 'pop 0.3s ease-out' : 'none' }}>
              {/* Imagen del Producto */}
              <div className="mb-4" style={{ 
                width: '300px', 
                height: '300px', 
                margin: '0 auto',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 0 40px rgba(0, 212, 255, 0.3)',
                backgroundColor: '#2a2a4a'
              }}>
                <img 
                  src={productoActual.imagen} 
                  alt={productoActual.nombre}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x300/2a2a4a/00d4ff?text=Producto';
                  }}
                />
              </div>
              
              {/* Nombre del Producto */}
              <h1 className="fw-bold mb-3" style={{ fontSize: '2.5rem', color: '#ffffff' }}>
                {productoActual.nombre}
              </h1>
              
              {/* Precio */}
              <div className="display-1 fw-bold" style={{ color: '#00ff88' }}>
                {formatCurrency(productoActual.precio)}
              </div>
              
              {/* Cantidad (si es mayor a 1) */}
              {productoActual.cantidad > 1 && (
                <div className="mt-3">
                  <span className="badge bg-warning text-dark fs-5 px-4 py-2">
                    Cantidad: {productoActual.cantidad}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <i className="bi bi-upc-scan display-1" style={{ color: '#444' }}></i>
              <p className="text-muted mt-3">Esperando productos...</p>
            </div>
          )}
        </div>

        {/* Columna Derecha: Resumen y QR */}
        <div className="col-md-4 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
          {/* Resumen de Compra */}
          <div className="card bg-dark border-secondary mb-4">
            <div className="card-header border-secondary" style={{ backgroundColor: '#006241' }}>
              <h5 className="mb-0">
                <i className="bi bi-receipt me-2"></i> Resumen de Compra
              </h5>
            </div>
            <div className="card-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <ul className="list-unstyled mb-0">
                {productos.map((item, index) => (
                  <li key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary">
                    <div>
                      <span className="fw-medium">{item.nombre}</span>
                      <br />
                      <small className="text-muted">x {item.cantidad}</small>
                    </div>
                    <span className="fw-bold" style={{ color: '#00ff88' }}>
                      {formatCurrency(item.subtotal)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-footer border-secondary" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
              <div className="d-flex justify-content-between align-items-center">
                <span className="fs-5">Total:</span>
                <span className="fs-2 fw-bold" style={{ color: '#00ff88' }}>
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          {/* QR para Transferencia */}
          <div className="card bg-dark border-secondary">
            <div className="card-header border-secondary" style={{ backgroundColor: '#006241' }}>
              <h6 className="mb-0">
                <i className="bi bi-qr-code me-2"></i> Paga con Transferencia
              </h6>
            </div>
            <div className="card-body text-center">
              <div className="p-3 bg-white rounded d-inline-block">
                <QRCodeCanvas 
                  value={config.clabeInterbancaria} 
                  size={150}
                  level={"H"}
                  includeMargin={true}
                />
              </div>
              <p className="mt-3 mb-1 small">
                <strong>CLABE:</strong> {config.clabeInterbancaria}
              </p>
              <p className="mb-0 small text-muted">
                {config.banco}
              </p>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="mt-4 text-center text-muted small">
            <p className="mb-1">
              <i className="bi bi-info-circle me-2"></i> Escanea los productos en la caja
            </p>
            <p className="mb-0">
              <i className="bi bi-phone me-2"></i> Muestra este QR para pagar
            </p>
          </div>
        </div>
      </div>

      {/* Animaciones */}
      <style>{`
        @keyframes pop {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
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
          background: #1a1a2e;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #006241;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #008855;
        }
      `}</style>
    </div>
  );
};

export default PantallaCliente;
