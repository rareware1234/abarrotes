import { Link, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiPackage, FiClipboard, FiBarChart2, FiDollarSign, FiTag, FiUser, FiLogOut } from 'react-icons/fi';
import logo from '../assets/logo.png';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const navItem = (to, icon, label) => (
    <Link to={to} className={`nav-link ${isActive(to)}`}>
      {icon}
      {label}
    </Link>
  );

  const userInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase();
  };

  const mockUser = { name: 'Juan García', role: 'Lider', roleColor: '#3B82F6' };

  return (
    <nav className="nav flex-column sidebar">
      <div className="sidebar-brand">
        <img
          src={logo}
          alt="Logo"
          className="sidebar-logo"
        />
      </div>

      <div className="mb-3">
        <small className="nav-section-label">Menú Principal</small>
      </div>

      {navItem('/', <FiShoppingCart size={18} />, 'Venta')}

      <div className="mb-3 mt-4">
        <small className="nav-section-label">Gestión</small>
      </div>

      {navItem('/productos', <FiPackage size={18} />, 'Productos')}
      {navItem('/inventario', <FiPackage size={18} />, 'Inventario')}
      {navItem('/pedidos', <FiClipboard size={18} />, 'Pedidos')}

      <div className="mb-3 mt-4">
        <small className="nav-section-label">Finanzas</small>
      </div>

      {navItem('/dashboard', <FiBarChart2 size={18} />, 'Dashboard')}
      {navItem('/caja', <FiDollarSign size={18} />, 'Caja')}

      <div className="mb-3 mt-4">
        <small className="nav-section-label">Sistema</small>
      </div>

      {navItem('/promociones', <FiTag size={18} />, 'Promociones')}
      {navItem('/configuracion', <FiUser size={18} />, 'Configuración')}
      {navItem('/perfil', <FiUser size={18} />, 'Mi Perfil')}

      <div className="sidebar-user">
        <div
          className="sidebar-user-avatar"
          style={{ color: mockUser.roleColor, background: `${mockUser.roleColor}22` }}
        >
          {userInitials(mockUser.name)}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{mockUser.name}</div>
          <div className="sidebar-user-role" style={{ color: mockUser.roleColor }}>{mockUser.role}</div>
        </div>
        <button className="btn btn-link p-0 border-0" style={{ color: '#6B7C93', marginLeft: 'auto' }}>
          <FiLogOut size={16} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
