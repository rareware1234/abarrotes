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
      // Verificar en localStorage si la caja está abierta
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
      setMessage({ type: 'error', text: 'Por favor ingresa un monto válido de apertura' });
      return;
    }

    setLoadingAction(true);
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Guardar estado en localStorage
      localStorage.setItem('cajaAbierta', 'true');
      localStorage.setItem('cajaFecha', fecha);
      localStorage.setItem('montoApertura', montoApertura);
      
      setCajaAbierta(true);
      setMessage({ type: 'success', text: 'Caja abierta exitosamente' });
      
      // Cargar ventas del día
      cargarVentasDelDia();
      
      // Limpiar mensaje después de 3 segundos
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
      setMessage({ type: 'error', text: 'Por favor ingresa el monto de cierre' });
      return;
    }

    setLoadingAction(true);
    try {
      // Calcular diferencia
      const montoAperturaGuardado = parseFloat(localStorage.getItem('montoApertura') || '0');
      const totalEfectivoVentas = resumen.totalEfectivo;
      const totalEsperado = montoAperturaGuardado + totalEfectivoVentas;
      const diferencia = parseFloat(montoCierre) - totalEsperado;
      
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Guardar cierre en localStorage
      localStorage.setItem('cajaAbierta', 'false');
      localStorage.setItem('montoCierre', montoCierre);
      localStorage.setItem('diferenciaCierre', diferencia.toFixed(2));
      
      setCajaAbierta(false);
      setMessage({ 
        type: diferencia === 0 ? 'success' : 'warning', 
        text: `Caja cerrada exitosamente${diferencia !== 0 ? `. Diferencia: $${diferencia.toFixed(2)}` : ''}` 
      });
      
      // Limpiar mensaje después de 5 segundos
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

  // Función para generar reporte en Excel
  const generarReporteExcel = () => {
    try {
      // Crear datos para el reporte
      const reporteData = ventasDelDia.map(venta => ({
        'Fecha': new Date(venta.fecha).toLocaleDateString('es-MX'),
        'Hora': formatTime(venta.fecha),
        'UUID': venta.uuid,
        'Método de Pago': venta.metodoPagoNombre,
        'Total': venta.total
      }));

      // Agregar fila de resumen al final
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

      // Crear libro de trabajo
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(reporteData);

      // Ajustar ancho de columnas
      ws['!cols'] = [
        { wch: 12 }, // Fecha
        { wch: 10 }, // Hora
        { wch: 25 }, // UUID
        { wch: 15 }, // Método de Pago
        { wch: 12 }  // Total
      ];

      // Agregar formato de moneda a la columna Total
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: 4 }); // Columna E (Total)
        if (ws[cellAddress]) {
          ws[cellAddress].z = '"$"#,##0.00'; // Formato de moneda
        }
      }

      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Ventas del Día');

      // Generar nombre de archivo con fecha
      const nombreArchivo = `Reporte_Caja_${fecha}.xlsx`;

      // Descargar el archivo
      XLSX.writeFile(wb, nombreArchivo);

      // Mostrar mensaje de éxito
      setMessage({ type: 'success', text: 'Reporte generado exitosamente' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error('Error generando reporte:', error);
      setMessage({ type: 'error', text: 'Error al generar el reporte' });
    }
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
          <h4 className="mb-0 fw-bold text-dark">Gestión de Caja</h4>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span className={`badge ${cajaAbierta ? 'bg-success' : 'bg-danger'} fs-6`}>
            {cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
          </span>
          <input 
            type="date" 
            className="form-control" 
            value={fecha}
            onChange={handleFechaChange}
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
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Abrir Caja
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Monto de Apertura ($)</label>
                    <input 
                      type="number" 
                      className="form-control form-control-lg"
                      placeholder="0.00"
                      value={montoApertura}
                      onChange={(e) => setMontoApertura(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <button 
                    className="btn btn-primary btn-lg w-100"
                    onClick={handleAbrirCaja}
                    disabled={loadingAction}
                  >
                    {loadingAction ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span> Abriendo...</>
                    ) : (
                      <><i className="bi bi-box-arrow-in-right me-2"></i> Abrir Caja</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Panel de caja abierta */}
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <div className="card shadow-sm h-100 border-success">
                  <div className="card-body text-center">
                    <h6 className="text-muted mb-2">Total Ventas</h6>
                    <h3 className="fw-bold" style={{ color: '#006241' }}>
                      {formatCurrency(resumen.totalVentas)}
                    </h3>
                    <small className="text-muted">{resumen.cantidadTransacciones} transacciones</small>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card shadow-sm h-100">
                  <div className="card-body text-center">
                    <h6 className="text-muted mb-2">Efectivo</h6>
                    <h3 className="fw-bold text-primary">
                      {formatCurrency(resumen.totalEfectivo)}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card shadow-sm h-100">
                  <div className="card-body text-center">
                    <h6 className="text-muted mb-2">Tarjeta</h6>
                    <h3 className="fw-bold text-info">
                      {formatCurrency(resumen.totalTarjeta)}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card shadow-sm h-100">
                  <div className="card-body text-center">
                    <h6 className="text-muted mb-2">Transferencia</h6>
                    <h3 className="fw-bold text-success">
                      {formatCurrency(resumen.totalTransferencia)}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel de cierre */}
            <div className="row justify-content-center mb-4">
              <div className="col-md-6 col-lg-4">
                <div className="card shadow">
                  <div className="card-header bg-danger text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Cerrar Caja
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Monto de Cierre ($)</label>
                      <input 
                        type="number" 
                        className="form-control form-control-lg"
                        placeholder="0.00"
                        value={montoCierre}
                        onChange={(e) => setMontoCierre(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                      <small className="text-muted">
                        Efectivo esperado: {formatCurrency(resumen.totalEfectivo + parseFloat(localStorage.getItem('montoApertura') || '0'))}
                      </small>
                    </div>
                    <button 
                      className="btn btn-danger btn-lg w-100"
                      onClick={handleCerrarCaja}
                      disabled={loadingAction}
                    >
                      {loadingAction ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span> Cerrando...</>
                      ) : (
                        <><i className="bi bi-box-arrow-right me-2"></i> Cerrar Caja</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de ventas */}
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="mb-0">Ventas del Día</h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Hora</th>
                        <th>UUID</th>
                        <th>Método de Pago</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventasDelDia.map((venta) => (
                        <tr key={venta.id}>
                          <td>{formatTime(venta.fecha)}</td>
                          <td><small className="text-muted">{venta.uuid}</small></td>
                          <td>
                            <span className={`badge ${
                              venta.metodoPago === '01' ? 'bg-primary' :
                              venta.metodoPago === '03' ? 'bg-info' : 'bg-success'
                            }`}>
                              {venta.metodoPagoNombre}
                            </span>
                          </td>
                          <td className="text-end fw-bold">{formatCurrency(venta.total)}</td>
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