import React, { useState, useEffect, useRef } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase.js';
import { useAuth } from '../context/AuthContext';
import { useEmpresa } from '../context/EmpresaContext';
import empresaService from '../services/empresaService';
import PageHeader from '../components/PageHeader';
import DisenoMarcaPanel from '../components/DisenoMarcaPanel';
import logoBlanco from '../assets/logo-blanco.png';
import logoColor from '../assets/logo-color.png';
import formatoPV from '../assets/formato-pv.png';
import { rgbCss, brandGradient, brandLuminance } from '../lib/brandColor';
import { resolveTheme, THEMES, isLightBranded, themeTextColor, resolveEmpresaLogo, resolveToken } from '../lib/empresaTheme';

// ── Color helpers (wrappers sobre lib/brandColor — fuente única) ──────────────
const toRgb = (e, extra = 0) => rgbCss(e, extra);
const toGradient = (e) => brandGradient(e, -0.12);
const luminance = (e) => brandLuminance(e);

// ── Color palette — mismos 13 presets (fuente única en lib/colorPresets) ─────
export { COLOR_PALETTE } from '../lib/colorPresets';
import { COLOR_PALETTE } from '../lib/colorPresets';

// ── Shared form styles ────────────────────────────────────────────────────────
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

// ── EmpresaCard — mismo lenguaje visual que los cards de Inicio/Sucursales:
//    card de gradiente diagonal, watermark del logo en la esquina y lockup
//    abajo-izquierda (GIRO → nombre → tagline). ───────────────────────────────
export function EmpresaCard({ empresa, onClick }) {
  const theme = resolveTheme(empresa);
  const tokens = THEMES[theme];
  const grad = tokens.cardGradient(empresa);
  const borderTok = resolveToken(tokens.border, empresa);
  const isLight = isLightBranded(empresa) || theme === 'elegantLight';
  const ink = themeTextColor(empresa);
  const textColor = ink === '#1B1B1B' || ink === '#000000' ? 'rgba(0,0,0,0.95)' : ink;
  const textMuted = ink === '#1B1B1B' || ink === '#000000' ? 'rgba(0,0,0,0.62)' : 'rgba(255,255,255,0.72)';
  const isDefault = empresa.id === empresaService.DEFAULT_EMPRESA_ID;
  const isClickable = !!onClick;
  const logoSrc = resolveEmpresaLogo(empresa, isLight);
  const hasLogo = !!logoSrc;
  // Wordmark de Punto Verde como fallback (color sobre fondos claros, blanco
  // sobre oscuros) — mismo criterio que los cards de Inicio/Sucursales.
  const wordmark = isLight ? logoColor : logoBlanco;
  const wordmarkBlend = isLight ? 'multiply' : 'normal';

  const pill = {
    background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
    borderRadius: 999, padding: '3px 9px', fontSize: 9, fontWeight: 800,
    color: 'rgba(255,255,255,0.92)', letterSpacing: 0.8, textTransform: 'uppercase',
  };

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', height: 184, padding: '0 16px 16px',
        cursor: isClickable ? 'pointer' : 'default',
        borderRadius: 20, overflow: 'hidden', background: grad,
        border: theme === 'neonParty' ? `${tokens.borderWidth} solid transparent` : `${tokens.borderWidth} solid ${borderTok}`,
        backgroundImage: theme === 'neonParty'
          ? `linear-gradient(${grad}, ${grad}), ${borderTok}`
          : undefined,
        backgroundOrigin: theme === 'neonParty' ? 'border-box' : undefined,
        backgroundClip: theme === 'neonParty' ? 'padding-box, border-box' : undefined,
        boxShadow: theme === 'neonParty' ? `0 6px 24px rgba(0,0,0,0.3), ${tokens.glow}` : '0 6px 24px rgba(0,0,0,0.3)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        textAlign: 'left', position: 'relative',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
      onMouseEnter={e => { if (isClickable) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(0,0,0,0.42)'; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.3)'; }}
    >
      {/* Tomate cortado en la esquina — igual que los cards de Formatos. */}
      <img
        src={formatoPV}
        alt=""
        style={{ position: 'absolute', top: -14, right: -14, height: '92%', width: 'auto', objectFit: 'contain', opacity: 0.92, pointerEvents: 'none' }}
      />

      {/* Badges arriba-izquierda */}
      {(empresa.activa || isDefault) && (
        <div style={{ position: 'absolute', top: 12, left: 14, display: 'flex', gap: 5 }}>
          {empresa.activa && <span style={pill}>Activa</span>}
          {isDefault && <span style={pill}>Principal</span>}
        </div>
      )}

      {/* Lockup abajo-izquierda */}
      <div style={{ position: 'relative' }}>
        {/* Wordmark visible (como en Inicio): el de la empresa si subió logo,
            si no el de Punto Verde. */}
        <img
          src={hasLogo ? logoSrc : wordmark}
          alt=""
          style={{ height: hasLogo ? 26 : 20, width: 'auto', maxWidth: '70%', objectFit: 'contain', objectPosition: 'left', display: 'block', marginBottom: 10, mixBlendMode: hasLogo ? 'normal' : wordmarkBlend, pointerEvents: 'none' }}
        />
        <div style={{ fontSize: 10, fontWeight: 800, color: textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
          {empresa.giro || 'Sin giro'}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: textColor, lineHeight: 1.1, letterSpacing: -0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {empresa.nombre || 'Empresa'}
        </div>
        {empresa.tagline && (
          <div style={{ fontSize: 12.5, fontWeight: 500, color: textMuted, lineHeight: 1.3, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {empresa.tagline}
          </div>
        )}
      </div>
    </button>
  );
}

// ── ColorPalette ──────────────────────────────────────────────────────────────
export function ColorPalette({ colorR, colorG, colorB, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {COLOR_PALETTE.map((c, i) => {
        const sel = Math.abs(colorR - c.r) < 0.01 && Math.abs(colorG - c.g) < 0.01 && Math.abs(colorB - c.b) < 0.01;
        const css = `rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`;
        return (
          <button
            key={i}
            onClick={() => onChange(c)}
            title={c.label}
            style={{
              width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
              background: css,
              border: sel ? '3px solid white' : '2.5px solid rgba(255,255,255,0.08)',
              outline: sel ? `2px solid ${css}` : 'none',
              outlineOffset: 2,
              transition: 'transform 0.1s',
            }}
          />
        );
      })}
    </div>
  );
}

// ── BrightnessSlider ──────────────────────────────────────────────────────────
export function BrightnessSlider({ value, onChange }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div>
      <label style={{ ...labelStyle, display: 'block', marginBottom: 6 }}>
        Brillo ({pct >= 0 ? '+' : ''}{pct}%)
      </label>
      <input
        type="range" min="-30" max="30"
        value={pct}
        onChange={e => onChange(parseInt(e.target.value) / 100)}
        style={{ width: '100%', accentColor: '#1A7A48' }}
      />
    </div>
  );
}

// ── EmpresaFormModal ──────────────────────────────────────────────────────────
function EmpresaFormModal({ empresa, onClose, onSaved, onDeleted, onOpenDiseno }) {
  const isEditing = !!empresa;
  const isDefault = empresa?.id === empresaService.DEFAULT_EMPRESA_ID;

  const [form, setForm] = useState(() => ({
    nombre: empresa?.nombre || '',
    giro: empresa?.giro || '',
    tagline: empresa?.tagline || '',
    colorR: empresa?.colorR ?? 0.059,
    colorG: empresa?.colorG ?? 0.302,
    colorB: empresa?.colorB ?? 0.176,
    brightness: empresa?.brightness ?? 0,
    activa: empresa?.activa !== false,
  }));

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(empresa?.logoUrl || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef(null);

  const isValid = form.nombre.trim() && form.giro.trim();

  const setColor = (c) => setForm(f => ({ ...f, colorR: c.r, colorG: c.g, colorB: c.b }));

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (id, file) => {
    const sRef = storageRef(storage, `empresas/${id}/logo.jpg`);
    const snap = await uploadBytes(sRef, file, { contentType: file.type || 'image/jpeg' });
    return await getDownloadURL(snap.ref);
  };

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    setError('');
    try {
      const data = { ...form };
      if (!logoFile && logoPreview === null) delete data.logoUrl;

      if (isEditing) {
        if (logoFile) data.logoUrl = await uploadLogo(empresa.id, logoFile);
        else if (logoPreview === null) data.logoUrl = null;
        const res = await empresaService.update(empresa.id, data);
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await empresaService.create(data);
        if (!res.success) throw new Error(res.error);
        if (logoFile) {
          const url = await uploadLogo(res.id, logoFile);
          await empresaService.update(res.id, { logoUrl: url });
        }
      }
      onSaved();
    } catch (e) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    const res = await empresaService.remove(empresa.id);
    if (res.success) {
      onDeleted();
    } else {
      setError(res.error);
      setSaving(false);
    }
  };

  const preview = {
    colorR: form.colorR, colorG: form.colorG, colorB: form.colorB,
    brightness: form.brightness,
    nombre: form.nombre || 'Empresa',
    giro: form.giro || 'Giro',
    tagline: form.tagline,
    logoUrl: logoPreview,
    activa: form.activa,
    id: empresa?.id || null,
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#141926', borderRadius: 22, width: '100%', maxWidth: 780, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 100px rgba(0,0,0,0.65)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 700, color: 'white' }}>
            {isEditing ? 'Editar empresa' : 'Nueva empresa'}
          </div>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.6fr)', minHeight: 0 }}>
          {/* Left — preview + logo */}
          <div style={{ padding: '22px 20px', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={labelStyle}>Vista previa</span>
            <EmpresaCard empresa={preview} onClick={null} />
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
            <button
              onClick={() => fileRef.current?.click()}
              style={{ padding: '9px 0', borderRadius: 10, border: '1.5px dashed rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.55)', fontSize: 13, cursor: 'pointer' }}
            >
              {logoPreview ? '🖼  Cambiar logo' : '📷  Subir logo (opcional)'}
            </button>
            {logoPreview && (
              <button
                onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                style={{ fontSize: 12, color: 'rgba(248,113,113,0.8)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}
              >
                Quitar logo
              </button>
            )}
          </div>

          {/* Right — form */}
          <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej. Punto Verde Centro"
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </div>
            <div>
              <label style={labelStyle}>Giro *</label>
              <input
                value={form.giro}
                onChange={e => setForm(f => ({ ...f, giro: e.target.value }))}
                placeholder="Ej. Tiendas de abarrotes"
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </div>
            <div>
              <label style={labelStyle}>Tagline</label>
              <input
                value={form.tagline}
                onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                placeholder="Descripción corta (opcional)"
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </div>

            <div>
              <label style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>Color de marca</label>
              <ColorPalette colorR={form.colorR} colorG={form.colorG} colorB={form.colorB} onChange={setColor} />
            </div>

            <BrightnessSlider value={form.brightness} onChange={v => setForm(f => ({ ...f, brightness: v }))} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox" id="emp-activa"
                checked={form.activa}
                onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))}
                style={{ width: 16, height: 16 }}
              />
              <label htmlFor="emp-activa" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, cursor: 'pointer' }}>Empresa activa</label>
            </div>

            {error && <div style={{ color: '#f87171', fontSize: 13, borderRadius: 8, background: 'rgba(248,113,113,0.1)', padding: '8px 12px' }}>{error}</div>}

            <button
              onClick={handleSave}
              disabled={!isValid || saving}
              style={{
                height: 46, borderRadius: 12, border: 'none',
                background: isValid && !saving ? '#1A7A48' : 'rgba(255,255,255,0.08)',
                color: 'white', fontWeight: 700, fontSize: 15,
                cursor: isValid && !saving ? 'pointer' : 'not-allowed',
              }}
            >
              {saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear empresa'}
            </button>

            {/* Diseño de marca — panel completo (colores, logo, iconografía, tema) */}
            {isEditing && (
              <button
                onClick={() => onOpenDiseno?.(empresa)}
                style={{ height: 44, borderRadius: 12, border: '1.5px solid rgba(198,160,82,0.5)', background: 'rgba(198,160,82,0.12)', color: '#E6D2A2', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <i className="bi bi-palette" /> Diseño de marca
              </button>
            )}

            {/* Danger zone */}
            {isEditing && !isDefault && (
              <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(239,68,68,0.15)' }}>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#f87171', fontSize: 14, cursor: 'pointer' }}
                  >
                    Eliminar empresa
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.55)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={handleDelete} disabled={saving} style={{ flex: 2, height: 40, borderRadius: 10, border: 'none', background: '#EF4444', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                      Confirmar eliminación
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Empresas() {
  const { empleado } = useAuth();
  const { reload: reloadEmpresas } = useEmpresa();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | empresa-object
  const [diseno, setDiseno] = useState(null); // empresa cuyo panel de marca está abierto

  const isAdmin = empleado?.rol === 'admin';

  const load = async () => {
    setLoading(true);
    // Leer primero: el spinner se apaga apenas tengamos datos.
    try {
      const res = await empresaService.fetchAll();
      if (res.success) setEmpresas(res.data);
    } catch (e) {
      console.error('Empresas: error al cargar', e);
    } finally {
      setLoading(false);
    }
    // Asegurar el doc default en segundo plano (no bloquea el spinner);
    // si crea algo nuevo, refrescamos la lista.
    empresaService.asegurarDefault()
      .then((r) => (r?.success ? empresaService.fetchAll() : null))
      .then((r) => { if (r?.success) setEmpresas(r.data); })
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleSaved = () => { setModal(null); load(); reloadEmpresas(); };
  const handleDeleted = () => { setModal(null); load(); reloadEmpresas(); };

  if (!isAdmin) {
    return (
      <div className="inicio-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <i className="bi bi-building-lock" style={{ fontSize: 44, color: 'rgba(255,255,255,0.35)' }} />
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, margin: 0 }}>Acceso restringido a administradores</p>
      </div>
    );
  }

  return (
    <div className="inicio-page">
      <div className="inicio-inner">
        <PageHeader
          title="Empresas"
          actions={
            <button
              onClick={() => setModal('new')}
              title="Nueva empresa"
              style={{
                width: 42, height: 42, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.18)', color: 'white',
                fontSize: 22, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', lineHeight: 1,
              }}
            >+</button>
          }
        />

        {/* Cards grid */}
        <div style={{ padding: '0 20px 48px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <div className="spinner-border" style={{ color: 'rgba(255,255,255,0.4)', width: 30, height: 30, borderWidth: 3 }} />
            </div>
          ) : empresas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.5)' }}>
              <i className="bi bi-building" style={{ fontSize: 44, display: 'block', marginBottom: 14 }} />
              <p style={{ margin: 0, fontSize: 15 }}>Sin empresas registradas</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 18 }}>
              {empresas.map(e => (
                <EmpresaCard key={e.id} empresa={e} onClick={() => setModal(e)} />
              ))}
            </div>
          )}
        </div>
      </div>{/* /inicio-inner */}

      {/* Modals */}
      {modal === 'new' && (
        <EmpresaFormModal onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal && modal !== 'new' && (
        <EmpresaFormModal
          empresa={modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onOpenDiseno={(e) => { setModal(null); setDiseno(e); }}
        />
      )}

      {diseno && (
        <DisenoMarcaPanel
          empresa={diseno}
          onClose={() => setDiseno(null)}
          onSaved={() => { load(); reloadEmpresas(); }}
        />
      )}
    </div>
  );
}
