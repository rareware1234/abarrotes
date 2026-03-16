import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
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

// Componente para detectar cambios de ruta
function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    // Guardar la ruta actual en localStorage para que PantallaCliente pueda leerla
    // Ignorar la ruta de la pantalla del cliente
    if (location.pathname !== '/pantalla-cliente') {
      localStorage.setItem('dashboard_current_path', location.pathname);
      console.log('[App] Ruta actual guardada:', location.pathname);
      
      // Disparar un evento de storage para notificar a otras pestañas
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'dashboard_current_path',
        newValue: location.pathname
      }));
    } else {
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
    <Router>
      <RouteTracker /> {/* Componente para rastrear ruta */}
      <Routes>
        {/* Rutas con barra lateral */}
        <Route path="/*" element={
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
        } />
        
        {/* Rutas sin barra lateral */}
        <Route path="/venta-detalles" element={<VentaDetalles />} />
        <Route path="/pantalla-cliente" element={<PantallaCliente />} />
      </Routes>
    </Router>
  );
}

export default App;
