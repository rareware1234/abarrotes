import React from 'react';

const CajaStatus = ({ caja }) => {
  const isAbierta = caja.estado === 'Abierta';

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white border-bottom-0 pt-3">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Estado de Caja</h6>
          <span className={`badge ${isAbierta ? 'bg-success' : 'bg-danger'}`}>
            {isAbierta ? 'Abierta' : 'Cerrada'}
          </span>
        </div>
      </div>
      <div className="card-body">
        <div className="row text-center g-2">
          <div className="col-6">
            <small className="text-muted d-block">Efectivo Actual</small>
            <span className="fw-bold">$ {caja.efectivoActual.toFixed(2)}</span>
          </div>
          <div className="col-6">
            <small className="text-muted d-block">Monto Inicial</small>
            <span className="text-muted">$ {caja.montoInicial.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="mt-3 d-grid gap-2">
          {isAbierta ? (
            <button className="btn btn-outline-danger btn-sm">
              Cerrar Caja
            </button>
          ) : (
            <button className="btn btn-success btn-sm">
              Abrir Caja
            </button>
          )}
          <button className="btn btn-outline-secondary btn-sm">
            Ver Movimientos
          </button>
        </div>
      </div>
    </div>
  );
};

export default CajaStatus;