import React from 'react';

const EmptyState = ({ icono, titulo, descripcion, accion }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icono}</div>
      <h3 className="empty-state-title">{titulo}</h3>
      <p className="empty-state-description">{descripcion}</p>
      {accion && (
        <button className="empty-state-action" onClick={accion.onClick}>
          {accion.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;