import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

const MENU_TITLES = {
  '/': 'Punto de Venta',
  '/productos': 'Productos',
  '/pedidos': 'Pedidos',
  '/dashboard': 'Dashboard',
  '/caja': 'Caja',
  '/perfil': 'Mi Perfil',
  '/configuracion': 'Configuracion'
};

function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 992);

  useEffect(() => {
    const name = sessionStorage.getItem('desktop_employeeName') || 'Usuario';
    const role = sessionStorage.getItem('desktop_employeeProfile') || 'staff';
    setUserName(name);
    setUserRole(role);
  }, []);

  useEffect(() => {
    const handlePathChange = () => {
      const path = window.location.hash.replace('#', '') || '/';
      setCurrentPath(path);
    };
    window.addEventListener('hashchange', handlePathChange);
    handlePathChange();
    return () => window.removeEventListener('hashchange', handlePathChange);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [currentPath]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const isActive = (path) => currentPath === path ? 'active' : '';
  
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRoleLabel = (role) => {
    const roles = { staff: 'Empleado', supervisor: 'Supervisor', director: 'Director' };
    return roles[role] || 'Empleado';
  };

  const getPageTitle = () => {
    return MENU_TITLES[currentPath] || 'Abarrotes Digitales';
  };

  const MenuIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  );

  const RefreshIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  );

  const isPOSPage = currentPath === '/';

  return (
    <div className="app">
      {!isPOSPage && (
        <nav className="navbar">
          <button className="navbar-hamburger" onClick={toggleMenu}>
            <MenuIcon />
          </button>
          <h1 className="navbar-title">{getPageTitle()}</h1>
          <div className="navbar-actions">
            {currentPath === '/pedidos' && (
              <button className="navbar-action-btn" onClick={() => window.location.reload()}>
                <RefreshIcon />
              </button>
            )}
          </div>
        </nav>
      )}

      {isMobile && !isPOSPage && (
        <div className={`sidebar-wrapper ${menuOpen ? 'open' : ''}`}>
          <div className="overlay" onClick={closeMenu}></div>
          <aside className="sidebar">
            <div className="sidebar-brand">
              <img src={logo} alt="Abarrotes Digitales" className="sidebar-logo" />
            </div>
            
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">{getInitials(userName)}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{userName}</div>
                <div className="sidebar-user-role">{getRoleLabel(userRole)}</div>
              </div>
            </div>
            
            <div className="nav-section-label">
              <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', letterSpacing: '1px' }}>MENU PRINCIPAL</small>
            </div>

            <Link to="/" className={`nav-link ${isActive('/')}`} onClick={closeMenu}>
              <i className="bi bi-cart4"></i> <span>Venta</span>
            </Link>
            
            <div className="nav-section-label">
              <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', letterSpacing: '1px' }}>GESTION</small>
            </div>

            <Link to="/productos" className={`nav-link ${isActive('/productos')}`} onClick={closeMenu}>
              <i className="bi bi-box-seam"></i> <span>Productos</span>
            </Link>

            <Link to="/pedidos" className={`nav-link ${isActive('/pedidos')}`} onClick={closeMenu}>
              <i className="bi bi-cart-check"></i> <span>Pedidos</span>
            </Link>
            
            <div className="nav-section-label">
              <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', letterSpacing: '1px' }}>FINANZAS</small>
            </div>

            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`} onClick={closeMenu}>
              <i className="bi bi-graph-up"></i> <span>Dashboard</span>
            </Link>

            <Link to="/caja" className={`nav-link ${isActive('/caja')}`} onClick={closeMenu}>
              <i className="bi bi-cash-stack"></i> <span>Caja</span>
            </Link>
            
            <div className="nav-section-label">
              <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', letterSpacing: '1px' }}>SISTEMA</small>
            </div>

            <Link to="/perfil" className={`nav-link ${isActive('/perfil')}`} onClick={closeMenu}>
              <i className="bi bi-person-circle"></i> <span>Mi Perfil</span>
            </Link>

            <Link to="/configuracion" className={`nav-link ${isActive('/configuracion')}`} onClick={closeMenu}>
              <i className="bi bi-gear"></i> <span>Configuracion</span>
            </Link>

            <div className="sidebar-footer">
              <small>v1.0.0</small>
            </div>
          </aside>
        </div>
      )}

      {!isMobile && (
        <div className={`sidebar-wrapper ${menuOpen ? 'open' : ''}`}>
          <div className="overlay" onClick={closeMenu}></div>
          <aside className="sidebar">
            <div className="sidebar-brand">
              <img src={logo} alt="Abarrotes Digitales" className="sidebar-logo" />
            </div>
            
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">{getInitials(userName)}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{userName}</div>
                <div className="sidebar-user-role">{getRoleLabel(userRole)}</div>
              </div>
            </div>
            
            <div className="nav-section-label">
              <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', letterSpacing: '1px' }}>MENU PRINCIPAL</small>
            </div>

            <Link to="/" className={`nav-link ${isActive('/')}`} onClick={closeMenu}>
              <i className="bi bi-cart4"></i> <span>Venta</span>
            </Link>
            
            <div className="nav-section-label">
              <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', letterSpacing: '1px' }}>GESTION</small>
            </div>

            <Link to="/productos" className={`nav-link ${isActive('/productos')}`} onClick={closeMenu}>
              <i className="bi bi-box-seam"></i> <span>Productos</span>
            </Link>

            <Link to="/pedidos" className={`nav-link ${isActive('/pedidos')}`} onClick={closeMenu}>
              <i className="bi bi-cart-check"></i> <span>Pedidos</span>
            </Link>
            
            <div className="nav-section-label">
              <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', letterSpacing: '1px' }}>FINANZAS</small>
            </div>

            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`} onClick={closeMenu}>
              <i className="bi bi-graph-up"></i> <span>Dashboard</span>
            </Link>

            <Link to="/caja" className={`nav-link ${isActive('/caja')}`} onClick={closeMenu}>
              <i className="bi bi-cash-stack"></i> <span>Caja</span>
            </Link>
            
            <div className="nav-section-label">
              <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', letterSpacing: '1px' }}>SISTEMA</small>
            </div>

            <Link to="/perfil" className={`nav-link ${isActive('/perfil')}`} onClick={closeMenu}>
              <i className="bi bi-person-circle"></i> <span>Mi Perfil</span>
            </Link>

            <Link to="/configuracion" className={`nav-link ${isActive('/configuracion')}`} onClick={closeMenu}>
              <i className="bi bi-gear"></i> <span>Configuracion</span>
            </Link>

            <div className="sidebar-footer">
              <small>v1.0.0</small>
            </div>
          </aside>
        </div>
      )}

      <main className={isPOSPage && isMobile ? "content-area pos-full" : "content-area"}>
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
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/*" element={
          <ProtectedRoute>
            <AppContent />
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
