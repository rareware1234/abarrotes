import React from 'react';

const GoalProgress = ({ actual, objetivo }) => {
  const porcentaje = Math.min(100, Math.round((actual / objetivo) * 100));

  return (
    <div>
      <div className="d-flex justify-content-between mb-1">
        <span className="small fw-medium">$ {actual.toLocaleString()}</span>
        <span className="small text-muted">$ {objetivo.toLocaleString()}</span>
      </div>
      <div className="progress" style={{ height: '12px', borderRadius: '6px' }}>
        <div
          className="progress-bar bg-success"
          role="progressbar"
          style={{ width: `${porcentaje}%` }}
          aria-valuenow={porcentaje}
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      <div className="text-center mt-1">
        <small className="text-muted">{porcentaje}% alcanzado</small>
      </div>
    </div>
  );
};

export default GoalProgress;