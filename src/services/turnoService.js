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
    const turnoRef = doc(collection(db, 'turnos'));
    // Respetar inicio/fin/horas custom (asignación por horas).
    // Solo usar TIPOS_TURNO como fallback si no vienen en el objeto.
    const data = { ...turno };
    if (!data.inicio && !data.fin && data.tipo && data.tipo !== 'descanso') {
      const tipoInfo = getTipoTurno(data.tipo);
      data.inicio = tipoInfo.inicio;
      data.fin    = tipoInfo.fin;
      data.horas  = tipoInfo.horas;
    }
    await setDoc(turnoRef, { ...data, createdAt: serverTimestamp() });
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

export const copiarSemanaAnterior = async (weekStart) => {
  try {
    const prevStart = new Date(weekStart);
    prevStart.setDate(prevStart.getDate() - 7);
    const prevRes = await fetchSemana(prevStart);
    if (!prevRes.success || prevRes.data.length === 0) return { success: true, count: 0 };

    const currentStart = new Date(weekStart);
    const results = await Promise.all(
      prevRes.data.map(t => {
        const prevDate = new Date(t.fecha + 'T00:00:00');
        const diffDays = Math.round((prevDate - prevStart) / (1000 * 60 * 60 * 24));
        const newDate = new Date(currentStart);
        newDate.setDate(currentStart.getDate() + diffDays);
        const newFecha = newDate.toISOString().split('T')[0];
        const { id, createdAt, updatedAt, ...rest } = t;
        return crear({ ...rest, fecha: newFecha });
      })
    );
    return { success: true, count: results.filter(r => r.success).length };
  } catch (error) {
    console.error('Error copying week:', error);
    return { success: false, error: error.message };
  }
};

export const limpiarSemana = async (weekStart) => {
  try {
    const res = await fetchSemana(weekStart);
    if (!res.success) return { success: false };
    await Promise.all(res.data.map(t => remove(t.id)));
    return { success: true, count: res.data.length };
  } catch (error) {
    console.error('Error clearing week:', error);
    return { success: false, error: error.message };
  }
};

// Plantilla estándar: Lun-Vie completo, Sáb medio, Dom descanso.
// Solo crea turnos donde el empleado no tiene ninguno ese día.
export const aplicarPlantillaSemanal = async (weekStart, empleados) => {
  try {
    const res = await fetchSemana(weekStart);
    if (!res.success) return { success: false };
    const existentes = res.data;
    const start = new Date(weekStart + 'T00:00:00');
    const tiposPorDia = ['completo','completo','completo','completo','completo','medio','descanso'];
    let count = 0;
    await Promise.all(
      empleados.flatMap(emp => {
        const empId = emp.uid || emp.id || '';
        return tiposPorDia.map((tipo, idx) => {
          const d = new Date(start);
          d.setDate(start.getDate() + idx);
          const fecha = d.toISOString().split('T')[0];
          const yaExiste = existentes.some(t => t.empleadoId === empId && t.fecha === fecha);
          if (yaExiste) return Promise.resolve();
          const tipoInfo = TIPOS_TURNO[tipo];
          count++;
          return crear({
            empleadoId: empId,
            empleadoNombre: emp.nombre || '',
            empleadoRol: emp.rol || '',
            fecha,
            tipo,
            inicio: tipoInfo.inicio || null,
            fin: tipoInfo.fin || null,
            horas: tipoInfo.horas,
            notas: 'Plantilla estándar',
            activo: true,
          });
        });
      })
    );
    return { success: true, count };
  } catch (error) {
    console.error('Error applying weekly template:', error);
    return { success: false, error: error.message };
  }
};

// Asigna descanso el sábado y/o domingo a empleados con menos de 2 descansos esta semana.
export const autoAsignarDescansos = async (weekStart, empleados) => {
  try {
    const res = await fetchSemana(weekStart);
    if (!res.success) return { success: false };
    const existentes = res.data;
    const start = new Date(weekStart + 'T00:00:00');
    const sabado = new Date(start); sabado.setDate(start.getDate() + 5);
    const domingo = new Date(start); domingo.setDate(start.getDate() + 6);
    const sabFecha = sabado.toISOString().split('T')[0];
    const domFecha = domingo.toISOString().split('T')[0];
    let count = 0;
    await Promise.all(
      empleados.flatMap(emp => {
        const empId = emp.uid || emp.id || '';
        const turnosEmp = existentes.filter(t => t.empleadoId === empId);
        const numDescansos = turnosEmp.filter(t => t.tipo === 'descanso').length;
        if (numDescansos >= 2) return [];
        return [sabFecha, domFecha].map(fecha => {
          const yaExiste = turnosEmp.some(t => t.fecha === fecha);
          if (yaExiste) return Promise.resolve();
          count++;
          return crear({
            empleadoId: empId,
            empleadoNombre: emp.nombre || '',
            empleadoRol: emp.rol || '',
            fecha,
            tipo: 'descanso',
            inicio: null,
            fin: null,
            horas: 0,
            notas: 'Descanso auto-asignado',
            activo: true,
          });
        });
      })
    );
    return { success: true, count };
  } catch (error) {
    console.error('Error auto-assigning breaks:', error);
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
  copiarSemanaAnterior,
  limpiarSemana,
  aplicarPlantillaSemanal,
  autoAsignarDescansos,
  TIPOS_TURNO
};