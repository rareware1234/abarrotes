import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

// Singleton para el canal de comunicación que sobrevive a re-renders
let globalChannel = null;
let globalChannelRefcount = 0;

const PantallaCliente = () => {
  console.log('[PANTALLA CLIENTE] Renderizando componente...');
  
  const [productos, setProductos] = useState([]);
  const [total, setTotal] = useState(0);
  const [fechaHora, setFechaHora] = useState(new Date());
  const [isWaiting, setIsWaiting] = useState(true);
  const [showThankYou, setShowThankYou] = useState(false);
  const [transferenciaInfo, setTransferenciaInfo] = useState(null); // Información de transferencia
  
  // Imagen de banner (walmart)
  const BANNER_URL = 'https://i.postimg.cc/XJVGftH1/walmart.jpg';
  
  const lastProcessedTimestamp = useRef('');

  // Función para limpiar la pantalla (Nueva Venta)
  const limpiarPantalla = useCallback(() => {
    console.log('[PANTALLA CLIENTE] Limpiando pantalla para nueva venta');
    setProductos([]);
    setTotal(0);
    setIsWaiting(true); // Volver a pantalla de espera
    setShowThankYou(false); // Ocultar mensaje de agradecimiento
    setTransferenciaInfo(null); // Limpiar información de transferencia
  }, []);

  // Función centralizada para procesar datos
  const procesarProducto = useCallback((data) => {
    console.log('[PANTALLA CLIENTE] Intentando procesar:', data);
    
    if (!data || !data.product) {
        console.warn('[PANTALLA CLIENTE] Datos inválidos recibidos');
        return;
    }

    // Evitar duplicados basado en timestamp
    if (data.timestamp && data.timestamp === lastProcessedTimestamp.current) {
      console.log('[PANTALLA CLIENTE] Duplicado detectado, ignorando');
      return;
    }
    
    lastProcessedTimestamp.current = data.timestamp;
    console.log('[PANTALLA CLIENTE] Procesando producto:', data.product.nombre);

    setShowThankYou(false); // Asegurar que no se muestre el mensaje de gracias

    // Actualizar información de transferencia si está presente
    if (data.transferenciaInfo) {
      console.log('[PANTALLA CLIENTE] Recibida información de transferencia:', data.transferenciaInfo);
      setTransferenciaInfo(data.transferenciaInfo);
    } else {
      // Limpiar información de transferencia si no está presente
      console.log('[PANTALLA CLIENTE] Limpiando información de transferencia');
      setTransferenciaInfo(null);
    }
    console.log('[PANTALLA CLIENTE] Estado transferenciaInfo actualizado');

    setProductos(prev => {
      const existente = prev.find(p => p.id === data.product.id);
      if (existente) {
        return prev.map(p => 
          p.id === data.product.id 
            ? { ...p, cantidad: p.cantidad + 1, subtotal: p.precio * (p.cantidad + 1) }
            : p
        );
      } else {
        return [...prev, { ...data.product, cantidad: 1, subtotal: data.product.precio }];
      }
    });

    setTotal(prev => prev + data.product.precio);
  }, []);

  // Función para procesar venta completada
  const procesarVentaCompletada = useCallback((data) => {
    console.log('[PANTALLA CLIENTE] Procesando venta completada');
    
    // Evitar duplicados basado en timestamp
    if (data.timestamp && data.timestamp === lastProcessedTimestamp.current) {
      console.log('[PANTALLA CLIENTE] Duplicado detectado, ignorando');
      return;
    }
    
    lastProcessedTimestamp.current = data.timestamp;
    
    // Limpiar carrito y mostrar mensaje de agradecimiento
    setProductos([]);
    setTotal(0);
    setShowThankYou(true);
    
    // Ocultar mensaje de agradecimiento después de 5 segundos
    if (window.thankYouTimeout) clearTimeout(window.thankYouTimeout);
    window.thankYouTimeout = setTimeout(() => {
      setShowThankYou(false);
      // El efecto de productos ajustará isWaiting automáticamente
    }, 5000);
  }, []);

  // Función para leer de localStorage y sessionStorage (usada en polling y al inicio)
  const leerDeLocalStorage = useCallback(() => {
    // Intentar leer de localStorage primero, luego de sessionStorage
    let dataStr = localStorage.getItem('cliente_pantalla');
    if (!dataStr) {
      dataStr = sessionStorage.getItem('cliente_pantalla');
    }
    
    if (!dataStr) return;
    
    try {
      const data = JSON.parse(dataStr);
      
      // Verificar si ya procesamos este timestamp
      if (data.timestamp && data.timestamp === lastProcessedTimestamp.current) {
        console.log('[PANTALLA CLIENTE] Mensaje ya procesado, ignorando');
        return;
      }
      
      console.log('[PANTALLA CLIENTE] Procesando mensaje:', data.type);
      
      if (data.type === 'product_scanned') {
        try {
          procesarProducto(data);
          // Eliminar de ambos storage
          localStorage.removeItem('cliente_pantalla');
          sessionStorage.removeItem('cliente_pantalla');
        } catch (error) {
          console.error('[PANTALLA CLIENTE] Error procesando producto:', error);
        }
      } else if (data.type === 'nueva_venta') {
        try {
          limpiarPantalla();
          localStorage.removeItem('cliente_pantalla');
          sessionStorage.removeItem('cliente_pantalla');
        } catch (error) {
          console.error('[PANTALLA CLIENTE] Error limpiando pantalla:', error);
        }
      } else if (data.type === 'venta_completada') {
        try {
          procesarVentaCompletada(data);
          localStorage.removeItem('cliente_pantalla');
          sessionStorage.removeItem('cliente_pantalla');
        } catch (error) {
          console.error('[PANTALLA CLIENTE] Error procesando venta completada:', error);
        }
      } else if (data.type === 'clear_transferencia') {
        console.log('[PANTALLA CLIENTE] Recibida señal para limpiar transferencia');
        try {
          setTransferenciaInfo(null);
          localStorage.removeItem('cliente_pantalla');
          sessionStorage.removeItem('cliente_pantalla');
        } catch (error) {
          console.error('[PANTALLA CLIENTE] Error limpiando transferencia:', error);
        }
      } else if (data.type === 'transferencia_info') {
        console.log('[PANTALLA CLIENTE] Recibida información de transferencia:', data);
        try {
          setTransferenciaInfo({
            clabe: data.clabe,
            banco: data.banco,
            beneficiario: data.beneficiario
          });
          localStorage.removeItem('cliente_pantalla');
          sessionStorage.removeItem('cliente_pantalla');
        } catch (error) {
          console.error('[PANTALLA CLIENTE] Error procesando transferencia:', error);
        }
      }
    } catch (error) {
      console.error('[PANTALLA CLIENTE] Error parsing data:', error);
    }
  }, [procesarProducto, limpiarPantalla, procesarVentaCompletada]);

  // Efecto para configurar BroadcastChannel una sola vez
  useEffect(() => {
    console.log('[PANTALLA CLIENTE] Configurando BroadcastChannel...');
    
    globalChannelRefcount++;
    
    if (!globalChannel && typeof BroadcastChannel !== 'undefined') {
      try {
        globalChannel = new BroadcastChannel('pantalla_cliente');
        console.log('[PANTALLA CLIENTE] BroadcastChannel creado globalmente');
      } catch (error) {
        console.error('[PANTALLA CLIENTE] Error creando BroadcastChannel:', error);
      }
    }
    
    // Leer mensajes pendientes al iniciar
    leerDeLocalStorage();
    
    // Cleanup
    return () => {
      globalChannelRefcount--;
      if (globalChannelRefcount === 0 && globalChannel) {
        globalChannel.close();
        globalChannel = null;
        console.log('[PANTALLA CLIENTE] BroadcastChannel cerrado (último componente)');
      }
    };
  }, []); // Empty dependency array - run only once
  
  // Efecto para escuchar mensajes del canal
  useEffect(() => {
    if (!globalChannel) return;
    
    const handleMessage = (event) => {
      console.log('[PANTALLA CLIENTE] BroadcastChannel mensaje recibido:', event.data.type);
      
      try {
        if (event.data.type === 'product_scanned') {
          procesarProducto(event.data);
        } else if (event.data.type === 'nueva_venta') {
          limpiarPantalla();
        } else if (event.data.type === 'venta_completada') {
          procesarVentaCompletada(event.data);
        } else if (event.data.type === 'clear_transferencia') {
          setTransferenciaInfo(null);
        } else if (event.data.type === 'transferencia_info') {
          setTransferenciaInfo({
            clabe: event.data.clabe,
            banco: event.data.banco,
            beneficiario: event.data.beneficiario
          });
        }
      } catch (error) {
        console.error('[PANTALLA CLIENTE] Error procesando mensaje:', error);
      }
    };
    
    globalChannel.addEventListener('message', handleMessage);
    console.log('[PANTALLA CLIENTE] Escuchando BroadcastChannel');
    
    return () => {
      if (globalChannel) {
        globalChannel.removeEventListener('message', handleMessage);
      }
    };
  }, [procesarProducto, limpiarPantalla, procesarVentaCompletada]);
  
  // Efecto para leer de localStorage (polling)
  useEffect(() => {
    console.log('[PANTALLA CLIENTE] Iniciando polling...');
    
    // 1. Intentar leer inmediatamente (en caso de que el dato ya esté ahí)
    // Nota: Después de limpiar, esto no hará nada, pero lo dejamos por si acaso
    leerDeLocalStorage();

    // 2. Storage Event (backup para otras pestañas)
    const handleStorageChange = (e) => {
      if (e.key === 'cliente_pantalla' && e.newValue) {
        console.log('[PANTALLA CLIENTE] Storage event disparado');
        leerDeLocalStorage();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 4. Polling de respaldo (si BroadcastChannel falla o no está disponible)
    const intervalId = setInterval(() => {
        leerDeLocalStorage();
    }, 300); // Polling cada 300ms para actualizaciones rápidas

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
      if (window.thankYouTimeout) clearTimeout(window.thankYouTimeout);
    };
  }, [leerDeLocalStorage, procesarProducto]);

  // Efecto para depurar cambios en transferenciaInfo
  useEffect(() => {
    console.log('[PANTALLA CLIENTE] transferenciaInfo cambió a:', transferenciaInfo);
  }, [transferenciaInfo]);

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

  // Efecto para actualizar la fecha y hora cada segundo
  useEffect(() => {
    const intervalId = setInterval(() => {
      setFechaHora(new Date());
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Efecto para ajustar isWaiting basado en la cantidad de productos
  useEffect(() => {
    if (productos.length === 0 && !showThankYou) {
      setIsWaiting(true);
    } else {
      setIsWaiting(false);
    }
  }, [productos, showThankYou]);

  return (
    <div className="container-fluid p-0" style={{ 
      backgroundColor: showThankYou ? '#ffffff' : (isWaiting ? '#006241' : '#ffffff'), 
      minHeight: '100vh',
      color: showThankYou ? '#333' : (isWaiting ? 'white' : '#333'),
      overflow: 'hidden'
    }}>
      {/* Panel de Depuración Visual (Oculto en producción) */}
      {/* <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: '#333',
        color: '#0f0',
        fontSize: '12px',
        padding: '5px 10px',
        fontFamily: 'monospace',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>Estado: {(isWaiting ? 'Esperando' : 'Activo')}</span>
        <span>Productos: {productos.length}</span>
      </div> */}

      {/* Pantalla de Agradecimiento */}
      {showThankYou && (
        <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh', padding: '20px', backgroundColor: '#ffffff' }}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ 
              width: '60%', 
              maxWidth: '500px', 
              height: 'auto', 
              marginBottom: '30px',
              objectFit: 'contain'
            }}
          />
          <h1 className="fw-bold" style={{ fontSize: '4rem', marginTop: '20px', color: '#006241' }}>¡Gracias por tu compra!</h1>
          <p className="mt-2" style={{ fontSize: '1.5rem', opacity: 0.8 }}>Esperamos verte pronto nuevamente.</p>
        </div>
      )}

      {/* Pantalla de Espera */}
      {!showThankYou && isWaiting && (
        <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh', padding: '20px' }}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ 
              width: '80%', 
              maxWidth: '700px', 
              height: 'auto', 
              marginBottom: '30px', 
              filter: 'brightness(0) invert(1)',
              objectFit: 'contain'
            }}
          />
          <h1 className="fw-bold" style={{ fontSize: '4rem', marginTop: '20px' }}>Bienvenido</h1>
          <p className="mt-2" style={{ fontSize: '1.5rem', opacity: 0.8 }}>Esperando productos...</p>
        </div>
      )}

      {/* Pantalla Activa */}
      {!showThankYou && !isWaiting && (
        <>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center px-5 py-3 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
            <div className="d-flex align-items-center">
               <img 
                src="/logo.png" 
                alt="Logo" 
                style={{ height: '50px', marginRight: '15px', filter: 'brightness(0)' }}
              />
              <h2 className="mb-0 fw-bold" style={{ color: '#006241' }}>
                Abarrotes Digitales
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
            {/* Columna Izquierda: Banner o Código QR */}
            <div className="col-md-6 d-flex align-items-center justify-content-center p-4" style={{ backgroundColor: '#ffffff' }}>
              {transferenciaInfo ? (
                // Mostrar código QR para transferencia
                <div className="text-center">
                  <h4 className="mb-4" style={{ color: '#006241' }}>Escanea para transferir</h4>
                  <div className="p-3 bg-white rounded shadow-sm d-inline-block">
                    <QRCodeCanvas 
                      value={`https://pay.conekta.io/link/${transferenciaInfo.clabe}`} 
                      size={250}
                      level={"H"}
                      includeMargin={true}
                    />
                  </div>
                  <div className="mt-4 text-start">
                    <p className="mb-1"><strong>CLABE:</strong> {transferenciaInfo.clabe}</p>
                    <p className="mb-1"><strong>Banco:</strong> {transferenciaInfo.banco}</p>
                    <p className="mb-0"><strong>Beneficiario:</strong> {transferenciaInfo.beneficiario}</p>
                  </div>
                </div>
              ) : (
                // Mostrar banner normal
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
                  <img 
                    src={BANNER_URL} 
                    alt="Banner promocional"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Columna Derecha: Resumen */}
            <div className="col-md-6 p-4" style={{ backgroundColor: '#f8f9fa' }}>
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

              <div className="text-center text-muted">
                <p className="mb-1">
                  <i className="bi bi-info-circle me-2"></i> Escanea los productos en la caja
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PantallaCliente;
