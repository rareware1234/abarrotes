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

const TIPOS_TURNO = {
  matutino: { inicio: '07:00', fin: '15:00', horas: 8, color: '#2563EB' },
  vespertino: { inicio: '15:00', fin: '23:00', horas: 8, color: '#F97316' },
  completo: { inicio: '07:00', fin: '23:00', horas: 16, color: '#1A7A48' },
  medio: { inicio: '09:00', fin: '13:00', horas: 4, color: '#EAB308' },
  descanso: { inicio: null, fin: null, horas: 0, color: '#64748B' }
};

export const getTipoTurno = (tipo) => TIPOS_TURNO[tipo] || TIPOS_TURNO.matutino;

export const fetchSemana = async (desde) => {
  try {
    const turnosRef = collection(db, 'turnos');
    const fechaDesde = new Date(desde);
    const fechaHasta = new Date(desde);
    fechaHasta.setDate(fechaHasta.getDate() + 7);
    
    const q = query(
      turnosRef,
      where('fecha', '>=', fechaDesde.toISOString().split('T')[0]),
      where('fecha', '<', fechaHasta.toISOString().split('T')[0]),
      orderBy('fecha', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const turnos = [];
    snapshot.forEach(doc => {
      turnos.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: turnos };
  } catch (error) {
    console.error('Error fetching week shifts:', error);
    return { success: false, error: error.message };
  }
};

export const fetchTodos = async () => {
  try {
    const turnosRef = collection(db, 'turnos');
    const q = query(turnosRef, orderBy('fecha', 'desc'), orderBy('inicio', 'asc'));
    const snapshot = await getDocs(q);
    const turnos = [];
    snapshot.forEach(doc => {
      turnos.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: turnos.slice(0, 200) };
  } catch (error) {
    console.error('Error fetching all shifts:', error);
    return { success: false, error: error.message };
  }
};

export const crear = async (turno) => {
  try {
    const tipoInfo = getTipoTurno(turno.tipo);
    const turnoRef = doc(collection(db, 'turnos'));
    await setDoc(turnoRef, {
      ...turno,
      inicio: tipoInfo.inicio,
      fin: tipoInfo.fin,
      horas: tipoInfo.horas,
      createdAt: serverTimestamp()
    });
    return { success: true, id: turnoRef.id };
  } catch (error) {
    console.error('Error creating shift:', error);
    return { success: false, error: error.message };
  }
};

export const update = async (id, data) => {
  try {
    const turnoRef = doc(db, 'turnos', id);
    await updateDoc(turnoRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating shift:', error);
    return { success: false, error: error.message };
  }
};

export const remove = async (id) => {
  try {
    const turnoRef = doc(db, 'turnos', id);
    await deleteDoc(turnoRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting shift:', error);
    return { success: false, error: error.message };
  }
};

export const fetchPorEmpleado = async (empleadoId) => {
  try {
    const turnosRef = collection(db, 'turnos');
    const q = query(
      turnosRef,
      where('empleadoId', '==', empleadoId),
      orderBy('fecha', 'desc')
    );
    const snapshot = await getDocs(q);
    const turnos = [];
    snapshot.forEach(doc => {
      turnos.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: turnos };
  } catch (error) {
    console.error('Error fetching shifts by employee:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getTipoTurno,
  fetchSemana,
  fetchTodos,
  crear,
  update,
  remove,
  fetchPorEmpleado,
  TIPOS_TURNO
};