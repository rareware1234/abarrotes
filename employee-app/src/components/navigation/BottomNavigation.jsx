import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaShoppingCart, FaSearch, FaTasks, FaCashRegister, FaUser, FaHome, FaChartLine } from 'react-icons/fa';

const NAV_ITEMS = [
  { path: '/pos', icon: FaShoppingCart, label: 'POS' },
  { path: '/scanner', icon: FaSearch, label: 'Buscar' },
  { path: '/tasks', icon: FaTasks, label: 'Tareas' },
  { path: '/caja', icon: FaCashRegister, label: 'Caja' },
  { path: '/perfil', icon: FaUser, label: 'Perfil' },
];

const BottomNavigation = ({ profileColor = '#00843D' }) => {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <item.icon />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNavigation;
