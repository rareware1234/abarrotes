// ============================================================
// Utilidades de imagen para el panel de marca — redimensiona a PNG con alpha y
// devuelve base64 (sin prefijo data:), para caber en el límite de 1MB de un
// doc de Firestore (doc §5.3: ≤800px, PNG con alpha preservado).
// ============================================================

/** Lee un File a data URL. */
export const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

/**
 * Redimensiona un File de imagen a un PNG cuadrado-contenido ≤ maxPx (preserva
 * alpha y proporción). Devuelve { base64, dataUrl }. Para SVG, se rasteriza al
 * tamaño dado. `base64` va sin el prefijo `data:image/png;base64,`.
 */
export const resizeToPngBase64 = async (file, maxPx = 512) => {
  const dataUrl = await fileToDataUrl(file);
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });
  const w = img.naturalWidth || maxPx;
  const h = img.naturalHeight || maxPx;
  const scale = Math.min(1, maxPx / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, cw, ch); // preserva transparencia
  ctx.drawImage(img, 0, 0, cw, ch);
  const out = canvas.toDataURL('image/png');
  return { base64: out.split(',')[1], dataUrl: out };
};

/** Nombre de archivo sin extensión (para prellenar el nombre del asset, doc §6.1). */
export const nombreSinExtension = (filename) =>
  (filename || '').replace(/\.[^/.]+$/, '').trim();
