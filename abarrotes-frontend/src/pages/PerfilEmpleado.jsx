import React, { useState, useEffect } from 'react';
import { logout } from '../services/firebaseAuth';
import { FaUser, FaCog, FaSignOutAlt, FaChartLine, FaDollarSign, FaClock, FaCheck } from 'react-icons/fa';

const PerfilEmpleado = () => {
  const [empleado, setEmpleado] = useState({
    nombre: 'Cargando...',
    rol: '...',
    sucursal: '...',
    turno: '...',
    avatar: null,
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmpleadoData();
  }, []);

  const loadEmpleadoData = () => {
    try {
      const employeeId = localStorage.getItem('employeeId');
      const employeeName = localStorage.getItem('employeeName') || 'Empleado';
      const employeeProfile = localStorage.getItem('employeeProfile') || 'staff';
      const profileColor = localStorage.getItem('employeeProfileColor') || '#1B5E35';
      
      setEmpleado({
        id: employeeId,
        nombre: employeeName,
        rol: employeeProfile.charAt(0).toUpperCase() + employeeProfile.slice(1),
        sucursal: 'Tienda Central #01',
        turno: 'Matutino (09:00 - 17:00)',
        avatar: null,
        profile: employeeProfile,
        profileColor: profileColor
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
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeName');
    localStorage.removeItem('employeeProfile');
    localStorage.removeItem('employeeProfileColor');
    window.location.href = '/login';
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
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
      <div className="card" style={{ padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          background: empleado.profileColor || '#1B5E35',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: 'white',
          fontSize: '28px',
          fontWeight: 700
        }}>
          {getInitials(empleado.nombre)}
        </div>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 600 }}>{empleado.nombre}</h2>
        <p style={{ margin: '0 0 16px 0', color: '#6b7c93' }}>{empleado.rol}</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1B5E35' }}>{empleado.sucursal}</div>
            <div style={{ fontSize: '12px', color: '#6b7c93' }}>Sucursal</div>
          </div>
          <div style={{ width: '1px', background: '#e5e7eb' }}></div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1B5E35' }}>{empleado.turno}</div>
            <div style={{ fontSize: '12px', color: '#6b7c93' }}>Turno</div>
          </div>
        </div>
      </div>

      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card">
          <div className="metric-label">Ventas Hoy</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1B5E35' }}>$1,234.56</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Tickets</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1B5E35' }}>12</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Ticket Promedio</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1B5E35' }}>$102.88</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Objetivo</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#4caf50' }}>85%</div>
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
                background: 'rgba(27,94,53,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px'
              }}>
                <FaCheck style={{ color: '#1B5E35', width: '16px', height: '16px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '14px' }}>{item.action}</div>
                <div style={{ fontSize: '12px', color: '#6b7c93' }}>{item.time}</div>
              </div>
              <div style={{ fontWeight: 600, color: '#1B5E35' }}>{item.amount}</div>
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
