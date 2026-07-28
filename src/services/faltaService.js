// ============================================================
// FaltaService — ausencias (`faltas`) y vacaciones (`vacaciones`).
// Réplica de DATA_LAYER_SPEC §FaltaService. Fechas de empleado como string
// ISO8601 (no Timestamp). Faltaba en la web (módulo RH incompleto).
// ============================================================
import { db } from '../firebase.js';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

export const TIPOS_FALTA = ['injustificada', 'justificada', 'permiso'];

/** Faltas de un empleado en un mes (año, mes 1-12). Filtra por prefijo ISO `YYYY-MM`. */
export const fetchMes = async (empleadoUid, anio, mes) => {
  try {
    const snap = await getDocs(query(collection(db, 'faltas'), where('empleadoUid', '==', empleadoUid)));
    const prefijo = `${anio}-${String(mes).padStart(2, '0')}`;
    const data = [];
    snap.forEach((d) => { const f = { id: d.id, ...d.data() }; if ((f.fecha || '').startsWith(prefijo)) data.push(f); });
    return { success: true, data };
  } catch (e) { return { success: false, error: e.message }; }
};

/** Registra una falta: { empleadoUid, fecha(ISO YYYY-MM-DD), tipo, notas }. */
export const registrar = async (falta) => {
  try {
    const ref = doc(collection(db, 'faltas'));
    await setDoc(ref, { ...falta, createdAt: serverTimestamp() });
    return { success: true, id: ref.id };
  } catch (e) { return { success: false, error: e.message }; }
};

/** Suma de días de vacaciones USADOS (aprobado:true) de un empleado en un año. */
export const fetchDiasVacacionesUsados = async (empleadoUid, anio) => {
  try {
    const snap = await getDocs(query(
      collection(db, 'vacaciones'),
      where('empleadoUid', '==', empleadoUid),
      where('año', '==', anio), // campo literal con ñ (match Swift, mismo Firestore)
    ));
    let dias = 0;
    snap.forEach((d) => { const v = d.data(); if (v.aprobado) dias += (v.dias || 0); });
    return { success: true, dias };
  } catch (e) { return { success: false, error: e.message, dias: 0 }; }
};

/** Registra un periodo de vacaciones: { empleadoUid, anio, dias, aprobado }. */
export const registrarVacaciones = async (vac) => {
  try {
    const ref = doc(collection(db, 'vacaciones'));
    await setDoc(ref, { ...vac, createdAt: serverTimestamp() });
    return { success: true, id: ref.id };
  } catch (e) { return { success: false, error: e.message }; }
};

export default { TIPOS_FALTA, fetchMes, registrar, fetchDiasVacacionesUsados, registrarVacaciones };
