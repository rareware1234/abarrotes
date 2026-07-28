// ============================================================
// MarcaCustomizationStore (doc §9.2) — personalizaciones por "marca/clave".
// Réplica 1:1 del store de Swift.
//
// Dos capas: cache local (localStorage) + Firestore colección
// `marcaCustomizaciones` (un doc por clave normalizada). Guarda 3 tipos de valor
// por clave: color {r,g,b}, logo (base64), y string genérico (campo razonSocial).
// Merge remoto pisa local; conserva claves locales aún no subidas.
//
// Shape de doc en Firestore (compatible con el resto de la web):
//   color  → campos { r, g, b }   (0–1)
//   logo   → campo  logoBase64     (string base64, sin prefijo data:)
//   string → campo  razonSocial    (string genérico reusado como key-value)
//
// La clave se NORMALIZA (normalizarClave) sobre el string COMPLETO incluyendo
// el prefijo, antes de leer/escribir. El id del doc ES la clave normalizada.
// ============================================================
import { db } from '../firebase.js';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { normalizarClave, normalizarCategoria } from '../lib/normalizar';

const COLLECTION = 'marcaCustomizaciones';
const LS_KEY = 'marca.customizaciones.v1';

/* ── Estado del singleton ─────────────────────────────────────────────────── */
let cache = {};              // { claveNorm: { color:{r,g,b}|null, logo:string|null, str:string|null } }
const pending = new Set();   // claves editadas localmente aún no confirmadas en remoto
let loaded = false;
const listeners = new Set();

const emit = () => { for (const l of listeners) l(cache); };

/** Suscribe a cambios del store. Devuelve función para desuscribir. */
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

/* ── Persistencia local ───────────────────────────────────────────────────── */
const loadLocal = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
};
const saveLocal = () => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(cache)); } catch { /* quota */ }
};

/* ── Mapear un doc de Firestore al shape interno ──────────────────────────── */
const fromDoc = (data) => ({
  color: (typeof data.r === 'number' && typeof data.g === 'number' && typeof data.b === 'number')
    ? { r: data.r, g: data.g, b: data.b } : null,
  logo: data.logoBase64 || null,
  str: data.razonSocial || null,
});

/* ── Carga inicial: merge remoto sobre local (remoto pisa; locales no subidas
     sobreviven vía `pending`). ────────────────────────────────────────────── */
export const load = async () => {
  cache = loadLocal();
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    const remote = {};
    snap.forEach((d) => { remote[d.id] = fromDoc(d.data()); });
    const merged = { ...cache, ...remote };
    // Conserva claves locales aún no subidas (pending) por encima del remoto.
    for (const k of pending) if (cache[k]) merged[k] = cache[k];
    cache = merged;
    loaded = true;
    saveLocal();
    emit();
    return { success: true };
  } catch (e) {
    loaded = true; // seguimos con la cache local
    emit();
    return { success: false, error: e.message };
  }
};

export const isLoaded = () => loaded;
export const snapshot = () => cache;

/* ── Lectura tipada (clave completa, ya con prefijo) ──────────────────────── */
export const getColor = (key) => cache[normalizarClave(key)]?.color || null;
export const getLogo = (key) => cache[normalizarClave(key)]?.logo || null;
export const getString = (key) => cache[normalizarClave(key)]?.str || null;

/* ── Escritura tipada (write-through a Firestore + cache + localStorage) ──── */
const writeDoc = async (norm, fields) => {
  pending.add(norm);
  saveLocal();
  emit();
  try {
    await setDoc(doc(db, COLLECTION, norm), fields, { merge: true });
    pending.delete(norm);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message }; // queda en pending para reintento
  }
};

export const setColor = async (key, rgb) => {
  const norm = normalizarClave(key);
  cache[norm] = { ...(cache[norm] || {}), color: rgb ? { r: rgb.r, g: rgb.g, b: rgb.b } : null };
  return writeDoc(norm, { r: rgb.r, g: rgb.g, b: rgb.b });
};

export const setLogo = async (key, base64) => {
  const norm = normalizarClave(key);
  cache[norm] = { ...(cache[norm] || {}), logo: base64 || null };
  return writeDoc(norm, { logoBase64: base64 || '' });
};

export const setString = async (key, value) => {
  const norm = normalizarClave(key);
  cache[norm] = { ...(cache[norm] || {}), str: value || null };
  return writeDoc(norm, { razonSocial: value || '' });
};

export const remove = async (key) => {
  const norm = normalizarClave(key);
  delete cache[norm];
  pending.delete(norm);
  saveLocal();
  emit();
  try { await deleteDoc(doc(db, COLLECTION, norm)); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
};

/* ════════════════════════════════════════════════════════════════════════
   Helpers namespaced de categoría (doc §9.2, tabla de claves).
   El prefijo va DENTRO de la clave; la normalización aplica al string completo.
   Para categorías usamos normalizarCategoria en el segmento de categoría para
   casar plural/singular igual que la resolución de ícono (§8.1).
   ════════════════════════════════════════════════════════════════════════ */
const catKey = (prefix, categoria) => `${prefix}::${normalizarCategoria(categoria)}`;

// cat::<categoria>            → color de fondo custom
export const getCatColor = (cat) => getColor(catKey('cat', cat));
export const setCatColor = (cat, rgb) => setColor(catKey('cat', cat), rgb);
export const clearCatColor = (cat) => remove(catKey('cat', cat));

// catname::<categoria>        → nombre display custom
export const getCatName = (cat) => getString(catKey('catname', cat));
export const setCatName = (cat, v) => setString(catKey('catname', cat), v);

// catdesc::<categoria>        → descripción custom
export const getCatDesc = (cat) => getString(catKey('catdesc', cat));
export const setCatDesc = (cat, v) => setString(catKey('catdesc', cat), v);

// caticon::<categoria>        → nombre de asset bundled (fallback)
export const getCatIconBundled = (cat) => getString(catKey('caticon', cat));
export const setCatIconBundled = (cat, v) => setString(catKey('caticon', cat), v);

// caticonasset::<categoria>   → enlace al ícono de marca = nombre del asset (durable) o id (legacy)
export const getCatIconAsset = (cat) => getString(catKey('caticonasset', cat));
export const setCatIconAsset = (cat, v) => setString(catKey('caticonasset', cat), v);

// cattextcolor::<categoria>   → negro | blanco | dorado
export const getCatTextColor = (cat) => getString(catKey('cattextcolor', cat));
export const setCatTextColor = (cat, v) => setString(catKey('cattextcolor', cat), v);

// catformatos::<categoria>    → CSV de formatos (legacy PV)
export const getCatFormatos = (cat) => getString(catKey('catformatos', cat));
export const setCatFormatos = (cat, v) => setString(catKey('catformatos', cat), v);

export default {
  load, isLoaded, snapshot, subscribe,
  getColor, getLogo, getString, setColor, setLogo, setString, remove,
  getCatColor, setCatColor, clearCatColor,
  getCatName, setCatName, getCatDesc, setCatDesc,
  getCatIconBundled, setCatIconBundled, getCatIconAsset, setCatIconAsset,
  getCatTextColor, setCatTextColor, getCatFormatos, setCatFormatos,
};
