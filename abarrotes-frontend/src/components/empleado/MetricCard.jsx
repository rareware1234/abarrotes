import React from 'react';

const MetricCard = ({ title, value, icon, color = 'primary' }) => {
  return (
    <div className="card shadow-sm h-100 border-0 metric-card">
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <p className="text-muted mb-1 small">{title}</p>
            <h5 className={`mb-0 text-${color}`}>{value}</h5>
          </div>
          <div className={`bg-${color} bg-opacity-10 rounded-circle p-2`}>
            <i className={`bi ${icon} text-${color}`}></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;