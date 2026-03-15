import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import VentaDetalles from './pages/VentaDetalles';
import Configuracion from './pages/Configuracion';
import Caja from './pages/Caja';

function App() {
  return (
    <Router>
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
                <Route path="/" element={<Dashboard />} />
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
      </Routes>
    </Router>
  );
}

export default App;
