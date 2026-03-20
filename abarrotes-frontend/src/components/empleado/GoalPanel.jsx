import React from 'react';

const GoalPanel = () => {
  const metaActual = 3500;
  const metaObjetivo = 5000;
  const porcentaje = (metaActual / metaObjetivo) * 100;

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-0 pt-3">
        <h6 className="fw-bold mb-0">Meta Diaria de Ventas</h6>
      </div>
      <div className="card-body">
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted small">$ {metaActual.toLocaleString()}</span>
          <span className="text-muted small">$ {metaObjetivo.toLocaleString()}</span>
        </div>
        
        {/* Barra de Progreso Moderna */}
        <div className="progress mb-3" style={{ height: '10px', borderRadius: '5px', backgroundColor: '#e9ecef' }}>
          <div 
            className="progress-bar bg-success" 
            role="progressbar" 
            style={{ width: `${porcentaje}%` }}
            aria-valuenow={porcentaje} 
            aria-valuemin="0" 
            aria-valuemax="100"
          ></div>
        </div>
        
        <div className="text-center">
          <span className="badge bg-light text-dark border">
            {Math.round(porcentaje)}% Completado
          </span>
        </div>

        {/* Indicador Motivacional */}
        <div className="mt-3 p-2 bg-light rounded text-center">
          <small className="text-muted d-block">Faltan</small>
          <span className="fw-bold text-success">$ {(metaObjetivo - metaActual).toLocaleString()}</span>
          <small className="text-muted d-block">para el bono de hoy 🏆</small>
        </div>
      </div>
    </div>
  );
};

export default GoalPanel;