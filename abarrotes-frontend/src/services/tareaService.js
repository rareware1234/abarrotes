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
    const tareasRef = collection(db, 'tareas');
    const q = query(tareasRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const tareas = [];
    snapshot.forEach(doc => {
      tareas.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: tareas };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { success: false, error: error.message };
  }
};

export const fetchPorEmpleado = async (empleadoId) => {
  try {
    const tareasRef = collection(db, 'tareas');
    const q = query(
      tareasRef,
      where('asignadoA', '==', empleadoId),
      orderBy('vencimiento', 'asc')
    );
    const snapshot = await getDocs(q);
    const tareas = [];
    snapshot.forEach(doc => {
      tareas.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: tareas };
  } catch (error) {
    console.error('Error fetching tasks by employee:', error);
    return { success: false, error: error.message };
  }
};

export const crear = async (tarea) => {
  try {
    const tareaRef = doc(collection(db, 'tareas'));
    await setDoc(tareaRef, {
      ...tarea,
      estado: 'pendiente',
      createdAt: serverTimestamp()
    });
    return { success: true, id: tareaRef.id };
  } catch (error) {
    console.error('Error creating task:', error);
    return { success: false, error: error.message };
  }
};

export const completar = async (id) => {
  try {
    const tareaRef = doc(db, 'tareas', id);
    await updateDoc(tareaRef, {
      estado: 'completada',
      completadaAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error completing task:', error);
    return { success: false, error: error.message };
  }
};

export const update = async (id, data) => {
  try {
    const tareaRef = doc(db, 'tareas', id);
    await updateDoc(tareaRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating task:', error);
    return { success: false, error: error.message };
  }
};

export const remove = async (id) => {
  try {
    const tareaRef = doc(db, 'tareas', id);
    await deleteDoc(tareaRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { success: false, error: error.message };
  }
};

export const fetchPlantillas = async () => {
  try {
    const plantillasRef = collection(db, 'plantillas_tareas');
    const q = query(plantillasRef, orderBy('nombre', 'asc'));
    const snapshot = await getDocs(q);
    const plantillas = [];
    snapshot.forEach(doc => {
      plantillas.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: plantillas };
  } catch (error) {
    console.error('Error fetching task templates:', error);
    return { success: false, error: error.message };
  }
};

export const crearPlantilla = async (plantilla) => {
  try {
    const plantillaRef = doc(collection(db, 'plantillas_tareas'));
    await setDoc(plantillaRef, {
      ...plantilla,
      createdAt: serverTimestamp()
    });
    return { success: true, id: plantillaRef.id };
  } catch (error) {
    console.error('Error creating task template:', error);
    return { success: false, error: error.message };
  }
};

export const eliminarPlantilla = async (id) => {
  try {
    const plantillaRef = doc(db, 'plantillas_tareas', id);
    await deleteDoc(plantillaRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting task template:', error);
    return { success: false, error: error.message };
  }
};

export default {
  fetchTodas,
  fetchPorEmpleado,
  crear,
  completar,
  update,
  remove,
  fetchPlantillas,
  crearPlantilla,
  eliminarPlantilla
};