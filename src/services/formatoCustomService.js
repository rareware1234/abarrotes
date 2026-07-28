import { db } from '../firebase.js';
import {
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';

export const fetchAll = async () => {
  try {
    const snap = await getDocs(query(collection(db, 'formatos_custom'), orderBy('nombre')));
    const data = [];
    snap.forEach(d => data.push({ id: d.id, ...d.data() }));
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const create = async (formato) => {
  try {
    const ref = doc(collection(db, 'formatos_custom'));
    await setDoc(ref, { ...formato, createdAt: serverTimestamp() });
    return { success: true, id: ref.id };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const update = async (id, data) => {
  try {
    await updateDoc(doc(db, 'formatos_custom', id), { ...data, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const remove = async (id) => {
  try {
    await deleteDoc(doc(db, 'formatos_custom', id));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export default { fetchAll, create, update, remove };
