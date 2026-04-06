import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config/firebase-config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const cajaAbierta = async (empleadoId) => {
  try {
    const cajasRef = collection(db, 'cajas');
    const q = query(
      cajasRef,
      where('empleadoId', '==', empleadoId),
      where('abierta', '==', true)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: true, data: null };
    }
    
    const doc = snapshot.docs[0];
    return { success: true, data: { id: doc.id, ...doc.data() } };
  } catch (error) {
    console.error('Error checking open caja:', error);
    return { success: false, error: error.message };
  }
};

export const abrirCaja = async (empleadoId, empleadoNombre, montoInicial) => {
  try {
    const cajaRef = doc(collection(db, 'cajas'));
    await setDoc(cajaRef, {
      empleadoId,
      empleadoNombre,
      montoInicial,
      montoActual: montoInicial,
      abierta: true,
      ventas: [],
      createdAt: serverTimestamp()
    });
    return { success: true, id: cajaRef.id };
  } catch (error) {
    console.error('Error opening caja:', error);
    return { success: false, error: error.message };
  }
};

export const cerrarCaja = async (id, data) => {
  try {
    const cajaRef = doc(db, 'cajas', id);
    await updateDoc(cajaRef, {
      abierta: false,
      montoCierre: data.montoReal,
      diferencia: data.montoReal - data.montoEsperado,
      ventasTotales: data.ventasTotales,
      ventasEfectivo: data.ventasEfectivo,
      ventasTarjeta: data.ventasTarjeta,
      numTransacciones: data.numTransacciones,
      notas: data.notas || '',
      closedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error closing caja:', error);
    return { success: false, error: error.message };
  }
};

export const fetchHistorial = async () => {
  try {
    const cajasRef = collection(db, 'cajas');
    const q = query(
      cajasRef,
      where('abierta', '==', false),
      orderBy('closedAt', 'desc'),
      limit(30)
    );
    const snapshot = await getDocs(q);
    const cierres = [];
    snapshot.forEach(doc => {
      cierres.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: cierres };
  } catch (error) {
    console.error('Error fetching caja history:', error);
    return { success: false, error: error.message };
  }
};

export const getVentasCaja = async (cajaId) => {
  try {
    const cajaRef = doc(db, 'cajas', cajaId);
    const docSnap = await getDoc(cajaRef);
    
    if (!docSnap.exists()) {
      return { success: true, data: [] };
    }
    
    const data = docSnap.data();
    return { success: true, data: data.ventas || [] };
  } catch (error) {
    console.error('Error fetching caja ventas:', error);
    return { success: false, error: error.message };
  }
};

export const addVentaToCaja = async (cajaId, venta) => {
  try {
    const cajaRef = doc(db, 'cajas', cajaId);
    const docSnap = await getDoc(cajaRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Caja no encontrada' };
    }
    
    const data = docSnap.data();
    const ventas = data.ventas || [];
    ventas.push(venta);
    
    await updateDoc(cajaRef, {
      ventas,
      montoActual: (data.montoActual || 0) + (venta.total || 0)
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error adding venta to caja:', error);
    return { success: false, error: error.message };
  }
};

export default {
  cajaAbierta,
  abrirCaja,
  cerrarCaja,
  fetchHistorial,
  getVentasCaja,
  addVentaToCaja
};