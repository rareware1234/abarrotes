import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBox, FaShoppingCart, FaMoneyBillWave, FaBell, FaExclamationTriangle, FaQrcode } from 'react-icons/fa';

const Dashboard = () => {
  const [stats, setStats] = useState({
    products: 0,
    sales: 0,
    revenue: 0
  });
  
  const [membershipStats, setMembershipStats] = useState({
    sold: 0,
    goal: 20,
    percentage: 0,
    incentives: 0,
    incentivePerUnit: 100
  });
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState('');

  useEffect(() => {
    // Obtener nombre del empleado del localStorage
    const name = localStorage.getItem('employeeName') || 'Empleado';
    setEmployeeName(name);

    // Cargar datos del dashboard
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Datos de demo para el dashboard
      setStats({
        products: 156,
        sales: 24,
        revenue: 8542.50
      });
      
      // Datos de ventas de membresías (demo)
      const membershipsSold = 8; // 8 membresías vendidas este mes
      const membershipGoal = 20; // Meta de 20 membresías
      const percentage = Math.min((membershipsSold / membershipGoal) * 100, 100);
      const incentives = membershipsSold * 100; // $100 por membresía
      
      setMembershipStats({
        sold: membershipsSold,
        goal: membershipGoal,
        percentage: percentage,
        incentives: incentives,
        incentivePerUnit: 100
      });
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Saludo */}
      <div className="mb-4">
        <h2 className="h5 fw-bold mb-1">
          ¡Hola, {employeeName}! 👋
        </h2>
        <p className="text-muted small mb-0">
          {new Date().toLocaleDateString('es-MX', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Indicador de Membresías Vendidas */}
      <div className="card mb-4 text-center" style={{ 
        backgroundColor: '#1e7f5c', 
        color: 'white',
        backgroundImage: 'linear-gradient(135deg, #1e7f5c 0%, #2a9d8f 100%)'
      }}>
        <div className="card-body py-4">
          <div className="d-flex justify-content-center align-items-center mb-3">
            <h3 className="h6 mb-0 fw-bold" style={{ color: '#a8e6cf' }}>
              MEMBRESÍAS VENDIDAS
            </h3>
          </div>
          
          <div className="d-flex justify-content-center align-items-center mb-3">
            {/* Indicador circular de progreso */}
            <div className="position-relative" style={{ width: '140px', height: '140px' }}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                {/* Fondo del círculo */}
                <circle
                  cx="70"
                  cy="70"
                  r="62"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="16"
                />
                {/* Progreso de membresías */}
                <circle
                  cx="70"
                  cy="70"
                  r="62"
                  fill="none"
                  stroke="#27ae60"
                  strokeWidth="16"
                  strokeDasharray={`${2 * Math.PI * 62 * (membershipStats.percentage / 100)} ${2 * Math.PI * 62}`}
                  transform="rotate(-90 70 70)"
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s ease-out' }}
                />
              </svg>
              {/* Texto centrado */}
              <div className="position-absolute top-50 start-50 translate-middle" style={{ transform: 'translate(-50%, -50%)' }}>
                <div className="fw-bold" style={{ fontSize: '2rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {membershipStats.sold}
                </div>
                <div className="small" style={{ fontSize: '0.75rem', color: '#a8e6cf' }}>
                  DE {membershipStats.goal}
                </div>
              </div>
            </div>
          </div>
          
          {/* Barra de progreso horizontal */}
          <div className="px-4 mb-3">
            <div className="d-flex justify-content-between small mb-1" style={{ color: '#a8e6cf', fontSize: '0.75rem' }}>
              <span>Progreso mensual</span>
              <span>{membershipStats.percentage.toFixed(0)}%</span>
            </div>
            <div className="progress" style={{ height: '10px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '5px' }}>
              <div className="progress-bar bg-success" style={{ 
                width: `${membershipStats.percentage}%`,
                backgroundColor: '#27ae60'
              }}></div>
            </div>
          </div>
          
          {/* Meta e incentivos */}
          <div className="d-flex justify-content-between align-items-center px-4">
            <div className="text-start">
              <div className="small" style={{ color: '#a8e6cf', fontSize: '0.7rem' }}>META MENSUAL</div>
              <div className="fw-bold" style={{ fontSize: '1.1rem' }}>{membershipStats.goal} membresías</div>
            </div>
            <div className="text-center">
              <div className="small" style={{ color: '#a8e6cf', fontSize: '0.7rem' }}>FALTAN</div>
              <div className="fw-bold" style={{ fontSize: '1.1rem' }}>{membershipStats.goal - membershipStats.sold}</div>
            </div>
            <div className="text-end">
              <div className="small" style={{ color: '#a8e6cf', fontSize: '0.7rem' }}>INCENTIVOS</div>
              <div className="fw-bold text-success" style={{ fontSize: '1.1rem' }}>
                ${membershipStats.incentives.toLocaleString()}
              </div>
            </div>
          </div>
          
          {/* Info de incentivo por unidad */}
          <div className="mt-3 py-2 px-3" style={{ 
            backgroundColor: 'rgba(0,0,0,0.2)', 
            borderRadius: '6px',
            fontSize: '0.8rem'
          }}>
            <span style={{ color: '#a8e6cf' }}>Incentivo: </span>
            <span className="fw-bold">${membershipStats.incentivePerUnit} por membresía vendida</span>
          </div>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="row g-2 mb-4">
        <div className="col-4">
          <div className="card text-center p-3">
            <FaBox className="mx-auto mb-2" size={24} style={{ color: '#1e7f5c' }} />
            <div className="fw-bold">{stats.products}</div>
            <small className="text-muted">Productos</small>
          </div>
        </div>
        <div className="col-4">
          <div className="card text-center p-3">
            <FaShoppingCart className="mx-auto mb-2" size={24} style={{ color: '#1e7f5c' }} />
            <div className="fw-bold">{stats.sales}</div>
            <small className="text-muted">Ventas</small>
          </div>
        </div>
        <div className="col-4">
          <div className="card text-center p-3">
            <FaMoneyBillWave className="mx-auto mb-2" size={24} style={{ color: '#1e7f5c' }} />
            <div className="fw-bold">${stats.revenue.toFixed(2)}</div>
            <small className="text-muted">Ingresos</small>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="h6 mb-0 fw-bold">Acciones Rápidas</h3>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-6">
              <Link to="/scanner" className="text-decoration-none">
                <div className="d-flex flex-column align-items-center p-3 rounded" 
                     style={{ backgroundColor: '#f0f9f4' }}>
                  <FaQrcode size={28} style={{ color: '#1e7f5c' }} />
                  <span className="mt-2 small fw-medium">Buscar por Código</span>
                </div>
              </Link>
            </div>
            <div className="col-6">
              <Link to="/asistencia" className="text-decoration-none">
                <div className="d-flex flex-column align-items-center p-3 rounded"
                     style={{ backgroundColor: '#f0f9f4' }}>
                  <FaBell size={28} style={{ color: '#1e7f5c' }} />
                  <span className="mt-2 small fw-medium">Asistencia</span>
                </div>
              </Link>
            </div>
            <div className="col-6">
              <Link to="/caja" className="text-decoration-none">
                <div className="d-flex flex-column align-items-center p-3 rounded"
                     style={{ backgroundColor: '#f0f9f4' }}>
                  <FaMoneyBillWave size={28} style={{ color: '#1e7f5c' }} />
                  <span className="mt-2 small fw-medium">Caja</span>
                </div>
              </Link>
            </div>
            <div className="col-6">
              <Link to="/tasks" className="text-decoration-none">
                <div className="d-flex flex-column align-items-center p-3 rounded"
                     style={{ backgroundColor: '#f0f9f4' }}>
                  <FaExclamationTriangle size={28} style={{ color: '#1e7f5c' }} />
                  <span className="mt-2 small fw-medium">Tareas</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
