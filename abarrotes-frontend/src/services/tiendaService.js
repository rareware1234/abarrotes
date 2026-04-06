import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config/firebase-config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const fetchTodas = async () => {
  try {
    const tiendasRef = collection(db, 'tiendas');
    const snapshot = await getDocs(tiendasRef);
    const tiendas = [];
    snapshot.forEach(doc => {
      tiendas.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: tiendas };
  } catch (error) {
    console.error('Error fetching stores:', error);
    return { success: false, error: error.message };
  }
};

export const getById = async (id) => {
  try {
    const tiendaRef = doc(db, 'tiendas', id);
    const docSnap = await getDocs(tiendaRef);
    
    if (!docSnap.exists()) {
      return { success: true, data: null };
    }
    
    return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
  } catch (error) {
    console.error('Error fetching store:', error);
    return { success: false, error: error.message };
  }
};

export const create = async (tienda) => {
  try {
    const tiendaRef = doc(collection(db, 'tiendas'));
    await setDoc(tiendaRef, {
      ...tienda,
      activa: true,
      createdAt: serverTimestamp()
    });
    return { success: true, id: tiendaRef.id };
  } catch (error) {
    console.error('Error creating store:', error);
    return { success: false, error: error.message };
  }
};

export const update = async (id, data) => {
  try {
    const tiendaRef = doc(db, 'tiendas', id);
    await updateDoc(tiendaRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating store:', error);
    return { success: false, error: error.message };
  }
};

export const toggleActiva = async (id) => {
  try {
    const tiendaRef = doc(db, 'tiendas', id);
    const docSnap = await getDocs(tiendaRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Tienda no encontrada' };
    }
    
    const currentActiva = docSnap.data().activa;
    await updateDoc(tiendaRef, {
      activa: !currentActiva,
      updatedAt: serverTimestamp()
    });
    
    return { success: true, nuevoEstado: !currentActiva };
  } catch (error) {
    console.error('Error toggling store status:', error);
    return { success: false, error: error.message };
  }
};

export const remove = async (id) => {
  try {
    const tiendaRef = doc(db, 'tiendas', id);
    await deleteDoc(tiendaRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting store:', error);
    return { success: false, error: error.message };
  }
};

export default {
  fetchTodas,
  getById,
  create,
  update,
  toggleActiva,
  remove
};