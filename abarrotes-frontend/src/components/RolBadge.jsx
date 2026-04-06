import React from 'react';

const RolBadge = ({ rol }) => {
  const getConfig = () => {
    switch (rol?.toLowerCase()) {
      case 'staff':
        return { bg: '#1A7A48', text: 'white', label: 'Staff' };
      case 'manager':
      case 'lider':
        return { bg: '#2563EB', text: 'white', label: 'Manager' };
      case 'admin':
      case 'director':
        return { bg: '#64748B', text: 'white', label: 'Admin' };
      default:
        return { bg: '#64748B', text: 'white', label: rol || 'Empleado' };
    }
  };

  const config = getConfig();

  return (
    <span 
      className="rol-badge"
      style={{ 
        backgroundColor: config.bg, 
        color: config.text,
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}
    >
      {config.label}
    </span>
  );
};

export default RolBadge;