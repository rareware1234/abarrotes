import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaBarcode, FaCheckSquare, FaUser, FaShoppingCart, FaTasks, FaHome, FaChartLine, FaCashRegister } from 'react-icons/fa';
import { canAccessRoute, getProfileColor } from '../../data/employeeProfiles';

const BottomNavigation = ({ profileColor = '#1e7f5c' }) => {
  const [navItems, setNavItems] = useState([]);
  const [employeeProfile, setEmployeeProfile] = useState('staff');

  useEffect(() => {
    // Obtener el perfil del empleado desde sessionStorage con prefijo móvil
    const profile = sessionStorage.getItem('mobile_employeeProfile') || 'staff';
    setEmployeeProfile(profile);
    
    // Definir todos los posibles ítems de navegación
    const allNavItems = [
      { path: '/pos', icon: FaShoppingCart, label: 'POS', profiles: ['staff', 'supervisor'] },
      { path: '/scanner', icon: FaBarcode, label: 'Buscar', profiles: ['staff', 'supervisor', 'director'] },
      { path: '/caja', icon: FaCashRegister, label: 'Caja', profiles: ['staff', 'supervisor'] },
      { path: '/tasks', icon: FaTasks, label: 'Tareas', profiles: ['staff', 'supervisor', 'director'] },
      { path: '/perfil', icon: FaUser, label: 'Perfil', profiles: ['staff', 'supervisor', 'director'] },
    ];
    
    // Filtrar ítems según el perfil del empleado
    const filteredItems = allNavItems.filter(item => 
      item.profiles.includes(profile)
    );
    
    setNavItems(filteredItems);
  }, []);

  return (
    <nav className="bg-white position-fixed bottom-0 start-50 translate-middle-x d-flex justify-content-around align-items-center shadow-lg"
         style={{
           width: '100%',
           maxWidth: 'min(100%, 500px)',
           height: '65px',
           paddingBottom: 'env(safe-area-inset-bottom)',
           borderTop: `3px solid ${profileColor}`,
           zIndex: 1100
         }}>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          style={({ isActive }) => ({
            color: isActive ? profileColor : '#666',
            flex: 1,
            textAlign: 'center',
            transition: 'color 0.2s ease',
            textDecoration: 'none',
            padding: '8px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          })}
        >
          <item.icon size={20} style={{ marginBottom: '2px' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 500, marginTop: '2px' }}>
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNavigation;
