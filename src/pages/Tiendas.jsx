import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import tiendaService from '../services/tiendaService';
import empleadoService from '../services/empleadoService';
import formatoPV from '../assets/formato-pv.png';
import formatoGO from '../assets/formato-go.png';
import formatoXL from '../assets/formato-xl.png';
import logoDark600 from '../assets/logo-dark-600.png';
import logoColor from '../assets/logo-color.png';
import './Tiendas.css';

const FORMATOS = {
  'Punto Verde': {
    label: 'Punto Verde',
    short: 'PV',
    color: '#0F4D2D',
    colorDark: '#09381E',
    gradient: 'linear-gradient(135deg, #09381E 0%, #0F4D2D 100%)',
    logo: logoDark600,
    logoFilter: 'none',
    badge: formatoPV,
    textColor: 'rgba(255,255,255,0.9)'
  },
  'Punto Verde GO': {
    label: 'Punto Verde GO',
    short: 'PV GO',
    color: '#EFA400',
    colorDark: '#C68700',
    gradient: 'linear-gradient(135deg, #C68700 0%, #EFA400 100%)',
    logo: logoColor,
    logoFilter: 'none',
    logoBlend: 'multiply',
    badge: formatoGO,
    textColor: 'rgba(0,0,0,0.8)'
  },
  'Punto Verde XL': {
    label: 'Punto Verde XL',
    short: 'PV XL',
    color: '#1A1A1A',
    colorDark: '#0E0E0E',
    gradient: 'linear-gradient(135deg, #0E0E0E 0%, #1A1A1A 100%)',
    logo: logoDark600,
    logoFilter: 'none',
    badge: formatoXL,
    textColor: 'rgba(255,255,255,0.9)'
  }
};

FORMATOS['PuntoVerde'] = FORMATOS['Punto Verde'];
FORMATOS['PuntoVerde GO'] = FORMATOS['Punto Verde GO'];
FORMATOS['PuntoVerde XL'] = FORMATOS['Punto Verde XL'];

const Tiendas = () => {
  const { hasPermission, empleado } = useAuth();
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtro, setFiltro] = useState('abiertas');
  const [viewMode, setViewMode] = useState('grid');
  const [showModal, setShowModal] = useState(false);
  const [editingTienda, setEditingTienda] = useState(null);
  const [selectedTienda, setSelectedTienda] = useState(null);
  const [teamData, setTeamData] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

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
    const result = await tiendaService.fetchTodas();
    if (result.success) setTiendas(result.data);
    setLoading(false);
  };

  // Managers solo ven sus tiendas asignadas (igual que macOS)
  const tiendasDelUsuario = isAdmin ? tiendas : tiendas.filter(t => {
    const misAsignadas = empleado?.tiendasAsignadas || [];
    return misAsignadas.includes(t.id)
      || t.responsable === empleado?.nombre
      || t.responsableId === empleado?.uid;
  });

  const filteredTiendas = tiendasDelUsuario.filter(t => {
    const matchSearch = !searchTerm ||
      t.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.responsable?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.direccion?.ciudad?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFiltro = filtro === 'todas' ? true :
      filtro === 'abiertas' ? t.activa !== false :
      t.activa === false;
    return matchSearch && matchFiltro;
  });

  const activas = tiendasDelUsuario.filter(t => t.activa !== false).length;
  const cerradas = tiendasDelUsuario.filter(t => t.activa === false).length;

  const getFormato = (t) => FORMATOS[t.formato] || FORMATOS['Punto Verde'];
  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  const isEstaAbierta = (tienda) => {
    if (!tienda.activa) return false;
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
    if (!formData.nombre) return alert('El nombre es requerido');
    const result = editingTienda
      ? await tiendaService.update(editingTienda.id, formData)
      : await tiendaService.create(formData);
    if (result.success) { setShowModal(false); setEditingTienda(null); resetForm(); fetchTiendas(); }
    else alert('Error: ' + result.error);
  };

  const handleEdit = (e, tienda) => {
    e.stopPropagation();
    setEditingTienda(tienda);
    setFormData({
      nombre: tienda.nombre || '', formato: tienda.formato || 'Punto Verde',
      calle: tienda.direccion?.calle || '', numeroExterior: tienda.direccion?.numeroExterior || '',
      numeroInterior: tienda.direccion?.numeroInterior || '', colonia: tienda.direccion?.colonia || '',
      cp: tienda.direccion?.cp || '', ciudad: tienda.direccion?.ciudad || '',
      estado: tienda.direccion?.estado || '', pais: tienda.direccion?.pais || 'México',
      telefono: tienda.telefono || '', responsable: tienda.responsable || '',
      responsableId: tienda.responsableId || '', horarioApertura: tienda.horarioApertura || '07:00',
      horarioCierre: tienda.horarioCierre || '23:00', activa: tienda.activa !== false
    });
    setShowModal(true);
  };

  const handleToggle = async (e, tienda) => {
    e.stopPropagation();
    await tiendaService.toggleActiva(tienda.id);
    fetchTiendas();
  };

  const resetForm = () => setFormData({
    nombre: '', formato: 'Punto Verde', calle: '', numeroExterior: '', numeroInterior: '',
    colonia: '', cp: '', ciudad: '', estado: '', pais: 'México', telefono: '',
    responsable: '', responsableId: '', horarioApertura: '07:00', horarioCierre: '23:00', activa: true
  });

  const handleOpenDetail = async (tienda) => {
    setSelectedTienda(tienda);
    setLoadingTeam(true);
    const result = await empleadoService.fetchByTienda(tienda.id);
    setTeamData(result.success ? result.data : []);
    setLoadingTeam(false);
  };

  const handleCloseDetail = () => {
    setSelectedTienda(null);
    setTeamData([]);
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

          <div className="tienda-card-status-badge" style={{
            background: abierta ? '#22c55e' : '#ef4444',
          }}>
            {abierta ? 'ABIERTA' : 'CERRADA'}
          </div>

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

            <div className="tienda-detail-dashboard">
              <div className="tienda-dash-widget">
                <div className="tienda-dash-icon" style={{ background: `${fmt.color}1A` }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={fmt.color} strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
                <div className="tienda-dash-value">—</div>
                <div className="tienda-dash-labels"><span>Ventas Hoy</span></div>
              </div>
              <div className="tienda-dash-widget">
                <div className="tienda-dash-icon" style={{ background: 'rgba(147,51,234,0.1)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div className="tienda-dash-value">—</div>
                <div className="tienda-dash-labels"><span>Ventas Mes</span></div>
              </div>
              <div className="tienda-dash-widget">
                <div className="tienda-dash-icon" style={{ background: 'rgba(249,115,22,0.1)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div className="tienda-dash-value">—</div>
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

          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="tiendas-page">
      <div className="tiendas-header">
        <div>
          <h1>Sucursales</h1>
          <div className="tiendas-subtitle">
            {!isAdmin ? 'Mis sucursales · ' : ''}{activas} en operación{cerradas > 0 ? ` · ${cerradas} cerrada${cerradas > 1 ? 's' : ''}` : ''}
          </div>
        </div>
        <div className="tiendas-header-actions">
          <div className="view-toggle">
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
          </div>
          {canEdit && (
            <button className="tiendas-add-btn" onClick={() => { setEditingTienda(null); resetForm(); setShowModal(true); }}>+</button>
          )}
        </div>
      </div>

      <div className="mobile-sticky-header">
        <div className="tiendas-search">
          <div className="tiendas-search-inner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Buscar tienda..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, minHeight: 'auto', minWidth: 'auto' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>

        <div className="tiendas-filters">
          <button className={`tiendas-filter-chip ${filtro === 'abiertas' ? 'active' : ''}`} onClick={() => setFiltro('abiertas')}>En Operación</button>
          <button className={`tiendas-filter-chip danger ${filtro === 'cerradas' ? 'active' : ''}`} onClick={() => setFiltro('cerradas')}>Cerradas</button>
          <button className={`tiendas-filter-chip ${filtro === 'todas' ? 'active' : ''}`} onClick={() => setFiltro('todas')}>Todas</button>
        </div>
      </div>

      <div className="tiendas-scroll-area">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}><div className="spinner-border"></div></div>
        ) : filteredTiendas.length === 0 ? (
          <div className="tiendas-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <p>No se encontraron tiendas</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="tiendas-grid">{filteredTiendas.map(renderCard)}</div>
        ) : (
          <div className="tiendas-list">{filteredTiendas.map(renderListRow)}</div>
        )}
      </div>{/* /tiendas-scroll-area */}

      {showModal && (() => {
        const fmt     = FORMATOS[formData.formato] || FORMATOS['Punto Verde'];
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
            <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: 0.6 }}>
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
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Selector de formato como chips */}
                    {['Punto Verde', 'Punto Verde GO', 'Punto Verde XL'].map(f => {
                      const active = formData.formato === f;
                      return (
                        <button key={f} onClick={() => setFormData(fd => ({ ...fd, formato: f }))}
                          style={{
                            padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                            fontSize: 11, fontWeight: 700,
                            background: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                            color: active ? fmt.colorDark : (fmt.color === '#EFA400' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)'),
                          }}>
                          {FORMATOS[f].short}
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

      {renderTiendaDetail()}
    </div>
  );
};

export default Tiendas;