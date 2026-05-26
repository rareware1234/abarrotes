import React from 'react';
import { useNavigate } from 'react-router-dom';

const HeaderEmpleado = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || { nombre: 'Empleado', rol: 'Cajero' };

  // Generar iniciales si no hay avatar
  const iniciales = user.nombre
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="card shadow-sm text-center p-3">
      <div className="d-flex align-items-center">
        {/* Avatar */}
        <div
          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
          style={{ width: '50px', height: '50px', fontSize: '1.2rem', fontWeight: 'bold' }}
        >
          {iniciales}
        </div>
        
        {/* Info */}
        <div className="text-start flex-grow-1">
          <h6 className="mb-0 fw-bold">{user.nombre}</h6>
          <small className="text-muted">{user.rol}</small>
        </div>

        {/* Estado Turno */}
        <div className="text-end">
          <span className="badge bg-success-subtle text-success border border-success">
            Turno Activo
          </span>
        </div>
      </div>
      
      {/* Cerrar Sesión */}
      <div className="mt-3 pt-2 border-top">
        <button className="btn btn-outline-danger btn-sm w-100" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default HeaderEmpleado;