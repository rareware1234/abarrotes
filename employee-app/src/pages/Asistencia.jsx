import React, { useState, useEffect } from 'react';
import { FaQrcode, FaCheckCircle, FaClock, FaHistory } from 'react-icons/fa';

const Asistencia = () => {
  const [qrData, setQrData] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('checked-out');
  const [lastEntry, setLastEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar datos de asistencia
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      // Generar QR de asistencia (simulado)
      const employeeId = localStorage.getItem('employeeId') || 'EMP001';
      const timestamp = new Date().toISOString();
      const qrContent = `ATTENDANCE|${employeeId}|${timestamp}`;
      setQrData(qrContent);

      // Datos de demo
      setAttendanceStatus('checked-in');
      setLastEntry({
        date: new Date().toLocaleDateString('es-MX'),
        time: '08:00 AM',
        type: 'entrada'
      });
    } catch (error) {
      console.error('Error cargando asistencia:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = () => {
    // Simular registro de entrada
    setAttendanceStatus('checked-in');
    setLastEntry({
      date: new Date().toLocaleDateString('es-MX'),
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      type: 'entrada'
    });
  };

  const handleCheckOut = () => {
    // Simular registro de salida
    setAttendanceStatus('checked-out');
  };

  return (
    <div className="fade-in">
      {/* Estado actual */}
      <div className="card mb-4 text-center">
        <div className="card-body py-4">
          <div className={`status-indicator mb-3 justify-content-center`}>
            <div className={`status-dot ${attendanceStatus === 'checked-in' ? 'active' : 'inactive'}`}></div>
            <span className="ms-2 fw-medium">
              {attendanceStatus === 'checked-in' ? 'Dentro de turno' : 'Fuera de turno'}
            </span>
          </div>
          
          <h3 className="h5 fw-bold mb-1">
            {attendanceStatus === 'checked-in' ? '¡Bienvenido!' : 'Fuera de turno'}
          </h3>
          <p className="text-muted mb-0">
            {attendanceStatus === 'checked-in' 
              ? 'Tu turno ha comenzado' 
              : 'Registra tu entrada para comenzar'}
          </p>
        </div>
      </div>

      {/* QR de asistencia */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="h6 mb-0 fw-bold d-flex align-items-center">
            <FaQrcode className="me-2" style={{ color: '#1e7f5c' }} />
            QR de Asistencia
          </h3>
        </div>
        <div className="card-body text-center py-4">
          {loading ? (
            <div className="skeleton" style={{ width: '200px', height: '200px', margin: '0 auto' }}></div>
          ) : (
            <div 
              className="d-inline-flex align-items-center justify-content-center bg-white p-4 rounded shadow-sm"
              style={{ width: '200px', height: '200px' }}
            >
              <div className="text-center">
                <div 
                  className="rounded mb-2"
                  style={{
                    width: '150px',
                    height: '150px',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FaQrcode size={80} style={{ color: '#333' }} />
                </div>
                <p className="text-muted small mb-0">
                  Escanea para registrar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-6">
              <button
                className="btn btn-primary btn-lg w-100"
                style={{ 
                  backgroundColor: attendanceStatus === 'checked-in' ? '#6c757d' : '#1e7f5c',
                  borderColor: attendanceStatus === 'checked-in' ? '#6c757d' : '#1e7f5c'
                }}
                onClick={handleCheckIn}
                disabled={attendanceStatus === 'checked-in'}
              >
                <FaCheckCircle className="me-2" />
                Entrada
              </button>
            </div>
            <div className="col-6">
              <button
                className="btn btn-outline-danger btn-lg w-100"
                onClick={handleCheckOut}
                disabled={attendanceStatus === 'checked-out'}
              >
                <FaClock className="me-2" />
                Salida
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Último registro */}
      {lastEntry && (
        <div className="card">
          <div className="card-header">
            <h3 className="h6 mb-0 fw-bold d-flex align-items-center">
              <FaHistory className="me-2" style={{ color: '#1e7f5c' }} />
              Último Registro
            </h3>
          </div>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-medium">{lastEntry.type === 'entrada' ? 'Entrada registrada' : 'Salida registrada'}</div>
                <small className="text-muted">{lastEntry.date}</small>
              </div>
              <span className="badge bg-primary">{lastEntry.time}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Asistencia;
