import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import * as XLSX from 'xlsx';
import { getProfileColor } from '../data/employeeProfiles';
import { FaMoneyBill, FaCreditCard, FaUniversity, FaUser, FaClock, FaFileExcel } from 'react-icons/fa';

const Caja = () => {
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [montoApertura, setMontoApertura] = useState('');
  const [montoCierre, setMontoCierre] = useState('');
  const [numeroEmpleado, setNumeroEmpleado] = useState('');
  
  const [sesionCaja, setSesionCaja] = useState(null);
  
  const [ventasDelDia, setVentasDelDia] = useState([]);
  const [resumen, setResumen] = useState({
    totalVentas: 0,
    totalEfectivo: 0,
    totalTarjeta: 0,
    totalTransferencia: 0,
    cantidadTransacciones: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  
  const [message, setMessage] = useState({ type: '', text: '' });

  const [colors, setColors] = useState({
    primary: '#1B5E35',
    primaryDark: '#154a2c',
    primaryLight: '#2E7D52',
    success: '#10b981',
    danger: '#dc3545',
    warning: '#ffc107',
  });

  useEffect(() => {
    const profileColor = getProfileColor(localStorage.getItem('employeeProfile') || 'staff');
    const adjustColor = (color, amount) => {
      const hex = color.replace('#', '');
      const num = parseInt(hex, 16);
      const r = Math.min(255, Math.max(0, (num >> 16) + amount));
      const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
      const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
      return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    };

    setColors({
      primary: profileColor,
      primaryDark: adjustColor(profileColor, -20),
      primaryLight: adjustColor(profileColor, 20),
      success: '#10b981',
      danger: '#dc3545',
      warning: '#ffc107',
    });
  }, []);

  useEffect(() => {
    const employeeId = localStorage.getItem('employeeId');
    if (employeeId) {
      setNumeroEmpleado(employeeId);
    }
    
    verificarEstadoCaja();
  }, []);

  const verificarEstadoCaja = async () => {
    setLoading(true);
    try {
      const empleadoGuardado = localStorage.getItem('empleadoNumero');
      if (empleadoGuardado) {
        setNumeroEmpleado(empleadoGuardado);
        
        const response = await api.get(`/api/caja/abierta/${empleadoGuardado}`);
        if (response.data) {
          setCajaAbierta(true);
          setSesionCaja(response.data);
          cargarVentasDelDia();
        }
      }
    } catch (error) {
      console.error('Error verificando estado de caja:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirCaja = async () => {
    if (!numeroEmpleado) {
      setMessage({ type: 'error', text: 'Ingresa tu numero de empleado' });
      return;
    }
    
    if (!montoApertura || parseFloat(montoApertura) <= 0) {
      setMessage({ type: 'error', text: 'Ingresa el monto inicial' });
      return;
    }

    setLoadingAction(true);
    try {
      const empleadoResponse = await api.get(`/api/empleados/numero/${numeroEmpleado}`);
      if (!empleadoResponse.data || !empleadoResponse.data.activo) {
        setMessage({ type: 'error', text: 'Empleado no encontrado' });
        setLoadingAction(false);
        return;
      }

      const response = await api.post('/api/caja/abrir', {
        numeroEmpleado: numeroEmpleado,
        montoApertura: parseFloat(montoApertura)
      });

      setSesionCaja(response.data);
      setCajaAbierta(true);
      localStorage.setItem('empleadoNumero', numeroEmpleado);
      
      setMessage({ type: 'success', text: `Caja abierta exitosamente, ${empleadoResponse.data.nombre}` });
      cargarVentasDelDia();
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data || 'Error al abrir la caja' });
      console.error('Error abriendo caja:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCerrarCaja = async () => {
    if (!montoCierre || parseFloat(montoCierre) <= 0) {
      setMessage({ type: 'error', text: 'Ingresa el monto de cierre' });
      return;
    }

    setLoadingAction(true);
    try {
      const response = await api.post(`/api/caja/cerrar/${sesionCaja.id}?montoCierre=${parseFloat(montoCierre)}`);
      
      setCajaAbierta(false);
      setSesionCaja(null);
      setNumeroEmpleado('');
      setMontoApertura('');
      setMontoCierre('');
      
      setMessage({ 
        type: response.data.diferencia === 0 ? 'success' : 'warning', 
        text: response.data.diferencia === 0 
          ? 'Caja cerrada perfectamente' 
          : `Diferencia: $${response.data.diferencia.toFixed(2)}` 
      });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data || 'Error al cerrar la caja' });
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

  const generarReporteExcel = () => {
    try {
      const reporteData = ventasDelDia.map(venta => ({
        'Fecha': new Date(venta.fecha).toLocaleDateString('es-MX'),
        'Hora': formatTime(venta.fecha),
        'UUID': venta.uuid,
        'Metodo de Pago': venta.metodoPagoNombre,
        'Total': venta.total
      }));

      reporteData.push({});
      reporteData.push({ 'Fecha': 'RESUMEN', 'Hora': '', 'UUID': '', 'Metodo de Pago': 'Total Ventas', 'Total': resumen.totalVentas });
      reporteData.push({ 'Fecha': '', 'Hora': '', 'UUID': '', 'Metodo de Pago': 'Efectivo', 'Total': resumen.totalEfectivo });
      reporteData.push({ 'Fecha': '', 'Hora': '', 'UUID': '', 'Metodo de Pago': 'Tarjeta', 'Total': resumen.totalTarjeta });
      reporteData.push({ 'Fecha': '', 'Hora': '', 'UUID': '', 'Metodo de Pago': 'Transferencia', 'Total': resumen.totalTransferencia });
      reporteData.push({ 'Fecha': '', 'Hora': '', 'UUID': '', 'Metodo de Pago': 'Transacciones', 'Total': resumen.cantidadTransacciones });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(reporteData);

      ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 12 }];

      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: 4 });
        if (ws[cellAddress]) {
          ws[cellAddress].z = '"$"#,##0.00';
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Ventas del Dia');
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
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
      </div>
    );
  }

  return (
    <div>
      {message.text && (
        <div style={{
          margin: '16px',
          padding: '12px 16px',
          borderRadius: '10px',
          background: message.type === 'success' ? '#e8f5ec' : '#fee2e2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
          fontSize: '14px',
          fontWeight: 500
        }}>
          {message.text}
        </div>
      )}

      {!cajaAbierta ? (
        <div style={{ maxWidth: '400px', margin: '48px auto', padding: '0 16px' }}>
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(27,94,53,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <FaMoneyBill style={{ fontSize: '28px', color: '#1B5E35' }} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600 }}>Abrir Caja</h3>
            <p style={{ color: '#6b7c93', marginBottom: '24px' }}>
              Ingresa tu numero de empleado y el monto inicial en efectivo.
            </p>
            
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Numero de empleado</label>
              <input 
                type="text" 
                className="form-input"
                placeholder="EMP001"
                value={numeroEmpleado}
                onChange={(e) => setNumeroEmpleado(e.target.value.toUpperCase())}
              />
            </div>
            
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Monto de apertura</label>
              <input 
                type="number"
                className="form-input"
                placeholder="0.00"
                value={montoApertura}
                onChange={(e) => setMontoApertura(e.target.value)}
                style={{ fontSize: '24px', fontWeight: 600, textAlign: 'center' }}
              />
            </div>
            
            <button 
              className="btn-primary-custom"
              onClick={handleAbrirCaja}
              disabled={loadingAction}
              style={{ width: '100%', marginTop: '16px' }}
            >
              {loadingAction ? 'Abriendo...' : 'Confirmar Apertura'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="metrics-grid" style={{ marginBottom: '24px' }}>
            <div className="metric-card">
              <div className="metric-label">Empleado</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#1B5E35', marginTop: '4px' }}>
                {sesionCaja?.numeroEmpleado}
              </div>
            </div>
            <div className="metric-card primary">
              <div className="metric-label">Total Ventas</div>
              <div className="metric-value">
                {formatCurrency(resumen.totalVentas)}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                {resumen.cantidadTransacciones} transacciones
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Efectivo</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#1B5E35', marginTop: '4px' }}>
                {formatCurrency(resumen.totalEfectivo)}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Monto Apertura</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#dc3545', marginTop: '4px' }}>
                {formatCurrency(sesionCaja?.montoApertura || 0)}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Cerrar Caja</h4>
            <p style={{ color: '#6b7c93', marginBottom: '16px' }}>
              Total en efectivo esperado: <strong>{formatCurrency(resumen.totalEfectivo + (sesionCaja?.montoApertura || 0))}</strong>
            </p>
            <input 
              type="number"
              className="form-input"
              placeholder="0.00"
              value={montoCierre}
              onChange={(e) => setMontoCierre(e.target.value)}
              style={{ fontSize: '24px', fontWeight: 600, textAlign: 'center', marginBottom: '16px' }}
            />
            <button 
              className="btn-primary-custom"
              onClick={handleCerrarCaja}
              disabled={loadingAction}
              style={{ width: '100%', background: '#dc3545' }}
            >
              {loadingAction ? 'Cerrando...' : 'Confirmar Cierre'}
            </button>
          </div>

          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Ventas del Dia</h5>
              <button 
                onClick={generarReporteExcel}
                style={{ 
                  padding: '8px 16px',
                  background: '#1B5E35',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FaFileExcel />
                Excel
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F3F4F6' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#1B5E35' }}>Hora</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 600, color: '#1B5E35' }}>UUID</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 600, color: '#1B5E35' }}>Metodo</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#1B5E35' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasDelDia.map((venta) => (
                    <tr key={venta.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '14px' }}>{formatTime(venta.fecha)}</td>
                      <td style={{ padding: '12px 8px', fontSize: '12px', color: '#6b7c93' }}>{venta.uuid}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ 
                          padding: '4px 10px',
                          background: venta.metodoPago === '01' ? 'rgba(27,94,53,0.1)' : venta.metodoPago === '03' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
                          color: venta.metodoPago === '01' ? '#1B5E35' : venta.metodoPago === '03' ? '#3b82f6' : '#f59e0b',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>
                          {venta.metodoPagoNombre}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#1B5E35' }}>
                        {formatCurrency(venta.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Caja;
