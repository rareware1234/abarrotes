import React, { createContext, useState, useContext, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase.js';
import { getActivaId } from '../lib/empresaActiva';
import { stockEn } from '../lib/stock';

// Redondeo de cambio en efectivo a incrementos de $0.05 (biblia §9).
const redondear05 = (v) => Math.round((v || 0) / 0.05) * 0.05;

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN' 
  }).format(amount);
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [promocionesActivas, setPromocionesActivas] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(true);

  useEffect(() => {
    cargarPromociones();
  }, []);

  const cargarPromociones = async () => {
    try {
      const promosRef = collection(db, 'promociones');
      const q = query(promosRef, where('activa', '==', true));
      const snapshot = await getDocs(q);
      
      const promos = [];
      const hoy = new Date();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const inicio = data.fechaInicio?.toDate ? data.fechaInicio.toDate() : new Date(data.fechaInicio);
        const fin = data.fechaFin?.toDate ? data.fechaFin.toDate() : new Date(data.fechaFin);
        
        if (inicio <= hoy && hoy <= fin) {
          promos.push({ id: doc.id, ...data });
        }
      });
      
      setPromocionesActivas(promos);
    } catch (error) {
      console.error('Error cargando promociones:', error);
    } finally {
      setLoadingPromos(false);
    }
  };

  const calcularDescuento = (item, promos) => {
    if (!promos || promos.length === 0) return item.precio;
    
    let precioFinal = item.precio;
    
    for (const promo of promos) {
      if (promo.tipo === 'descuento_porcentaje') {
        const aplica = promo.productos?.includes(item.id) || 
                       promo.categorias?.includes(item.categoria);
        if (aplica) {
          precioFinal = precioFinal * (1 - promo.valor / 100);
        }
      } else if (promo.tipo === 'precio_especial') {
        const aplica = promo.productos?.includes(item.id);
        if (aplica && promo.precioEspecial < precioFinal) {
          precioFinal = promo.precioEspecial;
        }
      } else if (promo.tipo === 'nxm') {
        const aplica = promo.productos?.includes(item.id);
        if (aplica && item.cantidad >= promo.lleva) {
          const pagar = Math.floor(item.cantidad / promo.lleva) * promo.paga + 
                        (item.cantidad % promo.lleva);
          precioFinal = (precioFinal / item.cantidad) * pagar;
        }
      }
    }
    
    return Math.round(precioFinal * 100) / 100;
  };

  const add = (producto, tiendaId = null) => {
    return new Promise((resolve) => {
      // Stock disponible por tienda (biblia §3.1). Si no se pasa tiendaId,
      // cae al stock legacy — retrocompatible con llamadas existentes.
      const disponible = stockEn(producto, tiendaId ?? producto.tiendaId);
      const stockMin = producto.stockMinimo || 5;
      setItems(prev => {
        const existente = prev.find(item => item.id === producto.id);

        if (existente) {
          const nuevoStock = existente.cantidad + 1;
          if (nuevoStock > disponible) {
            resolve({ resultado: 'sinStock', restante: 0 });
            return prev;
          }
          if (nuevoStock >= stockMin) {
            resolve({ resultado: 'added', restante: disponible - nuevoStock });
          } else {
            resolve({ resultado: 'stockBajo', restante: disponible - nuevoStock });
          }

          return prev.map(item =>
            item.id === producto.id
              ? { ...item, cantidad: nuevoStock, precioFinal: calcularDescuento({...item, cantidad: nuevoStock}, promocionesActivas) }
              : item
          );
        }

        if (disponible <= 0) {
          resolve({ resultado: 'sinStock', restante: 0 });
          return prev;
        }

        const nuevoItem = {
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precioVenta,
          precioOriginal: producto.precioVenta,
          cantidad: 1,
          stock: disponible,
          stockMinimo: stockMin,
          codigo: producto.codigo,
          categoria: producto.categoria,
          imagen: producto.imagen
        };

        nuevoItem.precioFinal = calcularDescuento(nuevoItem, promocionesActivas);

        if (disponible >= stockMin) {
          resolve({ resultado: 'added', restante: disponible - 1 });
        } else {
          resolve({ resultado: 'stockBajo', restante: disponible - 1 });
        }

        return [...prev, nuevoItem];
      });
    });
  };

  const updateQuantity = (id, cantidad) => {
    setItems(prev => {
      if (cantidad <= 0) {
        return prev.filter(item => item.id !== id);
      }
      
      return prev.map(item => {
        if (item.id === id) {
          if (cantidad > item.stock) {
            return item;
          }
          return { 
            ...item, 
            cantidad,
            precioFinal: calcularDescuento({...item, cantidad}, promocionesActivas)
          };
        }
        return item;
      });
    });
  };

  const remove = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clear = () => {
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => {
    const precio = item.precioFinal || item.precio;
    return sum + (precio * item.cantidad);
  }, 0);

  const iva = subtotal * 0.16;
  const total = subtotal + iva;
  const itemCount = items.reduce((sum, item) => sum + item.cantidad, 0);
  const isEmpty = items.length === 0;

  const toOrden = (empleadoId, metodoPago, efectivoRecibido) => {
    // OrdenItem canónico (ver SCHEMA.md): id, codigo, nombre, precioUnitario,
    // precioOriginal, cantidad, imagenUrl?, categoria?
    const productos = items.map(item => ({
      id: item.id,
      codigo: item.codigo || '',
      nombre: item.nombre,
      precioUnitario: item.precio,
      precioOriginal: item.precioOriginal || item.precio,
      cantidad: item.cantidad,
      imagenUrl: item.imagenUrl || null,
      categoria: item.categoria || ''
    }));

    const montoPagado = metodoPago === 'efectivo' ? efectivoRecibido : null;
    const cambio = metodoPago === 'efectivo'
      ? redondear05(Math.max(efectivoRecibido - total, 0))
      : 0;

    return {
      id: `ORD-${Date.now()}`,
      empresaId: getActivaId(), // scoping multi-tenant (biblia §3.3) — sin esto cae a default-pv
      empleadoId,
      productos,
      subtotal,
      iva,
      total,
      metodoPago,
      montoPagado,
      cambio,
      estado: 'completada',
      createdAt: new Date()
    };
  };

  // Color de marca de la empresa activa (leído de las CSS vars que fija
  // EmpresaContext). La pantalla de cliente corre en OTRA ventana y no comparte
  // el DOM, así que el color viaja dentro del payload (biblia §7.7: color por
  // formato/marca de la caja activa).
  const brandColors = () => {
    const cssVar = (n, fb) => {
      try {
        const v = getComputedStyle(document.documentElement).getPropertyValue(n).trim();
        return v || fb;
      } catch { return fb; }
    };
    return {
      color: cssVar('--brand-color', '#1A7A48'),
      colorDark: cssVar('--brand-color-dark', '#0F4D2E'),
    };
  };

  const sincronizarPantallaCliente = () => {
    const data = {
      tipo: 'actualizar',
      items: items.map(item => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio: item.precioFinal || item.precio,
        subtotal: (item.precioFinal || item.precio) * item.cantidad
      })),
      subtotal: subtotal.toFixed(2),
      iva: iva.toFixed(2),
      total: total.toFixed(2),
      ...brandColors(),
      timestamp: Date.now()
    };
    localStorage.setItem('cliente_pantalla', JSON.stringify(data));
  };

  const marcarCompletada = () => {
    const data = {
      tipo: 'completar',
      total: total.toFixed(2),
      ...brandColors(),
      timestamp: Date.now()
    };
    localStorage.setItem('cliente_pantalla', JSON.stringify(data));
    
    setTimeout(() => {
      localStorage.setItem('cliente_pantalla', JSON.stringify({ tipo: 'limpiar', timestamp: Date.now() }));
    }, 5000);
  };

  const value = {
    items,
    add,
    updateQuantity,
    remove,
    clear,
    subtotal,
    iva,
    total,
    itemCount,
    isEmpty,
    toOrden,
    sincronizarPantallaCliente,
    marcarCompletada,
    promocionesActivas,
    calcularDescuento
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;