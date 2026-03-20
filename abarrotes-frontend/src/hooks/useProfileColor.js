import { useState, useEffect } from 'react';
import { getProfileColor } from '../data/employeeProfiles';

export const useProfileColor = () => {
  const [profileColor, setProfileColor] = useState('#1e7f5c'); // Default staff color

  useEffect(() => {
    const updateColor = () => {
      const employeeProfile = localStorage.getItem('employeeProfile') || 'staff';
      const color = getProfileColor(employeeProfile);
      setProfileColor(color);
    };

    updateColor();
    
    // Escuchar cambios en el localStorage
    window.addEventListener('storage', updateColor);
    
    return () => {
      window.removeEventListener('storage', updateColor);
    };
  }, []);

  return profileColor;
};

// Función para ajustar brillo de color
export const adjustColor = (color, amount) => {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
};

export const getProfileColors = () => {
  const profileColor = getProfileColor(localStorage.getItem('employeeProfile') || 'staff');
  return {
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
  };
};
