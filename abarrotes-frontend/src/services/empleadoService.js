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
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '../firebase-config/firebase-config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const fetchAll = async () => {
  try {
    const empleadosRef = collection(db, 'empleados');
    const snapshot = await getDocs(empleadosRef);
    const empleados = [];
    snapshot.forEach(doc => {
      empleados.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: empleados };
  } catch (error) {
    console.error('Error fetching employees:', error);
    return { success: false, error: error.message };
  }
};

export const getById = async (uid) => {
  try {
    const empleadosRef = collection(db, 'empleados');
    const q = query(empleadosRef, where('uid', '==', uid));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: true, data: null };
    }
    
    const doc = snapshot.docs[0];
    return { success: true, data: { id: doc.id, ...doc.data() } };
  } catch (error) {
    console.error('Error fetching employee:', error);
    return { success: false, error: error.message };
  }
};

export const create = async (empleado) => {
  try {
    const tempPassword = generatePassword();
    const email = `${empleado.numEmpleado}@puntosverde.com`;
    
    let uid;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
      uid = userCredential.user.uid;
    } catch (authError) {
      if (authError.code === 'auth/email-already-in-use') {
        const existingResult = await fetchByNumEmpleado(empleado.numEmpleado);
        if (existingResult.success && existingResult.data) {
          uid = existingResult.data.uid;
        } else {
          return { success: false, error: 'El número de empleado ya existe' };
        }
      } else {
        throw authError;
      }
    }
    
    const empleadoRef = doc(collection(db, 'empleados'));
    await setDoc(empleadoRef, {
      ...empleado,
      uid,
      rol: empleado.rol || 'STAFF',
      activo: true,
      requiereCambioPassword: true,
      createdAt: serverTimestamp()
    });
    
    return { success: true, id: empleadoRef.id, tempPassword };
  } catch (error) {
    console.error('Error creating employee:', error);
    return { success: false, error: error.message };
  }
};

export const update = async (uid, data) => {
  try {
    const empleadosRef = collection(db, 'empleados');
    const q = query(empleadosRef, where('uid', '==', uid));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: false, error: 'Empleado no encontrado' };
    }
    
    const empleadoDoc = snapshot.docs[0];
    const empleadoRef = doc(db, 'empleados', empleadoDoc.id);
    await updateDoc(empleadoRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating employee:', error);
    return { success: false, error: error.message };
  }
};

export const toggleActivo = async (uid) => {
  try {
    const empleadosRef = collection(db, 'empleados');
    const q = query(empleadosRef, where('uid', '==', uid));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: false, error: 'Empleado no encontrado' };
    }
    
    const empleadoDoc = snapshot.docs[0];
    const currentActivo = empleadoDoc.data().activo;
    
    const empleadoRef = doc(db, 'empleados', empleadoDoc.id);
    await updateDoc(empleadoRef, {
      activo: !currentActivo,
      updatedAt: serverTimestamp()
    });
    
    return { success: true, nuevoEstado: !currentActivo };
  } catch (error) {
    console.error('Error toggling employee status:', error);
    return { success: false, error: error.message };
  }
};

export const fetchByNumEmpleado = async (numEmpleado) => {
  try {
    const empleadosRef = collection(db, 'empleados');
    const q = query(empleadosRef, where('numEmpleado', '==', numEmpleado));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: true, data: null };
    }
    
    const doc = snapshot.docs[0];
    return { success: true, data: { id: doc.id, ...doc.data() } };
  } catch (error) {
    console.error('Error fetching employee by number:', error);
    return { success: false, error: error.message };
  }
};

export const fetchByTienda = async (tiendaId) => {
  try {
    const empleadosRef = collection(db, 'empleados');
    const q = query(empleadosRef, where('tiendaId', '==', tiendaId));
    const snapshot = await getDocs(q);
    const empleados = [];
    snapshot.forEach(doc => {
      empleados.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: empleados };
  } catch (error) {
    console.error('Error fetching employees by store:', error);
    return { success: false, error: error.message };
  }
};

export default {
  fetchAll,
  getById,
  create,
  update,
  toggleActivo,
  fetchByNumEmpleado,
  fetchByTienda
};