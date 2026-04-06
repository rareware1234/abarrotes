import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import BadgeEstado from '../components/BadgeEstado';
import orderService from '../services/orderService';
import productService from '../services/productService';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebase-config/firebase-config';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const formatDate = (date) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [ventasHoy, setVentasHoy] = useState(0);
  const [ordenesHoy, setOrdenesHoy] = useState(0);
  const [totalProductos, setTotalProductos] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [ordenesRecientes, setOrdenesRecientes] = useState([]);
  const [ventasSemana, setVentasSemana] = useState({});
  const [creditosStats, setCreditosStats] = useState({ total: 0, porVencer: 0, tasaPromedio: 0 });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const hoy = new Date();
      const ventasResult = await orderService.getVentasHoy();
      if (ventasResult.success) {
        setVentasHoy(ventasResult.data.total);
        setOrdenesHoy(ventasResult.data.count);
      }

      const productosResult = await productService.fetchAll();
      if (productosResult.success) {
        setTotalProductos(productosResult.data.length);
      }

      const clientesRef = collection(db, 'clientes');
      const clientesSnapshot = await getDocs(clientesRef);
      setTotalClientes(clientesSnapshot.size);

      const semanaResult = await orderService.getVentasSemana();
      if (semanaResult.success) {
        setVentasSemana(semanaResult.data);
      }

      const ordenesResult = await orderService.getOrdenes('hoy');
      if (ordenesResult.success) {
        setOrdenesRecientes(ordenesResult.data.slice(0, 5));
      }

      if (hasPermission('creditos_ver')) {
        const creditosRef = collection(db, 'creditos');
        const creditosQ = query(creditosRef, where('estado', '==', 'activo'));
        const creditosSnapshot = await getDocs(creditosQ);
        
        let totalCredito = 0;
        let porVencer = 0;
        let sumaTasa = 0;
        let countTasa = 0;
        const now = new Date();
        
        creditosSnapshot.forEach(doc => {
          const data = doc.data();
          totalCredito += data.montoUsado || 0;
          
          if (data.fechaVencimiento) {
            const vencimiento = data.fechaVencimiento.toDate ? data.fechaVencimiento.toDate() : new Date(data.fechaVencimiento);
            const diasRestantes = Math.ceil((vencimiento - now) / (1000 * 60 * 60 * 24));
            if (diasRestantes <= 7 && diasRestantes > 0) {
              porVencer++;
            }
          }
          
          if (data.tasaMensual) {
            sumaTasa += data.tasaMensual;
            countTasa++;
          }
        });
        
        setCreditosStats({
          total: totalCredito,
          porVencer,
          tasaPromedio: countTasa > 0 ? Math.round(sumaTasa / countTasa) : 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Ventas',
        data: [
          ventasSemana['Lunes'] || 0,
          ventasSemana['Martes'] || 0,
          ventasSemana['Miércoles'] || 0,
          ventasSemana['Jueves'] || 0,
          ventasSemana['Viernes'] || 0,
          ventasSemana['Sábado'] || 0,
          ventasSemana['Domingo'] || 0
        ],
        backgroundColor: 'rgba(26, 122, 72, 0.6)',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => formatCurrency(context.raw)
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value)
        }
      }
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getTodayDate = () => {
    return new Intl.DateTimeFormat('es-MX', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(new Date());
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>
            {getGreeting()} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            {getTodayDate()}
          </p>
        </div>
      </div>

      <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard 
          titulo="Ventas Hoy" 
          valor={formatCurrency(ventasHoy)} 
          icono={<i className="bi bi-cash-stack"></i>}
          color="#1A7A48"
          loading={loading}
        />
        <StatCard 
          titulo="Órdenes Hoy" 
          valor={ordenesHoy} 
          icono={<i className="bi bi-cart-check"></i>}
          color="#2563EB"
          loading={loading}
        />
        <StatCard 
          titulo="Productos" 
          valor={totalProductos} 
          icono={<i className="bi bi-box-seam"></i>}
          color="#F97316"
          loading={loading}
        />
        <StatCard 
          titulo="Clientes" 
          valor={totalClientes} 
          icono={<i className="bi bi-people"></i>}
          color="#7C3AED"
          loading={loading}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>Ventas de la Semana</h3>
          <div style={{ height: '250px' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {hasPermission('creditos_ver') && (
        <div style={{ marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>Créditos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#1A7A48' }}>
                  {formatCurrency(creditosStats.total)}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total Activo</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#F59E0B' }}>
                  {creditosStats.porVencer}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Por Vencer (&lt;7 días)</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563EB' }}>
                  {creditosStats.tasaPromedio}%
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Tasa Promedio</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Órdenes Recientes</h3>
          <button 
            onClick={() => navigate('/pedidos')}
            style={{ background: 'none', border: 'none', color: 'var(--role-primary)', cursor: 'pointer', fontSize: '14px' }}
          >
            Ver todas →
          </button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <span className="spinner-border spinner-border-sm me-2"></span>
            Cargando...
          </div>
        ) : ordenesRecientes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <i className="bi bi-inbox" style={{ fontSize: '48px', opacity: 0.5 }}></i>
            <p>No hay órdenes hoy</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>Método</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>Productos</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>Total</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>Hora</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ordenesRecientes.map((orden) => (
                  <tr 
                    key={orden.id} 
                    onClick={() => navigate('/pedidos')}
                    style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  >
                    <td style={{ padding: '12px', fontSize: '13px' }}>{orden.id.slice(-8)}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      <i className={`bi ${orden.metodoPago === 'efectivo' ? 'bi-cash' : orden.metodoPago === 'tarjeta' ? 'bi-credit-card' : 'bi-wallet2'}`}></i>{' '}
                      {orden.metodoPago}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{orden.productos?.length || 0}</td>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600 }}>{formatCurrency(orden.total)}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>{formatDate(orden.createdAt)}</td>
                    <td style={{ padding: '12px' }}>
                      <BadgeEstado estado={orden.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;