import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config/firebase-config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const create = async (orden) => {
  try {
    const ordenRef = doc(collection(db, 'ordenes'));
    await setDoc(ordenRef, {
      ...orden,
      createdAt: serverTimestamp()
    });
    return { success: true, id: ordenRef.id };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
};

export const getOrdenes = async (filtro = 'hoy') => {
  try {
    const ordenesRef = collection(db, 'ordenes');
    let q;
    
    const now = new Date();
    let inicio;
    
    switch (filtro) {
      case 'hoy':
        inicio = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        q = query(ordenesRef, where('createdAt', '>=', inicio), orderBy('createdAt', 'desc'));
        break;
      case 'semana':
        inicio = new Date(now);
        inicio.setDate(inicio.getDate() - 7);
        q = query(ordenesRef, where('createdAt', '>=', inicio), orderBy('createdAt', 'desc'));
        break;
      case 'mes':
        inicio = new Date(now);
        inicio.setMonth(inicio.getMonth() - 1);
        q = query(ordenesRef, where('createdAt', '>=', inicio), orderBy('createdAt', 'desc'));
        break;
      default:
        q = query(ordenesRef, orderBy('createdAt', 'desc'), limit(200));
    }
    
    const snapshot = await getDocs(q);
    const ordenes = [];
    snapshot.forEach(doc => {
      ordenes.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: ordenes };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { success: false, error: error.message };
  }
};

export const getById = async (id) => {
  try {
    const ordenRef = doc(db, 'ordenes', id);
    const docSnap = await getDoc(ordenRef);
    
    if (!docSnap.exists()) {
      return { success: true, data: null };
    }
    
    return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
  } catch (error) {
    console.error('Error fetching order:', error);
    return { success: false, error: error.message };
  }
};

export const getByEmpleado = async (empleadoId) => {
  try {
    const ordenesRef = collection(db, 'ordenes');
    const q = query(
      ordenesRef, 
      where('empleadoId', '==', empleadoId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    const ordenes = [];
    snapshot.forEach(doc => {
      ordenes.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: ordenes };
  } catch (error) {
    console.error('Error fetching orders by employee:', error);
    return { success: false, error: error.message };
  }
};

export const getVentasHoy = async () => {
  try {
    const ordenesRef = collection(db, 'ordenes');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const q = query(
      ordenesRef,
      where('createdAt', '>=', hoy),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const ordenes = [];
    snapshot.forEach(doc => {
      ordenes.push({ id: doc.id, ...doc.data() });
    });
    
    const total = ordenes.reduce((sum, o) => sum + (o.total || 0), 0);
    const count = ordenes.length;
    
    return { success: true, data: { ordenes, total, count } };
  } catch (error) {
    console.error('Error fetching today sales:', error);
    return { success: false, error: error.message };
  }
};

export const getVentasSemana = async () => {
  try {
    const ordenesRef = collection(db, 'ordenes');
    const hoy = new Date();
    const semanaPasada = new Date(hoy);
    semanaPasada.setDate(semanaPasada.getDate() - 7);
    
    const q = query(
      ordenesRef,
      where('createdAt', '>=', semanaPasada),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const ordenes = [];
    snapshot.forEach(doc => {
      ordenes.push({ id: doc.id, ...doc.data() });
    });
    
    const dias = {};
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      const key = diasSemana[fecha.getDay()];
      dias[key] = 0;
    }
    
    ordenes.forEach(orden => {
      if (orden.createdAt && orden.createdAt.toDate) {
        const fecha = orden.createdAt.toDate();
        const key = diasSemana[fecha.getDay()];
        if (dias[key] !== undefined) {
          dias[key] += orden.total || 0;
        }
      }
    });
    
    return { success: true, data: dias };
  } catch (error) {
    console.error('Error fetching week sales:', error);
    return { success: false, error: error.message };
  }
};

export default {
  create,
  getOrdenes,
  getById,
  getByEmpleado,
  getVentasHoy,
  getVentasSemana
};