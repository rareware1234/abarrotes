import React, { createContext, useState, useContext, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config/firebase-config';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

  const add = (producto) => {
    return new Promise((resolve) => {
      setItems(prev => {
        const existente = prev.find(item => item.id === producto.id);
        
        if (existente) {
          const nuevoStock = existente.cantidad + 1;
          if (nuevoStock > producto.stock) {
            resolve({ resultado: 'sinStock', restante: 0 });
            return prev;
          }
          if (nuevoStock >= producto.stockMinimo) {
            resolve({ resultado: 'added', restante: producto.stock - nuevoStock });
          } else {
            resolve({ resultado: 'stockBajo', restante: producto.stock - nuevoStock });
          }
          
          return prev.map(item => 
            item.id === producto.id 
              ? { ...item, cantidad: nuevoStock, precioFinal: calcularDescuento({...item, cantidad: nuevoStock}, promocionesActivas) }
              : item
          );
        }
        
        if (producto.stock <= 0) {
          resolve({ resultado: 'sinStock', restante: 0 });
          return prev;
        }
        
        const nuevoItem = {
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precioVenta,
          precioOriginal: producto.precioVenta,
          cantidad: 1,
          stock: producto.stock,
          stockMinimo: producto.stockMinimo || 5,
          codigo: producto.codigo,
          categoria: producto.categoria,
          imagen: producto.imagen
        };
        
        nuevoItem.precioFinal = calcularDescuento(nuevoItem, promocionesActivas);
        
        if (producto.stock >= producto.stockMinimo) {
          resolve({ resultado: 'added', restante: producto.stock - 1 });
        } else {
          resolve({ resultado: 'stockBajo', restante: producto.stock - 1 });
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
    const productos = items.map(item => ({
      id: item.id,
      nombre: item.nombre,
      precioUnitario: item.precio,
      precioFinal: item.precioFinal || item.precio,
      cantidad: item.cantidad,
      descuento: item.precioOriginal - (item.precioFinal || item.precio)
    }));

    const cambio = metodoPago === 'efectivo' 
      ? efectivoRecibido - total 
      : 0;

    return {
      id: `ORD-${Date.now()}`,
      empleadoId,
      productos,
      subtotal,
      iva,
      total,
      metodoPago,
      efectivoRecibido: metodoPago === 'efectivo' ? efectivoRecibido : null,
      cambio: cambio > 0 ? cambio : 0,
      status: 'completada',
      createdAt: new Date()
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
      timestamp: Date.now()
    };
    localStorage.setItem('cliente_pantalla', JSON.stringify(data));
  };

  const marcarCompletada = () => {
    const data = {
      tipo: 'completar',
      total: total.toFixed(2),
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