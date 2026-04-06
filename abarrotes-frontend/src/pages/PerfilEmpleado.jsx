import React, { useState, useEffect } from 'react';
import { logout } from '../services/firebaseAuth';
import { useProfileColor } from '../hooks/useProfileColor';
import { FaUser, FaSignOutAlt, FaCheck } from 'react-icons/fa';

const PerfilEmpleado = () => {
  const [empleado, setEmpleado] = useState({
    nombre: 'Cargando...',
    rol: '...',
    sucursal: '...',
    turno: '...',
  });

  const [loading, setLoading] = useState(true);
  const profile = useProfileColor();

  useEffect(() => {
    loadEmpleadoData();
  }, []);

  const loadEmpleadoData = () => {
    try {
      const employeeId = sessionStorage.getItem('desktop_employeeId') || localStorage.getItem('employeeId');
      const employeeName = sessionStorage.getItem('desktop_employeeName') || localStorage.getItem('employeeName') || 'Empleado';
      const employeeProfile = sessionStorage.getItem('desktop_employeeProfile') || localStorage.getItem('employeeProfile') || 'staff';

      const getRoleLabel = (role) => ({
        staff: 'Staff', manager: 'Manager', admin: 'Administrador',
        supervisor: 'Manager', lider: 'Manager', director: 'Administrador'
      }[role] || 'Empleado');

      setEmpleado({
        id: employeeId,
        nombre: employeeName,
        rol: getRoleLabel(employeeProfile),
        sucursal: 'Tienda Central #01',
        turno: 'Matutino (09:00 - 17:00)',
        profile: employeeProfile
      });
    } catch (error) {
      console.error('Error cargando datos del empleado:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesion:', error);
    }
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
      </div>
    );
  }

  return (
    <div>
      <div className="card" style={{ padding: '32px', textAlign: 'center', marginBottom: '24px', background: `linear-gradient(135deg, ${profile.colorDark}, ${profile.color})`, border: 'none' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          border: '2px solid rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: 'white',
          fontSize: '2rem'
        }}>
          {profile.icon}
        </div>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 600, color: 'white' }}>{empleado.nombre}</h2>
        <span style={{
          background: 'rgba(255,255,255,0.18)',
          color: 'white',
          padding: '4px 14px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 600,
          display: 'inline-block'
        }}>
          {profile.icon} {empleado.rol}
        </span>
      </div>

      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card">
          <div className="metric-label">Ventas Hoy</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--role-primary)' }}>$1,234.56</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Tickets</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--role-primary)' }}>12</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Ticket Promedio</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--role-primary)' }}>$102.88</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Objetivo</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)' }}>85%</div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Actividad Reciente</h5>
        </div>
        <div>
          {[
            { action: 'Venta completada', time: 'Hace 5 min', amount: '$156.00' },
            { action: 'Venta completada', time: 'Hace 15 min', amount: '$89.50' },
            { action: 'Venta completada', time: 'Hace 30 min', amount: '$234.00' },
            { action: 'Apertura de caja', time: 'Hace 2 hr', amount: '$500.00' },
          ].map((item, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 16px',
              borderBottom: index < 3 ? '1px solid #f3f4f6' : 'none'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--role-tinted-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px'
              }}>
                <FaCheck style={{ color: 'var(--role-primary)', width: '16px', height: '16px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '14px' }}>{item.action}</div>
                <div style={{ fontSize: '12px', color: '#6b7c93' }}>{item.time}</div>
              </div>
              <div style={{ fontWeight: 600, color: 'var(--role-primary)' }}>{item.amount}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '14px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <FaSignOutAlt />
          Cerrar Sesion
        </button>
      </div>
    </div>
  );
};

export default PerfilEmpleado;
