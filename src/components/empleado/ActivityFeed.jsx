import React from 'react';

const ActivityFeed = () => {
  const actividades = [
    { id: 1, tipo: 'venta', desc: 'Venta #2034', monto: 240.00, hora: '10:30 AM', icon: 'bi-cart-check', color: 'success' },
    { id: 2, tipo: 'venta', desc: 'Venta #2033', monto: 80.00, hora: '10:15 AM', icon: 'bi-cart-check', color: 'success' },
    { id: 3, tipo: 'devolucion', desc: 'Devolución #2032', monto: -50.00, hora: '10:00 AM', icon: 'bi-arrow-return-left', color: 'danger' },
    { id: 4, tipo: 'venta', desc: 'Venta #2031', monto: 150.00, hora: '09:45 AM', icon: 'bi-cart-check', color: 'success' },
    { id: 5, tipo: 'venta', desc: 'Venta #2030', monto: 320.00, hora: '09:30 AM', icon: 'bi-cart-check', color: 'success' },
  ];

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-0">
        <div className="list-group list-group-flush">
          {actividades.map((act) => (
            <div key={act.id} className="list-group-item d-flex align-items-center px-4 py-3">
              <div className={`me-3 rounded-circle p-2 bg-${act.color}-subtle`}>
                <i className={`bi ${act.icon} text-${act.color}`}></i>
              </div>
              <div className="flex-grow-1">
                <h6 className="mb-0 small fw-bold">{act.desc}</h6>
                <small className="text-muted">{act.hora}</small>
              </div>
              <div className={`fw-bold ${act.monto < 0 ? 'text-danger' : 'text-dark'}`}>
                {act.monto < 0 ? '-' : ''}${Math.abs(act.monto).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;