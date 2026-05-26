import React from 'react';

const QuickStats = () => {
  const stats = [
    { label: 'Ventas del Día', value: '$2,450.00', icon: 'bi-cash-coin', color: 'success', trend: '+12%' },
    { label: 'Transacciones', value: '34', icon: 'bi-receipt', color: 'primary', trend: '+5' },
    { label: 'Ticket Promedio', value: '$72.05', icon: 'bi-graph-up-arrow', color: 'info', trend: '+2%' },
    { label: 'Productos Vendidos', value: '128', icon: 'bi-box-seam', color: 'warning', trend: '' },
  ];

  return (
    <div className="row g-3">
      {stats.map((stat, index) => (
        <div key={index} className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 stat-card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted small mb-1">{stat.label}</p>
                  <h4 className="fw-bold mb-0">{stat.value}</h4>
                  {stat.trend && (
                    <small className={`text-${stat.color}`}>
                      <i className="bi bi-arrow-up-short"></i>{stat.trend}
                    </small>
                  )}
                </div>
                <div className={`rounded-circle p-2 bg-${stat.color}-subtle`}>
                  <i className={`bi ${stat.icon} text-${stat.color}`}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;