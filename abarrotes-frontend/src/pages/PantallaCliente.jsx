import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode/react';

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

  // Banners de ofertas simulados
  const ofertas = [
    {
      id: 1,
      titulo: 'LUNES DE DESCUENTOS',
      subtitulo: 'Leche Lala 1L',
      precioNormal: '$25.00',
      precioOferta: '$20.00',
      imagen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/White_Milk.jpg/1200px-White_Milk.jpg',
      color: '#ff6b6b'
    },
    {
      id: 2,
      titulo: 'OFERTA DE LA SEMANA',
      subtitulo: 'Pan Bimbo 650g',
      precioNormal: '$28.00',
      precioOferta: '$24.00',
      imagen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/White_bread.jpg/1200px-White_bread.jpg',
      color: '#4ecdc4'
    },
    {
      id: 3,
      titulo: 'MEJORA TU DESAYUNO',
      subtitulo: 'Huevos Carta x12',
      precioNormal: '$36.00',
      precioOferta: '$32.00',
      imagen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Egg_sandbox.jpg/1200px-Egg_sandbox.jpg',
      color: '#ffe66d'
    },
    {
      id: 4,
      titulo: 'PROMOCIÓN ESPECIAL',
      subtitulo: 'Aceite Vegetal 1L',
      precioNormal: '$42.00',
      precioOferta: '$38.00',
      imagen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Olive_oil.jpg/1200px-Olive_oil.jpg',
      color: '#95e1d3'
    }
  ];

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
      backgroundColor: '#f8f9fa', 
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

      {/* Banners de Ofertas */}
      <div className="row g-0 mb-4" style={{ backgroundColor: '#ffffff', padding: '20px 0' }}>
        <div className="col-12">
          <div className="d-flex overflow-auto" style={{ scrollSnapType: 'x mandatory', gap: '20px', padding: '0 20px' }}>
            {ofertas.map((oferta, index) => (
              <div 
                key={oferta.id} 
                className="card flex-shrink-0" 
                style={{ 
                  width: '350px', 
                  scrollSnapAlign: 'start',
                  borderRadius: '15px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  border: 'none'
                }}
              >
                <div style={{ 
                  backgroundColor: oferta.color, 
                  padding: '15px',
                  textAlign: 'center',
                  color: 'white'
                }}>
                  <h5 className="mb-0 fw-bold">{oferta.titulo}</h5>
                </div>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <img 
                      src={oferta.imagen} 
                      alt={oferta.subtitulo}
                      style={{ 
                        width: '80px', 
                        height: '80px', 
                        objectFit: 'cover',
                        borderRadius: '10px',
                        marginRight: '15px'
                      }}
                    />
                    <div>
                      <h6 className="mb-1 fw-bold">{oferta.subtitulo}</h6>
                      <div>
                        <span className="text-muted text-decoration-line-through me-2">
                          {oferta.precioNormal}
                        </span>
                        <span className="fw-bold text-danger fs-5">
                          {oferta.precioOferta}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row g-0" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Columna Izquierda: Producto Actual */}
        <div className="col-md-8 d-flex align-items-center justify-content-center p-5" style={{ backgroundColor: '#ffffff' }}>
          {productoActual ? (
            <div className={`text-center ${animacion ? 'animate-pop' : ''}`} style={{ animation: animacion ? 'pop 0.3s ease-out' : 'none' }}>
              {/* Imagen del Producto */}
              <div className="mb-4" style={{ 
                width: '280px', 
                height: '280px', 
                margin: '0 auto',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                backgroundColor: '#f8f9fa',
                border: '3px solid #e9ecef'
              }}>
                <img 
                  src={productoActual.imagen} 
                  alt={productoActual.nombre}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    padding: '20px'
                  }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/280x280/f8f9fa/666?text=Producto';
                  }}
                />
              </div>
              
              {/* Nombre del Producto */}
              <h2 className="fw-bold mb-2" style={{ fontSize: '1.8rem', color: '#333' }}>
                {productoActual.nombre}
              </h2>
              
              {/* Precio */}
              <div className="display-4 fw-bold" style={{ color: '#006241' }}>
                {formatCurrency(productoActual.precio)}
              </div>
              
              {/* Cantidad (si es mayor a 1) */}
              {productoActual.cantidad > 1 && (
                <div className="mt-3">
                  <span className="badge bg-success fs-6 px-4 py-2">
                    Cantidad: {productoActual.cantidad}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <i className="bi bi-upc-scan display-1 text-muted"></i>
              <p className="text-muted mt-3 fs-5">Escanea un producto para verlo aquí</p>
            </div>
          )}
        </div>

        {/* Columna Derecha: Resumen y QR */}
        <div className="col-md-4 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          {/* Resumen de Compra */}
          <div className="card mb-4 shadow-sm" style={{ borderRadius: '15px', border: 'none' }}>
            <div className="card-header" style={{ backgroundColor: '#006241', color: 'white', borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
              <h5 className="mb-0">
                <i className="bi bi-receipt me-2"></i> Resumen de Compra
              </h5>
            </div>
            <div className="card-body" style={{ maxHeight: '250px', overflowY: 'auto' }}>
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

          {/* QR para Transferencia */}
          <div className="card shadow-sm" style={{ borderRadius: '15px', border: 'none' }}>
            <div className="card-header" style={{ backgroundColor: '#006241', color: 'white', borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
              <h6 className="mb-0">
                <i className="bi bi-qr-code me-2"></i> Paga con Transferencia
              </h6>
            </div>
            <div className="card-body text-center">
              <div className="p-3 bg-white rounded d-inline-block" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <QRCodeCanvas 
                  value={config.clabeInterbancaria} 
                  size={120}
                  level={"H"}
                  includeMargin={true}
                />
              </div>
              <p className="mt-3 mb-1">
                <strong>CLABE:</strong> {config.clabeInterbancaria}
              </p>
              <p className="mb-0 text-muted">
                {config.banco}
              </p>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="mt-4 text-center text-muted">
            <p className="mb-1">
              <i className="bi bi-info-circle me-2"></i> Escanea los productos en la caja
            </p>
            <p className="mb-0">
              <i className="bi bi-phone me-2"></i> Muestra el QR para pagar
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
          height: 8px;
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
        
        /* Banners de ofertas */
        .card:hover {
          transform: translateY(-5px);
          transition: transform 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default PantallaCliente;
