import React, { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import api from '../api/axiosConfig';
import { getProfileColor } from '../data/employeeProfiles';
import { useSharedOrders } from '../hooks/useSharedOrders';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const { getTodayOrders, getTodaySalesTotal } = useSharedOrders();
  
  const [stats, setStats] = useState({
    totalSales: 0,
    todaySales: 0,
    goal: 50000,
    ordersCount: 0,
    avgTicket: 0
  });
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState({ labels: [], data: [] });
  const [categoryData, setCategoryData] = useState({ labels: [], data: [] });
  const [profileColor, setProfileColor] = useState('#1B5E35');

  useEffect(() => {
    const employeeProfile = localStorage.getItem('employeeProfile') || 'staff';
    setProfileColor(getProfileColor(employeeProfile));
    
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const todayOrders = getTodayOrders();
      const todaySalesTotal = getTodaySalesTotal();
      
      const ordersCount = todayOrders.length;
      const avgTicket = ordersCount > 0 ? todaySalesTotal / ordersCount : 0;
      
      const totalSales = 125000.50;
      const goal = 10000;
      
      setStats({
        totalSales: totalSales,
        todaySales: todaySalesTotal,
        goal: goal,
        ordersCount: ordersCount,
        avgTicket: avgTicket
      });

      const lineData = {
        labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
        data: [4200, 5100, 4800, 6200, 7100, 8900, todaySalesTotal]
      };
      setSalesData(lineData);

      const doughnutData = {
        labels: ['Abarrotes', 'Lacteos', 'Limpieza', 'Bebidas', 'Otros'],
        data: [35, 25, 20, 15, 5]
      };
      setCategoryData(doughnutData);

      setLoading(false);
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error);
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '48px' }}>
      <div className="spinner" style={{ margin: '0 auto' }}></div>
    </div>
  );

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
  };

  const lineChartData = {
    labels: salesData.labels,
    datasets: [
      {
        data: salesData.data,
        borderColor: profileColor,
        backgroundColor: profileColor + '33',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: profileColor,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
    },
  };

  const doughnutChartData = {
    labels: categoryData.labels,
    datasets: [
      {
        data: categoryData.data,
        backgroundColor: [
          '#1B5E35',
          '#2E7D52',
          '#4CAF50',
          '#81C784',
          '#A5D6A7',
        ],
        borderWidth: 0,
      },
    ],
  };

  const goalPercentage = Math.min((stats.todaySales / stats.goal) * 100, 100);

  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-label">Ventas del Dia</div>
          <div className="metric-value">
            ${stats.todaySales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Meta Diaria</div>
          <div className="metric-value" style={{ color: '#4caf50' }}>
            ${stats.goal.toLocaleString('es-MX')}
          </div>
          <div style={{ marginTop: '8px', height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${goalPercentage}%`, height: '100%', background: '#4caf50', borderRadius: '3px' }}></div>
          </div>
          <div style={{ fontSize: '12px', color: '#6b7c93', marginTop: '4px' }}>{goalPercentage.toFixed(1)}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pedidos del Dia</div>
          <div className="metric-value" style={{ color: '#2196f3' }}>
            {stats.ordersCount}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Ticket Promedio</div>
          <div className="metric-value" style={{ color: '#ff9800' }}>
            ${stats.avgTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Ventas de la Semana</h4>
          <div style={{ height: '200px' }}>
            <Line options={lineChartOptions} data={lineChartData} />
          </div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Ventas por Categoria</h4>
          <div style={{ height: '200px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: '200px', width: '100%' }}>
              <Doughnut options={doughnutOptions} data={doughnutChartData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
