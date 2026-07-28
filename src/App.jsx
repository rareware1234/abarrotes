import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EmpresaProvider, useEmpresa } from './context/EmpresaContext';
import { InicioAvatar } from './components/inicio/shared';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute, RoleProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { isModuleVisible } from './lib/empresaTheme';
import POSPill from './components/POSPill';
import Login from './pages/Login';
import CambioPassword from './pages/CambioPassword';
import './App.css';

// Lazy: solo se descarga la página cuando el usuario la navega
const Venta         = lazy(() => import('./pages/Venta'));
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const Products      = lazy(() => import('./pages/Products'));
const Orders        = lazy(() => import('./pages/Orders'));
const Caja          = lazy(() => import('./pages/Caja'));
const PantallaCliente = lazy(() => import('./pages/PantallaCliente'));
const PerfilEmpleado  = lazy(() => import('./pages/PerfilEmpleado'));
const Tiendas       = lazy(() => import('./pages/Tiendas'));
const Empleados     = lazy(() => import('./pages/Empleados'));
const Turnos        = lazy(() => import('./pages/Turnos'));
const Tareas        = lazy(() => import('./pages/Tareas'));
const Promociones   = lazy(() => import('./pages/Promociones'));
const Creditos      = lazy(() => import('./pages/Creditos'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const Proveedores   = lazy(() => import('./pages/Proveedores'));
const CotizarSucursal = lazy(() => import('./pages/CotizarSucursal'));
const Empresas      = lazy(() => import('./pages/Empresas'));
const Pagos         = lazy(() => import('./pages/Pagos'));
const VentaDetalles = lazy(() => import('./pages/VentaDetalles'));
const Buscar        = lazy(() => import('./pages/Buscar'));
const PortalEmpresa = lazy(() => import('./pages/PortalEmpresa'));

const MENU_TITLES = {
  '/': 'Venta',
  '/caja': 'Caja',
  '/productos': 'Productos',
  '/pedidos': 'Pedidos',
  '/tareas': 'Tareas',
  '/empleados': 'Staff',
  '/tiendas': 'Sucursales',
  '/turnos': 'Horarios',
  '/creditos': 'Crédito',
  '/dashboard': 'Inicio',
  '/promociones': 'Promociones',
  '/perfil': 'Mi Perfil',
  '/configuracion': 'Configuración',
  '/proveedores': 'Proveedores',
  '/inventario': 'Inventario',
  '/cotizar': 'Cotizar Sucursal',
  '/empresas': 'Empresas',
  '/pagos': 'Pagos',
  '/buscar': 'Buscar'
};

const SIDEBAR_CONFIG = {
  TOP: [
    { path: '/buscar',     label: 'Buscar',     icon: 'bi-search',               permiso: null },
    { path: '/dashboard',  label: 'Inicio',     icon: 'bi-house-door-fill',      permiso: 'reportes' },
    { path: '/productos',  label: 'Productos',  icon: 'bi-box-seam-fill',         permiso: 'productos_ver', moduleId: 'products' },
    { path: '/tiendas',    label: 'Sucursales', icon: 'bi-buildings-fill',        permiso: 'tiendas_ver', moduleId: 'tiendas' },
    { path: '/tareas',     label: 'Tareas',     icon: 'bi-check2-square',         permiso: 'tareas_ver', moduleId: 'tareas' },
  ],
  VENTAS: [
    { path: '/pedidos',    label: 'Pedidos',    icon: 'bi-clipboard-check-fill',  permiso: 'ventas', moduleId: 'orders' },
    { path: '/pagos',      label: 'Pagos',      icon: 'bi-exclamation-circle-fill', permiso: 'ventas', moduleId: 'pagos' },
  ],
  EQUIPO: [
    { path: '/empleados',  label: 'Staff',      icon: 'bi-people-fill',           permiso: 'empleados_ver', moduleId: 'empleados' },
    { path: '/turnos',     label: 'Horarios',   icon: 'bi-calendar-week',         permiso: 'turnos_ver', moduleId: 'horarios' },
  ],
  CRECIMIENTO: [
    { path: '/promociones', label: 'Promociones', icon: 'bi-tag-fill',            permiso: 'promociones_ver', moduleId: 'promociones' },
    { path: '/creditos',    label: 'Crédito',     icon: 'bi-credit-card-2-front-fill', permiso: 'creditos_aprobar', moduleId: 'creditos' },
  ],
  SISTEMA: [
    { path: '/empresas',      label: 'Empresas',      icon: 'bi-building-fill', permiso: 'configuracion', soloRoles: ['admin'] },
    { path: '/configuracion', label: 'Configuración', icon: 'bi-gear-fill',     permiso: 'configuracion' },
  ],
};

function SidebarItem({ path, label, icon, permiso, moduleId, isActive, onClick }) {
  const { hasPermission, empleado } = useAuth();
  const { empresaActiva } = useEmpresa();
  if (permiso && !hasPermission(permiso)) return null;
  if (moduleId && !isModuleVisible(moduleId, empleado?.rol, empresaActiva)) return null;

  return (
    <Link to={path} className={`nav-link ${isActive}`} onClick={onClick}>
      <i className={icon}></i> <span>{label}</span>
    </Link>
  );
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { empleado, signOut, roleTheme, hasPermission } = useAuth();
  const { setRequestPicker } = useEmpresa();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showPOS, setShowPOS] = useState(false);
  const [closingPOS, setClosingPOS] = useState(false);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => window.innerHeight >= screen.height - 10);
  const [isAtTop, setIsAtTop] = useState(true);
  const contentRef = useRef(null);

  const handleClosePOS = () => {
    setClosingPOS(true);
    setTimeout(() => { setShowPOS(false); setClosingPOS(false); }, 320);
  };
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 992);

  // Prefetch all page chunks ~2s after mount so subsequent navigation is instant
  useEffect(() => {
    const t = setTimeout(() => {
      import('./pages/Products');
      import('./pages/Orders');
      import('./pages/Pagos');
      import('./pages/Tiendas');
      import('./pages/Tareas');
      import('./pages/Empleados');
      import('./pages/Turnos');
      import('./pages/Promociones');
      import('./pages/Creditos');
      import('./pages/Proveedores');
      import('./pages/Venta');
      import('./pages/Caja');
      import('./pages/PerfilEmpleado');
      import('./pages/Configuracion');
      import('./pages/Buscar');
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth >= 1024) setMenuOpen(false);
      setIsFullscreen(window.innerHeight >= screen.height - 10);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handler = () => setIsAtTop(el.scrollTop <= 12);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
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

  // Icono "sidebar.leading" — mismo glifo que el botón de ocultar barra
  // en iPad/macOS (rectángulo con panel lateral izquierdo marcado).
  const SidebarIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5"/>
      <line x1="9" y1="4.5" x2="9" y2="19.5"/>
    </svg>
  );

  const ROLE_LABELS = { staff: 'Staff', manager: 'Manager', admin: 'Admin' };
  const roleLabel = ROLE_LABELS[empleado?.rol] || 'Empleado';

  const canAddProduct = hasPermission('productos_agregar') || hasPermission('productos_editar');
  const canAddEmpleado = hasPermission('empleados_crear') || hasPermission('empleados_editar');

  const { empresaActiva } = useEmpresa();
  const renderSidebarSection = (title, items) => {
    const visibleItems = items.filter(item =>
      (!item.permiso || hasPermission(item.permiso)) &&
      (!item.soloRoles || item.soloRoles.includes(empleado?.rol)) &&
      (!item.moduleId || isModuleVisible(item.moduleId, empleado?.rol, empresaActiva))
    );
    if (visibleItems.length === 0) return null;
    return (
      <>
        {title && (
          <div className="nav-section-label">
            <small style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>{title}</small>
          </div>
        )}
        {visibleItems.map(item => (
          <SidebarItem key={item.path} {...item} isActive={isActive(item.path)} onClick={closeMenu} />
        ))}
      </>
    );
  };

  const sidebarContent = (
    <>
      <div className="sidebar-top">
        <button
          className="sidebar-toggle"
          onClick={() => (isMobile ? closeMenu() : setCollapsed(true))}
          aria-label="Ocultar barra"
        >
          <SidebarIcon />
        </button>
      </div>

      <nav className="sidebar-nav">
        {renderSidebarSection(null, SIDEBAR_CONFIG.TOP)}
        {renderSidebarSection('Ventas', SIDEBAR_CONFIG.VENTAS)}
        {renderSidebarSection('Equipo', SIDEBAR_CONFIG.EQUIPO)}
        {renderSidebarSection('Crecimiento', SIDEBAR_CONFIG.CRECIMIENTO)}
        {renderSidebarSection('Sistema', SIDEBAR_CONFIG.SISTEMA)}
      </nav>

      {empleado && (
        <>
          <button
            className="sidebar-user"
            onClick={() => setShowAccountSheet(s => !s)}
          >
            <InicioAvatar empleado={empleado} size={36} style={{ backgroundColor: 'var(--role-primary)' }} />
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{empleado.nombre}</div>
              <div className="sidebar-user-role">{roleLabel}</div>
            </div>
            <i className="bi bi-chevron-up" style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginLeft:'auto', transform: showAccountSheet ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }} />
          </button>

          {showAccountSheet && (
            <>
              <div style={{ position:'fixed', inset:0, zIndex:1102 }} onClick={() => setShowAccountSheet(false)} />
              <div style={{
                position:'fixed', bottom:64, left:0, width:260,
                background:'rgba(20,20,22,0.97)', backdropFilter:'blur(20px)',
                WebkitBackdropFilter:'blur(20px)',
                borderTop:'1px solid rgba(255,255,255,0.1)',
                borderRadius:'12px 12px 0 0', padding:'20px 16px 16px',
                zIndex:1103, display:'flex', flexDirection:'column', gap:4,
              }}>
              {/* Identity strip */}
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12, paddingBottom:12, borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
                <InicioAvatar empleado={empleado} size={44} style={{ backgroundColor:'var(--role-primary)', flexShrink:0 }} />
                <div>
                  <div style={{ fontWeight:700, color:'white', fontSize:14 }}>{empleado.nombre}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', marginTop:2 }}>{empleado.email || `N° ${empleado.numEmpleado}`}</div>
                  <div style={{ fontSize:10, color:'var(--role-primary,#1A7A48)', fontWeight:700, marginTop:2, textTransform:'uppercase', letterSpacing:0.5 }}>{roleLabel}</div>
                </div>
              </div>

              {[
                { icon:'bi-person-circle', label:'Mi Perfil', action:() => { navigate('/perfil'); setShowAccountSheet(false); closeMenu(); } },
                { icon:'bi-gear-fill', label:'Configuración', action:() => { navigate('/configuracion'); setShowAccountSheet(false); closeMenu(); } },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'rgba(255,255,255,0.06)', border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:500, cursor:'pointer', textAlign:'left' }}>
                  <i className={`bi ${item.icon}`} style={{ fontSize:15, width:20, textAlign:'center', color:'rgba(255,255,255,0.7)' }} />
                  {item.label}
                </button>
              ))}

              {empleado.rol === 'admin' && (
                <button onClick={() => { setRequestPicker(true); setShowAccountSheet(false); closeMenu(); }}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'rgba(255,255,255,0.06)', border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:500, cursor:'pointer', textAlign:'left' }}>
                  <i className="bi bi-building" style={{ fontSize:15, width:20, textAlign:'center', color:'rgba(255,255,255,0.7)' }} />
                  Cambiar empresa
                </button>
              )}

              <button onClick={async () => { setShowAccountSheet(false); closeMenu(); await signOut(); }}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, color:'#EF4444', fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left', marginTop:4 }}>
                <i className="bi bi-box-arrow-right" style={{ fontSize:15, width:20, textAlign:'center' }} />
                Cerrar Sesión
              </button>
            </div>
            </>
          )}
        </>
      )}
    </>
  );

  return (
    <div className={`app${collapsed ? ' sidebar-collapsed' : ''}${menuOpen ? ' sidebar-menu-open' : ''}${isFullscreen ? ' is-fullscreen' : ''}${isAtTop ? ' is-at-top' : ''}`}>
      {/* Mobile: barra fija con botón + título de página en la misma línea */}
      <div className="mobile-topbar">
        <button className="mobile-topbar-btn" onClick={toggleMenu} aria-label="Mostrar barra">
          <SidebarIcon />
        </button>
        <span className="mobile-topbar-title">{getPageTitle()}</span>
      </div>
      {/* Desktop: botón flotante solo cuando el sidebar está colapsado */}
      <button
        className="sidebar-reopen"
        onClick={() => setCollapsed(false)}
        aria-label="Mostrar barra"
      >
        <SidebarIcon />
      </button>

      <div className={`sidebar-wrapper ${menuOpen ? 'open' : ''}`}>
        <div className="overlay" onClick={closeMenu}></div>
        <aside className="sidebar">
          {sidebarContent}
        </aside>
      </div>

      <main className="content-area" ref={contentRef}>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<RoleProtectedRoute requiredPermission="reportes"><Dashboard /></RoleProtectedRoute>} />
            <Route path="/productos" element={<RoleProtectedRoute requiredPermission="productos_ver"><Products /></RoleProtectedRoute>} />
            <Route path="/pedidos" element={<Orders />} />
            <Route path="/pagos" element={<Pagos />} />
            <Route path="/caja" element={<Caja />} />
            <Route path="/empleados" element={<RoleProtectedRoute requiredPermission="empleados_ver"><Empleados /></RoleProtectedRoute>} />
            <Route path="/tiendas" element={<RoleProtectedRoute requiredPermission="tiendas_ver"><Tiendas /></RoleProtectedRoute>} />
            <Route path="/turnos" element={<RoleProtectedRoute requiredPermission="turnos_ver"><Turnos /></RoleProtectedRoute>} />
            <Route path="/tareas" element={<Tareas />} />
            <Route path="/promociones" element={<RoleProtectedRoute requiredPermission="promociones_ver"><Promociones /></RoleProtectedRoute>} />
            <Route path="/creditos" element={<RoleProtectedRoute requiredPermission="creditos_aprobar"><Creditos /></RoleProtectedRoute>} />
            <Route path="/proveedores" element={<RoleProtectedRoute requiredPermission="productos_ver"><Proveedores /></RoleProtectedRoute>} />
            <Route path="/cotizar" element={<RoleProtectedRoute requiredPermission="tiendas_ver"><CotizarSucursal /></RoleProtectedRoute>} />
            <Route path="/empresas" element={<RoleProtectedRoute requiredPermission="configuracion"><Empresas /></RoleProtectedRoute>} />
            <Route path="/perfil" element={<PerfilEmpleado />} />
            <Route path="/configuracion" element={<RoleProtectedRoute requiredPermission="configuracion"><Configuracion /></RoleProtectedRoute>} />
            <Route path="/buscar" element={<Buscar />} />
            <Route path="/cambiar-password" element={<CambioPassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {!showPOS && (
        <POSPill onClick={() => setShowPOS(true)} />
      )}

      {showPOS && (
        <div className={`pos-sheet${closingPOS ? ' pos-sheet-closing' : ''}`}>
          <button className="pos-sheet-close-btn" onClick={handleClosePOS} aria-label="Cerrar punto de venta">
            <svg viewBox="0 0 10 10" width="9" height="9" fill="none">
              <path d="M2 2 L8 8 M8 2 L2 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="content-area">
            <Suspense fallback={null}>
              <Venta />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Gate de empresa — port de ContentView.swift: un admin ve el portal de
 * selección de empresa al entrar (una vez por sesión); el resto va directo
 * a la app. Cualquier vista puede pedir reabrir el portal vía
 * `EmpresaContext.setRequestPicker(true)` ("cambiar empresa").
 */
// Clave que recuerda que ESTE admin ya eligió empresa (atada a su uid) — así el
// portal solo sale al iniciar sesión la 1ª vez; luego persiste entre recargas y
// solo se reabre desde "Cambiar empresa" (ficha de contacto → requestPicker).
const PORTAL_ELEGIDA_KEY = 'empresa.portal.uid.v1';

function EmpresaGate() {
  const { empleado } = useAuth();
  const { requestPicker, setRequestPicker } = useEmpresa();
  const isAdmin = empleado?.rol === 'admin';

  const [empresaElegida, setEmpresaElegida] = useState(() => {
    try { return !!empleado?.uid && localStorage.getItem(PORTAL_ELEGIDA_KEY) === empleado.uid; }
    catch { return false; }
  });

  // Al reabrir el portal desde "Cambiar empresa".
  useEffect(() => {
    if (requestPicker) { setEmpresaElegida(false); setRequestPicker(false); }
  }, [requestPicker, setRequestPicker]);

  // Si cambia el admin logueado (otro uid en este equipo), reevaluar.
  useEffect(() => {
    try { setEmpresaElegida(!!empleado?.uid && localStorage.getItem(PORTAL_ELEGIDA_KEY) === empleado.uid); }
    catch { setEmpresaElegida(false); }
  }, [empleado?.uid]);

  const handleElegida = () => {
    try { if (empleado?.uid) localStorage.setItem(PORTAL_ELEGIDA_KEY, empleado.uid); } catch { /* ignore */ }
    setEmpresaElegida(true);
  };

  if (isAdmin && !empresaElegida) {
    return (
      <Suspense fallback={null}>
        <PortalEmpresa onSelect={handleElegida} />
      </Suspense>
    );
  }
  return <AppLayout />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <EmpresaProvider>
          <CartProvider>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/pantalla-cliente" element={<PantallaCliente />} />
                <Route path="/venta-detalles" element={<VentaDetalles />} />
                <Route path="/*" element={<ProtectedRoute><EmpresaGate /></ProtectedRoute>} />
              </Routes>
            </Suspense>
          </CartProvider>
        </EmpresaProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;