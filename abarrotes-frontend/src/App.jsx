import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { RoleProtectedRoute } from './components/ProtectedRoute';
import Venta from './pages/Venta';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Caja from './pages/Caja';
import PantallaCliente from './pages/PantallaCliente';
import PerfilEmpleado from './pages/PerfilEmpleado';
import Login from './pages/Login';
import Tiendas from './pages/Tiendas';
import Empleados from './pages/Empleados';
import Turnos from './pages/Turnos';
import Tareas from './pages/Tareas';
import Promociones from './pages/Promociones';
import Creditos from './pages/Creditos';
import Configuracion from './pages/Configuracion';
import logo from './assets/logo.png';
import './App.css';

const MENU_TITLES = {
  '/': 'Punto de Venta',
  '/productos': 'Productos',
  '/pedidos': 'Pedidos',
  '/dashboard': 'Dashboard',
  '/caja': 'Caja',
  '/perfil': 'Mi Perfil',
  '/configuracion': 'Configuración',
  '/empleados': 'Empleados',
  '/tiendas': 'Tiendas',
  '/turnos': 'Turnos',
  '/tareas': 'Tareas',
  '/promociones': 'Promociones',
  '/creditos': 'Créditos'
};

const SIDEBAR_CONFIG = {
  VENTA: [
    { path: '/', label: 'Punto de Venta', icon: 'bi-cart4', roles: ['staff', 'manager', 'admin'] },
    { path: '/pedidos', label: 'Pedidos', icon: 'bi-cart-check', roles: ['staff', 'manager', 'admin'] }
  ],
  GESTION: [
    { path: '/productos', label: 'Productos', icon: 'bi-box-seam', roles: ['manager', 'admin'] },
    { path: '/empleados', label: 'Empleados', icon: 'bi-people', roles: ['manager', 'admin'] },
    { path: '/tiendas', label: 'Tiendas', icon: 'bi-shop', roles: ['admin'] }
  ],
  FINANZAS: [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-graph-up', roles: ['manager', 'admin'] },
    { path: '/caja', label: 'Caja', icon: 'bi-cash-stack', roles: ['staff', 'manager', 'admin'] },
    { path: '/creditos', label: 'Créditos', icon: 'bi-credit-card', roles: ['manager', 'admin'] }
  ],
  OPERACION: [
    { path: '/turnos', label: 'Turnos', icon: 'bi-clock', roles: ['manager', 'admin'] },
    { path: '/tareas', label: 'Tareas', icon: 'bi-check2-square', roles: ['staff', 'manager', 'admin'] },
    { path: '/promociones', label: 'Promociones', icon: 'bi-gift', roles: ['manager', 'admin'] }
  ],
  SISTEMA: [
    { path: '/perfil', label: 'Mi Perfil', icon: 'bi-person-circle', roles: ['staff', 'manager', 'admin'] },
    { path: '/configuracion', label: 'Configuración', icon: 'bi-gear', roles: ['admin'] }
  ]
};

function SidebarItem({ path, label, icon, isActive, onClick, rolActual }) {
  const { hasPermission } = useAuth();
  
  const permisosPath = {
    '/': 'ventas',
    '/pedidos': 'ventas',
    '/productos': 'productos_ver',
    '/empleados': 'empleados_ver',
    '/tiendas': 'tiendas_ver',
    '/dashboard': 'reportes',
    '/caja': 'caja_consulta',
    '/creditos': 'creditos_ver',
    '/turnos': 'turnos_ver',
    '/tareas': 'tareas_ver',
    '/promociones': 'promociones_ver',
    '/perfil': 'ventas',
    '/configuracion': 'admin'
  };
  
  const permiso = permisosPath[path];
  if (permiso && !hasPermission(permiso)) {
    return null;
  }
  
  return (
    <Link to={path} className={`nav-link ${isActive}`} onClick={onClick}>
      <i className={icon}></i> <span>{label}</span>
    </Link>
  );
}

function AppContent() {
  const location = useLocation();
  const { empleado, signOut, roleTheme } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 992);

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
  }, [location.pathname]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';
  
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRoleLabel = (rol) => {
    const labels = { staff: 'Staff', manager: 'Manager', admin: 'Administrador' };
    return labels[rol] || 'Empleado';
  };

  const getPageTitle = () => {
    return MENU_TITLES[location.pathname] || 'Abarrotes Digitales';
  };

  const getProfileColor = () => {
    return roleTheme?.primary || '#1A7A48';
  };

  const MenuIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  );

  const LogoutIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  );

  const isPOSPage = location.pathname === '/';
  const profileColor = getProfileColor();

  const renderSidebarSection = (title, items) => (
    items.length > 0 && (
      <>
        <div className="nav-section-label">
          <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', letterSpacing: '1px' }}>{title}</small>
        </div>
        {items.map(item => (
          <SidebarItem
            key={item.path}
            {...item}
            isActive={isActive(item.path)}
            onClick={closeMenu}
            rolActual={empleado?.rol}
          />
        ))}
      </>
    )
  );

  const sidebarContent = (
    <>
      <div className="sidebar-brand">
        <img src={logo} alt="PuntoVerde" className="sidebar-logo" />
      </div>
      
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          {getInitials(empleado?.nombre)}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{empleado?.nombre || 'Usuario'}</div>
          <div className="sidebar-user-role">{getRoleLabel(empleado?.rol)}</div>
        </div>
      </div>

      {renderSidebarSection('VENTAS', SIDEBAR_CONFIG.VENTA)}
      {renderSidebarSection('GESTIÓN', SIDEBAR_CONFIG.GESTION)}
      {renderSidebarSection('FINANZAS', SIDEBAR_CONFIG.FINANZAS)}
      {renderSidebarSection('OPERACIÓN', SIDEBAR_CONFIG.OPERACION)}
      {renderSidebarSection('SISTEMA', SIDEBAR_CONFIG.SISTEMA)}

      <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button 
          className="nav-link" 
          onClick={signOut}
          style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
        >
          <LogoutIcon /> <span>Cerrar Sesión</span>
        </button>
        <small style={{ color: 'rgba(255,255,255,0.4)', display: 'block', textAlign: 'center', marginTop: 8 }}>v2.0.0</small>
      </div>
    </>
  );

  return (
    <div className="app">
      {!isPOSPage && (
        <nav className="navbar">
          <button className="navbar-hamburger" onClick={toggleMenu}>
            <MenuIcon />
          </button>
          <h1 className="navbar-title">{getPageTitle()}</h1>
        </nav>
      )}

      {(isMobile || !isPOSPage) && (
        <div className={`sidebar-wrapper ${menuOpen ? 'open' : ''}`}>
          <div className="overlay" onClick={closeMenu}></div>
          <aside className="sidebar">
            {sidebarContent}
          </aside>
        </div>
      )}

      <main className={isPOSPage && isMobile ? "content-area pos-full" : "content-area"}>
        <Routes>
          <Route path="/" element={<Venta />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/productos" element={<Products />} />
          <Route path="/pedidos" element={<Orders />} />
          <Route path="/caja" element={<Caja />} />
          <Route path="/empleados" element={<Empleados />} />
          <Route path="/tiendas" element={<Tiendas />} />
          <Route path="/turnos" element={<Turnos />} />
          <Route path="/tareas" element={<Tareas />} />
          <Route path="/promociones" element={<Promociones />} />
          <Route path="/creditos" element={
            <RoleProtectedRoute requiredPermission="creditos_aprobar">
              <Creditos />
            </RoleProtectedRoute>
          } />
          <Route path="/perfil" element={<PerfilEmpleado />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/pantalla-cliente" element={<PantallaCliente />} />
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;