import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active bg-primary text-white' : '';
  };

  return (
    <nav className="nav flex-column sidebar">
      <div className="mb-4" style={{ display: 'flex', justifyContent: 'center', margin: '0 -20px' }}>
        <img 
          src={logo} 
          alt="Logo" 
          style={{ 
            width: '280px', 
            height: 'auto', 
            objectFit: 'contain',
            filter: 'brightness(0) invert(1) drop-shadow(0px 2px 4px rgba(0, 98, 65, 0.5))'
          }} 
        />
      </div>
      
      <div className="mb-3">
        <small className="text-uppercase opacity-75 text-white" style={{ fontSize: '0.85rem' }}>Menú Principal</small>
      </div>

      <Link to="/" className={`nav-link rounded mb-2 ${isActive('/')}`}>
        <i className="bi bi-speedometer2 me-2"></i> Dashboard
      </Link>
      
      <div className="mb-3 mt-4">
        <small className="text-uppercase opacity-75 text-white" style={{ fontSize: '0.85rem' }}>Gestión</small>
      </div>

      <Link to="/productos" className={`nav-link rounded mb-2 ${isActive('/productos')}`}>
        <i className="bi bi-box-seam me-2"></i> Productos
      </Link>
      
      <Link to="/inventario" className={`nav-link rounded mb-2 ${isActive('/inventario')}`}>
        <i className="bi bi-stack me-2"></i> Inventario
      </Link>
      
      <Link to="/pedidos" className={`nav-link rounded mb-2 ${isActive('/pedidos')}`}>
        <i className="bi bi-cart-check me-2"></i> Pedidos
      </Link>
      
      <div className="mb-3 mt-4">
        <small className="text-uppercase opacity-75 text-white" style={{ fontSize: '0.85rem' }}>Sistema</small>
      </div>

      <Link to="/configuracion" className={`nav-link rounded mb-2 ${isActive('/configuracion')}`}>
        <i className="bi bi-gear me-2"></i> Configuración
      </Link>

      <div className="mt-auto pt-4">
        <small className="opacity-60 text-white">
          Versión 1.0.0<br/>
          Backend: Activo
        </small>
      </div>
    </nav>
  );
};

export default Navbar;
