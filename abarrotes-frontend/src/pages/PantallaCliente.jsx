import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const PantallaCliente = () => {
  const [productos, setProductos] = useState([]);
  const [total, setTotal] = useState(0);
  const [fechaHora, setFechaHora] = useState(new Date());
  const [isWaiting, setIsWaiting] = useState(true);
  const [showThankYou, setShowThankYou] = useState(false);
  const [transferenciaInfo, setTransferenciaInfo] = useState(null);
  const [currentPath, setCurrentPath] = useState('/');
  
  const BANNER_URL = '/banner.png';
  const BRAND_COLOR = '#0F4D2E';
  const BRAND_LIGHT = '#1A7A48';
  const lastProcessedTimestamp = useRef('');
  const currentPathRef = useRef('/');
  
  // Referencia para el intervalo de polling (estática para persistir entre montajes)
  if (!window.pantallaClienteInterval) {
    window.pantallaClienteInterval = null;
  }

  // Efecto para actualizar la fecha y hora cada segundo
  useEffect(() => {
    const intervalId = setInterval(() => {
      setFechaHora(new Date());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Efecto para leer la ruta actual desde localStorage
  useEffect(() => {
    const readPath = () => {
      const path = localStorage.getItem('dashboard_current_path') || '/';
      setCurrentPath(path);
      currentPathRef.current = path;
      console.log('[PANTALLA-DEBUG] Ruta actual leída:', path);
    };

    readPath();

    // Escuchar cambios en localStorage (cuando se cambia de ruta en otra pestaña)
    const handleStorageChange = (e) => {
      if (e.key === 'dashboard_current_path') {
        const newPath = e.newValue || '/';
        setCurrentPath(newPath);
        currentPathRef.current = newPath;
        console.log('[PANTALLA-DEBUG] Ruta actual actualizada por evento:', newPath);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Leer periódicamente la ruta para asegurar sincronización
    const pathInterval = setInterval(() => {
      const path = localStorage.getItem('dashboard_current_path') || '/';
      console.log('[PANTALLA-DEBUG] Polling de ruta:', path, 'Actual:', currentPathRef.current);
      if (path !== currentPathRef.current) {
        setCurrentPath(path);
        currentPathRef.current = path;
        console.log('[PANTALLA-DEBUG] Ruta actual actualizada por polling:', path);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pathInterval);
    };
  }, []);

  // Efecto para ajustar isWaiting basado en la cantidad de productos y ruta actual
  useEffect(() => {
    console.log('[PANTALLA-DEBUG] === EFFECT isWaiting ===');
    console.log('[PANTALLA-DEBUG] productos.length:', productos.length);
    console.log('[PANTALLA-DEBUG] showThankYou:', showThankYou);
    console.log('[PANTALLA-DEBUG] currentPath:', currentPath);
    console.log('[PANTALLA-DEBUG] currentPathRef:', currentPathRef.current);
    
    // Usar currentPathRef para la condición, pero normalizar para ignorar /pantalla-cliente
    const pathToCheck = currentPathRef.current || currentPath || '/';
    let normalizedPath = pathToCheck;
    
    // Normalizar ruta: si es /pantalla-cliente o vacía, tratar como /
    if (normalizedPath === '/pantalla-cliente' || normalizedPath === '' || normalizedPath === null || normalizedPath === undefined) {
      normalizedPath = '/';
    }
    
    console.log('[PANTALLA-DEBUG] Ruta normalizada para verificación:', normalizedPath);
    
    // Mostrar pantalla de bloqueo si:
    // 1. No hay productos Y no es la pantalla de agradecimiento, O
    // 2. No estamos en la ruta de venta (/)
    if ((productos.length === 0 && !showThankYou) || normalizedPath !== '/') {
      console.log('[PANTALLA-DEBUG] Condición: pantalla bloqueada (sin productos o fuera de venta)');
      setIsWaiting(true);
    } else {
      console.log('[PANTALLA-DEBUG] Condición: pantalla activa (hay productos y en venta)');
      setIsWaiting(false);
    }
    
    console.log('[PANTALLA-DEBUG] === FIN EFFECT isWaiting ===');
  }, [productos, showThankYou, currentPath]);

  // Función para procesar un mensaje
  const procesarMensaje = useCallback((data) => {
    console.log('[PANTALLA-DEBUG] === INICIO procesarMensaje ===');
    console.log('[PANTALLA-DEBUG] Datos recibidos:', JSON.stringify(data, null, 2));
    
    if (!data || !data.type) {
      console.log('[PANTALLA-DEBUG] ✗ Datos inválidos o sin tipo');
      return;
    }

    console.log('[PANTALLA-DEBUG] Tipo de mensaje:', data.type);

    switch (data.type) {
      case 'product_scanned':
        console.log('[PANTALLA-DEBUG] → Procesando producto escaneado');
        console.log('[PANTALLA-DEBUG] Producto:', JSON.stringify(data.product, null, 2));
        
        setProductos(prev => {
          console.log('[PANTALLA-DEBUG] Productos actuales:', prev.length);
          const existente = prev.find(p => p.id === data.product.id);
          let newProductos;
          
          if (existente) {
            console.log('[PANTALLA-DEBUG] Producto ya existe, incrementando cantidad');
            newProductos = prev.map(p => 
              p.id === data.product.id 
                ? { ...p, cantidad: p.cantidad + 1, subtotal: p.precio * (p.cantidad + 1) }
                : p
            );
          } else {
            console.log('[PANTALLA-DEBUG] Nuevo producto, agregando a la lista');
            newProductos = [...prev, { ...data.product, cantidad: 1, subtotal: data.product.precio }];
          }
          
          // Recalcular total desde cero para evitar inconsistencias
          const newTotal = newProductos.reduce((sum, item) => sum + item.subtotal, 0);
          console.log('[PANTALLA-DEBUG] Total recalculado:', newTotal);
          setTotal(newTotal);
          
          return newProductos;
        });
        
        setShowThankYou(false);
        console.log('[PANTALLA-DEBUG] showThankYou set to false');
        
        if (data.transferenciaInfo) {
          setTransferenciaInfo(data.transferenciaInfo);
          console.log('[PANTALLA-DEBUG] Transferencia info actualizada');
        } else {
          setTransferenciaInfo(null);
          console.log('[PANTALLA-DEBUG] Transferencia info limpiada');
        }
        break;

      case 'nueva_venta':
        console.log('[PANTALLA-DEBUG] → Procesando nueva venta');
        setProductos([]);
        setTotal(0);
        setIsWaiting(true);
        setShowThankYou(false);
        setTransferenciaInfo(null);
        console.log('[PANTALLA-DEBUG] Pantalla reseteada a estado de espera');
        break;

      case 'venta_completada':
        console.log('[PANTALLA-DEBUG] → Procesando venta completada');
        setProductos([]);
        setTotal(0);
        setShowThankYou(true);
        console.log('[PANTALLA-DEBUG] showThankYou set to true');
        setTimeout(() => {
          setShowThankYou(false);
          console.log('[PANTALLA-DEBUG] showThankYou set to false después de 5s');
        }, 5000);
        break;

      case 'clear_transferencia':
        console.log('[PANTALLA-DEBUG] → Limpiando transferencia');
        setTransferenciaInfo(null);
        break;

      case 'transferencia_info':
        console.log('[PANTALLA-DEBUG] → Actualizando info de transferencia');
        setTransferenciaInfo({
          clabe: data.clabe,
          banco: data.banco,
          beneficiario: data.beneficiario
        });
        break;
        
      case 'actualizar_carrito':
        console.log('[PANTALLA-DEBUG] → Actualizando carrito completo');
        console.log('[PANTALLA-DEBUG] Productos recibidos:', data.productos.length);
        
        // Calcular subtotales y total
        const productosActualizados = data.productos.map(product => ({
          ...product,
          subtotal: product.precio * product.cantidad
        }));
        
        const nuevoTotal = productosActualizados.reduce((sum, item) => sum + item.subtotal, 0);
        
        setProductos(productosActualizados);
        setTotal(nuevoTotal);
        setIsWaiting(false);
        setShowThankYou(false);
        
        console.log('[PANTALLA-DEBUG] Carrito actualizado. Total:', nuevoTotal);
        break;
    }
    
    console.log('[PANTALLA-DEBUG] === FIN procesarMensaje ===');
  }, []);

  // Efecto principal para configurar BroadcastChannel y Polling
  useEffect(() => {
    console.log('[PANTALLA-DEBUG] === INICIO EFFECT CONFIGURACIÓN ===');
    console.log('[PANTALLA-DEBUG] Montando componente PantallaCliente...');

    // Función para leer de localStorage
    const leerDeLocalStorage = () => {
      const dataStr = localStorage.getItem('cliente_pantalla');
      if (dataStr) {
        try {
          const data = JSON.parse(dataStr);
          
          // Verificar si ya procesamos este timestamp
          if (data.timestamp && data.timestamp === lastProcessedTimestamp.current) {
            return; // Ya procesado
          }
          
          console.log('[PANTALLA-DEBUG] Mensaje nuevo encontrado en localStorage:', data.type);
          lastProcessedTimestamp.current = data.timestamp;
          procesarMensaje(data);
          
          // Limpiar el mensaje procesado
          localStorage.removeItem('cliente_pantalla');
          console.log('[PANTALLA-DEBUG] Mensaje eliminado de localStorage');
        } catch (error) {
          console.error('[PANTALLA-DEBUG] Error procesando mensaje de localStorage:', error);
        }
      }
    };

    // Configurar BroadcastChannel
    let channel = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('pantalla_cliente');
        channel.onmessage = (event) => {
          console.log('[PANTALLA-DEBUG] === MENSAJE POR BROADCASTCHANNEL ===');
          console.log('[PANTALLA-DEBUG] Timestamp recibido:', event.data.timestamp);
          console.log('[PANTALLA-DEBUG] Timestamp último procesado:', lastProcessedTimestamp.current);
          console.log('[PANTALLA-DEBUG] Tipo:', event.data.type);
          
          // Verificar timestamp para evitar duplicados
          if (event.data.timestamp && event.data.timestamp === lastProcessedTimestamp.current) {
            console.log('[PANTALLA-DEBUG] Mensaje duplicado por BroadcastChannel, ignorando');
            return;
          }
          
          lastProcessedTimestamp.current = event.data.timestamp;
          procesarMensaje(event.data);
          
          // Intentar limpiar de localStorage si llega por BroadcastChannel
          // (aunque probablemente ya no esté ahí si fue leído antes)
          localStorage.removeItem('cliente_pantalla');
        };
        console.log('[PANTALLA-DEBUG] ✓ BroadcastChannel configurado exitosamente');
      } catch (error) {
        console.error('[PANTALLA-DEBUG] ✗ Error configurando BroadcastChannel:', error);
      }
    } else {
      console.warn('[PANTALLA-DEBUG] ⚠ BroadcastChannel no disponible');
    }

    // Iniciar Polling de localStorage (cada 500ms) si no existe ya
    if (!window.pantallaClienteInterval) {
      console.log('[PANTALLA-DEBUG] Iniciando polling de localStorage...');
      window.pantallaClienteInterval = setInterval(leerDeLocalStorage, 500);
    }

    // Leer inmediatamente al montar
    leerDeLocalStorage();

    // Cleanup
    return () => {
      console.log('[PANTALLA-DEBUG] === CLEANUP EFFECT ===');
      if (channel) {
        channel.close();
        console.log('[PANTALLA-DEBUG] BroadcastChannel cerrado');
      }
      // No limpiamos el intervalo aquí para evitar que se detenga en Strict Mode
      // Se limpiará cuando se cierre la pestaña o se desmonte permanentemente
    };
  }, [procesarMensaje]);

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
      backgroundColor: showThankYou ? '#ffffff' : (isWaiting ? BRAND_COLOR : '#ffffff'), 
      minHeight: '100vh',
      color: showThankYou ? '#333' : (isWaiting ? 'white' : '#333'),
      overflow: 'hidden',
      fontFamily: "'Roboto', sans-serif"
    }}>
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
          <h1 className="fw-bold" style={{ fontSize: '4rem', marginTop: '20px', color: BRAND_LIGHT }}>¡Gracias por tu compra!</h1>
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
              filter: 'brightness(0) invert(1) drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
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
          <div className="d-flex justify-content-between align-items-center px-5 py-3 shadow-sm" style={{ backgroundColor: BRAND_COLOR }}>
            <div className="text-start">
              <img
                src="/logo-blanco.png"
                alt="Logo"
                style={{
                  height: '28px',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
            </div>
            <div className="text-end">
              <div className="h5 mb-0" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                {fechaHora.toLocaleDateString('es-MX', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </div>
              <div className="h4 mb-0 fw-bold" style={{ color: 'white', fontFamily: 'monospace' }}>
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
                  <h4 className="mb-4" style={{ color: BRAND_LIGHT }}>Escanea para transferir</h4>
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
                  backgroundColor: BRAND_COLOR,
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
                <div className="card-header" style={{ backgroundColor: BRAND_COLOR, color: 'white', borderTopLeftRadius: '14px', borderTopRightRadius: '14px' }}>
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
                        <span className="fw-bold" style={{ color: BRAND_LIGHT }}>
                          {formatCurrency(item.subtotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card-footer bg-light" style={{ borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fs-5">Total:</span>
                    <span className="fs-2 fw-bold" style={{ color: BRAND_LIGHT }}>
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PantallaCliente;