import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEmpresa } from '../context/EmpresaContext';
import { filterByActiveEmpresa } from '../lib/empresaActiva';
import tiendaService from '../services/tiendaService';
import empleadoService from '../services/empleadoService';
import orderService from '../services/orderService';
import registroActividadService from '../services/registroActividadService';
import CotizarSucursal from './CotizarSucursal';
import NuevoFormatoModal from '../components/NuevoFormatoModal';
import formatoCustomService from '../services/formatoCustomService';
import { customFormatoMeta } from '../data/formatos';
import { rgbCss } from '../lib/brandColor';
import {
  usesPaletteColors, paletteBackground, themeTextColor, resolveTheme, DEFAULT_EMPRESA_ID,
} from '../lib/empresaTheme';
import { brandColor } from '../lib/brandRoles';
import { resolveLogo, emblemaIniciales, wordmarkStyle } from '../lib/logoResolver';
import formatoPV from '../assets/formato-pv.png';
import formatoGO from '../assets/formato-go.png';
import formatoXL from '../assets/formato-xl.png';
import logoDark600 from '../assets/logo-dark-600.png';
import logoBlanco from '../assets/logo-blanco.png';
import logoColor from '../assets/logo-color.png';
import './Tiendas.css';

const FORMATOS = {
  'Punto Verde': {
    label: 'Punto Verde', short: 'PV', subtitle: '',
    color: '#0F4D2D', colorDark: '#09381E',
    gradient: 'linear-gradient(135deg, #09381E 0%, #0F4D2D 100%)',
    logo: logoBlanco, logoBlend: 'normal', badge: formatoPV,
    tagline: 'Tienda de barrio', textColor: 'rgba(255,255,255,0.9)',
  },
  'Punto Verde GO': {
    label: 'Punto Verde GO', short: 'PV GO', subtitle: 'GO',
    color: '#EFA400', colorDark: '#C68700',
    gradient: 'linear-gradient(135deg, #C68700 0%, #EFA400 100%)',
    logo: logoColor, logoBlend: 'multiply', badge: formatoGO,
    tagline: 'Formato intermedio con mayor variedad', textColor: 'rgba(0,0,0,0.8)',
  },
  'Punto Verde XL': {
    label: 'Punto Verde XL', short: 'PV XL', subtitle: 'XL',
    color: '#1A1A1A', colorDark: '#0E0E0E',
    gradient: 'linear-gradient(135deg, #0E0E0E 0%, #1A1A1A 100%)',
    logo: logoBlanco, logoBlend: 'normal', badge: formatoXL,
    tagline: 'Supermercado de formato grande', textColor: 'rgba(255,255,255,0.9)',
  },
};
FORMATOS['PuntoVerde']    = FORMATOS['Punto Verde'];
FORMATOS['PuntoVerde GO'] = FORMATOS['Punto Verde GO'];
FORMATOS['PuntoVerde XL'] = FORMATOS['Punto Verde XL'];

const FORMATO_KEYS = ['Punto Verde', 'Punto Verde GO', 'Punto Verde XL'];

const fmtNum = (v) =>
  new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(Math.round(v || 0));

const toDate = (v) => (v?.toDate ? v.toDate() : v ? new Date(v) : null);

// Gradiente de formatos custom — wrapper sobre lib/brandColor (fuente única).
const _rgbFmt = (fmt, extra = 0) => rgbCss(fmt, extra);

// Convierte un hex #rrggbb a rgba() con alpha (para tinta de marca con opacidad).
const hexToRgba = (hex, a) => {
  const h = String(hex || '').replace('#', '');
  if (h.length < 6) return `rgba(0,0,0,${a})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const Tiendas = () => {
  const { hasPermission, empleado } = useAuth();
  const { activaId, empresaActiva } = useEmpresa();

  // ── Brand-awareness (réplica Jul 7 de TiendasView.swift) ────────────────────
  // Para empresas con paleta (Kaal, id≠default) las superficies de sucursal se
  // pintan con la paleta de marca (Crema/Carbón/Oro + monograma) en lugar del
  // verde de Punto Verde. Punto Verde (default) conserva su look de formato.
  const paleta = !!empresaActiva && empresaActiva.id !== DEFAULT_EMPRESA_ID && usesPaletteColors(empresaActiva);
  const brandBgCss     = paleta ? paletteBackground(empresaActiva).css : null;                    // Crema plano
  const brandInkHex    = paleta ? themeTextColor(empresaActiva) : null;                            // Carbón
  const brandAccentHex = paleta ? brandColor(empresaActiva, 'acentoPrincipal') : null;            // Oro
  const brandIniciales = paleta ? emblemaIniciales(empresaActiva) : '';
  const brandLogoInfo  = paleta ? resolveLogo(empresaActiva) : null;
  const brandTheme     = paleta ? resolveTheme(empresaActiva) : null;

  // Tinta de marca (Carbón) con opacidad, para textos sobre el fondo Crema.
  const brandTc = (a) => hexToRgba(brandInkHex, a);

  // Monograma/wordmark de la marca (reemplaza el logo verde de PV en los cards).
  // `size` es la altura tipográfica en px.
  const BrandMark = ({ size = 20, opacity = 1 }) => {
    if (!paleta) return null;
    if (brandLogoInfo?.kind === 'image') {
      return <img src={brandLogoInfo.url} alt="" style={{ maxHeight: size, maxWidth: 120, objectFit: 'contain', opacity }} />;
    }
    if (brandLogoInfo?.kind === 'wordmark') {
      return <span style={{ ...wordmarkStyle(empresaActiva, brandTheme, { fontSize: size, color: brandInkHex }), opacity }}>{brandLogoInfo.text}</span>;
    }
    // Fallback: monograma de iniciales en Oro (la "K" de Kaal).
    return (
      <span style={{ fontSize: size, fontWeight: 900, letterSpacing: -0.5, color: brandAccentHex, lineHeight: 1, opacity }}>
        {brandIniciales || '·'}
      </span>
    );
  };
  const [tiendas, setTiendas] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const showToast = (msg, ms = 3000) => { setToast(msg); setTimeout(() => setToast(''), ms); };
  const [formatoFilter, setFormatoFilter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCotizarModal, setShowCotizarModal] = useState(false);
  const [editingFormato, setEditingFormato] = useState(null);
  const [editingTienda, setEditingTienda] = useState(null);
  const [selectedTienda, setSelectedTienda] = useState(null);
  const [customFormatos, setCustomFormatos] = useState([]);
  const [teamData, setTeamData] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const canEdit = hasPermission('tiendas_crear') || hasPermission('tiendas_editar');
  const isAdmin = empleado?.rol === 'admin';

  const [formData, setFormData] = useState({
    nombre: '', formato: 'Punto Verde', calle: '', numeroExterior: '', numeroInterior: '',
    colonia: '', cp: '', ciudad: '', estado: '', pais: 'México', telefono: '',
    responsable: '', responsableId: '', horarioApertura: '07:00', horarioCierre: '23:00', activa: true
  });

  useEffect(() => { fetchTiendas(); }, []);

  const fetchTiendas = async () => {
    setLoading(true);
    const [tRes, oRes, fmtRes] = await Promise.all([
      tiendaService.fetchTodas(),
      orderService.getOrdenes('todas'),
      formatoCustomService.fetchAll(),
    ]);
    if (tRes.success) setTiendas(tRes.data);
    if (oRes.success) setVentas(oRes.data);
    if (fmtRes.success) setCustomFormatos(fmtRes.data);
    setLoading(false);
  };

  // Promedio mensual, ventas de hoy y mes actual por tienda.
  const stats = useMemo(() => {
    const now = new Date();
    const curY = now.getFullYear(), curM = now.getMonth();
    const prom = {}, hoy = {}, mes = {}, tickets = {}, byMonth = {};
    ventas.forEach((o) => {
      const d = toDate(o.createdAt);
      const tid = o.tiendaId;
      if (!d || !tid) return;
      const total = o.total || 0;
      if (d.getFullYear() === curY && d.getMonth() === curM && d.getDate() === now.getDate()) {
        hoy[tid] = (hoy[tid] || 0) + total;
      }
      if (d.getFullYear() === curY && d.getMonth() === curM) {
        mes[tid] = (mes[tid] || 0) + total;
        tickets[tid] = (tickets[tid] || 0) + 1;
      }
      const ym = `${d.getFullYear()}-${d.getMonth()}`;
      (byMonth[tid] = byMonth[tid] || {})[ym] = (byMonth[tid][ym] || 0) + total;
    });
    Object.entries(byMonth).forEach(([tid, months]) => {
      const vals = Object.values(months);
      prom[tid] = vals.reduce((a, b) => a + b, 0) / Math.max(vals.length, 1);
    });
    return { prom, hoy, mes, tickets, byMonth };
  }, [ventas]);

  // Primero filtramos por empresa activa (multi-tenant, igual que
  // fetchAllForActiveEmpresa en macOS); las legacy sin empresaId caen a default.
  const tiendasEmpresa = filterByActiveEmpresa(tiendas, activaId);
  // Managers solo ven sus tiendas asignadas (igual que macOS)
  const tiendasDelUsuario = isAdmin ? tiendasEmpresa : tiendasEmpresa.filter(t => {
    const misAsignadas = empleado?.tiendasAsignadas || [];
    return misAsignadas.includes(t.id)
      || t.responsable === empleado?.nombre
      || t.responsableId === empleado?.uid;
  });

  // Secciones del browse (estilo macOS).
  const operacionList = tiendasDelUsuario.filter(t => t.activa !== false && !t.esCotizacion);
  const cerradasList = tiendasDelUsuario.filter(t => t.activa === false && !t.esCotizacion);
  const cotizacionesList = tiendasDelUsuario.filter(t => t.esCotizacion);
  const topTiendas = [...operacionList]
    .sort((a, b) => (stats.prom[b.id] || 0) - (stats.prom[a.id] || 0))
    .filter(t => (stats.prom[t.id] || 0) > 0)
    .slice(0, 8);

  // Resuelve el formato de una tienda: primero los 3 system, luego los custom
  // (por nombre). Réplica de UserFormatosStore.resolve() — así una sucursal con
  // formato personalizado se pinta con su color real en TODA la pantalla.
  const getFormato = (t) => {
    const std = FORMATOS[t?.formato];
    if (std) return std;
    const cust = customFormatos.find(f => f.nombre === t?.formato);
    if (cust) return customFormatoMeta(cust);
    return FORMATOS['Punto Verde'];
  };
  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  // Promover cotización → sucursal real (esCotizacion=false, activa=true).
  const handlePromover = async (tienda) => {
    if (!window.confirm(`¿Promover "${tienda.nombre}" a sucursal real? Quedará activa y dejará de ser una cotización.`)) return;
    const res = await tiendaService.update(tienda.id, { esCotizacion: false, activa: true });
    if (res.success) {
      registroActividadService.registrar({
        tiendaId: tienda.id, tiendaNombre: tienda.nombre,
        accion: 'cotizacion_promovida',
        descripcion: `Cotización "${tienda.nombre}" promovida a sucursal`,
        realizadoPor: empleado?.nombre || 'Sistema', realizadoPorId: empleado?.uid || '',
      });
      showToast('Cotización activada como sucursal');
      handleCloseDetail();
      fetchTiendas();
    } else {
      showToast('Error: ' + res.error);
    }
  };

  // Eliminar formato custom (desde el detalle del formato).
  const handleEliminarFormato = async (id) => {
    const res = await formatoCustomService.remove(id);
    if (res.success) { setEditingFormato(null); setFormatoFilter(null); fetchTiendas(); showToast('Formato eliminado'); }
    else showToast('Error: ' + res.error);
  };

  const isEstaAbierta = (tienda) => {
    if (tienda.activa === false) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [aH, aM] = (tienda.horarioApertura || '07:00').split(':').map(Number);
    const [cH, cM] = (tienda.horarioCierre || '23:00').split(':').map(Number);
    const apertura = (aH || 0) * 60 + (aM || 0);
    const cierre = (cH || 0) * 60 + (cM || 0);
    if (cierre > apertura) return currentMinutes >= apertura && currentMinutes < cierre;
    return currentMinutes >= apertura || currentMinutes < cierre;
  };

  const formatPhone = (tel) => {
    if (!tel) return '—';
    const d = tel.replace(/\D/g, '');
    if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
    return tel;
  };

  const handleSave = async () => {
    if (!formData.nombre) { showToast('El nombre es requerido'); return; }
    const isEditing = !!editingTienda;
    const payload = {
      nombre: formData.nombre, formato: formData.formato,
      direccion: {
        calle: formData.calle || '', numeroExterior: formData.numeroExterior || '',
        numeroInterior: formData.numeroInterior || '', colonia: formData.colonia || '',
        cp: formData.cp || '', ciudad: formData.ciudad || '',
        estado: formData.estado || '', pais: formData.pais || 'México',
      },
      telefono: formData.telefono || '', responsable: formData.responsable || '',
      responsableId: formData.responsableId || '',
      horarioApertura: formData.horarioApertura || '07:00',
      horarioCierre: formData.horarioCierre || '23:00',
      activa: formData.activa,
    };
    const result = isEditing
      ? await tiendaService.update(editingTienda.id, payload)
      : await tiendaService.create(payload);
    if (result.success) {
      const tiendaId = isEditing ? editingTienda.id : result.id;
      registroActividadService.registrar({
        tiendaId:      tiendaId || formData.nombre,
        tiendaNombre:  formData.nombre,
        accion:        isEditing ? 'tienda_editada' : 'tienda_creada',
        descripcion:   isEditing ? `Sucursal "${formData.nombre}" actualizada` : `Sucursal "${formData.nombre}" creada`,
        realizadoPor:  empleado?.nombre || 'Sistema',
        realizadoPorId: empleado?.uid || '',
      });
      setShowModal(false); setEditingTienda(null); resetForm(); fetchTiendas();
      showToast(isEditing ? 'Sucursal actualizada' : 'Sucursal creada');
    } else { showToast('Error: ' + result.error); }
  };

  const handleEdit = (e, tienda) => {
    e.stopPropagation();
    setEditingTienda(tienda);
    setFormData({
      nombre: tienda.nombre || '', formato: tienda.formato || 'Punto Verde',
      calle: tienda.direccion?.calle || tienda.calle || '', numeroExterior: tienda.direccion?.numeroExterior || tienda.numeroExterior || '',
      numeroInterior: tienda.direccion?.numeroInterior || tienda.numeroInterior || '', colonia: tienda.direccion?.colonia || tienda.colonia || '',
      cp: tienda.direccion?.cp || tienda.cp || '', ciudad: tienda.direccion?.ciudad || tienda.ciudad || '',
      estado: tienda.direccion?.estado || tienda.estado || '', pais: tienda.direccion?.pais || tienda.pais || 'México',
      telefono: tienda.telefono || '', responsable: tienda.responsable || '',
      responsableId: tienda.responsableId || '', horarioApertura: tienda.horarioApertura || '07:00',
      horarioCierre: tienda.horarioCierre || '23:00', activa: tienda.activa !== false
    });
    setShowModal(true);
  };

  const handleToggle = async (e, tienda) => {
    e.stopPropagation();
    const nuevaActiva = !(tienda.activa !== false);
    await tiendaService.toggleActiva(tienda.id);
    registroActividadService.registrar({
      tiendaId:      tienda.id,
      tiendaNombre:  tienda.nombre,
      accion:        nuevaActiva ? 'tienda_activada' : 'tienda_desactivada',
      descripcion:   `Sucursal "${tienda.nombre}" ${nuevaActiva ? 'activada' : 'desactivada'}`,
      realizadoPor:  empleado?.nombre || 'Sistema',
      realizadoPorId: empleado?.uid || '',
    });
    fetchTiendas();
  };

  const resetForm = () => setFormData({
    nombre: '', formato: 'Punto Verde', calle: '', numeroExterior: '', numeroInterior: '',
    colonia: '', cp: '', ciudad: '', estado: '', pais: 'México', telefono: '',
    responsable: '', responsableId: '', horarioApertura: '07:00', horarioCierre: '23:00', activa: true
  });

  const handleOpenDetail = async (tienda) => {
    setSelectedTienda(tienda);
    setActivityLog([]);
    setLoadingTeam(true);
    setLoadingActivity(true);
    const [teamResult, actResult] = await Promise.all([
      empleadoService.fetchByTienda(tienda.id),
      registroActividadService.fetchPorTienda(tienda.id, 20),
    ]);
    setTeamData(teamResult.success ? teamResult.data : []);
    setActivityLog(actResult.success ? actResult.data : []);
    setLoadingTeam(false);
    setLoadingActivity(false);
  };

  const handleCloseDetail = () => {
    setSelectedTienda(null);
    setTeamData([]);
    setActivityLog([]);
  };

  const renderCard = (tienda) => {
    const fmt = getFormato(tienda);
    const isWhiteText = !fmt.textColor.includes('0,0,0');
    const tc = (opacity) => isWhiteText
      ? `rgba(255,255,255,${opacity})`
      : `rgba(0,0,0,${opacity})`;
    const abierta = isEstaAbierta(tienda);

    return (
      <div
        key={tienda.id}
        className="tienda-card"
        style={{
          background: fmt.gradient,
          boxShadow: `0 6px 24px ${fmt.colorDark}40`,
          opacity: tienda.activa === false ? 0.7 : 1,
        }}
        onClick={() => handleOpenDetail(tienda)}
      >
        {/* Decorative orb */}
        <div className="tienda-card-orb" />

        {/* Acciones (hover) */}
        {canEdit && (
          <div className="tienda-card-edit-actions" onClick={e => e.stopPropagation()}>
            <button
              title={tienda.activa !== false ? 'Desactivar' : 'Activar'}
              onClick={(e) => handleToggle(e, tienda)}
            >
              {tienda.activa !== false
                ? <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                : <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              }
            </button>
            <button title="Editar" onClick={(e) => handleEdit(e, tienda)}>
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
        )}

        {/* Contenido centrado */}
        <div className="tienda-card-content">
          <img src={fmt.logo} alt={fmt.label} className="tienda-card-logo" style={{ filter: fmt.logoFilter, mixBlendMode: fmt.logoBlend || 'normal' }} />

          <div className="tienda-card-nombre" style={{ color: tc(0.92) }}>
            {tienda.nombre}
          </div>

          <div className="tienda-card-ciudad" style={{ color: tc(0.78) }}>
            {[tienda.direccion?.ciudad, tienda.direccion?.estado].filter(Boolean).join(', ') || '—'}
          </div>

          <div className="tienda-card-horario" style={{ color: tc(0.65) }}>
            {tienda.horarioApertura && tienda.horarioCierre
              ? `${tienda.horarioApertura} – ${tienda.horarioCierre}`
              : ''}
          </div>

          {tienda.esCotizacion ? (
            <div style={{ background: 'rgba(249,115,22,0.85)', borderRadius: 20, padding: '3px 10px', fontSize: 9, fontWeight: 800, color: 'white', letterSpacing: 1, marginBottom: 4 }}>
              COTIZACIÓN
            </div>
          ) : (
            <div className="tienda-card-status-badge" style={{ background: abierta ? '#22c55e' : '#ef4444' }}>
              {abierta ? 'ABIERTA' : 'CERRADA'}
            </div>
          )}

          {isAdmin && tienda.responsable && (
            <div className="tienda-card-manager-row">
              <div className="tienda-card-manager-avatar" style={{ color: tc(0.9) }}>
                {getInitial(tienda.responsable)}
              </div>
              <span className="tienda-card-manager-nombre" style={{ color: tc(0.85) }}>
                {tienda.responsable}
              </span>
            </div>
          )}
        </div>

        {/* Badge formato bottom-right */}
        <img src={fmt.badge} alt={fmt.label} className="tienda-card-format-badge" />
      </div>
    );
  };

  const renderListRow = (tienda) => {
    const fmt = getFormato(tienda);
    return (
      <div key={tienda.id} className="tienda-list-row" onClick={() => handleOpenDetail(tienda)}>
        <div className="tienda-list-logo-box" style={{ background: fmt.gradient }}>
          <img src={fmt.logo} alt={fmt.label} style={{ filter: fmt.logoFilter, mixBlendMode: fmt.logoBlend || 'normal' }} />
        </div>
        <div className="tienda-list-info">
          <div className="tienda-list-title">
            <h4>{tienda.nombre}</h4>
            {tienda.activa === false && <span className="inactiva-badge">Inactiva</span>}
          </div>
          <div className="tienda-list-address">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {tienda.direccion?.calle} #{tienda.direccion?.numeroExterior}, {tienda.direccion?.colonia}, {tienda.direccion?.ciudad}
          </div>
        </div>
        <div className="tienda-list-right">
          {tienda.responsable && isAdmin && (
            <div className="tienda-list-manager">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {tienda.responsable}
            </div>
          )}
          <div className="tienda-list-hours">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {tienda.horarioApertura} — {tienda.horarioCierre}
          </div>
        </div>
        <svg className="tienda-list-chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    );
  };

  const renderTiendaDetail = () => {
    if (!selectedTienda) return null;
    const fmt = getFormato(selectedTienda);
    const managers = teamData.filter(e => ['LIDER', 'MANAGER', 'DIRECTOR', 'ADMIN'].includes(e.rol?.toUpperCase()));
    const staffList = teamData.filter(e => !['LIDER', 'MANAGER', 'DIRECTOR', 'ADMIN'].includes(e.rol?.toUpperCase()));
    const tid = selectedTienda.id;
    const avgTicket = (stats.tickets[tid] || 0) > 0
      ? (stats.mes[tid] || 0) / stats.tickets[tid] : 0;

    // Monthly bar chart — build 12 months for current year
    const curYear = new Date().getFullYear();
    const byMonthTienda = stats.byMonth[tid] || {};
    const MES_ABREV = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const key = `${curYear}-${i}`;
      return byMonthTienda[key] || 0;
    });
    const maxMonth = Math.max(1, ...monthlyData);
    const hasMonthlyData = monthlyData.some(v => v > 0);

    // Finanzas estimadas
    const rentaMensual = selectedTienda.rentaMensual || 0;
    const nominaEstimada = selectedTienda.nominaEstimada || 0;
    const promVentas = stats.prom[tid] || 0;
    const margenEstimado = promVentas > 0 ? promVentas * 0.28 - rentaMensual - nominaEstimada : 0;
    const hasFinanzas = rentaMensual > 0 || nominaEstimada > 0;

    const mxnFmt = (v) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v || 0);

    return (
      <div className="tienda-detail-overlay" onClick={handleCloseDetail}>
        <div className="tienda-detail" onClick={e => e.stopPropagation()}>
          <div className="tienda-detail-scroll">

            <div className="tienda-detail-header" style={{ background: fmt.gradient }}>
              <div className="tienda-detail-toolbar">
                <button onClick={handleCloseDetail}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                {canEdit && (
                  <button onClick={(e) => { handleCloseDetail(); handleEdit(e, selectedTienda); }}>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  </button>
                )}
              </div>
              <div className="tienda-detail-brand">
                <img src={fmt.logo} alt="Punto Verde" className="detail-logo" style={{ filter: fmt.logoFilter, mixBlendMode: fmt.logoBlend || 'normal' }} />
                <h2 style={{ color: fmt.textColor }}>{selectedTienda.nombre}</h2>
                <img src={fmt.badge} alt={fmt.label} className="detail-badge" />
              </div>
              <div className="tienda-detail-info">
                {selectedTienda.responsable && (
                  <div className="tienda-detail-info-row" style={{ color: fmt.textColor }}>
                    <div className="tienda-detail-manager-avatar">{getInitial(selectedTienda.responsable)}</div>
                    <span style={{ fontWeight: 500 }}>{selectedTienda.responsable}</span>
                  </div>
                )}
                <div className="tienda-detail-info-row" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>{selectedTienda.horarioApertura || '—'} — {selectedTienda.horarioCierre || '—'}</span>
                </div>
              </div>
            </div>

            {/* ── Promedio mensual banner ── */}
            {promVentas > 0 && (
              <div style={{
                margin: '12px 16px 0',
                background: fmt.gradient,
                borderRadius: 14, padding: '14px 18px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, color: fmt.textColor, opacity: 0.75, textTransform: 'uppercase' }}>Promedio mensual de ventas</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: fmt.textColor, lineHeight: 1.2, marginTop: 2 }}>{mxnFmt(promVentas)}</div>
                </div>
                <i className="bi bi-graph-up-arrow" style={{ fontSize: 28, color: fmt.textColor, opacity: 0.5 }} />
              </div>
            )}

            {/* ── 2×2 stat dashboard ── */}
            <div className="tienda-detail-dashboard">
              <div className="tienda-dash-widget">
                <div className="tienda-dash-icon" style={{ background: `${fmt.color}1A` }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={fmt.color} strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
                <div className="tienda-dash-value">${fmtNum(stats.hoy[tid] || 0)}</div>
                <div className="tienda-dash-labels"><span>Ventas Hoy</span></div>
              </div>
              <div className="tienda-dash-widget">
                <div className="tienda-dash-icon" style={{ background: 'rgba(147,51,234,0.1)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div className="tienda-dash-value">${fmtNum(stats.mes[tid] || 0)}</div>
                <div className="tienda-dash-labels"><span>Ventas Mes</span></div>
              </div>
              <div className="tienda-dash-widget">
                <div className="tienda-dash-icon" style={{ background: 'rgba(249,115,22,0.1)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div className="tienda-dash-value">${fmtNum(avgTicket)}</div>
                <div className="tienda-dash-labels"><span>Ticket Prom.</span></div>
              </div>
              <div className="tienda-dash-widget">
                <div className="tienda-dash-icon" style={{ background: 'rgba(37,99,235,0.1)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="tienda-dash-value">{teamData.length}</div>
                <div className="tienda-dash-labels">
                  <span>Equipo</span><span className="dot"></span>
                  <span>{managers.length} mgr · {staffList.length} staff</span>
                </div>
              </div>
            </div>

            {/* ── Monthly bar chart ── */}
            {hasMonthlyData && (
              <div className="tienda-detail-section">
                <h4>Ventas {curYear}</h4>
                <div className="tienda-detail-card-padded" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 72 }}>
                    {monthlyData.map((v, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div
                          style={{
                            width: '100%',
                            height: `${Math.max(2, (v / maxMonth) * 56)}px`,
                            background: v > 0 ? fmt.gradient : '#E5E7EB',
                            borderRadius: 4,
                            transition: 'height .3s',
                          }}
                          title={`${MES_ABREV[i]}: $${fmtNum(v)}`}
                        />
                        <span style={{ fontSize: 8.5, color: '#9CA3AF', fontWeight: 600 }}>{MES_ABREV[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Finanzas estimadas (si hay datos) ── */}
            {hasFinanzas && (
              <div className="tienda-detail-section">
                <h4>Finanzas Estimadas</h4>
                <div className="tienda-detail-card-padded">
                  {[
                    { label: 'Ventas prom. mensual', value: mxnFmt(promVentas), color: '#059669', icon: 'bi-graph-up-arrow' },
                    { label: 'Renta mensual', value: mxnFmt(rentaMensual), color: '#DC2626', icon: 'bi-building' },
                    { label: 'Nómina estimada', value: mxnFmt(nominaEstimada), color: '#DC2626', icon: 'bi-people-fill' },
                    { label: 'Margen est. (28% bruto)', value: mxnFmt(margenEstimado), color: margenEstimado >= 0 ? '#059669' : '#DC2626', icon: 'bi-piggy-bank' },
                  ].map((row, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 0',
                      borderBottom: i < 3 ? '1px solid #F3F4F6' : 'none',
                    }}>
                      <i className={`bi ${row.icon}`} style={{ fontSize: 13, color: row.color, width: 18, textAlign: 'center', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: row.color }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="tienda-detail-section">
              <h4>Ubicación</h4>
              <div className="tienda-detail-card-padded">
                <div className="tienda-location-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <div>
                    <strong>{selectedTienda.direccion?.calle || '—'} #{selectedTienda.direccion?.numeroExterior || ''}</strong>
                    {selectedTienda.direccion?.numeroInterior && ` Int. ${selectedTienda.direccion.numeroInterior}`}
                    <br/>Col. {selectedTienda.direccion?.colonia || '—'}, {selectedTienda.direccion?.ciudad || '—'}, {selectedTienda.direccion?.estado || '—'}
                    {selectedTienda.direccion?.cp && ` C.P. ${selectedTienda.direccion.cp}`}
                  </div>
                </div>
                <div className="tienda-location-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg>
                  <span>{formatPhone(selectedTienda.telefono)}</span>
                </div>
              </div>
            </div>

            <div className="tienda-detail-section" style={{ paddingBottom: '24px' }}>
              <h4>Equipo</h4>
              {loadingTeam ? (
                <div className="tienda-team-empty"><div className="spinner-border spinner-border-sm"></div></div>
              ) : teamData.length === 0 ? (
                <div className="tienda-team-empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>
                  <p>Sin empleados asignados</p>
                </div>
              ) : (
                <div className="tienda-detail-card">
                  {managers.map(emp => (
                    <div key={emp.id} className="tienda-team-row">
                      <div className="tienda-team-avatar manager-av">{getInitial(emp.nombre)}</div>
                      <div className="tienda-team-info">
                        <div className="tienda-team-name">{emp.nombre}<span className="tienda-team-role-badge" style={{ background: '#2563EB' }}>Manager</span></div>
                        <div className="tienda-team-id">{emp.numEmpleado || emp.email}</div>
                      </div>
                      <div className={`tienda-team-status ${emp.activo !== false ? 'on' : 'off'}`}></div>
                    </div>
                  ))}
                  {staffList.length > 0 && <div className="tienda-team-staff-label">{staffList.length} STAFF</div>}
                  {staffList.map(emp => (
                    <div key={emp.id} className="tienda-team-row">
                      <div className="tienda-team-avatar staff-av">{getInitial(emp.nombre)}</div>
                      <div className="tienda-team-info">
                        <div className="tienda-team-name">{emp.nombre}</div>
                        <div className="tienda-team-id">{emp.numEmpleado || emp.email}</div>
                      </div>
                      <div className={`tienda-team-status ${emp.activo !== false ? 'on' : 'off'}`}></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actividad Reciente */}
            <div className="tienda-detail-section" style={{ paddingBottom: '32px' }}>
              <h4>Actividad Reciente</h4>
              {loadingActivity ? (
                <div className="tienda-team-empty"><div className="spinner-border spinner-border-sm"></div></div>
              ) : activityLog.length === 0 ? (
                <div className="tienda-team-empty" style={{ padding: '20px' }}>
                  <p style={{ margin: 0, color: '#9CA3AF', fontSize: '13px' }}>Sin actividad registrada</p>
                </div>
              ) : (
                <div className="tienda-detail-card">
                  {activityLog.map((reg, i) => {
                    const ts = reg.fecha?.toDate ? reg.fecha.toDate() : (reg.fecha ? new Date(reg.fecha) : null);
                    const timeStr = ts ? ts.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
                    return (
                      <div key={reg.id} style={{
                        display: 'flex', gap: '10px', padding: '10px 14px',
                        borderBottom: i < activityLog.length - 1 ? '1px solid var(--border, #e5e7eb)' : 'none'
                      }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--role-tinted-bg, rgba(26,122,72,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--role-primary)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{reg.accion}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reg.descripcion}</div>
                          <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{reg.realizadoPor} · {timeStr}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  };

  // Color de texto del card: verde oscuro sobre GO (amarillo), blanco en el resto.
  const tcol = (isGO, o) => (isGO ? `rgba(15,77,45,${o})` : `rgba(255,255,255,${o})`);

  const formatTime12 = (t24) => {
    if (!t24) return '';
    const parts = String(t24).split(':');
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const getStatusBadge = (tienda) => {
    if (tienda.esCotizacion) return { text: 'Cotización', open: null };
    if (tienda.activa === false) return { text: 'Inactiva', open: false };
    const abierta = isEstaAbierta(tienda);
    if (abierta) {
      const now = new Date();
      const cur = now.getHours() * 60 + now.getMinutes();
      const [cH, cM] = (tienda.horarioCierre || '23:00').split(':').map(Number);
      const cierre = cH * 60 + cM;
      const diff = cierre >= cur ? cierre - cur : cierre + 1440 - cur;
      if (diff <= 120) {
        return { text: diff < 60 ? `Cierra en ${diff} min` : `Cierra en ${Math.round(diff / 60)}h`, open: true };
      }
      return { text: `Cierra ${formatTime12(tienda.horarioCierre)}`, open: true };
    }
    return { text: `Abre ${formatTime12(tienda.horarioApertura)}`, open: false };
  };

  // Normaliza tanto formatos estándar como custom a la misma forma antes de renderizar
  const normalizarFormato = (raw, key) => {
    if (key) {
      // Formato estándar (de FORMATOS)
      const fmt = FORMATOS[key];
      const isGO = key === 'Punto Verde GO';
      const tc = (a) => tcol(isGO, a);
      return { gradient: fmt.gradient, logo: fmt.logo, logoBlend: fmt.logoBlend, subtitle: fmt.subtitle, tagline: fmt.tagline, nameColor: tc(1), tagColor: tc(0.78) };
    }
    // Formato custom (de Firestore)
    const lum = 0.2126 * (raw.colorR || 0) + 0.7152 * (raw.colorG || 0) + 0.0722 * (raw.colorB || 0) + (raw.brightness || 0);
    const isLight = lum > 0.45;
    const color = _rgbFmt(raw);
    return {
      gradient: `linear-gradient(135deg, ${_rgbFmt(raw, -0.12)} 0%, ${color} 100%)`,
      logo: logoBlanco, logoBlend: isLight ? 'multiply' : 'normal',
      subtitle: raw.nombre || '', tagline: raw.tagline || 'Formato personalizado',
      nameColor: 'rgba(255,255,255,0.92)',
      tagColor:  'rgba(255,255,255,0.7)',
    };
  };

  const renderFormatoCard = (key) => {
    const { gradient, logo, logoBlend, subtitle, tagline, nameColor, tagColor } = normalizarFormato(null, key);
    return (
      <button key={key} className="tb-formato-card" style={{ background: gradient }} onClick={() => setFormatoFilter(key)}>
        <img className="tb-formato-watermark" src={formatoPV} alt="" />
        <div className="tb-formato-lockup">
          {logo && <img src={logo} alt="" className="tb-formato-logo" style={{ mixBlendMode: logoBlend }} />}
          {subtitle && <span className="tb-formato-name" style={{ color: nameColor }}>{subtitle}</span>}
        </div>
        <span className="tb-formato-tag" style={{ color: tagColor }}>{tagline}</span>
      </button>
    );
  };

  const renderCustomFormatoCard = (raw) => {
    const { gradient, logo, subtitle, tagline, nameColor, tagColor } = normalizarFormato(raw, null);
    // El nombre se muestra según el checkbox "Mostrar nombre en el card".
    const showName = raw.mostrarNombre !== false;
    // Watermark: marca con paleta y formato sin logo propio → monograma de marca
    // (la "K" de Kaal) en vez del tomate de Punto Verde. (Ajuste Jul 7 Swift.)
    const brandWatermark = paleta && !raw.logoUrl;
    return (
      <button key={raw.id} className="tb-formato-card" style={{ background: gradient }} onClick={() => setFormatoFilter(raw.nombre)}>
        {brandWatermark
          ? <div className="tb-formato-watermark" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}><span style={{ fontSize: 240, fontWeight: 900, color: hexToRgba(brandAccentHex, 0.16), lineHeight: 0.75 }}>{brandIniciales || '·'}</span></div>
          : <img className="tb-formato-watermark" src={formatoPV} alt="" />}
        <div className="tb-formato-lockup">
          {raw.logoUrl
            ? <img src={raw.logoUrl} alt="" className="tb-formato-logo" />
            : (paleta ? <div className="tb-formato-logo" style={{ display: 'flex', alignItems: 'center' }}><BrandMark size={20} /></div>
                      : (logo && <img src={logo} alt="" className="tb-formato-logo" />))}
          {showName && subtitle && <span className="tb-formato-name" style={{ color: nameColor }}>{subtitle.toUpperCase()}</span>}
        </div>
        <span className="tb-formato-tag" style={{ color: tagColor }}>{tagline}</span>
      </button>
    );
  };

  const renderStoreCard = (tienda, wide = false) => {
    const fmt = getFormato(tienda);
    const isGO = fmt.color === '#EFA400';
    const tc = paleta ? brandTc : (a) => tcol(isGO, a);
    const badge = getStatusBadge(tienda);
    const ubic = tienda.direccion?.estado || tienda.estado || '—';
    const dotColor = badge.open === true ? '#4ade80' : badge.open === false ? '#f87171' : '#fbbf24';
    // Sobre el fondo Crema, la tinta clara de los badges no contrasta; usamos la
    // tinta de marca. En PV se conserva el pastel original.
    const textBadgeColor = paleta ? brandTc(0.75)
      : (badge.open === true ? '#bbf7d0' : badge.open === false ? '#fecaca' : '#fef08a');
    return (
      <div key={tienda.id}
        className={`tb-store-card${wide ? ' wide' : ''}`}
        style={{
          background: paleta ? brandBgCss : fmt.gradient,
          opacity: tienda.activa === false ? 0.72 : 1,
          border: paleta ? `1.5px solid ${brandAccentHex}` : undefined,
        }}
        onClick={() => handleOpenDetail(tienda)}
      >
        {/* ── Top: status badge + logo/monograma ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <div className="tb-status-badge" style={{ flexShrink: 1, minWidth: 0, overflow: 'hidden' }}>
            <span className="tb-status-dot" style={{ background: dotColor, flexShrink: 0 }} />
            <span style={{ color: textBadgeColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{badge.text}</span>
          </div>
          {paleta
            ? <BrandMark size={16} />
            : <img src={fmt.logo} alt="" style={{ maxHeight: 16, maxWidth: 90, height: 'auto', width: 'auto', objectFit: 'contain', mixBlendMode: fmt.logoBlend || 'normal', flexShrink: 0 }} />}
        </div>

        {/* ── Store name + location ── */}
        <div className="tb-store-name" style={{ color: tc(0.96) }}>{tienda.nombre}</div>
        <div className="tb-store-estado" style={{ color: tc(0.7) }}>{ubic}</div>

        <div className="tb-store-spacer" />

        {/* ── Bottom: métricas (o días desde cotización) ── */}
        <div className="tb-store-bottom">
          {tienda.esCotizacion ? (() => {
            const fc = toDate(tienda.fechaCreacion || tienda.createdAt);
            const dias = fc ? Math.max(0, Math.floor((Date.now() - fc.getTime()) / 86400000)) : 0;
            return (
              <div className="tb-store-metrics">
                <div className="tb-metric">
                  <div className="tb-metric-val" style={{ color: tc(1) }}>{dias} {dias === 1 ? 'día' : 'días'}</div>
                  <div className="tb-metric-lbl" style={{ color: tc(0.65) }}>DESDE COTIZACIÓN</div>
                </div>
              </div>
            );
          })() : (
            <div className="tb-store-metrics">
              <div className="tb-metric">
                <div className="tb-metric-val" style={{ color: tc(1) }}>${fmtNum(stats.hoy[tienda.id] || 0)}</div>
                <div className="tb-metric-lbl" style={{ color: tc(0.65) }}>VENTAS HOY</div>
              </div>
              <div className="tb-metric">
                <div className="tb-metric-val" style={{ color: tc(1) }}>${fmtNum(stats.prom[tienda.id] || 0)}</div>
                <div className="tb-metric-lbl" style={{ color: tc(0.65) }}>PROM. MENSUAL</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStoreSection = (title, list, desc, wide = false) => {
    if (!list.length) return null;
    return (
      <section className="inicio-section" key={title}>
        <div className="inicio-section-head" style={{ display: 'flex', alignSelf: 'stretch', cursor: 'default' }}>
          <div>
            <h2>{title}</h2>
            {desc && <div className="tb-section-desc">{desc}</div>}
          </div>
          <span className="tb-count">{list.length}</span>
        </div>
        <div className="inicio-carousel">{list.map(t => renderStoreCard(t, wide))}</div>
      </section>
    );
  };

  const renderStoreDetailPage = () => {
    if (!selectedTienda) return null;
    const fmt = getFormato(selectedTienda);
    const isGO = fmt.color === '#EFA400';
    const tc = paleta ? brandTc : (a) => tcol(isGO, a);
    const accentIcon = paleta ? brandAccentHex : fmt.color;
    const managers = teamData.filter(e => ['LIDER', 'MANAGER', 'DIRECTOR', 'ADMIN'].includes(e.rol?.toUpperCase()));
    const staffList = teamData.filter(e => !['LIDER', 'MANAGER', 'DIRECTOR', 'ADMIN'].includes(e.rol?.toUpperCase()));
    const tid = selectedTienda.id;
    const avgTicket = (stats.tickets[tid] || 0) > 0 ? (stats.mes[tid] || 0) / stats.tickets[tid] : 0;
    const curYear = new Date().getFullYear();
    const byMonthTienda = stats.byMonth[tid] || {};
    const MES_ABREV = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const monthlyData = Array.from({ length: 12 }, (_, i) => byMonthTienda[`${curYear}-${i}`] || 0);
    const maxMonth = Math.max(1, ...monthlyData);
    const hasMonthlyData = monthlyData.some(v => v > 0);
    const rentaMensual = selectedTienda.rentaMensual || 0;
    const nominaEstimada = selectedTienda.nominaEstimada || 0;
    const promVentas = stats.prom[tid] || 0;
    const margenEstimado = promVentas > 0 ? promVentas * 0.28 - rentaMensual - nominaEstimada : 0;
    const hasFinanzas = rentaMensual > 0 || nominaEstimada > 0;
    const mxnFmt = (v) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v || 0);
    const badge = getStatusBadge(selectedTienda);
    const dotColor = badge.open === true ? '#4ade80' : badge.open === false ? '#f87171' : '#fbbf24';
    const textBadgeColor = paleta ? brandTc(0.75)
      : (badge.open === true ? '#bbf7d0' : badge.open === false ? '#fecaca' : '#fef08a');
    // Superficies brand-aware: sobre el fondo Crema el glass blanco es invisible,
    // así que para marcas con paleta usamos tinta de marca (Carbón/Oro) tenue.
    const surf       = paleta ? hexToRgba(brandInkHex, 0.05)  : 'rgba(255,255,255,0.12)';
    const surfStrong = paleta ? hexToRgba(brandInkHex, 0.06)  : 'rgba(255,255,255,0.14)';
    const hairColor  = paleta ? hexToRgba(brandInkHex, 0.14)  : 'rgba(255,255,255,0.12)';
    const hairLine   = `1px solid ${paleta ? hexToRgba(brandInkHex, 0.1) : 'rgba(255,255,255,0.1)'}`;
    const barFill    = paleta ? brandAccentHex : 'rgba(255,255,255,0.65)';
    const barTrack   = paleta ? hexToRgba(brandInkHex, 0.1)   : 'rgba(255,255,255,0.15)';
    const avatarSurf = paleta ? hexToRgba(brandAccentHex, 0.22) : 'rgba(255,255,255,0.2)';
    const iconSurf   = paleta ? hexToRgba(brandInkHex, 0.08)  : 'rgba(255,255,255,0.18)';
    const glassCard  = { background: surf, borderRadius: 16, overflow: 'hidden', border: paleta ? `1px solid ${hexToRgba(brandAccentHex, 0.22)}` : undefined };
    const sectionTitle = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: tc(0.6), marginBottom: 10 };
    return (
      <>
        {/* ── Hero de la sucursal ── */}
        <div className="tb-formato-hero-header" style={{ background: paleta ? brandBgCss : fmt.gradient }}>
          {paleta
            ? <div className="tb-formato-hero-watermark" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}><span style={{ fontSize: 220, fontWeight: 900, color: hexToRgba(brandAccentHex, 0.14), lineHeight: 0.8 }}>{brandIniciales || '·'}</span></div>
            : <img className="tb-formato-hero-watermark" src={formatoPV} alt="" />}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <button className="tb-hero-back" onClick={handleCloseDetail} style={{ color: tc(0.9) }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
            </button>
            {canEdit && (
              <button className="tb-hero-action" onClick={(e) => { handleCloseDetail(); handleEdit(e, selectedTienda); }} style={{ color: tc(0.85) }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>
            )}
          </div>
          <div className="tb-formato-hero-content">
            {paleta
              ? <div className="tb-formato-hero-logo" style={{ display: 'flex', alignItems: 'center' }}><BrandMark size={30} /></div>
              : <img src={fmt.logo} alt="" className="tb-formato-hero-logo" style={{ mixBlendMode: fmt.logoBlend || 'normal' }} />}
            <div style={{ fontSize: 26, fontWeight: 800, color: tc(0.97), lineHeight: 1.2, marginTop: 8 }}>{selectedTienda.nombre}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              <div className="tb-status-badge">
                <span className="tb-status-dot" style={{ background: dotColor }} />
                <span style={{ color: textBadgeColor }}>{badge.text}</span>
              </div>
              {(selectedTienda.direccion?.estado || selectedTienda.estado) && (
                <span style={{ color: tc(0.6), fontSize: 13 }}>{selectedTienda.direccion?.estado || selectedTienda.estado}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Cuerpo del detalle ── */}
        <div style={{ padding: '0 20px 40px' }}>

          {selectedTienda.esCotizacion && canEdit && (
            <div style={{ background: surfStrong, borderRadius: 16, padding: '16px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', border: paleta ? `1px solid ${hexToRgba(brandAccentHex, 0.22)}` : undefined }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: tc(0.95) }}>Esta es una cotización</div>
                <div style={{ fontSize: 12, color: tc(0.65), marginTop: 2 }}>Promuévela a sucursal real cuando esté lista para operar.</div>
              </div>
              <button
                onClick={() => handlePromover(selectedTienda)}
                style={{ background: paleta ? brandAccentHex : '#fff', color: paleta ? '#fff' : fmt.colorDark, border: 'none', borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 14px rgba(0,0,0,0.18)' }}
              >
                <i className="bi bi-rocket-takeoff-fill" />
                Activar como sucursal
              </button>
            </div>
          )}

          {promVentas > 0 && (
            <div style={{ background: surfStrong, borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, border: paleta ? `1px solid ${hexToRgba(brandAccentHex, 0.22)}` : undefined }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, color: tc(0.6), textTransform: 'uppercase' }}>Promedio mensual de ventas</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: tc(1), lineHeight: 1.2, marginTop: 2 }}>{mxnFmt(promVentas)}</div>
              </div>
              <i className="bi bi-graph-up-arrow" style={{ fontSize: 28, color: tc(0.3) }} />
            </div>
          )}

          <div className="tienda-detail-dashboard" style={{ background: 'transparent', gap: 10, marginBottom: 20 }}>
            {[
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke={accentIcon} strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, bg: `${accentIcon}33`, val: `$${fmtNum(stats.hoy[tid] || 0)}`, lbl: 'Ventas Hoy' },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, bg: 'rgba(147,51,234,0.2)', val: `$${fmtNum(stats.mes[tid] || 0)}`, lbl: 'Ventas Mes' },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, bg: 'rgba(249,115,22,0.2)', val: `$${fmtNum(avgTicket)}`, lbl: 'Ticket Prom.' },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, bg: 'rgba(37,99,235,0.2)', val: teamData.length, lbl: 'Equipo' },
            ].map((w, i) => (
              <div key={i} className="tienda-dash-widget" style={{ background: surf, borderRadius: 16, border: paleta ? `1px solid ${hexToRgba(brandAccentHex, 0.18)}` : undefined }}>
                <div className="tienda-dash-icon" style={{ background: w.bg }}>{w.icon}</div>
                <div className="tienda-dash-value" style={{ color: tc(1) }}>{w.val}</div>
                <div className="tienda-dash-labels" style={{ color: tc(0.6) }}><span>{w.lbl}</span></div>
              </div>
            ))}
          </div>

          {hasMonthlyData && (
            <div style={{ marginBottom: 20 }}>
              <div style={sectionTitle}>Ventas {curYear}</div>
              <div style={{ ...glassCard, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 72 }}>
                  {monthlyData.map((v, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: '100%', height: `${Math.max(2, (v / maxMonth) * 56)}px`, background: v > 0 ? barFill : barTrack, borderRadius: 4, transition: 'height .3s' }} title={`${MES_ABREV[i]}: $${fmtNum(v)}`} />
                      <span style={{ fontSize: 8.5, color: tc(0.5), fontWeight: 600 }}>{MES_ABREV[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {hasFinanzas && (
            <div style={{ marginBottom: 20 }}>
              <div style={sectionTitle}>Finanzas Estimadas</div>
              <div style={glassCard}>
                {[
                  { label: 'Ventas prom. mensual', value: mxnFmt(promVentas), color: '#4ade80', icon: 'bi-graph-up-arrow' },
                  { label: 'Renta mensual', value: mxnFmt(rentaMensual), color: '#f87171', icon: 'bi-building' },
                  { label: 'Nómina estimada', value: mxnFmt(nominaEstimada), color: '#f87171', icon: 'bi-people-fill' },
                  { label: 'Margen est. (28% bruto)', value: mxnFmt(margenEstimado), color: margenEstimado >= 0 ? '#4ade80' : '#f87171', icon: 'bi-piggy-bank' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < 3 ? hairLine : 'none' }}>
                    <i className={`bi ${row.icon}`} style={{ fontSize: 13, color: row.color, width: 18, textAlign: 'center', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: tc(0.8) }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <div style={sectionTitle}>Ubicación</div>
            <div style={glassCard}>
              <div className="tienda-location-row" style={{ padding: '12px 14px', borderBottom: hairLine, color: tc(0.8) }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <div>
                  <strong style={{ color: tc(0.95) }}>{selectedTienda.direccion?.calle || '—'} #{selectedTienda.direccion?.numeroExterior || ''}</strong>
                  {selectedTienda.direccion?.numeroInterior && ` Int. ${selectedTienda.direccion.numeroInterior}`}
                  <br/>Col. {selectedTienda.direccion?.colonia || '—'}, {selectedTienda.direccion?.ciudad || '—'}, {selectedTienda.direccion?.estado || '—'}
                  {selectedTienda.direccion?.cp && ` C.P. ${selectedTienda.direccion.cp}`}
                </div>
              </div>
              <div className="tienda-location-row" style={{ padding: '12px 14px', color: tc(0.8) }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg>
                <span>{formatPhone(selectedTienda.telefono)}</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={sectionTitle}>Equipo</div>
            {loadingTeam ? (
              <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner-border" style={{ borderColor: tc(0.4), borderRightColor: 'transparent' }}></div></div>
            ) : teamData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: tc(0.5), fontSize: 13 }}>Sin empleados asignados</div>
            ) : (
              <div style={glassCard}>
                {managers.map(emp => (
                  <div key={emp.id} className="tienda-team-row" style={{ borderBottomColor: hairColor, padding: '10px 14px' }}>
                    <div className="tienda-team-avatar manager-av">{getInitial(emp.nombre)}</div>
                    <div className="tienda-team-info">
                      <div className="tienda-team-name" style={{ color: tc(0.95) }}>{emp.nombre}<span className="tienda-team-role-badge" style={{ background: '#2563EB' }}>Manager</span></div>
                      <div className="tienda-team-id" style={{ color: tc(0.55) }}>{emp.numEmpleado || emp.email}</div>
                    </div>
                    <div className={`tienda-team-status ${emp.activo !== false ? 'on' : 'off'}`}></div>
                  </div>
                ))}
                {staffList.length > 0 && <div className="tienda-team-staff-label" style={{ color: tc(0.5), borderTopColor: hairColor, padding: '6px 14px' }}>{staffList.length} STAFF</div>}
                {staffList.map(emp => (
                  <div key={emp.id} className="tienda-team-row" style={{ borderBottomColor: hairColor, padding: '10px 14px' }}>
                    <div className="tienda-team-avatar staff-av" style={{ background: avatarSurf, color: tc(0.9) }}>{getInitial(emp.nombre)}</div>
                    <div className="tienda-team-info">
                      <div className="tienda-team-name" style={{ color: tc(0.95) }}>{emp.nombre}</div>
                      <div className="tienda-team-id" style={{ color: tc(0.55) }}>{emp.numEmpleado || emp.email}</div>
                    </div>
                    <div className={`tienda-team-status ${emp.activo !== false ? 'on' : 'off'}`}></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 40 }}>
            <div style={sectionTitle}>Actividad Reciente</div>
            {loadingActivity ? (
              <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner-border" style={{ borderColor: tc(0.4), borderRightColor: 'transparent' }}></div></div>
            ) : activityLog.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: tc(0.5), fontSize: 13 }}>Sin actividad registrada</div>
            ) : (
              <div style={glassCard}>
                {activityLog.map((reg, i) => {
                  const ts = reg.fecha?.toDate ? reg.fecha.toDate() : (reg.fecha ? new Date(reg.fecha) : null);
                  const timeStr = ts ? ts.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
                  return (
                    <div key={reg.id} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: i < activityLog.length - 1 ? hairLine : 'none' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: iconSurf, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke={tc(0.8)} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: tc(0.95) }}>{reg.accion}</div>
                        <div style={{ fontSize: 12, color: tc(0.6), marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reg.descripcion}</div>
                        <div style={{ fontSize: 11, color: tc(0.45), marginTop: 2 }}>{reg.realizadoPor} · {timeStr}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </>
    );
  };

  const fmtPageGradient = useMemo(() => {
    // Para marcas con paleta (Kaal), el fondo de página/hero es Crema plano.
    if (paleta && (selectedTienda || formatoFilter)) return brandBgCss;
    if (selectedTienda) return getFormato(selectedTienda).gradient;
    if (!formatoFilter) return undefined;
    const std = FORMATOS[formatoFilter];
    if (std) return std.gradient;
    const cust = customFormatos.find(f => f.nombre === formatoFilter);
    if (!cust) return undefined;
    return `linear-gradient(135deg, ${_rgbFmt(cust, -0.12)} 0%, ${_rgbFmt(cust)} 100%)`;
  }, [formatoFilter, selectedTienda, customFormatos, paleta, brandBgCss]);

  // Aplicar el gradiente del formato también al .app (visible detrás del sidebar)
  useEffect(() => {
    const appEl = document.querySelector('.app');
    if (!appEl) return;
    appEl.style.background = fmtPageGradient || '';
    return () => { appEl.style.background = ''; };
  }, [fmtPageGradient]);

  // Sobre el fondo Crema los títulos blancos del CSS serían invisibles: con
  // `tb-brand-light` + vars de tinta de marca, el CSS los pinta en Carbón/Oro.
  const brandLightStyle = paleta
    ? { background: fmtPageGradient, '--tb-ink': brandInkHex, '--tb-ink-muted': brandTc(0.62), '--tb-ink-faint': brandTc(0.5), '--tb-accent': brandAccentHex }
    : (fmtPageGradient ? { background: fmtPageGradient } : undefined);

  return (
    <div className={`tiendas-page inicio-page${(formatoFilter || selectedTienda) ? ' tiendas-has-detail' : ''}${paleta ? ' tb-brand-light' : ''}`} style={brandLightStyle}>
      <div className="inicio-inner">
        <header className={`inicio-header${(formatoFilter || selectedTienda) ? ' tb-header-hidden' : ''}`}>
          <h1>Sucursales</h1>
          {canEdit && (
            <button className="tiendas-add-btn" onClick={() => setShowCotizarModal(true)}>+</button>
          )}
        </header>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}><div className="spinner-border"></div></div>
        ) : selectedTienda ? renderStoreDetailPage() : formatoFilter ? (
          (() => {
            const stdFmt = FORMATOS[formatoFilter];
            const custFmt = !stdFmt ? customFormatos.find(f => f.nombre === formatoFilter) : null;
            const fmtData = stdFmt
              ? { gradient: stdFmt.gradient, logo: stdFmt.logo, logoBlend: stdFmt.logoBlend, tagline: stdFmt.tagline, isGO: stdFmt.color === '#EFA400' }
              : (() => {
                  const lum = 0.2126*(custFmt?.colorR||0)+0.7152*(custFmt?.colorG||0)+0.0722*(custFmt?.colorB||0)+(custFmt?.brightness||0);
                  return { gradient: `linear-gradient(135deg,${_rgbFmt(custFmt,-0.12)} 0%,${_rgbFmt(custFmt)} 100%)`, logo: logoBlanco, logoBlend: lum>0.45?'multiply':'normal', tagline: custFmt?.tagline||'Formato personalizado', isGO: false };
                })();
            const list = tiendasDelUsuario.filter(t => stdFmt
              ? getFormato(t).short === stdFmt.short
              : t.formato === formatoFilter
            );
            const topList = [...list].sort((a,b) => (stats.prom[b.id]||0)-(stats.prom[a.id]||0));
            const openList = list.filter(t => isEstaAbierta(t));
            const closedList = list.filter(t => !isEstaAbierta(t) && !t.esCotizacion);
            const cotizList = list.filter(t => t.esCotizacion);
            const tc = paleta ? brandTc : (a) => tcol(fmtData.isGO, a);
            return (
              <>
                {/* ── Hero del formato ── */}
                <div className="tb-formato-hero-header" style={{ background: paleta ? brandBgCss : fmtData.gradient }}>
                  {paleta
                    ? <div className="tb-formato-hero-watermark" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}><span style={{ fontSize: 220, fontWeight: 900, color: hexToRgba(brandAccentHex, 0.14), lineHeight: 0.8 }}>{brandIniciales || '·'}</span></div>
                    : <img className="tb-formato-hero-watermark" src={formatoPV} alt="" />}
                  <button className="tb-hero-back" onClick={() => setFormatoFilter(null)} style={{ color: tc(0.9) }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
                  </button>
                  {canEdit && custFmt && (
                    <button
                      className="tb-hero-action"
                      onClick={() => setEditingFormato(custFmt)}
                      title="Editar formato"
                      style={{ position: 'absolute', top: 18, right: 20, color: tc(0.9) }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  )}
                  <div className="tb-formato-hero-content">
                    {paleta
                      ? <div className="tb-formato-hero-logo" style={{ display: 'flex', alignItems: 'center' }}><BrandMark size={30} /></div>
                      : <img src={fmtData.logo} alt="" className="tb-formato-hero-logo" style={{ mixBlendMode: fmtData.logoBlend }} />}
                    <div className="tb-formato-hero-tagline" style={{ color: tc(0.75) }}>{fmtData.tagline}</div>
                  </div>
                </div>

                {/* ── Secciones filtradas ── */}
                {topList.length > 0 && renderStoreSection(`Top ${formatoFilter}`, topList, 'Las que más venden este formato', true)}
                {renderStoreSection('En operación', openList, 'Sucursales activas hoy', true)}
                {renderStoreSection('Cerradas', closedList, 'Fuera de operación', true)}
                {renderStoreSection('Cotizaciones', cotizList, 'Pendientes de aprobar', true)}
                {list.length === 0 && (
                  <div className="tiendas-empty" style={{ marginTop: 40 }}>
                    <p>Sin sucursales en este formato</p>
                  </div>
                )}
              </>
            );
          })()
        ) : tiendasDelUsuario.length === 0 ? (
          <div className="tiendas-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <p>No se encontraron tiendas</p>
          </div>
        ) : (
          <>
            {/* ── Formatos carousel ── */}
            <section className="inicio-section">
              <div className="inicio-section-head" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                <h2>Formatos</h2>
                <div className="tb-section-desc">Conoce los formatos de Punto Verde</div>
              </div>
              <div className="inicio-carousel tb-row-formatos">
                {FORMATO_KEYS.map(renderFormatoCard)}
                {customFormatos.map(renderCustomFormatoCard)}
                {canEdit && (
                  <button className="tb-formato-card tb-nuevo-formato" onClick={() => setShowCotizarModal(true)}>
                    <div className="tb-nuevo-plus">
                      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                    <span className="tb-formato-name" style={{ color: 'rgba(255,255,255,0.88)' }}>Nuevo formato</span>
                    <span className="tb-formato-tag" style={{ color: 'rgba(255,255,255,0.55)' }}>Diseña una nueva línea</span>
                  </button>
                )}
              </div>
            </section>
            {renderStoreSection('Top sucursales', topTiendas, 'Las sucursales que más venden', true)}
            {renderStoreSection('En operación', operacionList, 'Abiertas actualmente', true)}
            {renderStoreSection('Cerradas', cerradasList, 'Fuera de operación', true)}
            {renderStoreSection('Cotizaciones', cotizacionesList, 'Pendientes de aprobar', true)}
          </>
        )}
      </div>{/* /inicio-inner */}

      {showModal && (() => {
        const fmt     = getFormato({ formato: formData.formato });
        const isEditing = !!editingTienda;
        const canSave = !!formData.nombre;

        /* ── shared helpers (mismo estilo que formulario empleado) ── */
        const IS = {
          width: '100%', boxSizing: 'border-box', padding: '10px 12px',
          border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13.5,
          color: '#111827', background: '#FAFAFA', outline: 'none',
        };
        const F = ({ label, required, children }) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {label}{required && <span style={{ color: fmt.color, marginLeft: 3 }}>*</span>}
            </label>
            {children}
          </div>
        );
        const Inp = ({ label, type = 'text', fkey, required, style: sx }) => (
          <F label={label} required={required}>
            <input type={type} value={formData[fkey]}
              onChange={e => setFormData(f => ({ ...f, [fkey]: e.target.value }))}
              style={{ ...IS, ...sx }} />
          </F>
        );
        const Sec = ({ icon, title }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 14,
            paddingBottom: 10, borderBottom: '1.5px solid #F3F4F6' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: fmt.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`bi bi-${icon}`} style={{ fontSize: 13, color: fmt.color === '#EFA400' ? '#000' : 'white' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{title}</span>
          </div>
        );
        const G2 = ({ children }) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
        );

        return (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{
              background: 'white', borderRadius: 20,
              width: '92%', maxWidth: 520, maxHeight: '92vh',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
              overflow: 'hidden',
            }}>

              {/* ── HEADER — gradiente reactivo al formato ── */}
              <div style={{ background: fmt.gradient, padding: '20px 24px 22px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: fmt.color === '#EFA400' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                      {isEditing ? 'Editando sucursal' : 'Nueva sucursal'}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: fmt.textColor, lineHeight: 1.2 }}>
                      {formData.nombre || 'Sin nombre'}
                    </div>
                  </div>
                  <button onClick={() => setShowModal(false)} style={{
                    background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 10,
                    width: 32, height: 32, cursor: 'pointer',
                    color: fmt.color === '#EFA400' ? 'rgba(0,0,0,0.7)' : 'white',
                    fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>✕</button>
                </div>

                {/* Logo + formato badge */}
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={fmt.logo} alt={fmt.label}
                    style={{ height: 26, objectFit: 'contain', mixBlendMode: fmt.logoBlend || 'normal' }} />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Selector de formato como chips — system + custom */}
                    {[...FORMATO_KEYS, ...customFormatos.map(c => c.nombre)].map(f => {
                      const active = formData.formato === f;
                      const fShort = (FORMATOS[f] || getFormato({ formato: f })).short;
                      return (
                        <button key={f} onClick={() => setFormData(fd => ({ ...fd, formato: f }))}
                          style={{
                            padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                            fontSize: 11, fontWeight: 700,
                            background: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                            color: active ? fmt.colorDark : (fmt.color === '#EFA400' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)'),
                          }}>
                          {fShort}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── BODY ── */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 24px 24px' }}>

                <Sec icon="shop" title="Información general" />
                <Inp label="Nombre de la sucursal" fkey="nombre" required />

                <Sec icon="geo-alt" title="Dirección" />
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                  <Inp label="Calle" fkey="calle" />
                  <Inp label="No. Ext." fkey="numeroExterior" />
                  <Inp label="No. Int." fkey="numeroInterior" />
                </div>
                <div style={{ marginTop: 12 }} />
                <G2>
                  <Inp label="Colonia" fkey="colonia" />
                  <Inp label="Código postal" fkey="cp" />
                </G2>
                <div style={{ marginTop: 12 }} />
                <G2>
                  <Inp label="Ciudad" fkey="ciudad" />
                  <Inp label="Estado" fkey="estado" />
                </G2>
                <div style={{ marginTop: 12 }} />
                <Inp label="País" fkey="pais" />

                <Sec icon="telephone" title="Contacto" />
                <Inp label="Teléfono" type="tel" fkey="telefono" />

                <Sec icon="clock" title="Horario de operación" />
                <G2>
                  <Inp label="Apertura" type="time" fkey="horarioApertura" />
                  <Inp label="Cierre" type="time" fkey="horarioCierre" />
                </G2>
                <div style={{ marginTop: 16 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.activa}
                    onChange={e => setFormData(f => ({ ...f, activa: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: fmt.color }} />
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#374151' }}>Sucursal activa</span>
                </label>
              </div>

              {/* ── FOOTER ── */}
              <div style={{
                flexShrink: 0, padding: '14px 24px',
                borderTop: '1.5px solid #F3F4F6', background: 'white',
                display: 'flex', gap: 10,
              }}>
                <button onClick={() => setShowModal(false)} style={{
                  flex: 1, padding: '11px 0', border: '1.5px solid #E5E7EB', borderRadius: 12,
                  background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#374151',
                }}>
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={!canSave} style={{
                  flex: 2, padding: '11px 0', border: 'none', borderRadius: 12,
                  background: canSave ? fmt.gradient : '#E5E7EB',
                  color: canSave ? fmt.textColor : '#9CA3AF',
                  fontSize: 14, fontWeight: 700, cursor: canSave ? 'pointer' : 'not-allowed',
                }}>
                  <i className={`bi bi-${isEditing ? 'check2-circle' : 'plus-circle'}`} style={{ marginRight: 7 }} />
                  {isEditing ? 'Guardar cambios' : 'Crear sucursal'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showCotizarModal && (
        <CotizarSucursal
          onClose={() => setShowCotizarModal(false)}
          onCreated={() => { setShowCotizarModal(false); fetchTiendas(); setFormatoFilter(null); }}
          empleadoActual={empleado}
        />
      )}

      {editingFormato && (
        <NuevoFormatoModal
          editing={editingFormato}
          onClose={() => setEditingFormato(null)}
          onCreated={() => { setEditingFormato(null); fetchTiendas(); showToast('Formato actualizado'); }}
          onDeleted={handleEliminarFormato}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#1e293b', color: 'white', padding: '10px 20px',
          borderRadius: 10, fontSize: 14, fontWeight: 500,
          zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.25)', whiteSpace: 'nowrap'
        }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default Tiendas;