import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Venta from './pages/Venta';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import VentaDetalles from './pages/VentaDetalles';
import Configuracion from './pages/Configuracion';
import Caja from './pages/Caja';
import PantallaCliente from './pages/PantallaCliente';
import PerfilEmpleado from './pages/PerfilEmpleado';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import logo from './assets/logo.png';

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/pantalla-cliente') {
      localStorage.setItem('dashboard_current_path', location.pathname);
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'dashboard_current_path',
        newValue: location.pathname
      }));
    } else {
      localStorage.removeItem('dashboard_current_path');
    }
  }, [location]);

  return null;
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleToggleMenu = () => {
      setMenuOpen(prev => !prev);
    };
    window.addEventListener('toggle-mobile-menu', handleToggleMenu);
    return () => window.removeEventListener('toggle-mobile-menu', handleToggleMenu);
  }, []);

  useEffect(() => {
    const preventHorizontalScroll = () => {
      if (window.scrollX !== 0) {
        window.scrollTo({ left: 0, behavior: 'instant' });
      }
      if (document.documentElement.scrollLeft !== 0) {
        document.documentElement.scrollLeft = 0;
      }
      if (document.body.scrollLeft !== 0) {
        document.body.scrollLeft = 0;
      }
    };
    window.addEventListener('scroll', preventHorizontalScroll, { passive: true });
    return () => window.removeEventListener('scroll', preventHorizontalScroll);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const isMobile = () => window.innerWidth < 1024;

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <Router>
      <RouteTracker />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="app">
              {/* NAVBAR: siempre encima de todo */}
              <nav className="navbar">
                <button className="hamburger" onClick={toggleMenu}>☰</button>
                <h1 className="navbar-title">Punto de Venta</h1>
              </nav>

              {/* SIDEBAR + OVERLAY: debajo del navbar */}
              <div className={`sidebar-wrapper ${menuOpen ? 'open' : ''}`}>
                <div className="overlay" onClick={closeMenu}></div>
                <aside className="sidebar">
                  <div className="sidebar-brand">
                    <img src={logo} alt="Abarrotes Digitales" className="sidebar-logo" />
                  </div>
                  
                  <div className="mb-3 nav-section-label">
                    <small className="text-uppercase opacity-75 text-white" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Menú Principal</small>
                  </div>

                  <Link to="/" className={`nav-link ${isActive('/')}`} onClick={closeMenu}>
                    <i className="bi bi-speedometer2"></i> <span>Venta</span>
                  </Link>
                  
                  <div className="mb-3 mt-4 nav-section-label">
                    <small className="text-uppercase opacity-75 text-white" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Gestión</small>
                  </div>

                  <Link to="/productos" className={`nav-link ${isActive('/productos')}`} onClick={closeMenu}>
                    <i className="bi bi-box-seam"></i> <span>Productos</span>
                  </Link>

                  <Link to="/pedidos" className={`nav-link ${isActive('/pedidos')}`} onClick={closeMenu}>
                    <i className="bi bi-cart-check"></i> <span>Pedidos</span>
                  </Link>
                  
                  <div className="mb-3 mt-4 nav-section-label">
                    <small className="text-uppercase opacity-75 text-white" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Finanzas</small>
                  </div>

                  <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`} onClick={closeMenu}>
                    <i className="bi bi-graph-up"></i> <span>Dashboard</span>
                  </Link>

                  <Link to="/caja" className={`nav-link ${isActive('/caja')}`} onClick={closeMenu}>
                    <i className="bi bi-cash-stack"></i> <span>Caja</span>
                  </Link>
                  
                  <div className="mb-3 mt-4 nav-section-label">
                    <small className="text-uppercase opacity-75 text-white" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Sistema</small>
                  </div>

                  <Link to="/perfil" className={`nav-link ${isActive('/perfil')}`} onClick={closeMenu}>
                    <i className="bi bi-person-circle"></i> <span>Mi Perfil</span>
                  </Link>

                  <Link to="/configuracion" className={`nav-link ${isActive('/configuracion')}`} onClick={closeMenu}>
                    <i className="bi bi-gear"></i> <span>Configuración</span>
                  </Link>

                  <div className="mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <small className="opacity-50 text-white" style={{ fontSize: '0.75rem' }}>
                      v1.0.0 • Backend Activo
                    </small>
                  </div>
                </aside>
              </div>

              {/* CONTENIDO PRINCIPAL */}
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Venta />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/productos" element={<Products />} />
                  <Route path="/pedidos" element={<Orders />} />
                  <Route path="/configuracion" element={<Configuracion />} />
                  <Route path="/caja" element={<Caja />} />
                  <Route path="/perfil" element={<PerfilEmpleado />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/venta-detalles" element={<ProtectedRoute><VentaDetalles /></ProtectedRoute>} />
        <Route path="/pantalla-cliente" element={<PantallaCliente />} />
        <Route path="/pos-mobile" element={<ProtectedRoute><Venta /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
