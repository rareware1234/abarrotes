import { useState, useEffect, useCallback, useRef } from 'react';

// Hook personalizado para manejar la lógica del cliente
export const useCliente = () => {
  const [productos, setProductos] = useState([]);
  const [isWaiting, setIsWaiting] = useState(true);
  const [transferenciaInfo, setTransferenciaInfo] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);
  
  const lastProcessedTimestamp = useRef('');
  const intervalRef = useRef(null);

  // Función para leer de localStorage (sin dependencias externas)
  const leerDeLocalStorage = useCallback(() => {
    try {
      const dataStr = localStorage.getItem('cliente_pantalla');
      if (!dataStr) return;

      console.log('[HOOK CLIENTE] Mensaje encontrado en localStorage');
      const data = JSON.parse(dataStr);

      // Evitar duplicados basados en timestamp
      if (data.timestamp && data.timestamp === lastProcessedTimestamp.current) {
        return;
      }
      lastProcessedTimestamp.current = data.timestamp;

      // Procesar según el tipo de mensaje
      switch (data.type) {
        case 'product_scanned':
          if (data.product) {
            console.log('[HOOK CLIENTE] Agregando producto:', data.product.nombre);
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
            setIsWaiting(false);
            setShowThankYou(false);
          }
          break;
        case 'nueva_venta':
          console.log('[HOOK CLIENTE] Limpiando pantalla');
          setProductos([]);
          setIsWaiting(true);
          setShowThankYou(false);
          setTransferenciaInfo(null);
          break;
        case 'venta_completada':
          console.log('[HOOK CLIENTE] Procesando venta completada');
          setShowThankYou(true);
          setIsWaiting(false);
          setTimeout(() => {
            setProductos([]);
            setIsWaiting(true);
            setShowThankYou(false);
          }, 5000);
          break;
        case 'clear_transferencia':
          setTransferenciaInfo(null);
          break;
        case 'transferencia_info':
          setTransferenciaInfo({
            clabe: data.clabe,
            banco: data.banco,
            beneficiario: data.beneficiario
          });
          break;
        default:
          console.log('[HOOK CLIENTE] Tipo de mensaje no reconocido:', data.type);
      }

      // Limpiar después de procesar
      localStorage.removeItem('cliente_pantalla');
      console.log('[HOOK CLIENTE] localStorage limpiado');
    } catch (error) {
      console.error('[HOOK CLIENTE] Error procesando mensaje:', error);
    }
  }, []); // Sin dependencias

  // Iniciar polling una sola vez (sin dependencias)
  useEffect(() => {
    if (!intervalRef.current) {
      console.log('[HOOK CLIENTE] Iniciando polling...');
      intervalRef.current = setInterval(leerDeLocalStorage, 100);
    }

    return () => {
      // No limpiar el intervalo al desmontar para mantener la conexión
      // if (intervalRef.current) {
      //   clearInterval(intervalRef.current);
      //   intervalRef.current = null;
      // }
    };
  }, []); // Array vacío de dependencias

  // Calcular total
  const total = productos.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    productos,
    isWaiting,
    transferenciaInfo,
    showThankYou,
    total
  };
};