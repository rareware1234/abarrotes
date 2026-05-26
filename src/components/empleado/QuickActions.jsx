import React from 'react';

const QuickActions = () => {
  const actions = [
    { label: 'Nueva Venta', icon: 'bi-cart-plus', color: 'success', path: '/' },
    { label: 'Buscar', icon: 'bi-search', color: 'primary', path: '/productos' },
    { label: 'Cobrar', icon: 'bi-wallet2', color: 'info', path: '/pedidos' },
    { label: 'Devolución', icon: 'bi-arrow-return-left', color: 'danger', path: '/devoluciones' },
    { label: 'Promociones', icon: 'bi-tag', color: 'warning', path: '/promociones' },
  ];

  return (
    <div className="card shadow-sm p-3">
      <h6 className="text-muted mb-3">Acciones Rápidas</h6>
      <div className="d-grid gap-2">
        {actions.map((action, index) => (
          <button
            key={index}
            className={`btn btn-${action.color} btn-lg text-start d-flex align-items-center py-3`}
            onClick={() => console.log(`Navegando a ${action.path}`)}
          >
            <i className={`bi ${action.icon} fs-5 me-3`}></i>
            <span className="fs-6 fw-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;