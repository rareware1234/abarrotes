import { db } from '../firebase.js';
import { getActivaId, scopeProductos } from '../lib/empresaActiva';
import tiendaService from './tiendaService';
import {

  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  increment,
  serverTimestamp
} from 'firebase/firestore';


export const fetchAll = async () => {
  try {
    const productosRef = collection(db, 'productos');
    const snapshot = await getDocs(productosRef);
    const productos = [];
    snapshot.forEach(doc => {
      productos.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: productos };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { success: false, error: error.message };
  }
};

export const fetchByBarcode = async (codigo) => {
  try {
    const productosRef = collection(db, 'productos');
    const q = query(productosRef, where('codigo', '==', codigo));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: true, data: null };
    }
    
    const doc = snapshot.docs[0];
    return { success: true, data: { id: doc.id, ...doc.data() } };
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    return { success: false, error: error.message };
  }
};

export const create = async (producto) => {
  try {
    const productoRef = doc(collection(db, 'productos'));
    await setDoc(productoRef, {
      empresaId: getActivaId(),
      ...producto,
      createdAt: serverTimestamp()
    });
    return { success: true, id: productoRef.id };
  } catch (error) {
    console.error('Error creating product:', error);
    return { success: false, error: error.message };
  }
};

export const update = async (id, data) => {
  try {
    const productoRef = doc(db, 'productos', id);
    await updateDoc(productoRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: error.message };
  }
};

export const remove = async (id) => {
  try {
    const productoRef = doc(db, 'productos', id);
    await deleteDoc(productoRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: error.message };
  }
};

export const fetchByCategory = async (categoria) => {
  try {
    const productosRef = collection(db, 'productos');
    const q = query(productosRef, where('categoria', '==', categoria));
    const snapshot = await getDocs(q);
    const productos = [];
    snapshot.forEach(doc => {
      productos.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: productos };
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Surte stock a una tienda (biblia §3.1/§4.1): incrementa
 * `stockPorTienda.{tiendaId}` atómicamente y REACTIVA el producto (`activo:true`).
 * `delta` puede ser negativo (descuento por venta).
 */
export const surtirEnTienda = async (productoId, tiendaId, delta) => {
  try {
    if (!productoId || !tiendaId) return { success: false, error: 'productoId y tiendaId requeridos' };
    await updateDoc(doc(db, 'productos', productoId), {
      [`stockPorTienda.${tiendaId}`]: increment(delta),
      activo: true,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error surtiendo en tienda:', error);
    return { success: false, error: error.message };
  }
};

/** Productos de la empresa activa: catálogo GLOBAL (empresaId propio O con stock
 *  en una de sus tiendas). Réplica de Producto.fetchAllForActiveEmpresa (Swift). */
export const fetchAllForActiveEmpresa = async () => {
  const [pRes, tRes] = await Promise.all([fetchAll(), tiendaService.fetchAllForActiveEmpresa()]);
  if (!pRes.success) return pRes;
  const ids = new Set((tRes.success ? tRes.data : []).map((t) => t.id));
  return { success: true, data: scopeProductos(pRes.data, ids, getActivaId()) };
};

export default {
  fetchAll,
  fetchAllForActiveEmpresa,
  fetchByBarcode,
  create,
  update,
  remove,
  fetchByCategory,
  surtirEnTienda
};