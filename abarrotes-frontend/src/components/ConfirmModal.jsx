import React from 'react';

const ConfirmModal = ({ 
  titulo = 'Confirmar', 
  mensaje, 
  onConfirm, 
  onCancel, 
  tipo = 'warning',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}) => {
  const getIcono = () => {
    switch (tipo) {
      case 'danger':
        return <i className="bi bi-exclamation-triangle-fill"></i>;
      case 'warning':
        return <i className="bi bi-question-circle-fill"></i>;
      case 'info':
        return <i className="bi bi-info-circle-fill"></i>;
      default:
        return <i className="bi bi-check-circle-fill"></i>;
    }
  };

  const getColor = () => {
    switch (tipo) {
      case 'danger': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'info': return '#2563EB';
      default: return '#1A7A48';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="confirm-modal">
        <div className="confirm-modal-icon" style={{ color: getColor() }}>
          {getIcono()}
        </div>
        <h3 className="confirm-modal-title">{titulo}</h3>
        <p className="confirm-modal-message">{mensaje}</p>
        <div className="confirm-modal-actions">
          <button className="btn btn-outline-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button 
            className="btn" 
            style={{ backgroundColor: getColor(), color: 'white' }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;