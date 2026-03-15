import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const Caja = () => {
  const [ventasDelDia, setVentasDelDia] = useState([]);
  const [resumen, setResumen] = useState({
    totalVentas: 0,
    totalEfectivo: 0,
    totalTarjeta: 0,
    totalTransferencia: 0,
    cantidadTransacciones: 0
  });
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarVentasDelDia();
  }, [fecha]);

  const cargarVentasDelDia = async () => {
    setLoading(true);
    try {
      // En producción, esto sería una llamada a la API
      // Por ahora, simulamos datos
      const simulatedData = generarDatosSimulados();
      setVentasDelDia(simulatedData);
      calcularResumen(simulatedData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading sales:', error);
      setLoading(false);
    }
  };

  const generarDatosSimulados = () => {
    // Generar datos de ejemplo para demostración
    const methods = ['01', '03', '04'];
    const methodNames = { '01': 'Efectivo', '03': 'Tarjeta', '04': 'Transferencia' };
    
    const ventas = [];
    const numVentas = Math.floor(Math.random() * 10) + 5; // 5-15 ventas
    
    for (let i = 0; i < numVentas; i++) {
      const method = methods[Math.floor(Math.random() * methods.length)];
      const total = Math.random() * 500 + 50; // $50-$550
      
      ventas.push({
        id: i + 1,
        fecha: new Date().toISOString(),
        total: total,
        metodoPago: method,
        metodoPagoNombre: methodNames[method],
        uuid: `UUID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      });
    }
    
    return ventas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  };

  const calcularResumen = (ventas) => {
    const resumen = ventas.reduce((acc, venta) => {
      acc.totalVentas += venta.total;
      acc.cantidadTransacciones += 1;
      
      if (venta.metodoPago === '01') {
        acc.totalEfectivo += venta.total;
      } else if (venta.metodoPago === '03') {
        acc.totalTarjeta += venta.total;
      } else if (venta.metodoPago === '04') {
        acc.totalTransferencia += venta.total;
      }
      
      return acc;
    }, {
      totalVentas: 0,
      totalEfectivo: 0,
      totalTarjeta: 0,
      totalTransferencia: 0,
      cantidadTransacciones: 0
    });
    
    setResumen(resumen);
  };

  const handleFechaChange = (e) => {
    setFecha(e.target.value);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container-fluid p-0 d-flex flex-column" style={{ backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-3">Cargando caja...</p>
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
          <h4 className="mb-0 fw-bold text-dark">Gestión de Caja</h4>
        </div>
        <div className="d-flex align-items-center gap-3">
          <input 
            type="date" 
            className="form-control" 
            value={fecha}
            onChange={handleFechaChange}
            style={{ width: 'auto' }}
          />
          <button className="btn btn-outline-primary" onClick={cargarVentasDelDia}>
            <i className="bi bi-arrow-clockwise me-2"></i> Actualizar
          </button>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-grow-1 p-4">
        {/* Resumen de Caja */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-body text-center">
                <h6 className="text-muted mb-2">Total Ventas</h6>
                <h3 className="fw-bold" style={{ color: '#006241' }}>
                  {formatCurrency(resumen.totalVentas)}
                </h3>
              </div>
            </div>
          </div>
          
          <div className="col-md-3 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-body text-center">
                <h6 className="text-muted mb-2">Efectivo</h6>
                <h4 className="fw-bold text-success">
                  {formatCurrency(resumen.totalEfectivo)}
                </h4>
              </div>
            </div>
          </div>
          
          <div className="col-md-3 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-body text-center">
                <h6 className="text-muted mb-2">Tarjeta</h6>
                <h4 className="fw-bold text-primary">
                  {formatCurrency(resumen.totalTarjeta)}
                </h4>
              </div>
            </div>
          </div>
          
          <div className="col-md-3 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-body text-center">
                <h6 className="text-muted mb-2">Transferencia</h6>
                <h4 className="fw-bold text-info">
                  {formatCurrency(resumen.totalTransferencia)}
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas Adicionales */}
        <div className="row mb-4">
          <div className="col-md-6 mb-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <h6 className="fw-bold mb-3" style={{ color: '#006241' }}>
                  <i className="bi bi-pie-chart me-2"></i> Distribución de Pagos
                </h6>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Efectivo</span>
                  <div className="progress flex-grow-1 mx-3" style={{ height: '20px' }}>
                    <div 
                      className="progress-bar bg-success" 
                      style={{ width: `${resumen.totalVentas > 0 ? (resumen.totalEfectivo / resumen.totalVentas) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="fw-bold">{resumen.totalVentas > 0 ? ((resumen.totalEfectivo / resumen.totalVentas) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Tarjeta</span>
                  <div className="progress flex-grow-1 mx-3" style={{ height: '20px' }}>
                    <div 
                      className="progress-bar bg-primary" 
                      style={{ width: `${resumen.totalVentas > 0 ? (resumen.totalTarjeta / resumen.totalVentas) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="fw-bold">{resumen.totalVentas > 0 ? ((resumen.totalTarjeta / resumen.totalVentas) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Transferencia</span>
                  <div className="progress flex-grow-1 mx-3" style={{ height: '20px' }}>
                    <div 
                      className="progress-bar bg-info" 
                      style={{ width: `${resumen.totalVentas > 0 ? (resumen.totalTransferencia / resumen.totalVentas) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="fw-bold">{resumen.totalVentas > 0 ? ((resumen.totalTransferencia / resumen.totalVentas) * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-6 mb-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <h6 className="fw-bold mb-3" style={{ color: '#006241' }}>
                  <i className="bi bi-graph-up me-2"></i> Estadísticas del Día
                </h6>
                <div className="row text-center">
                  <div className="col-6 mb-3">
                    <div className="p-3 bg-light rounded">
                      <h3 className="fw-bold mb-1">{resumen.cantidadTransacciones}</h3>
                      <small className="text-muted">Transacciones</small>
                    </div>
                  </div>
                  <div className="col-6 mb-3">
                    <div className="p-3 bg-light rounded">
                      <h3 className="fw-bold mb-1">
                        {resumen.cantidadTransacciones > 0 
                          ? formatCurrency(resumen.totalVentas / resumen.cantidadTransacciones)
                          : formatCurrency(0)
                        }
                      </h3>
                      <small className="text-muted">Promedio por Venta</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Ventas */}
        <div className="card shadow">
          <div className="card-header bg-white">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-list-ul me-2"></i> Detalle de Ventas
            </h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Hora</th>
                    <th>UUID</th>
                    <th>Forma de Pago</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasDelDia.map((venta) => (
                    <tr key={venta.id}>
                      <td>{formatTime(venta.fecha)}</td>
                      <td>
                        <small style={{ fontFamily: 'monospace' }}>
                          {venta.uuid}
                        </small>
                      </td>
                      <td>
                        <span className={`badge ${
                          venta.metodoPago === '01' ? 'bg-success' : 
                          venta.metodoPago === '03' ? 'bg-primary' : 'bg-info'
                        }`}>
                          {venta.metodoPagoNombre}
                        </span>
                      </td>
                      <td className="text-end fw-bold">
                        {formatCurrency(venta.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Botón de Cierre de Caja */}
        <div className="text-center mt-4">
          <button className="btn btn-danger btn-lg" onClick={() => alert('Función de cierre de caja en desarrollo')}>
            <i className="bi bi-box-arrow-right me-2"></i> Cierre de Caja
          </button>
        </div>
      </div>
    </div>
  );
};

export default Caja;
