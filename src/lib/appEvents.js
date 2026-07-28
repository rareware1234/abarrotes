// ============================================================
// Bus de eventos ligero, agnóstico de plataforma (funciona en web y RN).
// Réplica del patrón NotificationCenter de Swift (ej. `cajaActualizada`).
// ============================================================
const listeners = {};

/** Emite un evento a todos los suscriptores. */
export const emit = (evento, payload) => {
  (listeners[evento] || []).forEach((fn) => {
    try { fn(payload); } catch (e) { console.error('appEvents listener', e); }
  });
};

/** Suscribe a un evento. Devuelve función para desuscribir. */
export const on = (evento, fn) => {
  (listeners[evento] ||= []).push(fn);
  return () => { listeners[evento] = (listeners[evento] || []).filter((f) => f !== fn); };
};

// Nombres de eventos (constantes para evitar typos).
export const CAJA_ACTUALIZADA = 'cajaActualizada';
export const ORDEN_CREADA = 'ordenCreada';
