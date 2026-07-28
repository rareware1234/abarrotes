import { db } from '../firebase.js';
import { collection, doc, setDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';

const COL = 'registros_actividad';

export const registrar = async ({ tiendaId, tiendaNombre, accion, descripcion, realizadoPor, realizadoPorId, datosAnteriores = '' }) => {
  try {
    const ref = doc(collection(db, COL));
    await setDoc(ref, {
      tiendaId, tiendaNombre, accion, descripcion,
      realizadoPor, realizadoPorId,
      datosAnteriores,
      fecha: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error registering activity:', error);
    return { success: false, error: error.message };
  }
};

export const fetchPorTienda = async (tiendaId, max = 50) => {
  try {
    const q = query(
      collection(db, COL),
      where('tiendaId', '==', tiendaId),
      limit(max)
    );
    const snap = await getDocs(q);
    const registros = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Sort client-side to avoid needing a composite index
    registros.sort((a, b) => {
      const ta = a.fecha?.toDate ? a.fecha.toDate().getTime() : 0;
      const tb = b.fecha?.toDate ? b.fecha.toDate().getTime() : 0;
      return tb - ta;
    });
    return { success: true, data: registros };
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return { success: false, error: error.message };
  }
};

export const fetchPorEmpleado = async (empleadoId, max = 20) => {
  try {
    const q = query(
      collection(db, COL),
      where('realizadoPorId', '==', empleadoId),
      limit(max)
    );
    const snap = await getDocs(q);
    const registros = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    registros.sort((a, b) => {
      const ta = a.fecha?.toDate ? a.fecha.toDate().getTime() : 0;
      const tb = b.fecha?.toDate ? b.fecha.toDate().getTime() : 0;
      return tb - ta;
    });
    return { success: true, data: registros };
  } catch (error) {
    console.error('Error fetching employee activity:', error);
    return { success: false, error: error.message };
  }
};

export default { registrar, fetchPorTienda, fetchPorEmpleado };
