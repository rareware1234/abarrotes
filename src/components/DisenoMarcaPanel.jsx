// ============================================================
// Panel "Diseño de Marca" (doc §10) — port del panel de personalización de
// marca de la app Swift. Cuatro secciones, cada una con su propio botón Guardar:
//   1. Colores        — 8 roles de brandPalette + modo de texto (§10.1)
//   2. Logo           — wordmark de texto + monograma (§10.2, §5)
//   3. Colecciones    — iconografía (íconos de categoría) (§10.3, §6)
//   4. Tema / Fuentes — tema base + fuentes de titulares/textos (§4)
//
// Edita campos del doc de empresa (brandPalette, textColorMode, logoTexto,
// logoFontRaw, logoPeso, logoTracking, logoIniciales, colecciones, theme,
// brandFontTitleRaw, brandFontBodyRaw) vía empresaService.update.
// ============================================================
import React, { useState } from 'react';
import empresaService from '../services/empresaService';
import {
  BRAND_ROLE_ORDER, BRAND_ROLES, brandColor, goldGradient, normalizeHex,
} from '../lib/brandRoles';
import { BRAND_FONT_ORDER, FONT_LABEL } from '../lib/brandFont';
import { wordmarkStyle, emblemaIniciales } from '../lib/logoResolver';
import { resolveTheme } from '../lib/empresaTheme';
import {
  iconografiaAssets, assetDataUrl, ICONOGRAFIA_ID,
} from '../lib/categoriaBrandIcon';
import { resizeToPngBase64, nombreSinExtension } from '../lib/imageUtil';

const SECTIONS = [
  { id: 'colores', label: 'Colores', icon: 'bi-palette' },
  { id: 'logo', label: 'Logo', icon: 'bi-type' },
  { id: 'colecciones', label: 'Colecciones', icon: 'bi-images' },
  { id: 'tema', label: 'Tema y fuentes', icon: 'bi-sliders' },
];

const label = { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.7, textTransform: 'uppercase' };
const input = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const saveBtn = (enabled) => ({ height: 44, padding: '0 22px', borderRadius: 12, border: 'none', background: enabled ? '#C6A052' : 'rgba(255,255,255,0.08)', color: enabled ? '#1B1B1B' : 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: 14, cursor: enabled ? 'pointer' : 'not-allowed' });

// Estado de guardado compartido por sección.
function useSaver(empresaId, onSaved) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const save = async (patch) => {
    setSaving(true); setMsg('');
    const res = await empresaService.update(empresaId, patch);
    setSaving(false);
    if (res.success) { setMsg('Guardado ✓'); onSaved?.(patch); setTimeout(() => setMsg(''), 2500); }
    else setMsg('Error: ' + res.error);
    return res.success;
  };
  return { saving, msg, save };
}

/* ── §10.1 Colores ────────────────────────────────────────────────────────── */
function ColoresSection({ empresa, onSaved }) {
  const initPalette = () => {
    const p = {};
    for (const role of BRAND_ROLE_ORDER) p[role] = normalizeHex(brandColor(empresa, role)).replace('#', '');
    return p;
  };
  const [palette, setPalette] = useState(initPalette);
  const [textMode, setTextMode] = useState(empresa.textColorMode || 'auto');
  const { saving, msg, save } = useSaver(empresa.id, onSaved);

  const setRole = (role, hex) => setPalette((p) => ({ ...p, [role]: hex.replace('#', '').toUpperCase() }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h3 style={{ color: 'white', margin: '0 0 4px', fontSize: 18 }}>Colores de marca</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
          8 roles semánticos. Cada rol tiene un uso definido en toda la app; personalizarlos activa la paleta de la marca.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {BRAND_ROLE_ORDER.map((role) => {
          const def = BRAND_ROLES[role];
          const hex = '#' + (palette[role] || def.defaultHex);
          return (
            <div key={role} style={{ display: 'grid', gridTemplateColumns: '44px 1fr 130px', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 10 }}>
              <label style={{ position: 'relative', width: 44, height: 44, borderRadius: 10, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.15)', cursor: 'pointer', background: hex }}>
                <input type="color" value={hex} onChange={(e) => setRole(role, e.target.value)}
                  style={{ position: 'absolute', inset: -4, width: 60, height: 60, border: 'none', padding: 0, cursor: 'pointer', opacity: 0 }} />
              </label>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{def.nombre}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{def.funcion}</div>
              </div>
              <input value={hex} onChange={(e) => setRole(role, e.target.value)}
                style={{ ...input, fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase', padding: '8px 10px' }} />
            </div>
          );
        })}
      </div>

      {/* Modo de color de texto */}
      <div>
        <label style={{ ...label, display: 'block', marginBottom: 8 }}>Color de la fuente (app-wide)</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['auto', 'Automático'], ['light', 'Texto claro'], ['dark', 'Texto oscuro']].map(([v, t]) => (
            <button key={v} onClick={() => setTextMode(v)}
              style={{ flex: 1, height: 40, borderRadius: 10, border: textMode === v ? '2px solid #C6A052' : '1.5px solid rgba(255,255,255,0.12)', background: textMode === v ? 'rgba(198,160,82,0.15)' : 'transparent', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button disabled={saving} style={saveBtn(!saving)}
          onClick={() => save({ brandPalette: palette, textColorMode: textMode })}>
          {saving ? 'Guardando…' : 'Guardar colores'}
        </button>
        {msg && <span style={{ color: msg.startsWith('Error') ? '#f87171' : '#86efac', fontSize: 13 }}>{msg}</span>}
      </div>
    </div>
  );
}

/* ── §10.2 Logo (wordmark) ────────────────────────────────────────────────── */
function LogoSection({ empresa, onSaved }) {
  const theme = resolveTheme(empresa);
  const [f, setF] = useState({
    logoTexto: empresa.logoTexto || '',
    logoFontRaw: empresa.logoFontRaw || '',
    logoPeso: empresa.logoPeso ?? 700,
    logoTracking: empresa.logoTracking ?? 0,
    logoIniciales: empresa.logoIniciales || '',
  });
  const { saving, msg, save } = useSaver(empresa.id, onSaved);
  const preview = { ...empresa, ...f };
  const word = (f.logoTexto || '').trim() || 'KAAL';
  const iniciales = emblemaIniciales(preview) || 'K';

  const monogram = (bg, fg) => (
    <div style={{ width: 62, height: 62, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ ...wordmarkStyle(preview, theme, { fontSize: 26, color: fg }), fontWeight: preview.logoPeso ?? 700 }}>{iniciales}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h3 style={{ color: 'white', margin: '0 0 4px', fontSize: 18 }}>Logo (wordmark de texto)</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
          El wordmark de texto tiene prioridad sobre imágenes. Se renderiza en vivo con la fuente, peso y tracking elegidos.
        </p>
      </div>

      {/* Hero previews — 3 variantes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { bg: brandColor(preview, 'fondoGeneral'), fg: brandColor(preview, 'textoFondos'), tag: 'Principal' },
          { bg: brandColor(preview, 'fondosProfundos'), fg: brandColor(preview, 'fondoGeneral'), tag: 'Oscura' },
          { bg: brandColor(preview, 'fondosProfundos'), fg: null, gold: true, tag: 'Premium' },
        ].map((v, i) => (
          <div key={i} style={{ borderRadius: 14, padding: '26px 14px', background: v.bg, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', position: 'relative' }}>
            <span style={{ ...wordmarkStyle(preview, theme, { fontSize: 26, color: v.gold ? undefined : v.fg }),
              ...(v.gold ? { backgroundImage: goldGradient(preview), WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' } : {}) }}>
              {word}
            </span>
            <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(128,128,128,0.7)' }}>{v.tag}</div>
          </div>
        ))}
      </div>

      {/* Monogramas */}
      <div>
        <label style={{ ...label, display: 'block', marginBottom: 8 }}>Monogramas (emblema)</label>
        <div style={{ display: 'flex', gap: 12 }}>
          {monogram(brandColor(preview, 'fondoGeneral'), brandColor(preview, 'textoFondos'))}
          {monogram(brandColor(preview, 'fondosProfundos'), brandColor(preview, 'fondoGeneral'))}
          {monogram(brandColor(preview, 'fondosProfundos'), brandColor(preview, 'acentoPrincipal'))}
        </div>
      </div>

      {/* Campos */}
      <div><label style={label}>Texto del wordmark</label>
        <input value={f.logoTexto} onChange={(e) => setF({ ...f, logoTexto: e.target.value })} placeholder="Ej. KAAL" style={{ ...input, marginTop: 6 }} /></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={label}>Fuente del logo</label>
          <select value={f.logoFontRaw} onChange={(e) => setF({ ...f, logoFontRaw: e.target.value })} style={{ ...input, marginTop: 6 }}>
            <option value="">Igual que titulares</option>
            {BRAND_FONT_ORDER.map((k) => <option key={k} value={k}>{FONT_LABEL[k]}</option>)}
          </select>
        </div>
        <div><label style={label}>Iniciales del emblema (1–3)</label>
          <input value={f.logoIniciales} maxLength={3} onChange={(e) => setF({ ...f, logoIniciales: e.target.value.toUpperCase() })} placeholder={iniciales} style={{ ...input, marginTop: 6, textTransform: 'uppercase' }} /></div>
      </div>

      <div><label style={label}>Peso ({f.logoPeso})</label>
        <input type="range" min="100" max="900" step="100" value={f.logoPeso} onChange={(e) => setF({ ...f, logoPeso: parseInt(e.target.value, 10) })} style={{ width: '100%', accentColor: '#C6A052' }} /></div>

      <div><label style={label}>Tracking ({f.logoTracking.toFixed(2)} em)</label>
        <input type="range" min="-0.05" max="0.5" step="0.01" value={f.logoTracking} onChange={(e) => setF({ ...f, logoTracking: parseFloat(e.target.value) })} style={{ width: '100%', accentColor: '#C6A052' }} /></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button disabled={saving} style={saveBtn(!saving)} onClick={() => save(f)}>{saving ? 'Guardando…' : 'Guardar logo'}</button>
        {msg && <span style={{ color: msg.startsWith('Error') ? '#f87171' : '#86efac', fontSize: 13 }}>{msg}</span>}
      </div>
    </div>
  );
}

/* ── §10.3 Colecciones / Iconografía ──────────────────────────────────────── */
function ColeccionesSection({ empresa, onSaved }) {
  const [assets, setAssets] = useState(() => iconografiaAssets(empresa));
  const { saving, msg, save } = useSaver(empresa.id, onSaved);
  const [busy, setBusy] = useState(false);

  const persist = async (next) => {
    setAssets(next);
    const cols = Array.isArray(empresa.colecciones) ? [...empresa.colecciones] : [];
    const idx = cols.findIndex((c) => c?.id === ICONOGRAFIA_ID);
    const col = { id: ICONOGRAFIA_ID, nombre: 'Categorías', descripcion: 'Íconos de categoría de producto', assets: next, carpetas: [] };
    if (idx >= 0) cols[idx] = { ...cols[idx], ...col }; else cols.push(col);
    await save({ colecciones: cols });
  };

  const onUpload = async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    setBusy(true);
    try {
      const nuevos = [];
      for (const file of files) {
        const { base64 } = await resizeToPngBase64(file, 512);
        nuevos.push({ id: crypto.randomUUID(), nombre: nombreSinExtension(file.name), data: base64 });
      }
      await persist([...assets, ...nuevos]);
    } finally { setBusy(false); e.target.value = ''; }
  };

  const rename = (id, nombre) => setAssets((a) => a.map((x) => (x.id === id ? { ...x, nombre } : x)));
  const del = (id) => persist(assets.filter((x) => x.id !== id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h3 style={{ color: 'white', margin: '0 0 4px', fontSize: 18 }}>Iconografía de categorías</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
          Sube un ícono por categoría de producto. <b>Nombra cada ícono con su categoría</b> (ej. “Anillos”): así el enlace sobrevive aunque re-subas la imagen.
        </p>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 12, border: '1.5px dashed rgba(198,160,82,0.5)', color: '#C6A052', fontSize: 14, cursor: 'pointer' }}>
        <i className="bi bi-cloud-arrow-up" /> {busy ? 'Procesando…' : 'Subir íconos (PNG/SVG)'}
        <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onUpload} disabled={busy} />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))', gap: 12 }}>
        {assets.map((a) => (
          <div key={a.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10, textAlign: 'center' }}>
            <div style={{ width: '100%', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', background: brandColor(empresa, 'fondoGeneral'), borderRadius: 8, marginBottom: 8 }}>
              <img src={assetDataUrl(a)} alt={a.nombre} style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
            </div>
            <input value={a.nombre} onChange={(e) => rename(a.id, e.target.value)}
              onBlur={() => persist(assets)}
              style={{ ...input, padding: '6px 8px', fontSize: 12, textAlign: 'center' }} />
            <button onClick={() => del(a.id)} style={{ marginTop: 6, background: 'none', border: 'none', color: 'rgba(248,113,113,0.8)', fontSize: 12, cursor: 'pointer' }}>Eliminar</button>
          </div>
        ))}
        {assets.length === 0 && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, gridColumn: '1/-1', padding: '20px 0', textAlign: 'center' }}>Sin íconos de marca todavía.</div>}
      </div>

      {msg && <span style={{ color: msg.startsWith('Error') ? '#f87171' : '#86efac', fontSize: 13 }}>{msg}</span>}
    </div>
  );
}

/* ── §4 Tema y fuentes ────────────────────────────────────────────────────── */
function TemaSection({ empresa, onSaved }) {
  const [f, setF] = useState({
    theme: resolveTheme(empresa),
    brandFontTitleRaw: empresa.brandFontTitleRaw || '',
    brandFontBodyRaw: empresa.brandFontBodyRaw || '',
  });
  const { saving, msg, save } = useSaver(empresa.id, onSaved);
  const THEME_OPTS = [
    ['original', 'Original (Punto Verde)'],
    ['elegantLight', 'Elegante claro (joyería)'],
    ['neonParty', 'Neón (party)'],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h3 style={{ color: 'white', margin: 0, fontSize: 18 }}>Tema y fuentes</h3>

      <div><label style={{ ...label, display: 'block', marginBottom: 8 }}>Tema base</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {THEME_OPTS.map(([v, t]) => (
            <button key={v} onClick={() => setF({ ...f, theme: v })}
              style={{ height: 42, borderRadius: 10, border: f.theme === v ? '2px solid #C6A052' : '1.5px solid rgba(255,255,255,0.12)', background: f.theme === v ? 'rgba(198,160,82,0.15)' : 'transparent', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: '0 14px' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={label}>Fuente de titulares</label>
          <select value={f.brandFontTitleRaw} onChange={(e) => setF({ ...f, brandFontTitleRaw: e.target.value })} style={{ ...input, marginTop: 6 }}>
            <option value="">Default del tema</option>
            {BRAND_FONT_ORDER.map((k) => <option key={k} value={k}>{FONT_LABEL[k]}</option>)}
          </select></div>
        <div><label style={label}>Fuente de textos</label>
          <select value={f.brandFontBodyRaw} onChange={(e) => setF({ ...f, brandFontBodyRaw: e.target.value })} style={{ ...input, marginTop: 6 }}>
            <option value="">Default del tema</option>
            {BRAND_FONT_ORDER.map((k) => <option key={k} value={k}>{FONT_LABEL[k]}</option>)}
          </select></div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button disabled={saving} style={saveBtn(!saving)} onClick={() => save(f)}>{saving ? 'Guardando…' : 'Guardar tema'}</button>
        {msg && <span style={{ color: msg.startsWith('Error') ? '#f87171' : '#86efac', fontSize: 13 }}>{msg}</span>}
      </div>
    </div>
  );
}

/* ── Shell del panel ──────────────────────────────────────────────────────── */
export default function DisenoMarcaPanel({ empresa: empresaProp, onClose, onSaved }) {
  const [empresa, setEmpresa] = useState(empresaProp);
  const [section, setSection] = useState('colores');

  // Al guardar una sección, mezclamos el patch en el estado local para que las
  // otras secciones/preview reflejen los cambios sin recargar.
  const handleSaved = (patch) => { setEmpresa((e) => ({ ...e, ...patch })); onSaved?.(patch); };

  const Section = { colores: ColoresSection, logo: LogoSection, colecciones: ColeccionesSection, tema: TemaSection }[section];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }} onClick={onClose}>
      <div style={{ background: '#121722', borderRadius: 22, width: '100%', maxWidth: 900, height: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 100px rgba(0,0,0,0.65)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'white', fontSize: 17, fontWeight: 800 }}>Diseño de marca</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{empresa.nombre}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 15, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '190px 1fr', minHeight: 0 }}>
          {/* Nav */}
          <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => setSection(s.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, height: 42, padding: '0 14px', borderRadius: 10, border: 'none', background: section === s.id ? 'rgba(198,160,82,0.18)' : 'transparent', color: section === s.id ? '#E6D2A2' : 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                <i className={`bi ${s.icon}`} /> {s.label}
              </button>
            ))}
          </div>
          {/* Content */}
          <div style={{ overflow: 'auto', padding: '22px 26px' }}>
            <Section empresa={empresa} onSaved={handleSaved} />
          </div>
        </div>
      </div>
    </div>
  );
}
