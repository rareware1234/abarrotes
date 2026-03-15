import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const PantallaCliente = () => {
  const [productos, setProductos] = useState([]);
  const [total, setTotal] = useState(0);
  const [fechaHora, setFechaHora] = useState(new Date());
  const [isWaiting, setIsWaiting] = useState(true);
  const [showThankYou, setShowThankYou] = useState(false);
  const [transferenciaInfo, setTransferenciaInfo] = useState(null); // Información de transferencia
  
  // Imagen de banner (walmart)
  const BANNER_URL = 'https://i.postimg.cc/XJVGftH1/walmart.jpg';
  
  const lastProcessedTimestamp = useRef('');
  const channelRef = useRef(null);

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

    setIsWaiting(false);
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

  // Función para leer de localStorage (usada en polling y al inicio)
  const leerDeLocalStorage = useCallback(() => {
    const dataStr = localStorage.getItem('cliente_pantalla');
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);
        if (data.type === 'product_scanned') {
          try {
            procesarProducto(data);
          } catch (error) {
            console.error('[PANTALLA CLIENTE] Error procesando producto:', error);
          } finally {
            localStorage.removeItem('cliente_pantalla');
          }
        } else if (data.type === 'nueva_venta') {
          try {
            limpiarPantalla();
          } catch (error) {
            console.error('[PANTALLA CLIENTE] Error limpiando pantalla:', error);
          } finally {
            localStorage.removeItem('cliente_pantalla');
          }
        } else if (data.type === 'venta_completada') {
          try {
            procesarVentaCompletada(data);
          } catch (error) {
            console.error('[PANTALLA CLIENTE] Error procesando venta completada:', error);
          } finally {
            localStorage.removeItem('cliente_pantalla');
          }
        } else if (data.type === 'clear_transferencia') {
          console.log('[PANTALLA CLIENTE] Recibida señal para limpiar transferencia');
          try {
            setTransferenciaInfo(null);
          } catch (error) {
            console.error('[PANTALLA CLIENTE] Error limpiando transferencia:', error);
          } finally {
            localStorage.removeItem('cliente_pantalla');
          }
        } else if (data.type === 'transferencia_info') {
          console.log('[PANTALLA CLIENTE] Recibida información de transferencia:', data);
          try {
            setTransferenciaInfo({
              clabe: data.clabe,
              banco: data.banco,
              beneficiario: data.beneficiario
            });
          } catch (error) {
            console.error('[PANTALLA CLIENTE] Error procesando transferencia:', error);
          } finally {
            localStorage.removeItem('cliente_pantalla');
          }
        }
      } catch (error) {
        console.error('[PANTALLA CLIENTE] Error parsing localStorage:', error);
      }
    }
  }, [procesarProducto, limpiarPantalla, procesarVentaCompletada]);

  useEffect(() => {
    console.log('[PANTALLA CLIENTE] Iniciando aplicación...');
    
    // 0. Limpiar datos residuales al iniciar para evitar estados fantasma
    localStorage.removeItem('cliente_pantalla');
    
    // 1. Intentar leer inmediatamente (en caso de que el dato ya esté ahí)
    // Nota: Después de limpiar, esto no hará nada, pero lo dejamos por si acaso
    leerDeLocalStorage();

    // 2. Configurar BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channelRef.current = new BroadcastChannel('pantalla_cliente');
        channelRef.current.onmessage = (event) => {
          console.log('[PANTALLA CLIENTE] BroadcastChannel mensaje recibido', event.data);
          
          try {
            if (event.data.type === 'product_scanned') {
              procesarProducto(event.data);
              localStorage.removeItem('cliente_pantalla'); // Sincronizar estado
            } else if (event.data.type === 'nueva_venta') {
              limpiarPantalla();
              localStorage.removeItem('cliente_pantalla');
            } else if (event.data.type === 'venta_completada') {
              procesarVentaCompletada(event.data);
              localStorage.removeItem('cliente_pantalla');
            } else if (event.data.type === 'clear_transferencia') {
              setTransferenciaInfo(null);
              localStorage.removeItem('cliente_pantalla');
            } else if (event.data.type === 'transferencia_info') {
              setTransferenciaInfo({
                clabe: event.data.clabe,
                banco: event.data.banco,
                beneficiario: event.data.beneficiario
              });
              localStorage.removeItem('cliente_pantalla');
            }
          } catch (error) {
            console.error('[PANTALLA CLIENTE] Error procesando mensaje BroadcastChannel:', error);
          }
        };
        console.log('[PANTALLA CLIENTE] BroadcastChannel ACTIVO');
      } catch (error) {
        console.error('[PANTALLA CLIENTE] Error BroadcastChannel:', error);
      }
    } else {
      console.warn('[PANTALLA CLIENTE] BroadcastChannel NO soportado');
    }

    // 3. Storage Event (backup para otras pestañas)
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
      if (channelRef.current) channelRef.current.close();
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
        <span>Estado: {debugInfo}</span>
        <span>Último: {lastAction}</span>
      </div> */}

      {/* Pantalla de Agradecimiento */}
      {showThankYou && (
        <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh', padding: '20px', backgroundColor: '#ffffff' }}>
          <img 
            src="/src/assets/logo.png" 
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
            src="/src/assets/logo.png" 
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
                src="/src/assets/logo.png" 
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
