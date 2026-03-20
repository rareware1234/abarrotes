import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const VentaDetalles = () => {
  const [venta, setVenta] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Obtener el UUID de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const uuid = urlParams.get('uuid');
    
    if (uuid) {
      // Buscar la venta por UUID usando el servicio de facturación
      // Nota: En una implementación real, el servicio de facturación tendría un endpoint
      // que busque por UUID y devuelva los datos de la venta y el ticket
      // Por ahora, usaremos datos de ejemplo para demostrar la funcionalidad
      
      // Simulación de datos para demostración
      setTimeout(() => {
        setVenta({
          items: [
            { nombre: "Leche Entera", quantity: 2, subtotal: 40.00 },
            { nombre: "Pan de Caja", quantity: 1, subtotal: 25.00 },
            { nombre: "Huevos Carta", quantity: 12, subtotal: 36.00 }
          ],
          subtotal: 101.00,
          totalImpuestos: 16.16,
          total: 117.16,
          formaPago: "01"
        });
        setTicket({
          uuid: uuid,
          fechaEmision: new Date().toISOString()
        });
        setLoading(false);
      }, 1000);
    } else {
      // Si no hay UUID, mostrar mensaje
      setError('No se especificó un UUID de venta');
      setLoading(false);
    }
  }, []);

  const handleImprimir = () => {
    window.print();
  };

  const handleClose = () => {
    window.close();
  };

  if (loading) {
    return (
      <div className="container-fluid p-0 d-flex flex-column" style={{ backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-3">Cargando detalles de venta...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !venta) {
    return (
      <div className="container-fluid p-0 d-flex flex-column" style={{ backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="text-center">
            <div className="alert alert-warning" role="alert" style={{ maxWidth: '400px' }}>
              <i className="bi bi-exclamation-triangle me-2"></i> {error || 'No hay detalles de venta disponibles'}
            </div>
            <button className="btn btn-primary mt-3" onClick={handleClose}>
              <i className="bi bi-x-circle me-2"></i> Cerrar Ventana
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 d-flex flex-column" style={{ backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center px-4 py-3 bg-white shadow-sm">
        <div className="d-flex align-items-center">
          <img src="/src/assets/logo.png" alt="Logo" style={{ height: '40px', marginRight: '15px' }} />
          <h4 className="mb-0 fw-bold text-dark">Detalles de Venta</h4>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary rounded-pill" onClick={handleClose}>
            <i className="bi bi-x-circle me-2"></i> Cerrar
          </button>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-grow-1 d-flex justify-content-center align-items-center p-4">
        <div className="card shadow-lg" style={{ maxWidth: '600px', width: '100%' }}>
          <div className="card-header text-white" style={{ backgroundColor: '#006241' }}>
            <h5 className="mb-0">
              <i className="bi bi-receipt me-2"></i> Comprobante de Venta
            </h5>
          </div>
          <div className="card-body">
            {/* Información del Ticket */}
            {ticket && (
              <div className="text-center mb-4 pb-3 border-bottom">
                <h6 className="text-muted mb-1">UUID del Comprobante</h6>
                <p className="fw-bold mb-0" style={{ fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                  {ticket.uuid}
                </p>
                <small className="text-muted">
                  Fecha: {new Date(ticket.fechaEmision).toLocaleString()}
                </small>
              </div>
            )}

            {/* Resumen de la Venta */}
            <div className="mb-4">
              <h6 className="fw-bold mb-3" style={{ color: '#006241' }}>Resumen de la Venta</h6>
              <ul className="list-group list-group-flush">
                {venta.items.map((item, index) => (
                  <li key={index} className="list-group-item d-flex justify-content-between px-0">
                    <div>
                      <span className="fw-medium">{item.nombre}</span>
                      <br />
                      <small className="text-muted">Cantidad: {item.quantity}</small>
                    </div>
                    <span className="fw-bold">${(item.subtotal * 1.16).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Totales */}
            <div className="bg-light p-3 rounded">
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>${(venta.subtotal * 1.16).toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>IVA (16% incl.):</span>
                <span>${(venta.totalImpuestos * 1.16).toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between fw-bold fs-5" style={{ color: '#006241' }}>
                <span>Total:</span>
                <span>${(venta.total * 1.16).toFixed(2)}</span>
              </div>
            </div>

            {/* Forma de Pago */}
            <div className="mt-4 text-center">
              <span className="badge bg-secondary fs-6">
                {venta.formaPago === '01' && 'Efectivo'}
                {venta.formaPago === '03' && 'Tarjeta'}
                {venta.formaPago === '04' && 'Transferencia'}
              </span>
            </div>
          </div>
          <div className="card-footer bg-white text-center py-3">
            <button className="btn btn-primary me-2" style={{ backgroundColor: '#006241', borderColor: '#006241' }} onClick={handleImprimir}>
              <i className="bi bi-printer me-2"></i> Imprimir
            </button>
            <button className="btn btn-outline-primary" style={{ borderColor: '#006241', color: '#006241' }} onClick={handleClose}>
              <i className="bi bi-x-circle me-2"></i> Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentaDetalles;
