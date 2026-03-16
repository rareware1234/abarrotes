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

// Registrar los componentes de Chart.js
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
  const [stats, setStats] = useState({
    totalSales: 0,
    todaySales: 0,
    goal: 50000, // Meta diaria por defecto
    ordersCount: 0,
    avgTicket: 0
  });
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState({ labels: [], data: [] });
  const [categoryData, setCategoryData] = useState({ labels: [], data: [] });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simulación de datos mientras se conecta al backend
      // En producción, esto vendría de un endpoint como /api/stats/sales
      const simulatedData = {
        totalSales: 125000.50,
        todaySales: 8450.00,
        goal: 10000,
        ordersCount: 45,
        avgTicket: 187.78
      };
      
      setStats(simulatedData);

      // Datos para el gráfico de líneas (Ventas últimos 7 días)
      const lineData = {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        data: [4200, 5100, 4800, 6200, 7100, 8900, 8450]
      };
      setSalesData(lineData);

      // Datos para el gráfico de dona (Categorías)
      const doughnutData = {
        labels: ['Abarrotes', 'Lácteos', 'Limpieza', 'Bebidas', 'Otros'],
        data: [35, 25, 20, 15, 5]
      };
      setCategoryData(doughnutData);

      setLoading(false);
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Cargando dashboard...</div>;

  // Configuración del gráfico de líneas
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Ventas de la Semana' },
    },
  };

  const lineChartData = {
    labels: salesData.labels,
    datasets: [
      {
        label: 'Ventas ($)',
        data: salesData.data,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Configuración del gráfico de dona
  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'right' },
      title: { display: true, text: 'Ventas por Categoría' },
    },
  };

  const doughnutChartData = {
    labels: categoryData.labels,
    datasets: [
      {
        label: ' % Ventas',
        data: categoryData.data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Calcular porcentaje de meta alcanzada
  const goalPercentage = Math.min((stats.todaySales / stats.goal) * 100, 100);

  return (
    <div className="container-fluid p-4">
      <h2 className="mb-4">Dashboard de Ventas</h2>

      {/* KPIs Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card text-white bg-primary h-100">
            <div className="card-body">
              <h5 className="card-title">Ventas del Día</h5>
              <p className="card-text display-6">
                ${stats.todaySales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-white bg-success h-100">
            <div className="card-body">
              <h5 className="card-title">Meta Diaria</h5>
              <p className="card-text display-6">
                ${stats.goal.toLocaleString('es-MX')}
              </p>
              <div className="progress mt-2" style={{ height: '10px' }}>
                <div 
                  className="progress-bar bg-white" 
                  role="progressbar" 
                  style={{ width: `${goalPercentage}%` }}
                  aria-valuenow={goalPercentage} 
                  aria-valuemin="0" 
                  aria-valuemax="100"
                ></div>
              </div>
              <small>{goalPercentage.toFixed(1)}% Alcanzado</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-white bg-info h-100">
            <div className="card-body">
              <h5 className="card-title">Pedidos del Día</h5>
              <p className="card-text display-6">{stats.ordersCount}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-white bg-warning h-100">
            <div className="card-body">
              <h5 className="card-title">Ticket Promedio</h5>
              <p className="card-text display-6">
                ${stats.avgTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="row">
        <div className="col-md-8 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <Line options={lineChartOptions} data={lineChartData} />
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body d-flex justify-content-center align-items-center">
              <div style={{ maxWidth: '300px', width: '100%' }}>
                <Doughnut options={doughnutOptions} data={doughnutChartData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
