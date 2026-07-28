import React, { useState, useEffect } from 'react';
import logoDark600 from '../assets/logo-dark-600.png';
import logoColor from '../assets/logo-color.png';
import formatoPV from '../assets/formato-pv.png';
import formatoGO from '../assets/formato-go.png';
import formatoXL from '../assets/formato-xl.png';
import empleadoService from '../services/empleadoService';
import tiendaService from '../services/tiendaService';
import orderService from '../services/orderService';
import productService from '../services/productService';
import formatoCustomService from '../services/formatoCustomService';
import NuevoFormatoModal from '../components/NuevoFormatoModal';
import { normalizeFormato } from '../data/formatos';
import { rgbCss, brandGradient, brandLuminance } from '../lib/brandColor';
import './CotizarSucursal.css';

// ── Custom formato color helpers (wrappers sobre lib/brandColor) ──────────────
const _rgb = (fmt, extra = 0) => rgbCss(fmt, extra);
const customGradient = (fmt) => brandGradient(fmt, -0.12);
const customLuminance = (fmt) => brandLuminance(fmt);

const customToMeta = (fmt) => {
  if (!fmt) return null;
  const lum = customLuminance(fmt) + (fmt.brightness || 0);
  const isLight = lum > 0.45;
  const color = _rgb(fmt);
  const colorDark = _rgb(fmt, -0.12);
  return {
    color, colorDark,
    gradient: `linear-gradient(135deg, ${colorDark} 0%, ${color} 100%)`,
    textColor: isLight ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
    isLight,
  };
};

const SALARIO_MIN = 278.80 * 30.4;
const FACTOR_PREST = 1.35;
const COSTO_EMP = SALARIO_MIN * FACTOR_PREST;
const FMT_KEYS = ['Punto Verde', 'Punto Verde GO', 'Punto Verde XL'];

const _toDate = (v) => (v?.toDate ? v.toDate() : v ? new Date(v) : null);

/** Promedios reales por formato (renta, nómina, ventas, empleados) + top
 *  marcas + ventas mensuales del año. Réplica de cargarPromediosReales (Swift). */
function computeAverages(tiendas, ordenes, productos, empleados) {
  const elegibles = tiendas.filter((t) => !t.esCotizacion);
  const ordByTienda = {};
  ordenes.forEach((o) => { if (o.tiendaId) (ordByTienda[o.tiendaId] = ordByTienda[o.tiendaId] || []).push(o); });
  const ventasMensualPorTienda = {};
  Object.entries(ordByTienda).forEach(([tid, ords]) => {
    const porMes = {};
    ords.forEach((o) => { const d = _toDate(o.createdAt); if (!d) return; porMes[`${d.getFullYear()}-${d.getMonth()}`] = (porMes[`${d.getFullYear()}-${d.getMonth()}`] || 0) + (o.total || 0); });
    const vals = Object.values(porMes);
    if (vals.length) ventasMensualPorTienda[tid] = vals.reduce((a, b) => a + b, 0) / vals.length;
  });
  const empPorTienda = {};
  empleados.forEach((e) => { const tid = e.tiendaAsignada || e.tiendaId; if (tid) empPorTienda[tid] = (empPorTienda[tid] || 0) + 1; });
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const averages = {};
  FMT_KEYS.forEach((fmt) => {
    const pf = elegibles.filter((t) => normalizeFormato(t.formato) === fmt);
    averages[fmt] = {
      renta: avg(pf.map((t) => t.rentaMensual || 0).filter((x) => x > 0)),
      nomina: avg(pf.map((t) => t.nominaEstimada || 0).filter((x) => x > 0)),
      ventas: avg(pf.map((t) => ventasMensualPorTienda[t.id]).filter(Boolean)),
      empleados: avg(pf.map((t) => empPorTienda[t.id] || 0).filter((x) => x > 0)),
      muestra: pf.length,
    };
  });
  const prodToMarca = {}; productos.forEach((p) => { if (!prodToMarca[p.id]) prodToMarca[p.id] = p.proveedor; });
  const tiendaToFmt = {}; tiendas.forEach((t) => { tiendaToFmt[t.id] = normalizeFormato(t.formato); });
  const ingresos = {};
  ordenes.forEach((o) => {
    const fmt = tiendaToFmt[o.tiendaId]; if (!fmt) return;
    (o.productos || []).forEach((it) => {
      const marca = prodToMarca[it.id]; if (!marca) return;
      ingresos[fmt] = ingresos[fmt] || {};
      ingresos[fmt][marca] = (ingresos[fmt][marca] || 0) + (it.precioUnitario || it.precioConIVA || it.precio || 0) * (it.cantidad || 0);
    });
  });
  const topMarcas = {};
  FMT_KEYS.forEach((fmt) => { topMarcas[fmt] = Object.entries(ingresos[fmt] || {}).sort((a, b) => b[1] - a[1]).slice(0, 4).map((e) => e[0]); });
  const year = new Date().getFullYear();
  const vMes = {};
  ordenes.forEach((o) => { const d = _toDate(o.createdAt); if (!d || d.getFullYear() !== year) return; const fmt = tiendaToFmt[o.tiendaId]; if (!fmt) return; vMes[fmt] = vMes[fmt] || {}; const m = d.getMonth() + 1; vMes[fmt][m] = (vMes[fmt][m] || 0) + (o.total || 0); });
  const ventasMensuales = {};
  FMT_KEYS.forEach((fmt) => { const pm = vMes[fmt] || {}; ventasMensuales[fmt] = Array.from({ length: 12 }, (_, i) => pm[i + 1] || 0); });
  return { averages, topMarcas, ventasMensuales };
}

const FORMATOS_META = {
  'Punto Verde': {
    color: '#0F4D2D', colorDark: '#09381E',
    gradient: 'linear-gradient(135deg,#09381E 0%,#0F4D2D 100%)',
    textColor: 'rgba(255,255,255,0.9)', isLight: false,
  },
  'Punto Verde GO': {
    color: '#EFA400', colorDark: '#C68700',
    gradient: 'linear-gradient(135deg,#C68700 0%,#EFA400 100%)',
    textColor: 'rgba(0,0,0,0.8)', isLight: true,
  },
  'Punto Verde XL': {
    color: '#1A1A1A', colorDark: '#0E0E0E',
    gradient: 'linear-gradient(135deg,#0E0E0E 0%,#1A1A1A 100%)',
    textColor: 'rgba(255,255,255,0.9)', isLight: false,
  },
};

const PERFILES = {
  'Punto Verde': {
    tagline: 'Tienda de barrio',
    areaMin: 48, areaMax: 120, anchoSugerido: 8, largoSugerido: 10,
    empleadosMin: 3, empleadosMax: 5, cajas: 1,
    inventarioSugerido: 220000, rentaTipica: 22000, serviciosTipicos: 7000,
    caracteristicas: [
      { titulo: 'Surtido esencial', detalle: 'Abarrotes y básicos del hogar' },
      { titulo: '1 caja de cobro', detalle: 'Operación sencilla y enfocada' },
      { titulo: 'Perecederos', detalle: 'Refrigeración y congelados' },
      { titulo: 'Bodega', detalle: 'Espacio dedicado al almacén' },
    ],
  },
  'Punto Verde GO': {
    tagline: 'Formato intermedio con mayor variedad',
    areaMin: 120, areaMax: 220, anchoSugerido: 12, largoSugerido: 15,
    empleadosMin: 6, empleadosMax: 10, cajas: 2,
    inventarioSugerido: 450000, rentaTipica: 38000, serviciosTipicos: 12000,
    caracteristicas: [
      { titulo: 'Catálogo ampliado', detalle: 'Más SKUs y categorías' },
      { titulo: '2 cajas de cobro', detalle: 'Reduce tiempos de espera' },
      { titulo: 'Horario extendido', detalle: 'Cobertura todo el día' },
      { titulo: 'Equipo dedicado', detalle: '6 a 10 personas' },
    ],
  },
  'Punto Verde XL': {
    tagline: 'Supermercado de formato grande',
    areaMin: 220, areaMax: 450, anchoSugerido: 16, largoSugerido: 20,
    empleadosMin: 12, empleadosMax: 20, cajas: 4,
    inventarioSugerido: 950000, rentaTipica: 75000, serviciosTipicos: 25000,
    caracteristicas: [
      { titulo: 'Multi-categoría', detalle: 'Despensa, hogar y línea blanca' },
      { titulo: '4+ cajas de cobro', detalle: 'Alto volumen de operaciones' },
      { titulo: 'Carnicería y panadería', detalle: 'Áreas de servicio en sitio' },
      { titulo: 'Estacionamiento', detalle: 'Acceso vehicular propio' },
    ],
  },
};

const ESTADOS_MX = ['Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas','Chihuahua','Ciudad de México','Coahuila','Colima','Durango','Estado de México','Guanajuato','Guerrero','Hidalgo','Jalisco','Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo','San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas'];
const ESTADOS_US = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
const ESTADOS_CA = ['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland','Nova Scotia','Ontario','Prince Edward Island','Quebec','Saskatchewan'];
const ESTADOS_POR_PAIS = { 'México': ESTADOS_MX, 'Estados Unidos': ESTADOS_US, 'Canadá': ESTADOS_CA };

const mxn = (v) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v || 0);
const num = (s) => parseFloat(String(s).replace(/[^0-9.]/g, '')) || 0;

const STEP_TITLES    = ['Formato', 'Ubicación', 'Costos', 'Personal', 'Cotización'];
const STEP_SUBTITLES = ['Elige el tipo de sucursal', 'Nombre y dónde estará ubicada', 'Renta, servicios e inversión', 'Empleados y nómina', 'Resumen y proyección final'];

const getLogo      = (fmt) => fmt === 'Punto Verde GO' ? logoColor : logoDark600;
const getBadge     = (fmt) => fmt === 'Punto Verde' ? formatoPV : fmt === 'Punto Verde GO' ? formatoGO : formatoXL;
const getLogoBlend = (fmt) => fmt === 'Punto Verde GO' ? 'multiply' : 'normal';

const CotizarSucursal = ({ onClose, onCreated, empleadoActual }) => {
  const [paso, setPaso] = useState(1);
  const [formato, setFormato] = useState('Punto Verde');
  const [customFormatos, setCustomFormatos] = useState([]);
  const [showNuevoFormato, setShowNuevoFormato] = useState(false);

  // paso 2
  const [nombre, setNombre]                   = useState('');
  const [pais, setPais]                       = useState('México');
  const [estado, setEstado]                   = useState('');
  const [ciudad, setCiudad]                   = useState('');
  const [codigoPostal, setCodigoPostal]       = useState('');
  const [calle, setCalle]                     = useState('');
  const [numeroExterior, setNumeroExterior]   = useState('');
  const [numeroInterior, setNumeroInterior]   = useState('');
  const [colonia, setColonia]                 = useState('');

  // paso 3
  const [rentaMensual, setRentaMensual]               = useState('');
  const [gastosServicios, setGastosServicios]         = useState('');
  const [gastosAdicionales, setGastosAdicionales]     = useState('');
  const [depositoLocal, setDepositoLocal]             = useState('');
  const [inventarioInicial, setInventarioInicial]     = useState('');

  // paso 4
  const [slots, setSlots]                           = useState([]);
  const [salarioPorEmpleado, setSalarioPorEmpleado] = useState(String(Math.round(COSTO_EMP)));
  const [empleadosDisponibles, setEmpleadosDisponibles] = useState([]);
  const [loadingEmpleados, setLoadingEmpleados]     = useState(false);
  const [pickerSlotIndex, setPickerSlotIndex]       = useState(null);

  // paso 5
  const [notas, setNotas]                   = useState('');
  const [isSaving, setIsSaving]             = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showSuccess, setShowSuccess]       = useState(false);
  const [folio]           = useState(() => 'QT-' + Math.random().toString(36).substr(2, 6).toUpperCase());
  const [fechaCotizacion] = useState(() => new Date());
  const [stats, setStats] = useState({ averages: {}, topMarcas: {}, ventasMensuales: {} });

  useEffect(() => {
    Promise.all([
      tiendaService.fetchTodas(), orderService.getOrdenes('todas'),
      productService.fetchAll(), empleadoService.fetchAll(),
    ]).then(([t, o, p, e]) => {
      setStats(computeAverages(
        t.success ? t.data : [], o.success ? o.data : [],
        p.success ? p.data : [], e.success ? e.data : [],
      ));
    }).catch(() => {});
    formatoCustomService.fetchAll().then(res => {
      if (res.success) setCustomFormatos(res.data);
    });
  }, []);

  const perfilDe = (fmtName, explicit) =>
    explicit || PERFILES[fmtName] || customFormatos.find(c => c.nombre === fmtName)?.perfilData || PERFILES['Punto Verde'];

  const aplicarFormato = (fmt, explicitPerfil) => {
    setFormato(fmt);
    const p = perfilDe(fmt, explicitPerfil);
    const empMin = p.empleadosMin || 3;
    const slotsIniciales = Array.from({ length: empMin }, (_, i) => ({
      id: `slot-${i}-${Date.now()}`,
      nombre: 'Staff',
      rol: 'Staff',
      salario: COSTO_EMP,
      empleadoUid: null,
      fotoUrl: null,
    }));
    setSlots(slotsIniciales);
    setRentaMensual(String(Math.round(p.rentaTipica || 0)));
    setGastosServicios(String(Math.round(p.serviciosTipicos || 0)));
    setDepositoLocal(String(Math.round((p.rentaTipica || 0) * 2)));
    setInventarioInicial(String(Math.round(p.inventarioSugerido || 0)));
  };

  useEffect(() => { aplicarFormato('Punto Verde'); }, []);

  useEffect(() => {
    if (paso === 4 && empleadosDisponibles.length === 0) {
      setLoadingEmpleados(true);
      empleadoService.fetchAll().then(res => {
        setEmpleadosDisponibles(res.success ? res.data.filter(e => e.activo !== false) : []);
        setLoadingEmpleados(false);
      });
    }
  }, [paso]);

  const selectedCustom = customFormatos.find(c => c.nombre === formato);
  const meta   = FORMATOS_META[formato] || (selectedCustom ? customToMeta(selectedCustom) : FORMATOS_META['Punto Verde']);
  const perfil = PERFILES[formato] || selectedCustom?.perfilData || PERFILES['Punto Verde'];

  const nominaCalculada  = slots.reduce((sum, s) => sum + s.salario, 0);
  const costoMensual     = num(rentaMensual) + num(gastosServicios) + num(gastosAdicionales) + nominaCalculada;
  const inversionInicial = num(depositoLocal) + num(inventarioInicial);
  const totalPrimerMes   = costoMensual + inversionInicial;

  const canContinue = paso !== 2 || (nombre.trim() && pais && estado.trim() && ciudad.trim());

  // ── Slot helpers ──
  const addSlot = () => {
    const salDefault = parseFloat(salarioPorEmpleado) || COSTO_EMP;
    setSlots(prev => [...prev, {
      id: `slot-${Date.now()}`,
      nombre: 'Staff', rol: 'Staff',
      salario: salDefault, empleadoUid: null, fotoUrl: null,
    }]);
  };

  const removeSlot = (id) => setSlots(prev => prev.filter(s => s.id !== id));

  const assignEmployee = (emp, index) => {
    const salBase = emp.salarioDiario
      ? emp.salarioDiario * 30.4 * FACTOR_PREST
      : (parseFloat(salarioPorEmpleado) || COSTO_EMP);
    setSlots(prev => prev.map((s, i) =>
      i === index
        ? { ...s, nombre: emp.nombre, rol: emp.rol || 'Staff', salario: salBase, empleadoUid: emp.id || emp.uid, fotoUrl: emp.fotoUrl || null }
        : s
    ));
    setPickerSlotIndex(null);
  };

  const unassignSlot = (index) => {
    const salDefault = parseFloat(salarioPorEmpleado) || COSTO_EMP;
    setSlots(prev => prev.map((s, i) =>
      i === index
        ? { ...s, nombre: 'Staff', rol: 'Staff', salario: salDefault, empleadoUid: null, fotoUrl: null }
        : s
    ));
    setPickerSlotIndex(null);
  };

  // ── Inner components ──

  const UnderlineField = ({ label, value, onChange, placeholder = '', required = false, type = 'text' }) => {
    const [focused, setFocused] = useState(false);
    return (
      <div className="underline-field">
        <label className="underline-label">
          {label}{required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
        </label>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="underline-input"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <div className="underline-bar" style={{ background: focused ? meta.color : 'rgba(0,0,0,0.15)', height: focused ? 2 : 1 }} />
      </div>
    );
  };

  const MoneyField = ({ label, value, onChange, hint }) => {
    const [focused, setFocused] = useState(false);
    return (
      <div className="underline-field">
        <label className="underline-label">{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 2 }}>
          <span style={{ fontSize: 20, color: '#6B7280', fontWeight: 500 }}>$</span>
          <input
            type="number"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="0"
            className="underline-input money-input"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ fontSize: 18 }}
          />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.4 }}>MXN</span>
        </div>
        <div className="underline-bar" style={{ background: focused ? meta.color : 'rgba(0,0,0,0.15)', height: focused ? 2 : 1 }} />
        {hint && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{hint}</div>}
      </div>
    );
  };

  const SelectField = ({ label, value, onChange, options, required = false }) => {
    const [focused, setFocused] = useState(false);
    return (
      <div className="underline-field">
        <label className="underline-label">
          {label}{required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
        </label>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="underline-input underline-select"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ appearance: 'none', cursor: 'pointer' }}
        >
          <option value="">Seleccionar</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <div className="underline-bar" style={{ background: focused ? meta.color : 'rgba(0,0,0,0.15)', height: focused ? 2 : 1 }} />
      </div>
    );
  };

  const SectionLabel = ({ children }) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 14, marginTop: 22 }}>
      {children}
    </div>
  );

  const ResumenLinea = ({ label, valor }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{mxn(valor)}</span>
    </div>
  );

  const ResumenSubtotal = ({ label, valor, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: color || '#111827' }}>{mxn(valor)}</span>
    </div>
  );

  const PersonalCard = ({ slot, index }) => (
    <div className="personal-card" style={{
      background: slot.empleadoUid ? `${meta.color}0D` : '#F9FAFB',
      borderColor: slot.empleadoUid ? `${meta.color}4D` : 'rgba(0,0,0,0.1)',
    }}>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <div
          className="personal-slot-avatar"
          style={{ background: `${meta.color}1A`, borderColor: slot.empleadoUid ? `${meta.color}88` : `${meta.color}33`, borderWidth: slot.empleadoUid ? 2 : 1 }}
          onClick={() => setPickerSlotIndex(index)}
        >
          {slot.fotoUrl
            ? <img src={slot.fotoUrl} alt={slot.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={meta.color} strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          }
        </div>
        <button className="slot-remove-btn" onClick={() => removeSlot(slot.id)}>×</button>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#111827', textAlign: 'center', lineHeight: 1.3 }}>{slot.nombre}</div>
      <div style={{ fontSize: 10, color: meta.color, fontWeight: 500, marginTop: 2, textAlign: 'center' }}>{mxn(slot.salario)}</div>
    </div>
  );

  const AddCard = () => (
    <div className="personal-card add-card" onClick={addSlot} style={{ cursor: 'pointer', background: '#F9FAFB' }}>
      <div className="personal-slot-avatar add-avatar" style={{ borderColor: `${meta.color}88`, background: `${meta.color}0D` }}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke={meta.color} strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: meta.color, textAlign: 'center', marginTop: 8 }}>Agregar</div>
      <div style={{ height: 14 }} />
    </div>
  );

  // ── PDF ──
  const generarPDF = () => {
    setIsGeneratingPDF(true);
    const fecha = fechaCotizacion.toLocaleDateString('es-MX', { dateStyle: 'long' });
    const lineas = [];
    if (num(rentaMensual) > 0) lineas.push(['Renta mensual', mxn(num(rentaMensual))]);
    if (num(gastosServicios) > 0) lineas.push(['Servicios (luz, agua, internet)', mxn(num(gastosServicios))]);
    if (nominaCalculada > 0) lineas.push([`Nómina estimada (${slots.length} empleados)`, mxn(nominaCalculada)]);
    if (num(gastosAdicionales) > 0) lineas.push(['Otros gastos', mxn(num(gastosAdicionales))]);
    const lineasInv = [];
    if (num(depositoLocal) > 0) lineasInv.push(['Depósito del local', mxn(num(depositoLocal))]);
    if (num(inventarioInicial) > 0) lineasInv.push(['Inventario inicial', mxn(num(inventarioInicial))]);

    const tableRows = (rows) => rows.map(([l, v]) =>
      `<tr><td>${l}</td><td style="text-align:right;font-weight:500">${v}</td></tr>`
    ).join('');

    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cotización ${folio}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 48px; color: #111; font-size: 13px; background: white; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .brand { font-size: 18px; font-weight: 800; color: ${meta.colorDark}; }
  .folio { text-align: right; }
  .folio .label { font-size: 10px; font-weight: 700; letter-spacing: 1.4px; color: ${meta.colorDark}; text-transform: uppercase; }
  .folio .num { font-size: 13px; font-weight: 600; font-family: monospace; }
  .divider { height: 3px; background: ${meta.color}; margin: 20px 0 24px; border-radius: 2px; }
  h2 { font-size: 11px; font-weight: 700; color: #6B7280; letter-spacing: 0.7px; text-transform: uppercase; margin: 0 0 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  td { padding: 7px 0; border-bottom: 1px solid #F3F4F6; }
  .subtotal td { font-weight: 700; border-top: 2px solid #E5E7EB; border-bottom: none; padding-top: 10px; font-size: 14px; color: ${meta.colorDark}; }
  .section { margin-bottom: 24px; }
  .total-box { background: ${meta.gradient}; color: white; padding: 16px 20px; border-radius: 10px; margin: 24px 0; display: flex; justify-content: space-between; align-items: center; }
  .total-box .label { font-size: 10px; font-weight: 700; letter-spacing: 1px; opacity: 0.85; text-transform: uppercase; }
  .total-box .value { font-size: 28px; font-weight: 800; }
  .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #E5E7EB; font-size: 10px; color: #9CA3AF; }
  .info-row { margin-bottom: 6px; }
  .info-row strong { display: inline-block; width: 110px; color: #6B7280; font-weight: 600; }
  @media print { body { padding: 32px; } button { display: none; } }
</style></head>
<body>
<div class="header">
  <div>
    <div class="brand">Punto Verde</div>
    <div style="font-size:11px;color:#6B7280;margin-top:2px">Sistema de gestión de sucursales</div>
  </div>
  <div class="folio">
    <div class="label">Cotización de Sucursal</div>
    <div class="num">${folio}</div>
    <div style="font-size:11px;color:#6B7280;margin-top:2px">${fecha}</div>
  </div>
</div>
<div class="divider"></div>
<div class="section">
  <h2>Sucursal</h2>
  <div class="info-row"><strong>Nombre</strong>${nombre || '—'}</div>
  <div class="info-row"><strong>Formato</strong>${formato}</div>
  <div class="info-row"><strong>Ubicación</strong>${[ciudad, estado, pais].filter(Boolean).join(', ') || '—'}</div>
  ${calle ? `<div class="info-row"><strong>Dirección</strong>${calle} ${numeroExterior}${colonia ? ', Col. ' + colonia : ''}</div>` : ''}
</div>
${lineas.length > 0 ? `<div class="section"><h2>Costos operativos mensuales</h2><table>${tableRows(lineas)}<tr class="subtotal"><td>Subtotal mensual</td><td style="text-align:right">${mxn(costoMensual)}</td></tr></table></div>` : ''}
${lineasInv.length > 0 ? `<div class="section"><h2>Inversión inicial (único)</h2><table>${tableRows(lineasInv)}<tr class="subtotal"><td>Subtotal inversión</td><td style="text-align:right">${mxn(inversionInicial)}</td></tr></table></div>` : ''}
${totalPrimerMes > 0 ? `<div class="total-box"><div class="label">Inversión total primer mes</div><div class="value">${mxn(totalPrimerMes)}</div></div>` : ''}
${notas ? `<div class="section"><h2>Notas</h2><p style="margin:0;line-height:1.6">${notas}</p></div>` : ''}
<div class="footer">
  <div>Documento informativo. Los montos son estimaciones basadas en datos proporcionados al momento de la cotización.</div>
  <div style="margin-top:4px">Cotización generada el ${fecha} · Folio ${folio}</div>
</div>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(htmlContent);
      w.document.close();
      setTimeout(() => { w.print(); setIsGeneratingPDF(false); }, 500);
    } else {
      setIsGeneratingPDF(false);
    }
  };

  // ── Save ──
  const crearCotizacion = async () => {
    if (!nombre.trim() || isSaving) return;
    setIsSaving(true);
    const result = await tiendaService.createCotizacion({
      nombre: nombre.trim(),
      direccion: calle,
      numeroExterior, numeroInterior, colonia,
      codigoPostal, pais, estado, ciudad,
      telefono: '',
      responsable: empleadoActual?.nombre || '',
      responsableId: empleadoActual?.uid || null,
      horarioApertura: '08:00',
      horarioCierre: '21:00',
      activa: false,
      formato,
      esCotizacion: true,
      rentaMensual: num(rentaMensual),
      gastosServicios: num(gastosServicios),
      nominaEstimada: nominaCalculada,
      gastosAdicionales: num(gastosAdicionales),
      inventarioInicial: num(inventarioInicial),
      notasCotizacion: notas,
      anchoLocal: 0,
      largoLocal: 0,
    });
    if (result.success) {
      setShowSuccess(true);
    }
    setIsSaving(false);
  };

  // ── Step JSX ──

  const paso1 = (
    <div style={{ padding: '20px 0 0' }}>
      {/* ── Hero format carousel ── */}
      <div className="formato-hero-row">
        {['Punto Verde', 'Punto Verde GO', 'Punto Verde XL'].map(fmt => {
          const m = FORMATOS_META[fmt];
          const p = PERFILES[fmt];
          const sel = formato === fmt;
          return (
            <div
              key={fmt}
              className={`formato-hero-card${sel ? ' selected' : ''}`}
              style={{
                background: m.gradient,
                opacity: sel ? 1 : 0.52,
                boxShadow: sel ? `0 12px 36px ${m.colorDark}50` : '0 2px 8px rgba(0,0,0,0.10)',
                border: sel ? '2px solid rgba(255,255,255,0.6)' : '2px solid transparent',
              }}
              onClick={() => aplicarFormato(fmt)}
            >
              {sel && (
                <div style={{ position: 'absolute', top: 11, right: 11, width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-check2" style={{ color: 'white', fontSize: 13 }} />
                </div>
              )}
              {/* Logos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <img src={getLogo(fmt)} alt={fmt} style={{ height: 18, objectFit: 'contain', objectPosition: 'left', maxWidth: '70%', mixBlendMode: getLogoBlend(fmt) }} />
                <img src={getBadge(fmt)} alt={fmt} style={{ height: 26, objectFit: 'contain', objectPosition: 'left', maxWidth: '80%', mixBlendMode: getLogoBlend(fmt), opacity: 0.9 }} />
              </div>
              {/* Tagline */}
              <div style={{ fontSize: 12, fontWeight: 500, color: m.textColor, opacity: 0.85, lineHeight: 1.35, marginTop: 8, flex: 1 }}>
                {p.tagline}
              </div>
              {/* Stat chips */}
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {[
                  { icon: 'bi-rulers', text: `${p.areaMin}–${p.areaMax} m²` },
                  { icon: 'bi-people-fill', text: `${p.empleadosMin}–${p.empleadosMax} emp.` },
                  { icon: 'bi-cash-register', text: `${p.cajas} ${p.cajas > 1 ? 'cajas' : 'caja'}` },
                ].map((stat, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'rgba(255,255,255,0.20)',
                    borderRadius: 999, padding: '3px 9px',
                    fontSize: 10, fontWeight: 700, color: m.textColor, letterSpacing: 0.2,
                  }}>
                    <i className={`bi ${stat.icon}`} style={{ fontSize: 10 }} />
                    {stat.text}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom formats + "+" button */}
      {(customFormatos.length > 0 || true) && (
        <div style={{ marginTop: 10, padding: '0 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.38)', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 8 }}>
            Formatos personalizados
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {customFormatos.map(fmt => {
              const sel = formato === fmt.nombre;
              const grad = customGradient(fmt);
              const lum = customLuminance(fmt) + (fmt.brightness || 0);
              const isLight = lum > 0.45;
              const textCol = isLight ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)';
              const initials = (fmt.nombre || 'F').slice(0, 2).toUpperCase();
              return (
                <div
                  key={fmt.id}
                  className={`formato-card ${sel ? 'selected' : ''}`}
                  style={{
                    flex: '0 0 100px', width: 100,
                    background: grad,
                    opacity: sel ? 1 : 0.55,
                    boxShadow: sel ? `0 8px 24px rgba(0,0,0,0.35)` : 'none',
                    border: sel ? '2.5px solid rgba(255,255,255,0.85)' : '2.5px solid transparent',
                    flexDirection: 'column', gap: 4,
                  }}
                  onClick={() => aplicarFormato(fmt.nombre, fmt.perfilData)}
                >
                  {sel && (
                    <div style={{ position: 'absolute', top: 6, right: 6 }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01" stroke="white" strokeWidth="2.5" fill="none"/></svg>
                    </div>
                  )}
                  {fmt.logoUrl
                    ? <img src={fmt.logoUrl} alt={fmt.nombre} style={{ height: 24, maxWidth: '80%', objectFit: 'contain' }} />
                    : <span style={{ fontSize: 20, fontWeight: 900, color: textCol, letterSpacing: -0.5 }}>{initials}</span>
                  }
                  <span style={{ fontSize: 9, fontWeight: 700, color: textCol, textAlign: 'center', padding: '0 4px', lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmt.nombre}</span>
                </div>
              );
            })}

            {/* New format button */}
            <div
              className="formato-card"
              style={{ flex: '0 0 80px', width: 80, background: 'rgba(0,0,0,0.06)', border: '1.5px dashed rgba(0,0,0,0.18)', opacity: 0.75, cursor: 'pointer' }}
              onClick={() => setShowNuevoFormato(true)}
            >
              <span style={{ fontSize: 22, color: 'rgba(0,0,0,0.4)', lineHeight: 1 }}>+</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(0,0,0,0.4)', textAlign: 'center' }}>Nuevo formato</span>
            </div>
          </div>
        </div>
      )}


      <div className="perfil-panel" style={{ marginTop: 16, marginBottom: 20, marginLeft: 20, marginRight: 20, borderColor: `${meta.color}22` }}>
        <div style={{ padding: '18px 18px 0' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 14 }}>{perfil.tagline}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {[
              { label: 'Área', value: `${perfil.areaMin}–${perfil.areaMax} m²` },
              { label: 'Personal', value: `${perfil.empleadosMin}–${perfil.empleadosMax} personas` },
              { label: 'Cajas', value: String(perfil.cajas) },
              ...perfil.caracteristicas.map(c => ({ label: c.titulo, detalle: c.detalle })),
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, marginTop: 5, flexShrink: 0 }} />
                <span style={{ fontSize: 13 }}>
                  <strong style={{ fontWeight: 600 }}>{item.label}</strong>
                  {(item.detalle || item.value) &&
                    <span style={{ color: '#6B7280' }}>{'  '}{item.detalle || item.value}</span>
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ margin: '18px 18px 0', padding: '12px 14px', background: 'rgba(0,0,0,0.03)', borderRadius: 10, marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>Inventario inicial sugerido</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>{mxn(perfil.inventarioSugerido)}</div>
        </div>
      </div>

      {(() => {
        const a = stats.averages[formato] || {};
        const marcas = stats.topMarcas[formato] || [];
        const meses = stats.ventasMensuales[formato] || [];
        const rentaVal = a.renta > 0 ? a.renta : perfil.rentaTipica;
        const nominaVal = a.nomina > 0 ? a.nomina : perfil.empleadosMin * COSTO_EMP;
        const ventasVal = a.ventas || 0;
        const maxMes = Math.max(1, ...meses);
        const MES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
        return (
          <div className="perfil-panel" style={{ marginBottom: 20, padding: 18, marginLeft: 20, marginRight: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: 'VENTAS MENSUAL', value: ventasVal > 0 ? mxn(ventasVal) : '—' },
                { label: 'PROM. RENTA', value: mxn(rentaVal) },
                { label: 'PROM. NÓMINA', value: mxn(nominaVal) },
              ].map((b, i) => (
                <div key={i} style={{ background: meta.gradient, borderRadius: 12, padding: '10px 12px', color: '#fff' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, opacity: 0.85 }}>{b.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{b.value}</div>
                </div>
              ))}
            </div>
            {a.muestra > 0 && (
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
                Promedios basados en {a.muestra} sucursal{a.muestra === 1 ? '' : 'es'} de este formato.
              </div>
            )}
            {marcas.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Marcas más vendidas</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {marcas.map((m) => (
                    <span key={m} style={{ fontSize: 12, fontWeight: 600, color: meta.color, background: `${meta.color}14`, padding: '4px 10px', borderRadius: 999 }}>{m}</span>
                  ))}
                </div>
              </div>
            )}
            {meses.some((v) => v > 0) && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Ventas mensuales (este año)</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 72 }}>
                  {meses.map((v, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: '100%', height: `${Math.max(2, (v / maxMes) * 56)}px`, background: meta.gradient, borderRadius: 4 }} title={mxn(v)} />
                      <span style={{ fontSize: 9, color: '#9CA3AF' }}>{MES[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );

  const paso2 = (
    <div style={{ padding: '0 20px 20px', overflowY: 'auto' }}>
      <SectionLabel>Información básica</SectionLabel>
      <UnderlineField label="Nombre de la sucursal" value={nombre} onChange={setNombre} placeholder="Ej. Sucursal Centro" required />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <SelectField
          label="País"
          value={pais}
          onChange={(v) => { setPais(v); setEstado(''); }}
          options={['México', 'Estados Unidos', 'Canadá']}
          required
        />
        <SelectField
          label="Estado"
          value={estado}
          onChange={setEstado}
          options={ESTADOS_POR_PAIS[pais] || []}
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <UnderlineField label="Ciudad" value={ciudad} onChange={setCiudad} placeholder="Ciudad" required />
        <UnderlineField label="Código Postal" value={codigoPostal} onChange={setCodigoPostal} placeholder="00000" />
      </div>

      <SectionLabel>Dirección</SectionLabel>
      <UnderlineField label="Calle" value={calle} onChange={setCalle} placeholder="Nombre de la calle" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <UnderlineField label="No. Exterior" value={numeroExterior} onChange={setNumeroExterior} placeholder="123" />
        <UnderlineField label="No. Interior" value={numeroInterior} onChange={setNumeroInterior} placeholder="A (opcional)" />
      </div>

      <div style={{ marginTop: 16 }}>
        <UnderlineField label="Colonia" value={colonia} onChange={setColonia} placeholder="Nombre de la colonia" />
      </div>
    </div>
  );

  const paso3 = (
    <div style={{ padding: '0 20px 20px' }}>
      <SectionLabel>Costos operativos mensuales</SectionLabel>
      <MoneyField label="Renta mensual" value={rentaMensual} onChange={setRentaMensual} />
      <div style={{ marginTop: 16 }}>
        <MoneyField label="Gastos de servicios" value={gastosServicios} onChange={setGastosServicios} hint="Luz, agua, internet, gas" />
      </div>
      <div style={{ marginTop: 16 }}>
        <MoneyField label="Gastos adicionales" value={gastosAdicionales} onChange={setGastosAdicionales} hint="Otros gastos recurrentes" />
      </div>

      <SectionLabel>Inversión inicial (único)</SectionLabel>
      <MoneyField label="Depósito del local" value={depositoLocal} onChange={setDepositoLocal} hint="Generalmente equivale a 2 meses de renta" />
      <div style={{ marginTop: 16 }}>
        <MoneyField label="Inventario inicial" value={inventarioInicial} onChange={setInventarioInicial} />
      </div>
    </div>
  );

  const paso4 = (
    <div style={{ padding: '0 20px 20px' }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16, marginBottom: 4 }}>
        <div style={{ background: `${meta.color}0D`, borderRadius: 12, padding: '12px 14px', border: `1px solid ${meta.color}22` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>Empleados</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: meta.colorDark }}>{slots.length}</div>
        </div>
        <div style={{ background: `${meta.color}0D`, borderRadius: 12, padding: '12px 14px', border: `1px solid ${meta.color}22` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>Nómina estimada</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: meta.colorDark }}>{mxn(nominaCalculada)}</div>
        </div>
      </div>

      <SectionLabel>Equipo de la sucursal</SectionLabel>
      <div className="personal-grid">
        {slots.map((slot, index) => (
          <PersonalCard key={slot.id} slot={slot} index={index} />
        ))}
        <AddCard />
      </div>

      <SectionLabel>Salario por default</SectionLabel>
      <MoneyField
        label="Salario mensual estimado por empleado"
        value={salarioPorEmpleado}
        onChange={(v) => {
          setSalarioPorEmpleado(v);
          const sal = parseFloat(v) || COSTO_EMP;
          setSlots(prev => prev.map(s => s.empleadoUid ? s : { ...s, salario: sal }));
        }}
        hint="Se aplica a los puestos sin empleado asignado (incluye prestaciones)"
      />
    </div>
  );

  const paso5 = (
    <div style={{ padding: '0 20px 20px' }}>
      {/* Cover card */}
      <div style={{ background: meta.gradient, borderRadius: 14, padding: '18px', marginTop: 16, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -50, right: -30, filter: 'blur(30px)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <img src={getLogo(formato)} style={{ height: 18, objectFit: 'contain', mixBlendMode: getLogoBlend(formato) }} alt={formato} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: 1.4 }}>COTIZACIÓN</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'white', fontFamily: 'monospace' }}>{folio}</div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: meta.textColor }}>{nombre || 'Sin nombre'}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
            {(ciudad || estado) && (
              <span style={{ fontSize: 12, color: meta.isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)' }}>
                📍 {[ciudad, estado].filter(Boolean).join(', ')}
              </span>
            )}
            <span style={{ fontSize: 12, color: meta.isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)' }}>
              📅 {fechaCotizacion.toLocaleDateString('es-MX', { dateStyle: 'long' })}
            </span>
          </div>
        </div>
      </div>

      {costoMensual > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Costos operativos mensuales</SectionLabel>
          {num(rentaMensual) > 0 && <ResumenLinea label="Renta mensual" valor={num(rentaMensual)} />}
          {num(gastosServicios) > 0 && <ResumenLinea label="Servicios" valor={num(gastosServicios)} />}
          {nominaCalculada > 0 && <ResumenLinea label={`Nómina estimada (${slots.length} empleados)`} valor={nominaCalculada} />}
          {num(gastosAdicionales) > 0 && <ResumenLinea label="Otros gastos" valor={num(gastosAdicionales)} />}
          <ResumenSubtotal label="Subtotal mensual" valor={costoMensual} color={meta.colorDark} />
        </div>
      )}

      {inversionInicial > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Inversión inicial (único)</SectionLabel>
          {num(depositoLocal) > 0 && <ResumenLinea label="Depósito del local" valor={num(depositoLocal)} />}
          {num(inventarioInicial) > 0 && <ResumenLinea label="Inventario inicial" valor={num(inventarioInicial)} />}
          <ResumenSubtotal label="Subtotal inversión" valor={inversionInicial} color={meta.colorDark} />
        </div>
      )}

      {totalPrimerMes > 0 && (
        <div style={{ background: `${meta.color}14`, borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 4 }}>Inversión total primer mes</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: meta.colorDark }}>{mxn(totalPrimerMes)}</div>
        </div>
      )}

      {/* Notes */}
      <div style={{ marginBottom: 20 }}>
        <SectionLabel>Notas (opcional)</SectionLabel>
        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          rows={3}
          style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', color: '#111827', background: '#FAFAFA' }}
          placeholder="Observaciones, condiciones especiales, acuerdos..."
        />
      </div>

      {/* PDF button */}
      <button
        onClick={generarPDF}
        disabled={isGeneratingPDF}
        style={{ width: '100%', padding: '13px', border: `1.5px solid ${meta.color}4D`, borderRadius: 12, background: `${meta.color}14`, color: meta.color, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
        {isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}
      </button>

      <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        Se guardará como sucursal pendiente. Puedes activarla cuando esté lista.
      </div>
    </div>
  );

  const successView = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '32px 24px' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#22c55e" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <polyline points="9 15 11 17 15 13" />
        </svg>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>¡Cotización creada!</div>
      <div style={{ fontSize: 15, color: '#6B7280', marginBottom: 28 }}>{nombre}</div>

      <div style={{ width: '100%', background: 'white', borderRadius: 14, padding: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginBottom: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${meta.color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src={getLogo(formato)} style={{ height: 16, objectFit: 'contain', mixBlendMode: getLogoBlend(formato) }} alt={formato} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{nombre}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{formato}</div>
          </div>
          <div style={{ marginLeft: 'auto', background: 'rgba(249,115,22,0.12)', borderRadius: 20, padding: '3px 10px', fontSize: 9, fontWeight: 800, color: '#F97316', letterSpacing: 1 }}>COTIZACIÓN</div>
        </div>
        {totalPrimerMes > 0 && (
          <>
            <div style={{ height: 1, background: '#F3F4F6', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>Costo mensual estimado</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: meta.colorDark }}>{mxn(costoMensual)}</span>
            </div>
          </>
        )}
      </div>

      <button
        onClick={onCreated}
        style={{ width: '100%', marginTop: 24, padding: '13px', border: 'none', borderRadius: 12, background: '#22c55e', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
      >
        Listo
      </button>
    </div>
  );

  return (
    <>
    <div className="cotizar-overlay" onClick={onClose}>
      <div className="cotizar-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        {!showSuccess && (
          <div className="cotizar-header" style={{ background: paso >= 2 ? meta.gradient : 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 20px 0' }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: paso >= 2 ? meta.textColor : '#111827' }}>
                  {STEP_TITLES[paso - 1]}
                </div>
                <div style={{ fontSize: 13, color: paso >= 2 ? (meta.isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.75)') : '#6B7280', marginTop: 3 }}>
                  {STEP_SUBTITLES[paso - 1]}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {paso >= 2 && (
                  <img src={getBadge(formato)} alt={formato} style={{ height: 28, objectFit: 'contain' }} />
                )}
                <button
                  onClick={onClose}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: paso >= 2 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: paso >= 2 ? (meta.isLight ? 'rgba(0,0,0,0.7)' : 'white') : '#374151', fontSize: 14 }}
                >
                  ✕
                </button>
              </div>
            </div>
            {/* Progress bars */}
            <div style={{ display: 'flex', gap: 4, padding: '14px 20px' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: i <= paso
                      ? (paso >= 2 ? 'white' : meta.color)
                      : (paso >= 2 ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.1)'),
                    transition: 'background 0.3s',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        {showSuccess ? successView : (
          <div className="cotizar-body">
            {paso === 1 && paso1}
            {paso === 2 && paso2}
            {paso === 3 && paso3}
            {paso === 4 && paso4}
            {paso === 5 && paso5}
          </div>
        )}

        {/* Footer */}
        {!showSuccess && (
          <div className="cotizar-footer">
            <button className="cotizar-btn-sec" onClick={paso > 1 ? () => setPaso(p => p - 1) : onClose}>
              {paso > 1 ? '← Anterior' : 'Cancelar'}
            </button>
            <div style={{ flex: 1 }} />
            {paso < 5
              ? (
                <button
                  className="cotizar-btn-prim"
                  disabled={!canContinue}
                  style={{
                    background: canContinue ? meta.gradient : '#E5E7EB',
                    color: canContinue ? (meta.isLight ? 'rgba(0,0,0,0.85)' : 'white') : '#9CA3AF',
                    cursor: canContinue ? 'pointer' : 'not-allowed',
                  }}
                  onClick={() => setPaso(p => p + 1)}
                >
                  Continuar →
                </button>
              )
              : (
                <button
                  className="cotizar-btn-prim"
                  disabled={isSaving}
                  style={{
                    background: isSaving ? '#E5E7EB' : meta.gradient,
                    color: isSaving ? '#9CA3AF' : (meta.isLight ? 'rgba(0,0,0,0.85)' : 'white'),
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                  }}
                  onClick={crearCotizacion}
                >
                  {isSaving ? 'Creando...' : '📄 Crear cotización'}
                </button>
              )
            }
          </div>
        )}

        {/* Employee picker overlay */}
        {pickerSlotIndex !== null && (
          <div className="picker-overlay" onClick={() => setPickerSlotIndex(null)}>
            <div className="picker-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 12px', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Asignar empleado</div>
                <button onClick={() => setPickerSlotIndex(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6B7280' }}>✕</button>
              </div>

              {loadingEmpleados ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <div className="spinner-border spinner-border-sm" />
                </div>
              ) : empleadosDisponibles.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>No hay empleados disponibles</div>
              ) : (
                <div style={{ padding: 16, overflowY: 'auto', maxHeight: 350 }}>
                  <div className="personal-grid">
                    {empleadosDisponibles.map(emp => {
                      const initials = emp.nombre?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
                      return (
                        <div key={emp.id} className="empleado-picker-card" onClick={() => assignEmployee(emp, pickerSlotIndex)}>
                          <div className="personal-slot-avatar" style={{ background: `${meta.color}1A`, borderColor: `${meta.color}33`, width: 50, height: 50, marginBottom: 6 }}>
                            {emp.fotoUrl
                              ? <img src={emp.fotoUrl} alt={emp.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                              : <span style={{ fontSize: 16, fontWeight: 700, color: meta.color }}>{initials}</span>
                            }
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#111827', textAlign: 'center', lineHeight: 1.2 }}>{emp.nombre}</div>
                          <div style={{ fontSize: 9, color: '#6B7280', textAlign: 'center', textTransform: 'uppercase', marginTop: 2 }}>{emp.rol || 'staff'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {slots[pickerSlotIndex]?.empleadoUid && (
                <div style={{ borderTop: '1px solid #F3F4F6' }}>
                  <button
                    onClick={() => unassignSlot(pickerSlotIndex)}
                    style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: '#EF4444', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                  >
                    Quitar empleado de este puesto
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>

    {showNuevoFormato && (
      <NuevoFormatoModal
        onClose={() => setShowNuevoFormato(false)}
        onCreated={(newFmt) => {
          setCustomFormatos(prev => [...prev, newFmt]);
          aplicarFormato(newFmt.nombre, newFmt.perfilData);
          setShowNuevoFormato(false);
        }}
      />
    )}
    </>
  );
};

export default CotizarSucursal;
