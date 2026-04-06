import React from 'react';

const StatCard = ({ titulo, valor, icono, color = 'var(--primary)', loading = false }) => {
  if (loading) {
    return (
      <div className="stat-card skeleton">
        <div className="skeleton-icon"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-value"></div>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ backgroundColor: `${color}15`, color }}>
        {icono}
      </div>
      <div className="stat-card-content">
        <span className="stat-card-title">{titulo}</span>
        <span className="stat-card-value" style={{ color }}>{valor}</span>
      </div>
    </div>
  );
};

export default StatCard;