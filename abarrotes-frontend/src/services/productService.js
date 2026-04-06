import { initializeApp } from 'firebase/app';
import {
  getFirestore,
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
  serverTimestamp
} from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config/firebase-config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

export default {
  fetchAll,
  fetchByBarcode,
  create,
  update,
  remove,
  fetchByCategory
};