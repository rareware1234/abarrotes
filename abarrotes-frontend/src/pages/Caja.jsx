import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import * as XLSX from 'xlsx';

const Caja = () => {
  // Estado de la caja
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [montoApertura, setMontoApertura] = useState('');
  const [montoCierre, setMontoCierre] = useState('');
  
  // Datos de ventas
  const [ventasDelDia, setVentasDelDia] = useState([]);
  const [resumen, setResumen] = useState({
    totalVentas: 0,
    totalEfectivo: 0,
    totalTarjeta: 0,
    totalTransferencia: 0,
    cantidadTransacciones: 0
  });
  
  // Estado de carga
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Fechas
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  
  // Mensajes
  const [message, setMessage] = useState({ type: '', text: '' });

  // Cargar estado de la caja al iniciar
  useEffect(() => {
    verificarEstadoCaja();
  }, []);

  // Función para verificar si la caja está abierta
  const verificarEstadoCaja = async () => {
    setLoading(true);
    try {
      const estadoCaja = localStorage.getItem('cajaAbierta');
      const fechaCaja = localStorage.getItem('cajaFecha');
      
      if (estadoCaja === 'true' && fechaCaja === fecha) {
        setCajaAbierta(true);
        cargarVentasDelDia();
      } else {
        setCajaAbierta(false);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error verificando estado de caja:', error);
      setCajaAbierta(false);
      setLoading(false);
    }
  };

  // Función para abrir caja
  const handleAbrirCaja = async () => {
    if (!montoApertura || parseFloat(montoApertura) <= 0) {
      setMessage({ type: 'error', text: 'Ingresa el monto inicial de tu caja' });
      return;
    }

    setLoadingAction(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      localStorage.setItem('cajaAbierta', 'true');
      localStorage.setItem('cajaFecha', fecha);
      localStorage.setItem('montoApertura', montoApertura);
      
      setCajaAbierta(true);
      setMessage({ type: 'success', text: '¡Caja abierta exitosamente! Listo para vender.' });
      
      cargarVentasDelDia();
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al abrir la caja' });
      console.error('Error abriendo caja:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  // Función para cerrar caja
  const handleCerrarCaja = async () => {
    if (!montoCierre || parseFloat(montoCierre) <= 0) {
      setMessage({ type: 'error', text: 'Ingresa el monto de cierre' });
      return;
    }

    setLoadingAction(true);
    try {
      const montoAperturaGuardado = parseFloat(localStorage.getItem('montoApertura') || '0');
      const totalEfectivoVentas = resumen.totalEfectivo;
      const totalEsperado = montoAperturaGuardado + totalEfectivoVentas;
      const diferencia = parseFloat(montoCierre) - totalEsperado;
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      localStorage.setItem('cajaAbierta', 'false');
      localStorage.setItem('montoCierre', montoCierre);
      localStorage.setItem('diferenciaCierre', diferencia.toFixed(2));
      
      setCajaAbierta(false);
      setMessage({ 
        type: diferencia === 0 ? 'success' : 'warning', 
        text: diferencia === 0 
          ? '¡Caja cerrada perfectamente!' 
          : `Caja cerrada. Diferencia: $${diferencia.toFixed(2)}` 
      });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cerrar la caja' });
      console.error('Error cerrando caja:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  const cargarVentasDelDia = async () => {
    setLoading(true);
    try {
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
    const methods = ['01', '03', '04'];
    const methodNames = { '01': 'Efectivo', '03': 'Tarjeta', '04': 'Transferencia' };
    
    const ventas = [];
    const numVentas = Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < numVentas; i++) {
      const method = methods[Math.floor(Math.random() * methods.length)];
      const total = Math.random() * 500 + 50;
      
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

  // Función para generar reporte en Excel
  const generarReporteExcel = () => {
    try {
      const reporteData = ventasDelDia.map(venta => ({
        'Fecha': new Date(venta.fecha).toLocaleDateString('es-MX'),
        'Hora': formatTime(venta.fecha),
        'UUID': venta.uuid,
        'Método de Pago': venta.metodoPagoNombre,
        'Total': venta.total
      }));

      // Agregar resumen al final
      reporteData.push({});
      reporteData.push({
        'Fecha': 'RESUMEN',
        'Hora': '',
        'UUID': '',
        'Método de Pago': 'Total Ventas',
        'Total': resumen.totalVentas
      });
      reporteData.push({
        'Fecha': '',
        'Hora': '',
        'UUID': '',
        'Método de Pago': 'Efectivo',
        'Total': resumen.totalEfectivo
      });
      reporteData.push({
        'Fecha': '',
        'Hora': '',
        'UUID': '',
        'Método de Pago': 'Tarjeta',
        'Total': resumen.totalTarjeta
      });
      reporteData.push({
        'Fecha': '',
        'Hora': '',
        'UUID': '',
        'Método de Pago': 'Transferencia',
        'Total': resumen.totalTransferencia
      });
      reporteData.push({
        'Fecha': '',
        'Hora': '',
        'UUID': '',
        'Método de Pago': 'Transacciones',
        'Total': resumen.cantidadTransacciones
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(reporteData);

      ws['!cols'] = [
        { wch: 12 },
        { wch: 10 },
        { wch: 25 },
        { wch: 15 },
        { wch: 12 }
      ];

      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: 4 });
        if (ws[cellAddress]) {
          ws[cellAddress].z = '"$"#,##0.00';
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Ventas del Día');
      const nombreArchivo = `Reporte_Caja_${fecha}.xlsx`;
      XLSX.writeFile(wb, nombreArchivo);

      setMessage({ type: 'success', text: 'Reporte generado exitosamente' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error('Error generando reporte:', error);
      setMessage({ type: 'error', text: 'Error al generar el reporte' });
    }
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

  if (loading && !cajaAbierta) {
    return (
      <div className="container-fluid p-0 d-flex flex-column" style={{ backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-3">Verificando estado de caja...</p>
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
          <img src="/logo.png" alt="Logo" style={{ height: '40px', marginRight: '15px' }} />
          <h4 className="mb-0 fw-bold text-dark">Caja</h4>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span className={`badge ${cajaAbierta ? 'bg-success' : 'bg-danger'} fs-6 px-3 py-2`}>
            {cajaAbierta ? 'CAJA ABIERTA' : 'CAJA CERRADA'}
          </span>
          <input 
            type="date" 
            className="form-control" 
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{ width: 'auto' }}
            disabled={cajaAbierta}
          />
          {cajaAbierta && (
            <button 
              className="btn btn-outline-success"
              onClick={generarReporteExcel}
            >
              <i className="bi bi-file-earmark-excel me-2"></i> Reporte Excel
            </button>
          )}
        </div>
      </div>

      {/* Mensajes */}
      {message.text && (
        <div className={`alert alert-${message.type === 'error' ? 'danger' : message.type === 'success' ? 'success' : 'warning'} alert-dismissible fade show m-3`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="flex-grow-1 p-4">
        {/* Si la caja está cerrada, mostrar panel de apertura */}
        {!cajaAbierta ? (
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-4">
              <div className="card shadow-lg border-0">
                <div className="card-body text-center p-5">
                  <div className="mb-4">
                    <i className="bi bi-box-arrow-in-right text-primary" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h3 className="fw-bold text-dark mb-4">Abrir Caja</h3>
                  <p className="text-muted mb-4">
                    Ingresa el monto inicial en efectivo para comenzar a operar.
                  </p>
                  <div className="mb-4">
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-white text-muted">$</span>
                      <input 
                        type="number" 
                        className="form-control form-control-lg text-center"
                        placeholder="0.00"
                        value={montoApertura}
                        onChange={(e) => setMontoApertura(e.target.value)}
                        min="0"
                        step="0.01"
                        style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleAbrirCaja();
                        }}
                      />
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary btn-lg w-100 py-3"
                    style={{ fontSize: '1.1rem' }}
                    onClick={handleAbrirCaja}
                    disabled={loadingAction}
                  >
                    {loadingAction ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span> Abriendo...</>
                    ) : (
                      <><i className="bi bi-check-circle me-2"></i> Confirmar Apertura</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Panel de caja abierta - Resumen en tarjetas */}
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <div className="card shadow-sm h-100 border-0">
                  <div className="card-body text-center py-4">
                    <div className="mb-2">
                      <i className="bi bi-cash-stack text-primary" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h6 className="text-muted mb-1">Total Ventas</h6>
                    <h3 className="fw-bold mb-0" style={{ color: '#006241', fontSize: '1.8rem' }}>
                      {formatCurrency(resumen.totalVentas)}
                    </h3>
                    <small className="text-muted">{resumen.cantidadTransacciones} transacciones</small>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card shadow-sm h-100 border-0">
                  <div className="card-body text-center py-4">
                    <div className="mb-2">
                      <i className="bi bi-cash text-success" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h6 className="text-muted mb-1">Efectivo</h6>
                    <h3 className="fw-bold text-success mb-0" style={{ fontSize: '1.8rem' }}>
                      {formatCurrency(resumen.totalEfectivo)}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card shadow-sm h-100 border-0">
                  <div className="card-body text-center py-4">
                    <div className="mb-2">
                      <i className="bi bi-credit-card text-info" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h6 className="text-muted mb-1">Tarjeta</h6>
                    <h3 className="fw-bold text-info mb-0" style={{ fontSize: '1.8rem' }}>
                      {formatCurrency(resumen.totalTarjeta)}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card shadow-sm h-100 border-0">
                  <div className="card-body text-center py-4">
                    <div className="mb-2">
                      <i className="bi bi-phone text-warning" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h6 className="text-muted mb-1">Transferencia</h6>
                    <h3 className="fw-bold text-warning mb-0" style={{ fontSize: '1.8rem' }}>
                      {formatCurrency(resumen.totalTransferencia)}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel de cierre */}
            <div className="row justify-content-center mb-4">
              <div className="col-md-6 col-lg-4">
                <div className="card shadow-lg border-0">
                  <div className="card-body text-center p-5">
                    <div className="mb-4">
                      <i className="bi bi-box-arrow-right text-danger" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h3 className="fw-bold text-dark mb-2">Cerrar Caja</h3>
                    <p className="text-muted mb-4">
                      Total en efectivo esperado: <strong>{formatCurrency(resumen.totalEfectivo + parseFloat(localStorage.getItem('montoApertura') || '0'))}</strong>
                    </p>
                    <div className="mb-4">
                      <div className="input-group input-group-lg">
                        <span className="input-group-text bg-white text-muted">$</span>
                        <input 
                          type="number" 
                          className="form-control form-control-lg text-center"
                          placeholder="0.00"
                          value={montoCierre}
                          onChange={(e) => setMontoCierre(e.target.value)}
                          min="0"
                          step="0.01"
                          style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleCerrarCaja();
                          }}
                        />
                      </div>
                    </div>
                    <button 
                      className="btn btn-danger btn-lg w-100 py-3"
                      style={{ fontSize: '1.1rem' }}
                      onClick={handleCerrarCaja}
                      disabled={loadingAction}
                    >
                      {loadingAction ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span> Cerrando...</>
                      ) : (
                        <><i className="bi bi-box-arrow-right me-2"></i> Confirmar Cierre</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de ventas */}
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0">
                  <i className="bi bi-list-ul me-2 text-primary"></i>
                  Ventas del Día
                </h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 ps-4">Hora</th>
                        <th className="border-0">UUID</th>
                        <th className="border-0">Método de Pago</th>
                        <th className="border-0 pe-4 text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventasDelDia.map((venta) => (
                        <tr key={venta.id}>
                          <td className="ps-4">{formatTime(venta.fecha)}</td>
                          <td><small className="text-muted">{venta.uuid}</small></td>
                          <td>
                            <span className={`badge ${
                              venta.metodoPago === '01' ? 'bg-success' :
                              venta.metodoPago === '03' ? 'bg-info' : 'bg-warning'
                            }`}>
                              {venta.metodoPagoNombre}
                            </span>
                          </td>
                          <td className="text-end pe-4 fw-bold">{formatCurrency(venta.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Caja;