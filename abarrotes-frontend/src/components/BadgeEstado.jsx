import React from 'react';

const BadgeEstado = ({ estado }) => {
  const getConfig = () => {
    switch (estado?.toLowerCase()) {
      case 'completada':
      case 'completado':
      case 'activo':
      case 'activa':
        return { bg: '#1A7A48', text: 'white', label: estado };
      case 'pendiente':
      case 'en_progreso':
      case 'en progreso':
        return { bg: '#F59E0B', text: 'white', label: 'Pendiente' };
      case 'cancelada':
      case 'cancelado':
      case 'suspendido':
      case 'vencido':
        return { bg: '#EF4444', text: 'white', label: estado };
      case 'pagado':
        return { bg: '#2563EB', text: 'white', label: 'Pagado' };
      default:
        return { bg: '#64748B', text: 'white', label: estado || 'Desconocido' };
    }
  };

  const config = getConfig();

  return (
    <span 
      className="badge-estado"
      style={{ 
        backgroundColor: config.bg, 
        color: config.text,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        display: 'inline-block'
      }}
    >
      {config.label}
    </span>
  );
};

export default BadgeEstado;