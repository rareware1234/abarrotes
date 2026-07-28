import React, { useState, useRef } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase.js';
import formatoCustomService from '../services/formatoCustomService';
import { ColorPalette, BrightnessSlider } from '../pages/Empresas';
import { SERVICE_ICONS, sfToBi, perfilBaseline } from '../data/formatos';
import { brandGradient, brandLuminance } from '../lib/brandColor';

// ── Color helpers (wrappers sobre lib/brandColor — fuente única) ──────────────
const toGradient = (e) => brandGradient(e, -0.12);
const luminance = (e) => brandLuminance(e);

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1.5px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)', color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
const labelStyle = {
  fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
  letterSpacing: 0.7, textTransform: 'uppercase',
};
const numInputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  border: '1.5px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)', color: 'white',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
};
const numLabelStyle = {
  fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.50)',
  display: 'block', marginBottom: 4,
};

// ── Preview card — formato card style matching paso 1 ────────────────────────
function FormatoPreviewCard({ formato }) {
  const grad = toGradient(formato);
  const lum = luminance(formato) + (formato.brightness || 0);
  const isLight = lum > 0.45;
  const textColor = isLight ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)';
  const textMuted = isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)';
  const initials = (formato.nombre || 'F').slice(0, 2).toUpperCase();

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.35)' }}>
      <div style={{ height: 130, background: grad, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative', padding: '12px 16px' }}>
        {formato.logoUrl
          ? <img src={formato.logoUrl} alt="" style={{ maxHeight: 50, maxWidth: '80%', objectFit: 'contain' }} />
          : <span style={{ fontSize: 32, fontWeight: 900, color: textColor, letterSpacing: -1 }}>{initials}</span>
        }
        {formato.tagline && (
          <span style={{ fontSize: 11, color: textMuted, textAlign: 'center', lineHeight: 1.3 }}>{formato.tagline}</span>
        )}
        <span style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: 1, textTransform: 'uppercase' }}>
          CUSTOM
        </span>
      </div>
      <div style={{ background: 'rgba(15,18,28,0.85)', padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {formato.nombre || 'Nuevo formato'}
        </div>
      </div>
    </div>
  );
}

// ── Icon picker (popover grid de SERVICE_ICONS) ──────────────────────────────
function IconPicker({ icono, onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.08)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <i className={`bi ${sfToBi(icono)}`} style={{ fontSize: 15 }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: 40, left: 0, zIndex: 31, background: '#1b2233', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 8, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, width: 232, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
            {SERVICE_ICONS.map(opt => (
              <button
                key={opt.sf}
                type="button"
                title={opt.label}
                onClick={() => { onPick(opt.sf); setOpen(false); }}
                style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: opt.sf === icono ? 'rgba(255,255,255,0.22)' : 'transparent', color: 'white' }}
              >
                <i className={`bi ${opt.bi}`} style={{ fontSize: 14 }} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function NuevoFormatoModal({ onClose, onCreated, editing = null, onDeleted }) {
  const isEditing = !!editing;
  const baseP = editing?.perfilData || perfilBaseline();

  const [form, setForm] = useState({
    nombre: editing?.nombre || '',
    tagline: editing?.tagline || '',
    colorR: editing?.colorR ?? 0.059,
    colorG: editing?.colorG ?? 0.302,
    colorB: editing?.colorB ?? 0.176,
    brightness: editing?.brightness ?? 0,
  });

  // Mostrar/ocultar el nombre del formato en su card (default: mostrar).
  const [mostrarNombre, setMostrarNombre] = useState(editing?.mostrarNombre ?? true);

  // Servicios / características (icono = nombre SF Symbol)
  const [caracteristicas, setCaracteristicas] = useState(() => {
    const src = (editing?.caracteristicas?.length ? editing.caracteristicas : baseP.caracteristicas) || [];
    return src.map(c => ({ icono: c.icono || 'checkmark.seal.fill', titulo: c.titulo || '', detalle: c.detalle || '' }));
  });

  // Perfil (strings para edición libre)
  const [perfil, setPerfil] = useState({
    areaMin: String(baseP.areaMin ?? ''), areaMax: String(baseP.areaMax ?? ''),
    anchoSugerido: String(baseP.anchoSugerido ?? ''), largoSugerido: String(baseP.largoSugerido ?? ''),
    empleadosMin: String(baseP.empleadosMin ?? ''), empleadosMax: String(baseP.empleadosMax ?? ''),
    cajas: String(baseP.cajas ?? 1),
    inventarioSugerido: String(baseP.inventarioSugerido ?? ''), rentaTipica: String(baseP.rentaTipica ?? ''),
    serviciosTipicos: String(baseP.serviciosTipicos ?? ''), ventasTipicaMensual: String(baseP.ventasTipicaMensual ?? ''),
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(editing?.logoUrl || null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const isValid = form.nombre.trim().length > 0;
  const pNum = (v) => parseFloat(String(v).replace(/[^0-9.]/g, '')) || 0;
  const pInt = (v) => Math.round(pNum(v));

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const setCar = (i, patch) => setCaracteristicas(prev => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c));
  const addCar = () => setCaracteristicas(prev => [...prev, { icono: 'checkmark.seal.fill', titulo: '', detalle: '' }]);
  const delCar = (i) => setCaracteristicas(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    setError('');
    try {
      const cleanCar = caracteristicas
        .filter(c => c.titulo.trim())
        .map(c => {
          const out = { icono: c.icono, titulo: c.titulo.trim() };
          if (c.detalle.trim()) out.detalle = c.detalle.trim();
          return out;
        });

      const perfilData = {
        tagline: form.tagline.trim(),
        areaMin: pInt(perfil.areaMin), areaMax: pInt(perfil.areaMax),
        anchoSugerido: pNum(perfil.anchoSugerido), largoSugerido: pNum(perfil.largoSugerido),
        empleadosMin: pInt(perfil.empleadosMin), empleadosMax: pInt(perfil.empleadosMax),
        cajas: Math.max(1, pInt(perfil.cajas)),
        inventarioSugerido: pNum(perfil.inventarioSugerido), rentaTipica: pNum(perfil.rentaTipica),
        serviciosTipicos: pNum(perfil.serviciosTipicos), ventasTipicaMensual: pNum(perfil.ventasTipicaMensual),
        caracteristicas: cleanCar,
      };

      const data = {
        nombre: form.nombre.trim(),
        tagline: form.tagline.trim(),
        shortName: editing?.shortName || '',
        iconName: editing?.iconName || 'building.2.fill',
        colorR: form.colorR, colorG: form.colorG, colorB: form.colorB,
        brightness: form.brightness,
        mostrarNombre,
        caracteristicas: cleanCar,
        perfilData,
      };

      let id = editing?.id;
      if (isEditing) {
        const res = await formatoCustomService.update(id, data);
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await formatoCustomService.create(data);
        if (!res.success) throw new Error(res.error);
        id = res.id;
      }

      if (logoFile) {
        const sRef = storageRef(storage, `formatos_custom/${id}/logo.jpg`);
        const snap = await uploadBytes(sRef, logoFile, { contentType: logoFile.type || 'image/jpeg' });
        const url = await getDownloadURL(snap.ref);
        await formatoCustomService.update(id, { logoUrl: url });
        data.logoUrl = url;
      } else if (editing?.logoUrl && logoPreview === null) {
        await formatoCustomService.update(id, { logoUrl: null });
        data.logoUrl = null;
      } else if (editing?.logoUrl) {
        data.logoUrl = editing.logoUrl;
      }

      onCreated({ id, ...data });
    } catch (e) {
      setError(e.message || 'Error al guardar formato');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing?.id) return;
    setDeleting(true);
    const res = await formatoCustomService.remove(editing.id);
    if (res.success) {
      onDeleted?.(editing.id);
    } else {
      setError(res.error || 'Error al eliminar');
      setDeleting(false);
    }
  };

  const preview = {
    colorR: form.colorR, colorG: form.colorG, colorB: form.colorB,
    brightness: form.brightness, nombre: form.nombre, tagline: form.tagline, logoUrl: logoPreview,
  };

  // Función (no componente) para evitar remount/pérdida de foco por tecla.
  const numField = (label, fkey) => (
    <div key={fkey} style={{ flex: '1 1 0', minWidth: 0 }}>
      <label style={numLabelStyle}>{label}</label>
      <input
        type="number" value={perfil[fkey]}
        onChange={e => setPerfil(p => ({ ...p, [fkey]: e.target.value }))}
        placeholder="0" style={numInputStyle}
      />
    </div>
  );

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#141926', borderRadius: 22, width: '100%', maxWidth: 720, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 100px rgba(0,0,0,0.65)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 700, color: 'white' }}>{isEditing ? 'Editar formato' : 'Nuevo formato'}</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 0 }}>
          {/* Left — preview */}
          <div style={{ padding: '20px 18px', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={labelStyle}>Vista previa</span>
            <FormatoPreviewCard formato={preview} />
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
            <button onClick={() => fileRef.current?.click()} style={{ padding: '8px 0', borderRadius: 10, border: '1.5px dashed rgba(255,255,255,0.18)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>
              {logoPreview ? '🖼  Cambiar logo' : '📷  Subir logo (opcional)'}
            </button>
            {logoPreview && (
              <button onClick={() => { setLogoFile(null); setLogoPreview(null); }} style={{ fontSize: 11, color: 'rgba(248,113,113,0.7)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}>Quitar logo</button>
            )}
          </div>

          {/* Right — form */}
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
            <div>
              <label style={labelStyle}>Nombre del formato *</label>
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej. Punto Verde Premium" style={{ ...inputStyle, marginTop: 6 }} autoFocus />
            </div>
            <div>
              <label style={labelStyle}>Tagline</label>
              <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="Descripción corta (opcional)" style={{ ...inputStyle, marginTop: 6 }} />
            </div>

            <div>
              <label style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>Color de identidad</label>
              <ColorPalette colorR={form.colorR} colorG={form.colorG} colorB={form.colorB} onChange={c => setForm(f => ({ ...f, colorR: c.r, colorG: c.g, colorB: c.b }))} />
            </div>

            <BrightnessSlider value={form.brightness} onChange={v => setForm(f => ({ ...f, brightness: v }))} />

            {/* ── Mostrar nombre en el card ── */}
            <button
              type="button"
              onClick={() => setMostrarNombre(m => !m)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'left' }}
            >
              <i
                className={`bi ${mostrarNombre ? 'bi-check-square-fill' : 'bi-square'}`}
                style={{ fontSize: 18, color: mostrarNombre ? '#1A7A48' : 'rgba(255,255,255,0.7)' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Mostrar nombre en el card</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Si lo desactivas, el card solo muestra el logo.</span>
              </div>
            </button>

            {/* ── Servicios ── */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ ...labelStyle, flex: 1 }}>Servicios</span>
                <button onClick={addCar} style={{ background: 'rgba(26,122,72,0.25)', border: '1px solid rgba(26,122,72,0.4)', color: '#86efac', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Agregar</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {caracteristicas.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <IconPicker icono={c.icono} onPick={(sf) => setCar(i, { icono: sf })} />
                    <input value={c.titulo} onChange={e => setCar(i, { titulo: e.target.value })} placeholder="Servicio" style={{ ...inputStyle, padding: '7px 10px', fontSize: 13 }} />
                    <button onClick={() => delCar(i)} style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 8, border: 'none', background: 'rgba(248,113,113,0.12)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bi bi-trash" style={{ fontSize: 13 }} />
                    </button>
                  </div>
                ))}
                {caracteristicas.length === 0 && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Sin servicios. Agrega al menos uno.</div>
                )}
              </div>
            </div>

            {/* ── Perfil ── */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span style={labelStyle}>Perfil</span>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>Dimensiones (m²)</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {numField('Área mín', 'areaMin')}
                  {numField('Área máx', 'areaMax')}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  {numField('Ancho (m)', 'anchoSugerido')}
                  {numField('Largo (m)', 'largoSugerido')}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>Personal y cajas</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {numField('Empleados mín', 'empleadosMin')}
                  {numField('Empleados máx', 'empleadosMax')}
                  {numField('Cajas', 'cajas')}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>Economía mensual ($)</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {numField('Inventario inicial', 'inventarioSugerido')}
                  {numField('Renta típica', 'rentaTipica')}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  {numField('Servicios', 'serviciosTipicos')}
                  {numField('Ventas mensuales', 'ventasTipicaMensual')}
                </div>
              </div>
            </div>

            {error && <div style={{ color: '#f87171', fontSize: 13, borderRadius: 8, background: 'rgba(248,113,113,0.1)', padding: '8px 12px' }}>{error}</div>}

            <button
              onClick={handleSave}
              disabled={!isValid || saving}
              style={{ height: 46, borderRadius: 12, border: 'none', background: isValid && !saving ? '#1A7A48' : 'rgba(255,255,255,0.08)', color: 'white', fontWeight: 700, fontSize: 15, cursor: isValid && !saving ? 'pointer' : 'not-allowed', marginTop: 4 }}
            >
              {saving ? (isEditing ? 'Guardando…' : 'Creando…') : (isEditing ? 'Guardar cambios' : 'Crear formato')}
            </button>

            {isEditing && onDeleted && (
              <div style={{ paddingTop: 6 }}>
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)} style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#f87171', fontSize: 14, cursor: 'pointer' }}>
                    Eliminar formato
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.55)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={handleDelete} disabled={deleting} style={{ flex: 2, height: 40, borderRadius: 10, border: 'none', background: '#EF4444', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                      {deleting ? 'Eliminando…' : 'Confirmar eliminación'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isEditing && (
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                El perfil define las proyecciones por default de la cotización. Puedes ajustarlo después.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
