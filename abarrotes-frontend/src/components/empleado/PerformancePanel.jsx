import React from 'react';

const PerformancePanel = () => {
  return (
    <div className="card shadow-sm mb-3">
      <div className="card-body">
        <h6 className="card-title text-muted mb-3">Rendimiento</h6>
        
        <div className="d-flex justify-content-between mb-2">
          <span className="small text-muted">Ventas del Mes</span>
          <span className="fw-bold">$15,400</span>
        </div>
        
        <div className="d-flex justify-content-between mb-2">
          <span className="small text-muted">Clientes Atendidos</span>
          <span className="fw-bold">320</span>
        </div>
        
        <div className="d-flex justify-content-between mb-2">
          <span className="small text-muted">Ranking en Tienda</span>
          <span className="fw-bold text-warning">
            <i className="bi bi-trophy-fill me-1"></i>#2
          </span>
        </div>
        
        <div className="d-flex justify-content-between">
          <span className="small text-muted">Eficiencia</span>
          <span className="fw-bold text-success">98%</span>
        </div>
      </div>
    </div>
  );
};

export default PerformancePanel;