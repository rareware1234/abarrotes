import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaClock, FaChartLine, FaCheck, FaIdCard, FaStore, FaCog, FaBell } from 'react-icons/fa';
import { logout } from '../services/firebaseAuth';
import { getProfileById } from '../data/employeeProfiles';

const Perfil = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('perfil');

  const employeeId = sessionStorage.getItem('mobile_employeeId') || '';
  const employeeName = sessionStorage.getItem('mobile_employeeName') || 'Empleado';
  const employeeProfile = sessionStorage.getItem('mobile_employeeProfile') || 'STAFF';
  const profileColor = sessionStorage.getItem('mobile_employeeProfileColor') || '#00843D';
  const profile = getProfileById(employeeProfile);
  const initials = employeeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {}
    sessionStorage.removeItem('mobile_employeeId');
    sessionStorage.removeItem('mobile_employeeName');
    sessionStorage.removeItem('mobile_employeeProfile');
    sessionStorage.removeItem('mobile_employeeProfileColor');
    sessionStorage.removeItem('mobile_loginTime');
    sessionStorage.removeItem('mobile_isMobileApp');
    sessionStorage.removeItem('mobile_firebaseUid');
    navigate('/login', { replace: true });
  };

  const STATS_DATA = [
    { label: 'Ventas hoy', value: '$1,234', icon: FaChartLine, color: 'var(--primary)' },
    { label: 'Tickets hoy', value: '12', icon: FaCheck, color: 'var(--success)' },
    { label: 'Tareas completadas', value: '8/10', icon: FaCheck, color: 'var(--info)' },
    { label: 'Horas trabajadas', value: '6.5h', icon: FaClock, color: 'var(--warning)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
      <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
        <div className="avatar avatar-xl" style={{ margin: '0 auto 12px', background: profileColor, fontSize: '2rem' }}>
          {initials}
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: 4 }}>
          {employeeName}
        </h2>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: 8 }}>
          <span className="badge" style={{ background: profileColor + '20', color: profileColor }}>
            <FaIdCard style={{ marginRight: 4 }} />{profile.name}
          </span>
          <span className="badge badge-muted">
            <FaStore style={{ marginRight: 4 }} />Tulipanes
          </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
          Turno: Matutino 09:00 - 17:00
        </p>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'perfil' ? 'active' : ''}`} onClick={() => setActiveTab('perfil')}>
          Resumen
        </button>
        <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
          Mi Info
        </button>
        <button className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>
          Config
        </button>
      </div>

      {activeTab === 'perfil' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {STATS_DATA.map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon" style={{ background: s.color + '20', color: s.color, width: 42, height: 42 }}>
                  <s.icon style={{ fontSize: '1.1rem' }} />
                </div>
                <div>
                  <div className="stat-value" style={{ fontSize: '1.2rem' }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header-section">
              <h3 className="card-title">Actividad reciente</h3>
            </div>
            <div style={{ padding: '4px 0' }}>
              {[
                { icon: FaCheck, time: 'Hace 10 min', text: 'Venta completada - $156.00', color: 'var(--success)' },
                { icon: FaCheck, time: 'Hace 25 min', text: 'Tarea: Reposición estantes', color: 'var(--success)' },
                { icon: FaCheck, time: 'Hace 1 hora', text: 'Venta completada - $89.50', color: 'var(--success)' },
                { icon: FaUser, time: 'Hace 2 horas', text: 'Entrada registrada', color: 'var(--primary)' },
              ].map((a, i) => (
                <div key={i} className="list-item" style={{ padding: '10px 16px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: a.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, color: a.color, fontSize: '0.85rem', flexShrink: 0 }}>
                    <a.icon />
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title" style={{ fontSize: '0.85rem' }}>{a.text}</div>
                    <div className="list-item-subtitle">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'info' && (
        <div className="card">
          {[
            { label: 'Nombre', value: employeeName, icon: FaUser },
            { label: 'ID de Empleado', value: employeeId, icon: FaIdCard },
            { label: 'Puesto', value: profile.name, icon: FaUser },
            { label: 'Sucursal', value: 'Tulipanes - Central', icon: FaStore },
            { label: 'Turno', value: 'Matutino (09:00 - 17:00)', icon: FaClock },
            { label: 'Permisos', value: profile.description, icon: FaCog },
          ].map((item, i) => (
            <div key={i} className="list-item" style={{ borderBottom: i < 5 ? '1px solid var(--border-light)' : 'none' }}>
              <div style={{ width: 36, height: 36, background: 'var(--primary-muted)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, color: 'var(--primary)', fontSize: '0.9rem', flexShrink: 0 }}>
                <item.icon />
              </div>
              <div className="list-item-content">
                <div className="list-item-subtitle" style={{ fontSize: '0.75rem' }}>{item.label}</div>
                <div className="list-item-title" style={{ fontSize: '0.9rem' }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'config' && (
        <div className="card">
          {[
            { label: 'Notificaciones', icon: FaBell, action: true, value: 'Activadas' },
            { label: 'Tema oscuro', icon: FaCog, action: true, value: 'Apagado' },
            { label: 'Sonidos', icon: FaCog, action: true, value: 'Activados' },
          ].map((item, i) => (
            <div key={i} className="list-item" style={{ borderBottom: i < 2 ? '1px solid var(--border-light)' : 'none' }}>
              <div style={{ width: 36, height: 36, background: 'var(--primary-muted)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, color: 'var(--primary)', fontSize: '0.9rem', flexShrink: 0 }}>
                <item.icon />
              </div>
              <div className="list-item-content">
                <div className="list-item-title" style={{ fontSize: '0.9rem' }}>{item.label}</div>
              </div>
              <span className="badge badge-muted">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      <button
        className="btn btn-block"
        style={{ background: '#fee2e2', color: '#dc2626', fontWeight: 700, marginTop: 8 }}
        onClick={handleLogout}
      >
        <FaSignOutAlt /> Cerrar Sesión
      </button>
    </div>
  );
};

export default Perfil;
