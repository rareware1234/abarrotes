import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute, RoleProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import './pages/Tiendas.css';
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
import logo from './assets/logo-solido-blanco.png';
import './App.css';

const MENU_TITLES = {
  '/': 'Venta',
  '/caja': 'Caja',
  '/productos': 'Productos',
  '/pedidos': 'Pedidos',
  '/tareas': 'Tareas',
  '/empleados': 'Empleados',
  '/tiendas': 'Sucursales',
  '/turnos': 'Horarios',
  '/creditos': 'Crédito',
  '/dashboard': 'Dashboard',
  '/promociones': 'Promociones',
  '/perfil': 'Mi Perfil',
  '/configuracion': 'Configuración'
};

const SIDEBAR_CONFIG = {
  VENTAS: [
    { path: '/', label: 'Venta', icon: 'bi-cart-fill', permiso: 'ventas' }
  ],
  INVENTARIO: [
    { path: '/productos', label: 'Productos', icon: 'bi-box-seam-fill', permiso: 'productos_ver' },
    { path: '/pedidos', label: 'Pedidos', icon: 'bi-clipboard-check-fill', permiso: 'ventas' }
  ],
  EQUIPO: [
    { path: '/tareas', label: 'Tareas', icon: 'bi-check2-square', permiso: 'tareas_ver' },
    { path: '/empleados', label: 'Empleados', icon: 'bi-people-fill', permiso: 'empleados_ver' },
    { path: '/tiendas', label: 'Sucursales', icon: 'bi-building', permiso: 'tiendas_ver' },
    { path: '/turnos', label: 'Horarios', icon: 'bi-calendar-week', permiso: 'turnos_ver' }
  ],
  CREDITO: [
    { path: '/creditos', label: 'Crédito', icon: 'bi-credit-card-fill', permiso: 'creditos_aprobar' }
  ],
  ANALISIS: [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-bar-chart-fill', permiso: 'reportes' },
    { path: '/promociones', label: 'Promociones', icon: 'bi-tag-fill', permiso: 'promociones_ver' }
  ],
  SISTEMA: [
    { path: '/configuracion', label: 'Configuración', icon: 'bi-gear-fill', permiso: 'configuracion' },
    { path: '/perfil', label: 'Mi Perfil', icon: 'bi-person-circle', permiso: 'ventas' }
  ]
};

function SidebarItem({ path, label, icon, permiso, isActive, onClick }) {
  const { hasPermission } = useAuth();
  if (permiso && !hasPermission(permiso)) return null;
  
  return (
    <Link to={path} className={`nav-link ${isActive}`} onClick={onClick}>
      <i className={icon}></i> <span>{label}</span>
    </Link>
  );
}

function AppLayout() {
  const location = useLocation();
  const { empleado, signOut, roleTheme, hasPermission } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 992);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Bloquear scroll del contenido cuando el sidebar está abierto
  // Técnica position:fixed — única forma confiable en iOS/iPadOS
  useEffect(() => {
    if (!menuOpen) return;

    const contentArea = document.querySelector('.content-area');
    if (!contentArea) return;

    // Guardar posición actual de scroll
    const scrollTop = contentArea.scrollTop;

    // Fijar el content-area (detiene el scroll nativo en iOS/iPadOS)
    contentArea.style.position = 'fixed';
    contentArea.style.top = `-${scrollTop}px`;
    contentArea.style.left = '0';
    contentArea.style.right = '0';
    contentArea.style.bottom = '0';
    contentArea.style.overflow = 'hidden';

    // Bloquear wheel (trackpad en iPad)
    const preventWheel = (e) => {
      if (e.target.closest('.sidebar')) return;
      e.preventDefault();
    };
    document.addEventListener('wheel', preventWheel, { passive: false });

    return () => {
      // Restaurar estilos y posición de scroll
      contentArea.style.position = '';
      contentArea.style.top = '';
      contentArea.style.left = '';
      contentArea.style.right = '';
      contentArea.style.bottom = '';
      contentArea.style.overflow = '';
      contentArea.scrollTop = scrollTop;
      document.removeEventListener('wheel', preventWheel, { passive: false });
    };
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';
  
  const getPageTitle = () => MENU_TITLES[location.pathname] || 'Punto Verde';

  const profileColor = roleTheme?.primary || '#1A7A48';

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

  const CajaIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <rect x="2" y="6" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  );

  const canAddProduct = hasPermission('productos_agregar') || hasPermission('productos_editar');
  const canAddEmpleado = hasPermission('empleados_crear') || hasPermission('empleados_editar');

  const renderSidebarSection = (title, items) => {
    const visibleItems = items.filter(item => !item.permiso || hasPermission(item.permiso));
    if (visibleItems.length === 0) return null;
    return (
      <>
        <div className="nav-section-label">
          <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', letterSpacing: '1px' }}>{title}</small>
        </div>
        {items.map(item => (
          <SidebarItem key={item.path} {...item} isActive={isActive(item.path)} onClick={closeMenu} />
        ))}
      </>
    );
  };

  const sidebarContent = (
    <>
      <div className="sidebar-brand">
        <img src={logo} alt="PuntoVerde" className="sidebar-logo" />
      </div>
      
      {renderSidebarSection('VENTAS', SIDEBAR_CONFIG.VENTAS)}
      {renderSidebarSection('INVENTARIO', SIDEBAR_CONFIG.INVENTARIO)}
      {renderSidebarSection('EQUIPO', SIDEBAR_CONFIG.EQUIPO)}
      {renderSidebarSection('CRÉDITO', SIDEBAR_CONFIG.CREDITO)}
      {renderSidebarSection('ANÁLISIS', SIDEBAR_CONFIG.ANALISIS)}
      {renderSidebarSection('SISTEMA', SIDEBAR_CONFIG.SISTEMA)}
    </>
  );

  return (
    <div className="app">
      <nav className="navbar">
        <button className="navbar-hamburger" onClick={toggleMenu}>
          <MenuIcon />
        </button>
        <h1 className="navbar-title">{getPageTitle()}</h1>
        {location.pathname === '/' && (
          <button className="navbar-hamburger" onClick={() => window.dispatchEvent(new CustomEvent('open-caja'))}>
            <CajaIcon />
          </button>
        )}
        {location.pathname === '/productos' && canAddProduct && (
          <button className="navbar-hamburger" onClick={() => window.dispatchEvent(new CustomEvent('open-nuevo-producto'))} style={{ fontSize: '24px', fontWeight: 300, lineHeight: 1 }}>
            +
          </button>
        )}
        {location.pathname === '/tareas' && (
          <button className="navbar-hamburger" onClick={() => window.dispatchEvent(new CustomEvent('open-nueva-tarea'))} style={{ fontSize: '24px', fontWeight: 300, lineHeight: 1 }}>
            +
          </button>
        )}
        {location.pathname === '/empleados' && canAddEmpleado && (
          <button className="navbar-hamburger" onClick={() => window.dispatchEvent(new CustomEvent('open-nuevo-empleado'))} style={{ fontSize: '24px', fontWeight: 300, lineHeight: 1 }}>
            +
          </button>
        )}
      </nav>

      <div className={`sidebar-wrapper ${menuOpen ? 'open' : ''}`}>
        <div className="overlay" onClick={closeMenu}></div>
        <aside className="sidebar">
          {sidebarContent}
        </aside>
      </div>

      <main className="content-area">
        <Routes>
          <Route path="/" element={<Venta />} />
          <Route path="/dashboard" element={<RoleProtectedRoute requiredPermission="reportes"><Dashboard /></RoleProtectedRoute>} />
          <Route path="/productos" element={<RoleProtectedRoute requiredPermission="productos_ver"><Products /></RoleProtectedRoute>} />
          <Route path="/pedidos" element={<Orders />} />
          <Route path="/caja" element={<Caja />} />
          <Route path="/empleados" element={<RoleProtectedRoute requiredPermission="empleados_ver"><Empleados /></RoleProtectedRoute>} />
          <Route path="/tiendas" element={<RoleProtectedRoute requiredPermission="tiendas_ver"><Tiendas /></RoleProtectedRoute>} />
          <Route path="/turnos" element={<RoleProtectedRoute requiredPermission="turnos_ver"><Turnos /></RoleProtectedRoute>} />
          <Route path="/tareas" element={<Tareas />} />
          <Route path="/promociones" element={<RoleProtectedRoute requiredPermission="promociones_ver"><Promociones /></RoleProtectedRoute>} />
          <Route path="/creditos" element={<RoleProtectedRoute requiredPermission="creditos_aprobar"><Creditos /></RoleProtectedRoute>} />
          <Route path="/perfil" element={<PerfilEmpleado />} />
          <Route path="/configuracion" element={<RoleProtectedRoute requiredPermission="configuracion"><Configuracion /></RoleProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
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
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/pantalla-cliente" element={<PantallaCliente />} />
            <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;