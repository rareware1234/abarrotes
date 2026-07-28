// ============================================================
// Editor de categoría (crear / editar) — doc §7. Port de NuevaCategoriaSheet /
// CategoriaEditSheet (Swift). Captura: nombre, ícono (de la iconografía de la
// marca), color de fondo (opcional) y color de título (negro/blanco/dorado).
// Persiste el enlace de ícono por NOMBRE (durable, §7.1) y los colores en
// MarcaCustomizationStore; la creación pasa por UserCategoriasStore (sellando
// defaults, §9.3). Vista previa compacta del card real de Productos (§7.4).
// ============================================================
import React, { useState, useEffect } from 'react';
import marcaStore from '../services/marcaCustomizationStore';
import userCategoriasStore from '../services/userCategoriasStore';
import { iconografiaAssets, assetDataUrl } from '../lib/categoriaBrandIcon';
import { titleColorStyle, brandColor, contrastTitleColor } from '../lib/brandRoles';
import { THEMES, resolveTheme, usesPaletteColors, resolveToken } from '../lib/empresaTheme';
import { rgbCss, rgbHex } from '../lib/brandColor';
import { COLOR_PALETTE } from '../lib/colorPresets';

const label = { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.7, textTransform: 'uppercase' };
const input = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' };

const catGradient = (rgb) => {
  const c1 = rgbCss(rgb);
  const c2 = rgbCss({ ...rgb, brightness: -0.18 });
  return `linear-gradient(135deg, ${c2} 0%, ${c1} 100%)`;
};

export default function CategoriaEditorModal({ empresa, empresaId, categoria, onClose, onSaved }) {
  const isEditing = !!categoria;
  const theme = resolveTheme(empresa);
  const [ready, setReady] = useState(marcaStore.isLoaded());
  const [nombre, setNombre] = useState(categoria || '');
  const [iconAsset, setIconAsset] = useState('');   // nombre del asset elegido
  const [bgColor, setBgColor] = useState(null);      // {r,g,b} | null
  const [titleKey, setTitleKey] = useState('');      // '' | negro | blanco | dorado
  const [saving, setSaving] = useState(false);
  const assets = iconografiaAssets(empresa);

  // Hidrata valores actuales desde el store.
  useEffect(() => {
    let alive = true;
    const hydrate = () => {
      if (!alive || !categoria) { setReady(true); return; }
      setIconAsset(marcaStore.getCatIconAsset(categoria) || '');
      setBgColor(marcaStore.getCatColor(categoria));
      setTitleKey(marcaStore.getCatTextColor(categoria) || '');
      setReady(true);
    };
    if (marcaStore.isLoaded()) hydrate();
    else marcaStore.load().then(hydrate);
    return () => { alive = false; };
  }, [categoria]);

  const selectedAsset = assets.find((a) => a.nombre === iconAsset) || null;
  const iconUrl = selectedAsset ? assetDataUrl(selectedAsset) : null;

  // Estilo del título en el preview (§7.3 explícito, o §7.2 contraste si hay bg).
  const titleStyle = (() => {
    if (titleKey) {
      const s = titleColorStyle(empresa, titleKey);
      if (s.kind === 'gradient') return { backgroundImage: s.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
      return { color: s.color };
    }
    if (bgColor) return { color: contrastTitleColor(rgbHex(bgColor)) };
    return { color: brandColor(empresa, 'textoFondos') };
  })();

  const previewBg = bgColor
    ? catGradient(bgColor)
    : (usesPaletteColors(empresa) ? brandColor(empresa, 'fondoGeneral') : resolveToken(THEMES[theme].cardGradient, empresa));

  const handleSave = async () => {
    const clean = nombre.trim();
    if (!clean || saving) return;
    setSaving(true);
    try {
      if (!isEditing) {
        const uc = await userCategoriasStore.loadUserCreated(empresaId);
        await userCategoriasStore.addCategoria(empresaId, clean, uc, empresa);
      } else if (clean !== categoria) {
        const uc = await userCategoriasStore.loadUserCreated(empresaId);
        await userCategoriasStore.renameCategoria(empresaId, categoria, clean, uc);
      }
      // Enlace de ícono por NOMBRE del asset (durable, §7.1).
      if (iconAsset) await marcaStore.setCatIconAsset(clean, iconAsset);
      // Color de fondo (opcional).
      if (bgColor) await marcaStore.setCatColor(clean, bgColor);
      else await marcaStore.clearCatColor(clean);
      // Color de título.
      if (titleKey) await marcaStore.setCatTextColor(clean, titleKey);
      onSaved?.(clean);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }} onClick={onClose}>
      <div style={{ background: '#121722', borderRadius: 22, width: '100%', maxWidth: 760, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 100px rgba(0,0,0,0.65)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, color: 'white', fontSize: 17, fontWeight: 800 }}>{isEditing ? 'Editar categoría' : 'Nueva categoría'}</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 15, cursor: 'pointer' }}>✕</button>
        </div>

        {!ready ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Cargando…</div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: 'minmax(0,200px) minmax(0,1fr)', gap: 0 }}>
            {/* Preview compacto (~60% del card real 260×320) */}
            <div style={{ padding: '22px 18px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={label}>Vista previa</span>
              <div style={{ marginTop: 12, width: 156, height: 192, borderRadius: 16, background: previewBg, position: 'relative', overflow: 'hidden', border: `1.5px solid ${resolveToken(THEMES[theme].border, empresa)}`, boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
                {iconUrl && (
                  <img src={iconUrl} alt="" style={{ position: 'absolute', top: -8, right: -8, width: 96, height: 96, objectFit: 'contain', opacity: 0.9 }} />
                )}
                <div style={{ position: 'absolute', left: 14, bottom: 14, right: 14 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1, ...titleStyle }}>{nombre || 'Categoría'}</div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={label}>Nombre</label>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Anillos" style={{ ...input, marginTop: 6 }} /></div>

              {/* Ícono de la categoría */}
              <div>
                <label style={{ ...label, display: 'block', marginBottom: 8 }}>Ícono de la categoría</label>
                {assets.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Sube íconos en Diseño de marca → Colecciones.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px,1fr))', gap: 8 }}>
                    {assets.map((a) => {
                      const sel = a.nombre === iconAsset;
                      return (
                        <button key={a.id} onClick={() => setIconAsset(sel ? '' : a.nombre)} title={a.nombre}
                          style={{ height: 56, borderRadius: 10, border: sel ? '2px solid #C6A052' : '1.5px solid rgba(255,255,255,0.12)', background: brandColor(empresa, 'fondoGeneral'), cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
                          <img src={assetDataUrl(a)} alt={a.nombre} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Color de fondo */}
              <div>
                <label style={{ ...label, display: 'block', marginBottom: 8 }}>Color de fondo (opcional)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <button onClick={() => setBgColor(null)}
                    style={{ width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', background: 'transparent', border: !bgColor ? '3px solid white' : '2px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', fontSize: 12 }} title="Sin color">∅</button>
                  {COLOR_PALETTE.map((c, i) => {
                    const sel = bgColor && Math.abs(bgColor.r - c.r) < 0.01 && Math.abs(bgColor.g - c.g) < 0.01 && Math.abs(bgColor.b - c.b) < 0.01;
                    const css = rgbCss(c);
                    return <button key={i} onClick={() => setBgColor({ r: c.r, g: c.g, b: c.b })} title={c.label}
                      style={{ width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', background: css, border: sel ? '3px solid white' : '2.5px solid rgba(255,255,255,0.08)' }} />;
                  })}
                </div>
              </div>

              {/* Color de título */}
              <div>
                <label style={{ ...label, display: 'block', marginBottom: 8 }}>Color del título</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['negro', 'Negro'], ['blanco', 'Blanco'], ['dorado', 'Dorado']].map(([v, t]) => (
                    <button key={v} onClick={() => setTitleKey(titleKey === v ? '' : v)}
                      style={{ flex: 1, height: 40, borderRadius: 10, border: titleKey === v ? '2px solid #C6A052' : '1.5px solid rgba(255,255,255,0.12)', background: titleKey === v ? 'rgba(198,160,82,0.15)' : 'transparent', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t}</button>
                  ))}
                </div>
              </div>

              <button onClick={handleSave} disabled={!nombre.trim() || saving}
                style={{ height: 46, borderRadius: 12, border: 'none', background: nombre.trim() && !saving ? '#C6A052' : 'rgba(255,255,255,0.08)', color: nombre.trim() && !saving ? '#1B1B1B' : 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: 15, cursor: nombre.trim() && !saving ? 'pointer' : 'not-allowed' }}>
                {saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear categoría'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
