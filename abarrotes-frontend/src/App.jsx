import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Venta from './pages/Venta';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import VentaDetalles from './pages/VentaDetalles';
import Configuracion from './pages/Configuracion';
import Caja from './pages/Caja';
import PantallaCliente from './pages/PantallaCliente';
import Login from './pages/Login';

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Componente para detectar cambios de ruta
function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    // Guardar la ruta actual en localStorage para que PantallaCliente pueda leerla
    // Ignorar la ruta de la pantalla del cliente
    if (location.pathname !== '/pantalla-cliente' && location.pathname !== '/login') {
      localStorage.setItem('dashboard_current_path', location.pathname);
      console.log('[App] Ruta actual guardada:', location.pathname);
      
      // Disparar un evento de storage para notificar a otras pestañas
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'dashboard_current_path',
        newValue: location.pathname
      }));
    } else if (location.pathname === '/pantalla-cliente') {
      // Si estamos en la pantalla del cliente, limpiar la ruta del dashboard
      // para que PantallaCliente no se bloquee
      localStorage.removeItem('dashboard_current_path');
      console.log('[App] Ruta del dashboard limpiada (estamos en pantalla cliente)');
    }
  }, [location]);

  return null; // Componente invisible solo para rastreo
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <RouteTracker /> {/* Componente para rastrear ruta */}
        <Routes>
          {/* Ruta de Login (sin protección) */}
          <Route path="/login" element={<Login />} />
          
          {/* Ruta de Pantalla del Cliente (sin protección) */}
          <Route path="/pantalla-cliente" element={<PantallaCliente />} />
          
          {/* Rutas protegidas con barra lateral */}
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="d-flex" style={{ minHeight: '100vh' }}>
                {/* Barra Lateral (Sidebar) */}
                <div style={{ width: '260px', flexShrink: 0 }}>
                  <Navbar />
                </div>
                
                {/* Contenido Principal */}
                <div style={{ flex: 1, backgroundColor: '#f4f6f9' }}>
                  <Routes>
                    <Route path="/" element={<Venta />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/productos" element={<Products />} />
                    <Route path="/inventario" element={<Inventory />} />
                    <Route path="/pedidos" element={<Orders />} />
                    <Route path="/configuracion" element={<Configuracion />} />
                    <Route path="/caja" element={<Caja />} />
                  </Routes>
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          {/* Ruta de detalles de venta protegida */}
          <Route path="/venta-detalles" element={
            <ProtectedRoute>
              <VentaDetalles />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
