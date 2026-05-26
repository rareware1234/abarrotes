import React from 'react';

const NotificationsPanel = () => {
  const notificaciones = [
    { id: 1, text: 'Promoción: 2x1 en galletas Oreo', type: 'promo', time: 'Ahora' },
    { id: 2, text: 'Inventario bajo: Leche entera', type: 'alert', time: '10 min' },
    { id: 3, text: 'Reunión de equipo: 2:00 PM', type: 'info', time: '1 hora' },
  ];

  const getTypeStyle = (type) => {
    switch (type) {
      case 'promo': return { bg: 'bg-warning-subtle', text: 'text-warning', icon: 'bi-tag' };
      case 'alert': return { bg: 'bg-danger-subtle', text: 'text-danger', icon: 'bi-exclamation-triangle' };
      default: return { bg: 'bg-info-subtle', text: 'text-info', icon: 'bi-bell' };
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-0 pt-3">
        <h6 className="fw-bold mb-0 d-flex align-items-center">
          <i className="bi bi-bell-fill me-2 text-primary"></i>Notificaciones
        </h6>
      </div>
      <div className="card-body">
        {notificaciones.map((notif) => {
          const style = getTypeStyle(notif.type);
          return (
            <div key={notif.id} className={`d-flex align-items-center p-2 mb-2 rounded ${style.bg}`}>
              <i className={`bi ${style.icon} ${style.text} me-2`}></i>
              <div className="flex-grow-1">
                <small className="fw-medium d-block">{notif.text}</small>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>{notif.time}</small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationsPanel;