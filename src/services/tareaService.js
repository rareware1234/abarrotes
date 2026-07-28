import { db } from '../firebase.js';
import {

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

// Generates tasks for the current week from active plantillas.
// Skips duplicates (same plantillaId + vencimiento date already exists).
export const generarTareasSemanales = async () => {
  try {
    const [plantillasRes, tareasRes] = await Promise.all([
      fetchPlantillas(),
      fetchTodas(),
    ]);
    if (!plantillasRes.success) return { success: false, error: plantillasRes.error };

    const plantillas = plantillasRes.data;
    const tareasExistentes = tareasRes.success ? tareasRes.data : [];

    const existing = new Set(
      tareasExistentes
        .filter(t => t.plantillaId && t.vencimiento)
        .map(t => `${t.plantillaId}::${t.vencimiento}`)
    );

    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });

    const toDateStr = (d) => d.toISOString().split('T')[0];
    const created = [];

    for (const plantilla of plantillas) {
      let targetDays = [];

      if (plantilla.frecuencia === 'diaria') {
        targetDays = weekDays.filter(d => d.getDay() !== 0); // Mon–Sat
      } else if (plantilla.frecuencia === 'semanal') {
        if (plantilla.diasSemana && plantilla.diasSemana.length > 0) {
          targetDays = weekDays.filter(d => {
            const idx = (d.getDay() + 6) % 7; // JS Sun=0 → Mon=0
            return plantilla.diasSemana.includes(idx);
          });
        } else {
          targetDays = weekDays.filter(d => d.getDay() === 5); // Friday by default
        }
      } else if (plantilla.frecuencia === 'quincenal') {
        const weekNum = Math.ceil(monday.getDate() / 7);
        if (weekNum % 2 === 1) targetDays = [weekDays[0]]; // odd weeks, Monday
      } else if (plantilla.frecuencia === 'mensual') {
        if (monday.getDate() <= 7) targetDays = [weekDays[0]]; // first week of month
      }

      for (const day of targetDays) {
        const fechaStr = toDateStr(day);
        const key = `${plantilla.id}::${fechaStr}`;
        if (existing.has(key)) continue;

        const tareaRef = doc(collection(db, 'tareas'));
        await setDoc(tareaRef, {
          titulo: plantilla.nombre,
          notas: plantilla.notas || '',
          prioridad: plantilla.prioridad || 'media',
          asignadoA: plantilla.asignadoA || null,
          vencimiento: fechaStr,
          hora: '',
          recurrente: true,
          frecuencia: plantilla.frecuencia,
          plantillaId: plantilla.id,
          estado: 'pendiente',
          createdAt: serverTimestamp(),
        });
        created.push(tareaRef.id);
        existing.add(key);
      }
    }

    return { success: true, created: created.length };
  } catch (error) {
    console.error('Error generating weekly tasks:', error);
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
  eliminarPlantilla,
  generarTareasSemanales,
};