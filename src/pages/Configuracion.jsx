import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEmpresa } from '../context/EmpresaContext';
import { useNavigate } from 'react-router-dom';
import logoColor from '../assets/logo-color.png';
import empresaService from '../services/empresaService';
import { AppScreen, Card, Row, Divider, ToggleRow, Button } from '../components/ui/AppKit';
import { ColorPalette, BrightnessSlider, COLOR_PALETTE } from './Empresas';
import { TOGGLEABLE_MODULES } from '../lib/empresaTheme';
import './Configuracion.css';

const MODULE_LABELS = {
  pos: 'Punto de venta', products: 'Productos', proveedores: 'Proveedores',
  orders: 'Pedidos', pagos: 'Pagos', caja: 'Caja', tareas: 'Tareas',
  empleados: 'Staff', tiendas: 'Sucursales', horarios: 'Horarios',
  promociones: 'Promociones', creditos: 'Crédito', stock: 'Inventario',
};

/* ── Helpers de persistencia de toggles ───────────────────────────────────── */
const getSetting = (key, def) => {
  try { const v = localStorage.getItem('pv_setting_' + key); return v === null ? def : JSON.parse(v); }
  catch { return def; }
};
const setSetting = (key, val) => {
  try { localStorage.setItem('pv_setting_' + key, JSON.stringify(val)); } catch {}
};

/* ── Secciones (mismas que SettingsWindowView.swift) ───────────────────────── */
const SECTIONS = [
  { id: 'general',        label: 'General',        icon: 'bi-gear-fill',        color: '#6B7280' },
  { id: 'cuenta',         label: 'Cuenta',         icon: 'bi-person-circle',    color: '#3B82F6' },
  { id: 'apariencia',     label: 'Apariencia',     icon: 'bi-paintbrush-fill',  color: '#8B5CF6' },
  { id: 'marca',          label: 'Configurar marca', icon: 'bi-palette-fill',   color: '#8B5CF6', soloRoles: ['manager', 'admin'] },
  { id: 'funcionalidades', label: 'Funcionalidades', icon: 'bi-toggles',        color: '#F97316', soloRoles: ['manager', 'admin'] },
  { id: 'impresora',      label: 'Impresora',      icon: 'bi-printer-fill',     color: '#F97316' },
  { id: 'notificaciones', label: 'Notificaciones', icon: 'bi-bell-fill',        color: '#EF4444' },
  { id: 'acerca',         label: 'Acerca de',      icon: 'bi-info-circle-fill', color: '#10B981' },
];

/* ── Sub-componentes — ahora sobre el AppKit reutilizable (mismo diseño en toda
   la app). SettingsGroup=Card, SettingsRow=Row, SettingsToggle=ToggleRow. ──── */
function SettingsGroup({ title, children }) {
  return <Card title={title}>{children}</Card>;
}

function SettingsRow(props) {
  return <Row {...props} />;
}

function SettingsToggle({ label, subtitle, settingKey, defaultVal }) {
  const [on, setOn] = useState(() => getSetting(settingKey, defaultVal));
  return (
    <ToggleRow
      label={label} subtitle={subtitle} checked={on}
      onChange={(v) => { setOn(v); setSetting(settingKey, v); }}
    />
  );
}

/* ── Secciones de contenido ──────────────────────────────────────────────── */
function SectionGeneral() {
  return (
    <div className="cfg-content">
      <div className="cfg-section-header">
        <i className="bi bi-gear-fill" style={{ color: '#6B7280' }} />
        <h2>General</h2>
      </div>
      <SettingsGroup title="Punto de Venta">
        <SettingsToggle label="Confirmar antes de cobrar" subtitle="Mostrar resumen antes de procesar el pago" settingKey="confirmar_cobro" defaultVal={true} />
        <Divider />
        <SettingsToggle label="Sonido al escanear" subtitle="Reproducir sonido al agregar un producto" settingKey="sonido_scan" defaultVal={true} />
        <Divider />
        <SettingsToggle label="Abrir cajón automáticamente" subtitle="Abrir cajón de efectivo al completar venta" settingKey="cajon_auto" defaultVal={false} />
      </SettingsGroup>
      <SettingsGroup title="Pantalla de Cliente">
        <SettingsToggle label="Abrir en pantalla completa" subtitle="La pantalla de cliente se abre en fullscreen" settingKey="cliente_fullscreen" defaultVal={true} />
        <Divider />
        <SettingsRow label="Intervalo de banners" detail="45 segundos" />
      </SettingsGroup>
    </div>
  );
}

function SectionCuenta({ navigate }) {
  const { empleado } = useAuth();
  return (
    <div className="cfg-content">
      <div className="cfg-section-header">
        <i className="bi bi-person-circle" style={{ color: '#3B82F6' }} />
        <h2>Cuenta</h2>
      </div>
      <SettingsGroup title="Información del empleado">
        <SettingsRow label="Nombre" detail={empleado?.nombre || '—'} />
        <Divider />
        <SettingsRow label="No. Empleado" detail={empleado?.numEmpleado ? `EMP-${empleado.numEmpleado}` : '—'} />
        <Divider />
        <SettingsRow label="Email" detail={empleado?.email || '—'} />
        <Divider />
        <SettingsRow label="Teléfono" detail={empleado?.telefono || '—'} />
        <Divider />
        <SettingsRow label="Rol" detail={{ staff: 'Staff', manager: 'Manager', admin: 'Administrador' }[empleado?.rol] || empleado?.rol || '—'} />
      </SettingsGroup>
      <SettingsGroup title="Seguridad">
        <SettingsRow label="Cambiar contraseña" chevron onClick={() => navigate('/cambiar-password')} />
        <Divider />
        <SettingsToggle label="Recordar sesión" subtitle="Mantener sesión iniciada en este equipo" settingKey="recordar_sesion" defaultVal={true} />
      </SettingsGroup>
    </div>
  );
}

function SectionApariencia() {
  const { empleado, roleTheme } = useAuth();
  return (
    <div className="cfg-content">
      <div className="cfg-section-header">
        <i className="bi bi-paintbrush-fill" style={{ color: '#8B5CF6' }} />
        <h2>Apariencia</h2>
      </div>
      <SettingsGroup title="Tema">
        <SettingsRow label="Perfil activo" detail={empleado?.rol || 'Staff'} />
        <Divider />
        <div className="cfg-row">
          <span className="cfg-row-label">Color de acento</span>
          <span className="cfg-row-detail" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: roleTheme?.primary || '#1A7A48', display: 'inline-block' }} />
            {roleTheme?.primary || '#1A7A48'}
          </span>
        </div>
      </SettingsGroup>
      <SettingsGroup title="Interfaz">
        <SettingsToggle label="Animaciones" subtitle="Activar transiciones y animaciones de la interfaz" settingKey="animaciones" defaultVal={true} />
        <Divider />
        <SettingsToggle label="Mostrar precios con IVA" subtitle="Todos los precios incluyen IVA (16%)" settingKey="precios_iva" defaultVal={true} />
      </SettingsGroup>
    </div>
  );
}

function SectionImpresora() {
  const [testing, setTesting] = useState(false);
  const testPrint = () => { setTesting(true); window.print(); setTimeout(() => setTesting(false), 1500); };
  return (
    <div className="cfg-content">
      <div className="cfg-section-header">
        <i className="bi bi-printer-fill" style={{ color: '#F97316' }} />
        <h2>Impresora</h2>
      </div>
      <SettingsGroup title="Configuración de impresión">
        <SettingsRow label="Impresora de tickets" detail="No configurada" chevron />
        <Divider />
        <SettingsToggle label="Imprimir ticket automáticamente" subtitle="Imprimir al completar cada venta" settingKey="auto_print" defaultVal={false} />
        <Divider />
        <SettingsRow label="Tamaño de papel" detail="80 mm" />
      </SettingsGroup>
      <SettingsGroup title="Prueba">
        <div className="cfg-row">
          <button className="cfg-link-btn" onClick={testPrint} disabled={testing}>
            {testing ? 'Imprimiendo...' : 'Imprimir ticket de prueba'}
          </button>
        </div>
      </SettingsGroup>
    </div>
  );
}

function SectionNotificaciones() {
  return (
    <div className="cfg-content">
      <div className="cfg-section-header">
        <i className="bi bi-bell-fill" style={{ color: '#EF4444' }} />
        <h2>Notificaciones</h2>
      </div>
      <SettingsGroup title="Alertas">
        <SettingsToggle label="Stock bajo" subtitle="Notificar cuando un producto tenga stock bajo" settingKey="notif_stock_bajo" defaultVal={true} />
        <Divider />
        <SettingsToggle label="Producto agotado" subtitle="Notificar cuando un producto se agote" settingKey="notif_agotado" defaultVal={true} />
        <Divider />
        <SettingsToggle label="Cierre de caja pendiente" subtitle="Recordar hacer cierre de caja al final del turno" settingKey="notif_cierre_caja" defaultVal={false} />
      </SettingsGroup>
    </div>
  );
}

/* ── Marca (§9 guía branding): colores, tema, color de fuente, info ───────── */
function SectionMarca() {
  const { empresaActiva, reload } = useEmpresa();
  const [form, setForm] = useState(() => ({
    nombre: empresaActiva?.nombre || '',
    giro: empresaActiva?.giro || '',
    tagline: empresaActiva?.tagline || '',
    colorR: empresaActiva?.colorR ?? 0.059,
    colorG: empresaActiva?.colorG ?? 0.302,
    colorB: empresaActiva?.colorB ?? 0.176,
    brightness: empresaActiva?.brightness ?? 0,
    theme: empresaActiva?.theme || 'original',
    textColorMode: empresaActiva?.textColorMode || 'auto',
  }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const setColor = (c) => setForm(f => ({ ...f, colorR: c.r, colorG: c.g, colorB: c.b }));

  const handleSave = async () => {
    if (!empresaActiva?.id || saving) return;
    setSaving(true);
    setSaved(false);
    const data = { ...form };
    if (data.theme === 'original') delete data.theme;
    if (data.textColorMode === 'auto') delete data.textColorMode;
    await empresaService.update(empresaActiva.id, data);
    await reload();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="cfg-content">
      <div className="cfg-section-header">
        <i className="bi bi-palette-fill" style={{ color: '#8B5CF6' }} />
        <h2>Configurar marca</h2>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: -6, marginBottom: 16 }}>
        Empresa activa: <strong>{empresaActiva?.nombre || '—'}</strong>
      </p>

      <SettingsGroup title="Información">
        <div className="cfg-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, padding: '12px 16px' }}>
          <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre" className="form-control" style={{ marginBottom: 8 }} />
          <input value={form.giro} onChange={e => setForm(f => ({ ...f, giro: e.target.value }))} placeholder="Giro" className="form-control" style={{ marginBottom: 8 }} />
          <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="Tagline" className="form-control" />
        </div>
      </SettingsGroup>

      <SettingsGroup title="Colores">
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ColorPalette colorR={form.colorR} colorG={form.colorG} colorB={form.colorB} onChange={setColor} />
          <BrightnessSlider value={form.brightness} onChange={v => setForm(f => ({ ...f, brightness: v }))} />
        </div>
      </SettingsGroup>

      <SettingsGroup title="Tema">
        <div style={{ padding: '12px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'original', label: 'Original (Punto Verde)' },
            { id: 'elegantLight', label: 'Elegante claro (Kaal)' },
            { id: 'neonParty', label: 'Neón fiesta (Party Kids)' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setForm(f => ({ ...f, theme: t.id }))}
              className="btn"
              style={{
                borderRadius: 10, padding: '8px 14px', fontSize: 13,
                border: form.theme === t.id ? '2px solid #8B5CF6' : '1.5px solid rgba(255,255,255,0.15)',
                background: form.theme === t.id ? 'rgba(139,92,246,0.18)' : 'transparent',
                color: 'white',
              }}
            >{t.label}</button>
          ))}
        </div>
      </SettingsGroup>

      <SettingsGroup title="Color de la fuente">
        <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
          {[
            { id: 'auto', label: 'Automático' },
            { id: 'light', label: 'Blanca' },
            { id: 'dark', label: 'Negra' },
          ].map(o => (
            <button
              key={o.id}
              onClick={() => setForm(f => ({ ...f, textColorMode: o.id }))}
              className="btn"
              style={{
                borderRadius: 10, padding: '8px 14px', fontSize: 13,
                border: form.textColorMode === o.id ? '2px solid #8B5CF6' : '1.5px solid rgba(255,255,255,0.15)',
                background: form.textColorMode === o.id ? 'rgba(139,92,246,0.18)' : 'transparent',
                color: 'white',
              }}
            >{o.label}</button>
          ))}
        </div>
      </SettingsGroup>

      <div style={{ padding: '4px 0 24px' }}>
        <button className="cfg-link-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar cambios de marca'}
        </button>
      </div>
    </div>
  );
}

/* ── Funcionalidades (§6 guía branding): feature toggles por módulo ───────── */
function SectionFuncionalidades() {
  const { empresaActiva, reload } = useEmpresa();
  const disabled = new Set(empresaActiva?.disabledModules || []);

  const toggleModule = async (moduleId) => {
    if (!empresaActiva?.id) return;
    const next = new Set(empresaActiva.disabledModules || []);
    if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId);
    await empresaService.update(empresaActiva.id, { disabledModules: [...next] });
    await reload();
  };

  return (
    <div className="cfg-content">
      <div className="cfg-section-header">
        <i className="bi bi-toggles" style={{ color: '#F97316' }} />
        <h2>Funcionalidades</h2>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: -6, marginBottom: 16 }}>
        Apaga módulos para <strong>{empresaActiva?.nombre || 'esta empresa'}</strong>. No borra datos.
      </p>
      <SettingsGroup title="Módulos">
        {[...TOGGLEABLE_MODULES].map((id, i, arr) => (
          <div key={id}>
            <div className="cfg-row cfg-toggle-row">
              <span className="cfg-row-label">{MODULE_LABELS[id] || id}</span>
              <div className={`cfg-toggle ${!disabled.has(id) ? 'on' : ''}`} onClick={() => toggleModule(id)}>
                <div className="cfg-toggle-thumb" />
              </div>
            </div>
            {i < arr.length - 1 && <Divider />}
          </div>
        ))}
      </SettingsGroup>
    </div>
  );
}

function SectionAcerca() {
  return (
    <div className="cfg-content">
      <div className="cfg-section-header">
        <i className="bi bi-info-circle-fill" style={{ color: '#10B981' }} />
        <h2>Acerca de</h2>
      </div>
      <div className="cfg-about-card">
        <img src={logoColor} alt="Punto Verde" className="cfg-about-logo" />
        <h3 className="cfg-about-name">PuntoVerde POS</h3>
        <p className="cfg-about-version">Versión 1.0.0</p>
        <p className="cfg-about-desc">
          Sistema de Punto de Venta para tiendas de abarrotes.<br />
          Desarrollado con React + Firebase.
        </p>
      </div>
      <SettingsGroup title="Legal">
        <SettingsRow label="Términos y condiciones" chevron />
        <Divider />
        <SettingsRow label="Política de privacidad" chevron />
        <Divider />
        <SettingsRow label="Licencias de terceros" chevron />
      </SettingsGroup>
    </div>
  );
}

/* ── Componente principal ─────────────────────────────────────────────────── */
export default function Configuracion() {
  const navigate = useNavigate();
  const { empleado } = useAuth();

  const visibleSections = SECTIONS.filter(
    s => !s.soloRoles || s.soloRoles.includes(empleado?.rol)
  );

  const renderSection = (id) => {
    switch (id) {
      case 'general':        return <SectionGeneral />;
      case 'cuenta':         return <SectionCuenta navigate={navigate} />;
      case 'apariencia':     return <SectionApariencia />;
      case 'marca':          return <SectionMarca />;
      case 'funcionalidades': return <SectionFuncionalidades />;
      case 'impresora':      return <SectionImpresora />;
      case 'notificaciones': return <SectionNotificaciones />;
      case 'acerca':         return <SectionAcerca />;
      default:               return null;
    }
  };

  // Single-column apilado (como Inicio / ajustes de iOS) — sin sidebar, para que
  // se vea igual que el resto de ventanas.
  return (
    <AppScreen title="Configuración" subtitle="Ajustes del sistema" className="config-page">
      <div className="cfg-stack">
        {visibleSections.map(s => (
          <div key={s.id} className="cfg-block">{renderSection(s.id)}</div>
        ))}
      </div>
    </AppScreen>
  );
}
