import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBell, FaUserCircle } from 'react-icons/fa';

const Header = ({ profileColor = '#1e7f5c' }) => {
  const location = useLocation();
  const employeeName = sessionStorage.getItem('mobile_employeeName') || 'Empleado';
  
  // Determinar el título según la ruta actual
  const getTitle = () => {
    switch (location.pathname) {
      case '/pos':
        return 'Punto de Venta';
      case '/scanner':
        return 'Buscar Producto';
      case '/asistencia':
        return 'Asistencia';
      case '/caja':
        return 'Caja';
      case '/tasks':
        return 'Tareas';
      case '/perfil':
        return 'Mi Perfil';
      default:
        return 'Empleado';
    }
  };

  return (
    <header className="bg-white shadow-sm py-3 px-4 d-flex align-items-center justify-content-between"
            style={{ 
              position: 'sticky',
              top: 0,
              zIndex: 1000,
              borderBottom: `3px solid ${profileColor}`
            }}>
      <div className="d-flex align-items-center">
        <h1 className="h5 mb-0 fw-bold" style={{ color: profileColor }}>
          {getTitle()}
        </h1>
      </div>
      
      <div className="d-flex align-items-center gap-3">
        <div className="text-muted small d-none d-sm-block">
          {employeeName}
        </div>
        <Link to="/perfil" className="text-decoration-none">
          <div className="avatar avatar-sm" style={{ backgroundColor: profileColor }}>
            <FaUserCircle size={20} />
          </div>
        </Link>
        
        <div className="text-decoration-none position-relative notification-badge">
          <FaBell size={20} style={{ color: '#666' }} />
        </div>
      </div>
    </header>
  );
};

export default Header;
