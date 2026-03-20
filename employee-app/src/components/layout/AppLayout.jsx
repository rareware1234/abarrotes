import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNavigation from '../navigation/BottomNavigation';
import { getProfileColor, canAccessRoute } from '../../data/employeeProfiles';
import useSessionTimeout from '../../hooks/useSessionTimeout';

const AppLayout = () => {
  const [profileColor, setProfileColor] = useState('#1e7f5c');
  const navigate = useNavigate();

  // Usar timeout de sesión
  useSessionTimeout();

  useEffect(() => {
    // Obtener el color del perfil desde sessionStorage con prefijo móvil
    const employeeProfile = sessionStorage.getItem('mobile_employeeProfile');
    if (employeeProfile) {
      const color = getProfileColor(employeeProfile);
      setProfileColor(color);
    } else {
      // Si no hay sesión, redirigir al login
      navigate('/login', { replace: true });
    }
    
    // Verificar si el empleado tiene acceso a la ruta actual
    const currentPath = window.location.pathname.substring(1);
    if (employeeProfile && !canAccessRoute(employeeProfile, currentPath)) {
      const allowedRoutes = ['pos', 'scanner', 'perfil', 'asistencia'];
      const firstAllowed = allowedRoutes.find(route => canAccessRoute(employeeProfile, route));
      if (firstAllowed) {
        navigate(`/${firstAllowed}`);
      }
    }
  }, [navigate]);

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <Header profileColor={profileColor} />
      <main className="flex-grow-1 p-3" style={{ 
        paddingBottom: '80px',
        backgroundColor: '#f5f7f6'
      }}>
        <Outlet />
      </main>
      <BottomNavigation profileColor={profileColor} />
    </div>
  );
};

export default AppLayout;
