import { db } from '../firebase.js';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';

export const DEFAULT_EMPRESA_ID = 'default-pv';

const DEFAULT_EMPRESA_DATA = {
  nombre: 'Punto Verde',
  giro: 'Tiendas de abarrotes',
  tagline: 'Red de tiendas de barrio',
  colorR: 0.059, colorG: 0.302, colorB: 0.176,
  brightness: 0,
  activa: true,
};

export const fetchAll = async () => {
  try {
    const snap = await getDocs(query(collection(db, 'empresas'), orderBy('nombre')));
    const data = [];
    snap.forEach(d => data.push({ id: d.id, ...d.data() }));
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const create = async (empresa) => {
  try {
    const ref = doc(collection(db, 'empresas'));
    await setDoc(ref, { ...empresa, fechaCreacion: serverTimestamp() });
    return { success: true, id: ref.id };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const update = async (id, data) => {
  try {
    await updateDoc(doc(db, 'empresas', id), { ...data, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const remove = async (id) => {
  if (id === DEFAULT_EMPRESA_ID) {
    return { success: false, error: 'No se puede eliminar la empresa principal' };
  }
  try {
    await deleteDoc(doc(db, 'empresas', id));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const asegurarDefault = async () => {
  try {
    const ref = doc(db, 'empresas', DEFAULT_EMPRESA_ID);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { ...DEFAULT_EMPRESA_DATA, fechaCreacion: serverTimestamp() });
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export default { fetchAll, create, update, remove, asegurarDefault, DEFAULT_EMPRESA_ID };
