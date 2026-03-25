import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Empleado } from '../types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

export const getEmpleadoPerfil = async (uid: string): Promise<Empleado | null> => {
  const snap = await getDoc(doc(db, 'empleados', uid));
  return snap.exists() ? (snap.data() as Empleado) : null;
};

export const fetchProductos = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const data = await res.json();
    return data.map((p: any) => ({
      id: p.id?.toString() || p.productoId?.toString(),
      nombre: p.nombre || p.name,
      precio: parseFloat(p.precio || p.price || 0),
      sku: p.sku || p.barcode || p.codigoBarras || '',
      categoria: p.categoria || p.category || 'General',
      stock: parseInt(p.stock || p.existencia || 999),
      imagen: p.imagen || p.imageUrl,
    }));
  } catch (err) {
    console.error('Error fetching productos:', err);
    const cached = await AsyncStorage.getItem('cached_productos');
    if (cached) return JSON.parse(cached);
    throw err;
  }
};

export const guardarProductosCache = async (productos: any[]) => {
  await AsyncStorage.setItem('cached_productos', JSON.stringify(productos));
};

export const crearOrden = async (orden: any) => {
  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orden),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error creando orden:', err);
    throw err;
  }
};

export const fetchDashboardStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/orders/stats`);
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching stats:', err);
    throw err;
  }
};

export const fetchCajaEstado = async (empleadoId: string) => {
  try {
    const res = await fetch(`${API_BASE}/api/caja/estado/empleado/${empleadoId}`);
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching caja:', err);
    throw err;
  }
};

export const abrirCaja = async (empleadoId: string, montoApertura: number) => {
  const res = await fetch(`${API_BASE}/api/caja/abrir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numeroEmpleado: empleadoId, montoApertura }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  return await res.json();
};

export const cerrarCaja = async (cajaId: string, montoCierre: number) => {
  const res = await fetch(`${API_BASE}/api/caja/cerrar/${cajaId}?montoCierre=${montoCierre}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  return await res.json();
};
