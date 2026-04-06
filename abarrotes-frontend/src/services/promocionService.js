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

export const fetchAll = async () => {
  try {
    const promosRef = collection(db, 'promociones');
    const snapshot = await getDocs(promosRef);
    const promos = [];
    snapshot.forEach(doc => {
      promos.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: promos };
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return { success: false, error: error.message };
  }
};

export const getActivas = async () => {
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
    
    return { success: true, data: promos };
  } catch (error) {
    console.error('Error fetching active promotions:', error);
    return { success: false, error: error.message };
  }
};

export const create = async (promo) => {
  try {
    const promoRef = doc(collection(db, 'promociones'));
    await setDoc(promoRef, {
      ...promo,
      activa: promo.activa !== false,
      createdAt: serverTimestamp()
    });
    return { success: true, id: promoRef.id };
  } catch (error) {
    console.error('Error creating promotion:', error);
    return { success: false, error: error.message };
  }
};

export const update = async (id, data) => {
  try {
    const promoRef = doc(db, 'promociones', id);
    await updateDoc(promoRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating promotion:', error);
    return { success: false, error: error.message };
  }
};

export const remove = async (id) => {
  try {
    const promoRef = doc(db, 'promociones', id);
    await deleteDoc(promoRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return { success: false, error: error.message };
  }
};

export const toggle = async (id) => {
  try {
    const promoRef = doc(db, 'promociones', id);
    const docSnap = await getDocs(promoRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Promoción no encontrada' };
    }
    
    const currentActiva = docSnap.data().activa;
    await updateDoc(promoRef, {
      activa: !currentActiva,
      updatedAt: serverTimestamp()
    });
    
    return { success: true, nuevoEstado: !currentActiva };
  } catch (error) {
    console.error('Error toggling promotion:', error);
    return { success: false, error: error.message };
  }
};

export default {
  fetchAll,
  getActivas,
  create,
  update,
  remove,
  toggle
};