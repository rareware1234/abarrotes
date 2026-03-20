import React from 'react';

const CajaPanel = () => {
  const [cajaAbierta, setCajaAbierta] = React.useState(true);

  return (
    <div className="card border-0 shadow-sm bg-light">
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0 fw-bold">Estado de Caja</h6>
          <span className={`badge ${cajaAbierta ? 'bg-success' : 'bg-danger'}`}>
            {cajaAbierta ? 'Abierta' : 'Cerrada'}
          </span>
        </div>
        
        <div className="mb-3">
          <div className="d-flex justify-content-between small mb-1">
            <span className="text-muted">Efectivo Actual</span>
            <span className="fw-bold">$1,250.00</span>
          </div>
          <div className="d-flex justify-content-between small">
            <span className="text-muted">Monto Inicial</span>
            <span className="text-muted">$500.00</span>
          </div>
        </div>

        <div className="d-grid gap-2">
          {cajaAbierta ? (
            <button className="btn btn-outline-danger btn-sm">
              Cerrar Caja
            </button>
          ) : (
            <button className="btn btn-success btn-sm">
              Abrir Caja
            </button>
          )}
          <button className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-list-ul me-1"></i> Movimientos
          </button>
        </div>
      </div>
    </div>
  );
};

export default CajaPanel;