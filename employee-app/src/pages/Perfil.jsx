import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaIdCard, FaStore, FaClock, FaPhone, FaEnvelope, FaShoppingCart, FaBox, FaMoneyBillWave, FaChartLine, FaUserShield, FaUserTie, FaUserCog } from 'react-icons/fa';
import { getProfileById, getProfileColor } from '../data/employeeProfiles';
import { logout } from '../services/firebaseAuth';

const Perfil = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Colores dinámicos basados en el perfil
  const [colors, setColors] = useState({
    primary: '#1e7f5c',
    primaryDark: '#165f45',
    primaryLight: '#2fbf8c',
    secondary: '#2c3e50',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    border: '#dee2e6'
  });

  useEffect(() => {
    const profileColor = getProfileColor(localStorage.getItem('employeeProfile') || 'staff');
    const adjustColor = (color, amount) => {
      const hex = color.replace('#', '');
      const num = parseInt(hex, 16);
      const r = Math.min(255, Math.max(0, (num >> 16) + amount));
      const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
      const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
      return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    };

    setColors({
      primary: profileColor,
      primaryDark: adjustColor(profileColor, -20),
      primaryLight: adjustColor(profileColor, 20),
      secondary: '#2c3e50',
      success: '#28a745',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
      light: '#f8f9fa',
      dark: '#343a40',
      border: '#dee2e6'
    });
  }, []);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Obtener datos del perfil desde localStorage (guardados por Firebase Auth)
      const employeeId = localStorage.getItem('employeeId');
      const employeeName = localStorage.getItem('employeeName') || 'Empleado';
      const employeeProfileId = localStorage.getItem('employeeProfile') || 'staff';
      const profileColor = localStorage.getItem('employeeProfileColor') || '#1e7f5c';
      
      const profileData = getProfileById(employeeProfileId);
      
      setProfile({
        id: employeeId,
        name: employeeName,
        profileId: employeeProfileId,
        profileName: profileData.name,
        profileColor: profileColor,
        role: profileData.name,
        sucursal: 'Tulipanes',
        turno: 'Matutino',
        email: `${employeeId}@abarrotesdigitales.com`,
        phone: '555-123-4567',
        joinDate: 'N/A'
      });
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    // Limpiar localStorage
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeName');
    localStorage.removeItem('employeeProfile');
    localStorage.removeItem('employeeProfileColor');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header del perfil */}
      <div className="card mb-4">
        <div className="card-body text-center py-4">
            <div 
              className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{ 
                width: '100px', 
                height: '100px', 
                backgroundColor: colors.primaryLight,
                color: 'white'
              }}
            >
            <FaUser size={48} />
          </div>
          
           <h3 className="h5 fw-bold mb-1">
            {profile?.name || 'Empleado'}
          </h3>
          <p className="text-muted mb-2">
            {profile?.role || 'Cajero'}
          </p>
          
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <span className="badge px-3 py-2" style={{ backgroundColor: profile?.profileColor || '#1e7f5c' }}>
              {profile?.profileName || 'Staff'}
            </span>
            <span className="badge bg-secondary px-3 py-2">
              {profile?.sucursal || 'Sucursal'}
            </span>
            <span className="badge bg-light text-dark px-3 py-2">
              {profile?.turno || 'Turno'}
            </span>
          </div>
        </div>
      </div>

      {/* Inicio - Estadísticas rápidas */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="h6 mb-0 fw-bold">
             <FaChartLine className="me-2" style={{ color: colors.primary }} />
             Resumen del Día
           </h3>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-6">
              <div className="text-center p-3 rounded" style={{ backgroundColor: colors.light }}>
                <FaShoppingCart className="mb-2" style={{ color: colors.primary, fontSize: '1.5rem' }} />
                <div className="fw-bold fs-5">12</div>
                <div className="text-muted small">Ventas</div>
              </div>
            </div>
            <div className="col-6">
              <div className="text-center p-3 rounded" style={{ backgroundColor: colors.light }}>
                <FaMoneyBillWave className="mb-2" style={{ color: colors.primary, fontSize: '1.5rem' }} />
                <div className="fw-bold fs-5">$8,450</div>
                <div className="text-muted small">Ingresos</div>
              </div>
            </div>
            <div className="col-6">
              <div className="text-center p-3 rounded" style={{ backgroundColor: colors.light }}>
                <FaBox className="mb-2" style={{ color: colors.primary, fontSize: '1.5rem' }} />
                <div className="fw-bold fs-5">156</div>
                <div className="text-muted small">Productos</div>
              </div>
            </div>
            <div className="col-6">
              <div className="text-center p-3 rounded" style={{ backgroundColor: colors.light }}>
                <FaChartLine className="mb-2" style={{ color: colors.primary, fontSize: '1.5rem' }} />
                <div className="fw-bold fs-5">+15%</div>
                <div className="text-muted small">Crecimiento</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información del perfil */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="h6 mb-0 fw-bold">Información Personal</h3>
        </div>
        <div className="card-body p-0">
          <div className="profile-item px-3 py-3">
            <FaIdCard className="me-3 text-muted" />
            <div className="profile-label">ID Empleado</div>
            <div className="profile-value">{profile?.id || 'N/A'}</div>
          </div>
          <div className="profile-item px-3 py-3">
            <FaEnvelope className="me-3 text-muted" />
            <div className="profile-label">Correo</div>
            <div className="profile-value small">{profile?.email || 'N/A'}</div>
          </div>
          <div className="profile-item px-3 py-3">
            <FaPhone className="me-3 text-muted" />
            <div className="profile-label">Teléfono</div>
            <div className="profile-value">{profile?.phone || 'N/A'}</div>
          </div>
          <div className="profile-item px-3 py-3">
            <FaStore className="me-3 text-muted" />
            <div className="profile-label">Sucursal</div>
            <div className="profile-value">{profile?.sucursal || 'N/A'}</div>
          </div>
          <div className="profile-item px-3 py-3">
            <FaClock className="me-3 text-muted" />
            <div className="profile-label">Turno</div>
            <div className="profile-value">{profile?.turno || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Estado de asistencia */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="h6 mb-0 fw-bold">Estado de Asistencia</h3>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <div className="fw-medium">Estado Actual</div>
              <small className="text-muted">Dentro de turno</small>
            </div>
            <div className="status-indicator">
              <div className="status-dot active" style={{ backgroundColor: colors.primary }}></div>
              <span className="ms-2 fw-medium" style={{ color: colors.primary }}>Activo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de cerrar sesión */}
      <button
        className="btn btn-lg w-100 d-flex align-items-center justify-content-center"
        style={{ 
          backgroundColor: 'transparent', 
          borderColor: colors.danger, 
          color: colors.danger 
        }}
        onClick={handleLogout}
      >
        <FaSignOutAlt className="me-2" />
        Cerrar Sesión
      </button>

      {/* Info de la app */}
      <div className="text-center mt-4 text-muted small">
        <p className="mb-0">
          App de Empleados v1.0.0
        </p>
        <p className="mb-0">
          Abarrotes Digitales
        </p>
      </div>
    </div>
  );
};

export default Perfil;
