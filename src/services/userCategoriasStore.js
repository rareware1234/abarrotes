// ============================================================
// UserCategoriasStore (doc §9.3) — categorías creadas por el usuario.
// Réplica 1:1 del store de Swift.
//
//  - userCreated: set de nombres PERSISTIDO (localStorage key
//    `user.created.categorias.v1`, namespaced por empresa) + se sube a Firestore
//    (colección `userCategorias`, doc id = empresaId, campo `nombres`). Sobrevive
//    reinicios.
//  - fromProductos: set derivado en runtime de los productos. NO persiste.
//  - Lista mostrada = userCreated ∪ fromProductos. Si vacía, categorías default
//    por marca (ej. Kaal → ["Anillos"]).
//  - CRÍTICO: al crear la primera categoría real, primero se "sellan" los
//    defaults dentro de userCreated para que no desaparezcan.
// ============================================================
import { db } from '../firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { resolveTheme } from '../lib/empresaTheme';

const COLLECTION = 'userCategorias';
const LS_PREFIX = 'user.created.categorias.v1';

const lsKey = (empresaId) => `${LS_PREFIX}::${empresaId || 'default-pv'}`;

/* ── Categorías default por marca (estado vacío) ──────────────────────────── */
export const defaultCategorias = (empresa) => {
  const theme = resolveTheme(empresa);
  if (theme === 'elegantLight') return ['Anillos']; // Kaal
  return [];
};

/* ── userCreated: localStorage + Firestore ────────────────────────────────── */
const loadLocal = (empresaId) => {
  try {
    const arr = JSON.parse(localStorage.getItem(lsKey(empresaId)) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
};
const saveLocal = (empresaId, nombres) => {
  try { localStorage.setItem(lsKey(empresaId), JSON.stringify([...nombres])); } catch { /* quota */ }
};

/**
 * Carga userCreated: local primero, luego mergea el remoto (unión). Devuelve un
 * Set de nombres. No lanza si Firestore falla (queda solo local).
 */
export const loadUserCreated = async (empresaId) => {
  const set = new Set(loadLocal(empresaId));
  try {
    const snap = await getDoc(doc(db, COLLECTION, empresaId || 'default-pv'));
    if (snap.exists()) {
      for (const n of snap.data().nombres || []) set.add(n);
      saveLocal(empresaId, set);
    }
  } catch { /* offline: solo local */ }
  return set;
};

const persist = async (empresaId, set) => {
  saveLocal(empresaId, set);
  try {
    await setDoc(doc(db, COLLECTION, empresaId || 'default-pv'), { nombres: [...set] }, { merge: true });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

/* ── Derivado de productos (no persiste) ──────────────────────────────────── */
export const fromProductos = (products) =>
  new Set((products || []).map((p) => p.categoria).filter(Boolean));

/**
 * Lista de categorías a mostrar = userCreated ∪ fromProductos. Si el resultado
 * es vacío, devuelve las categorías default de la marca.
 */
export const listCategorias = (userCreated, products, empresa) => {
  const union = new Set([...(userCreated || []), ...fromProductos(products)]);
  if (union.size === 0) return defaultCategorias(empresa);
  return [...union].sort((a, b) => a.localeCompare(b));
};

/**
 * Crea una categoría. Si userCreated está vacío (primera categoría real), sella
 * los defaults de la marca dentro de userCreated para que no desaparezcan.
 * Devuelve el nuevo Set de userCreated.
 */
export const addCategoria = async (empresaId, nombre, userCreated, empresa) => {
  const set = new Set(userCreated || []);
  if (set.size === 0) {
    for (const d of defaultCategorias(empresa)) set.add(d); // sellar defaults
  }
  const clean = (nombre || '').trim();
  if (clean) set.add(clean);
  await persist(empresaId, set);
  return set;
};

/** Renombra en userCreated (si existe). Devuelve el nuevo Set. */
export const renameCategoria = async (empresaId, oldNombre, newNombre, userCreated) => {
  const set = new Set(userCreated || []);
  if (set.has(oldNombre)) { set.delete(oldNombre); set.add((newNombre || '').trim()); }
  await persist(empresaId, set);
  return set;
};

/** Elimina de userCreated (no borra productos). Devuelve el nuevo Set. */
export const removeCategoria = async (empresaId, nombre, userCreated) => {
  const set = new Set(userCreated || []);
  set.delete(nombre);
  await persist(empresaId, set);
  return set;
};

export default {
  defaultCategorias, loadUserCreated, fromProductos, listCategorias,
  addCategoria, renameCategoria, removeCategoria,
};
