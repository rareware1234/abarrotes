import { db } from '../firebase.js';
import { getActivaId, filterByActiveEmpresa } from '../lib/empresaActiva';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';


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

/** Tiendas de la empresa activa (réplica de TiendaService.fetchAllForActiveEmpresa Swift). */
export const fetchAllForActiveEmpresa = async () => {
  const res = await fetchTodas();
  if (!res.success) return res;
  return { success: true, data: filterByActiveEmpresa(res.data) };
};

export const getById = async (id) => {
  try {
    const tiendaRef = doc(db, 'tiendas', id);
    const docSnap = await getDoc(tiendaRef);

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
      empresaId: getActivaId(),
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
    const docSnap = await getDoc(tiendaRef);

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

export const createCotizacion = async (data) => {
  try {
    const tiendaRef = doc(collection(db, 'tiendas'));
    await setDoc(tiendaRef, {
      empresaId: getActivaId(),
      ...data,
      fechaCreacion: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    return { success: true, id: tiendaRef.id };
  } catch (error) {
    console.error('Error creating cotizacion:', error);
    return { success: false, error: error.message };
  }
};

export default {
  fetchTodas,
  fetchAllForActiveEmpresa,
  getById,
  create,
  update,
  toggleActiva,
  remove,
  createCotizacion,
};