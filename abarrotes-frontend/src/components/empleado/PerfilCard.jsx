import React from 'react';

const PerfilCard = ({ empleado }) => {
  const iniciales = empleado.nombre
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="card border-0 shadow-sm mb-4 profile-card">
      <div className="card-body p-4">
        <div className="d-flex align-items-center">
          {/* Avatar Grande */}
          <div className="profile-avatar me-4">
            <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center shadow-sm">
              <span className="fs-2 fw-bold">{iniciales}</span>
            </div>
          </div>
          
          {/* Info Detallada */}
          <div className="flex-grow-1">
            <div className="row">
              <div className="col-md-6">
                <h3 className="fw-bold text-dark mb-1">{empleado.nombre}</h3>
                <p className="text-muted mb-2">{empleado.rol}</p>
                <div className="d-flex align-items-center mb-1">
                  <i className="bi bi-geo-alt text-muted me-2"></i>
                  <span className="small">{empleado.sucursal}</span>
                </div>
              </div>
              <div className="col-md-6 text-md-end">
                <div className="mb-2">
                  <span className="badge bg-success-subtle text-success px-3 py-2 border border-success">
                    <i className="bi bi-clock-history me-1"></i> {empleado.turno}
                  </span>
                </div>
                <div className="mt-3">
                  <span className="badge bg-primary-subtle text-primary px-2 py-1">
                    ID: #EMP-001
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfilCard;