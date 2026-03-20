import React from 'react';

const ActivityList = ({ actividades }) => {
  const getIcon = (tipo) => {
    switch (tipo) {
      case 'venta':
        return <i className="bi bi-cart-check text-success"></i>;
      case 'devolucion':
        return <i className="bi bi-arrow-return-left text-danger"></i>;
      default:
        return <i className="bi bi-circle text-muted"></i>;
    }
  };

  return (
    <div className="card shadow-sm" style={{ maxHeight: '300px', overflowY: 'auto' }}>
      <ul className="list-group list-group-flush">
        {actividades.map((act) => (
          <li
            key={act.id}
            className="list-group-item d-flex justify-content-between align-items-center px-3 py-2"
          >
            <div className="d-flex align-items-center">
              <div className="me-3">{getIcon(act.tipo)}</div>
              <div>
                <span className="d-block small fw-medium">{act.descripcion}</span>
                <small className="text-muted">{act.hora}</small>
              </div>
            </div>
            <span
              className={`fw-medium ${act.tipo === 'devolucion' ? 'text-danger' : ''}`}
            >
              {act.tipo === 'devolucion' ? '-' : ''}${Math.abs(act.monto).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityList;