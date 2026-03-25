import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBell, FaBars } from 'react-icons/fa';

const Header = ({ profileColor = '#00843D' }) => {
  const location = useLocation();
  const employeeName = sessionStorage.getItem('mobile_employeeName') || 'Empleado';
  const initials = employeeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const getTitle = () => {
    switch (location.pathname) {
      case '/': return 'Inicio';
      case '/pos': return 'Punto de Venta';
      case '/scanner': return 'Buscar Producto';
      case '/asistencia': return 'Asistencia';
      case '/caja': return 'Caja';
      case '/tasks': return 'Tareas';
      case '/perfil': return 'Mi Perfil';
      default: return 'Abarrotes';
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-logo">
          <span style={{ color: 'white', fontWeight: '800', fontSize: '1rem' }}>AD</span>
        </div>
        <h1 className="header-title">{getTitle()}</h1>
      </div>

      <div className="header-right">
        <span className="header-emp-name d-none d-sm-block">{employeeName}</span>
        <Link to="/perfil" className="header-avatar" title="Mi Perfil">
          {initials}
        </Link>
        <button className="notif-btn" title="Notificaciones">
          <FaBell size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
