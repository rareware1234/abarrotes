import React, { useState, useEffect } from 'react';
import HeaderEmpleado from '../components/empleado/HeaderEmpleado';
import PerfilCard from '../components/empleado/PerfilCard';
import QuickStats from '../components/empleado/QuickStats';
import GoalPanel from '../components/empleado/GoalPanel';
import CajaPanel from '../components/empleado/CajaPanel';
import ActivityFeed from '../components/empleado/ActivityFeed';
import NotificationsPanel from '../components/empleado/NotificationsPanel';
import DashboardNav from '../components/empleado/DashboardNav';
import PromotionsPanel from '../components/empleado/PromotionsPanel';
import { logout } from '../services/firebaseAuth';
import './PerfilEmpleado.css';

const PerfilEmpleado = () => {
  // Datos del empleado desde localStorage
  const [empleado, setEmpleado] = useState({
    nombre: 'Cargando...',
    rol: '...',
    sucursal: '...',
    turno: '...',
    avatar: null,
  });
  
  const [loading, setLoading] = useState(true);

  // Estado de la aplicación
  const [activeTab, setActiveTab] = useState('perfil');

  useEffect(() => {
    loadEmpleadoData();
  }, []);

  const loadEmpleadoData = () => {
    try {
      const employeeId = localStorage.getItem('employeeId');
      const employeeName = localStorage.getItem('employeeName') || 'Empleado';
      const employeeProfile = localStorage.getItem('employeeProfile') || 'staff';
      const profileColor = localStorage.getItem('employeeProfileColor') || '#1e7f5c';
      
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
      console.error('Error al cerrar sesión:', error);
    }
    // Limpiar localStorage
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeName');
    localStorage.removeItem('employeeProfile');
    localStorage.removeItem('employeeProfileColor');
    window.location.href = '/login';
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
    <div className="dashboard-container">
      <div className="row g-0 h-100">
        
        {/* --- Columna Izquierda: Navegación y Caja --- */}
        <div className="col-lg-2 sidebar-dashboard bg-white border-end">
          <div className="p-3">
            <h6 className="text-muted text-uppercase small mb-3">Menú</h6>
            <DashboardNav activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          
          <div className="mt-auto p-3">
            <CajaPanel />
            <PromotionsPanel />
          </div>
        </div>

        {/* --- Columna Central: Contenido Principal --- */}
        <div className="col-lg-7 main-content bg-light">
          <div className="p-4">
            {/* Header con Logout */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0 fw-bold text-dark">Mi Perfil</h4>
              <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
              </button>
            </div>

            {/* Tarjeta de Perfil Grande */}
            <PerfilCard empleado={empleado} />

            {/* Métricas Rápidas */}
            <h5 className="mt-4 mb-3 fw-bold text-dark">Resumen del Día</h5>
            <QuickStats />

            {/* Actividad Reciente */}
            <h5 className="mt-4 mb-3 fw-bold text-dark">Actividad Reciente</h5>
            <ActivityFeed />
          </div>
        </div>

        {/* --- Columna Derecha: Metas y Notificaciones --- */}
        <div className="col-lg-3 sidebar-right bg-white border-start">
          <div className="p-4">
            {/* Metas */}
            <GoalPanel />
            
            {/* Notificaciones */}
            <NotificationsPanel />
          </div>
        </div>

      </div>
    </div>
  );
};

export default PerfilEmpleado;
