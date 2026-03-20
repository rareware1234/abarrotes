import React, { useState, useEffect } from 'react';
import { FaCashRegister, FaWallet, FaShoppingBag, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { getProfileColor } from '../data/employeeProfiles';

const Caja = () => {
  const [cajaStatus, setCajaStatus] = useState({
    isOpen: false,
    initialAmount: 1000,
    currentAmount: 1000,
    salesToday: 0,
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  
  // Colores dinámicos basados en el perfil
  const [colors, setColors] = useState({
    primary: '#1e7f5c',
    primaryDark: '#165f45',
    primaryLight: '#2fbf8c',
    secondary: '#2c3e50',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    border: '#dee2e6'
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
      secondary: '#2c3e50',
      success: '#28a745',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
      light: '#f8f9fa',
      dark: '#343a40',
      border: '#dee2e6'
    });
  }, []);

  useEffect(() => {
    loadCajaData();
  }, []);

  const loadCajaData = async () => {
    try {
      setLoading(true);
      // Datos de demo
      setCajaStatus({
        isOpen: true,
        initialAmount: 1000,
        currentAmount: 1500,
        salesToday: 500,
        transactions: [
          { id: 1, type: 'sale', amount: 50, time: '10:30 AM', description: 'Venta #001' },
          { id: 2, type: 'sale', amount: 75, time: '11:15 AM', description: 'Venta #002' },
          { id: 3, type: 'sale', amount: 120, time: '12:00 PM', description: 'Venta #003' },
          { id: 4, type: 'sale', amount: 85, time: '13:30 PM', description: 'Venta #004' },
          { id: 5, type: 'sale', amount: 170, time: '14:45 PM', description: 'Venta #005' }
        ]
      });
    } catch (error) {
      console.error('Error cargando caja:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCaja = () => {
    setCajaStatus(prev => ({ ...prev, isOpen: true }));
  };

  const handleCloseCaja = () => {
    setCajaStatus(prev => ({ ...prev, isOpen: false }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Estado de caja */}
      <div className="card mb-4">
        <div className="card-body text-center py-4">
           <div className="mb-3">
             <div 
               className="rounded-circle d-inline-flex align-items-center justify-content-center"
               style={{ 
                 width: '80px', 
                 height: '80px',
                 backgroundColor: cajaStatus.isOpen ? colors.primary : colors.secondary
               }}
             >
               <FaCashRegister size={40} color="white" />
             </div>
           </div>
          
          <h3 className="h5 fw-bold mb-1">
            {cajaStatus.isOpen ? 'Caja Abierta' : 'Caja Cerrada'}
          </h3>
          <p className="text-muted mb-3">
            {cajaStatus.isOpen 
              ? 'La caja está activa y lista para ventas' 
              : 'La caja se encuentra cerrada'}
          </p>

          <div className="d-flex justify-content-center gap-3">
            {!cajaStatus.isOpen ? (
              <button 
                className="btn btn-primary"
                style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
                onClick={handleOpenCaja}
              >
                <FaArrowUp className="me-2" />
                Abrir Caja
              </button>
            ) : (
              <button 
                className="btn"
                style={{ 
                  backgroundColor: 'transparent', 
                  borderColor: colors.danger, 
                  color: colors.danger 
                }}
                onClick={handleCloseCaja}
              >
                <FaArrowDown className="me-2" />
                Cerrar Caja
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Montos */}
      <div className="row g-3 mb-4">
        <div className="col-6">
          <div className="card h-100">
            <div className="card-body text-center py-3">
              <FaWallet className="mb-2" size={20} style={{ color: colors.primary }} />
              <div className="fw-bold" style={{ color: colors.primary }}>
                ${cajaStatus.currentAmount.toFixed(2)}
              </div>
              <small className="text-muted">Efectivo Actual</small>
            </div>
          </div>
        </div>
        <div className="col-6">
          <div className="card h-100">
            <div className="card-body text-center py-3">
              <FaShoppingBag className="mb-2" size={20} style={{ color: colors.primary }} />
              <div className="fw-bold" style={{ color: colors.primary }}>
                ${cajaStatus.salesToday.toFixed(2)}
              </div>
              <small className="text-muted">Ventas Hoy</small>
            </div>
          </div>
        </div>
      </div>

      {/* Transacciones recientes */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="h6 mb-0 fw-bold">Transacciones Recientes</h3>
          <span className="badge" style={{ backgroundColor: colors.primary }}>{cajaStatus.transactions.length}</span>
        </div>
        <div className="card-body p-0">
          {cajaStatus.transactions.length > 0 ? (
            <ul className="list-unstyled mb-0">
              {cajaStatus.transactions.map((transaction) => (
                <li 
                  key={transaction.id} 
                  className="p-3 border-bottom d-flex justify-content-between align-items-center"
                >
                  <div>
                    <div className="fw-medium small">{transaction.description}</div>
                    <small className="text-muted">{transaction.time}</small>
                  </div>
                  <span className="fw-bold" style={{ color: colors.primary }}>
                    +${transaction.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-muted">
              No hay transacciones recientes
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Caja;
