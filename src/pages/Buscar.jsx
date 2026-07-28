import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import './Buscar.css';

import proveedoresIcon from '../assets/search-icons/proveedores_color.svg';
import staffIcon       from '../assets/search-icons/staff_color.svg';
import horariosIcon    from '../assets/search-icons/horarios_color.svg';
import creditoIcon     from '../assets/search-icons/credito_color.svg';
import promocionesIcon from '../assets/search-icons/promociones_color.svg';

const CATEGORIAS = [
  {
    label: 'Proveedores',
    path: '/proveedores',
    permiso: 'productos_ver',
    icon: proveedoresIcon,
    gradient: 'linear-gradient(135deg, #F28C33 0%, #E64D33 100%)',
    shadow: 'rgba(242,140,51,0.35)',
  },
  {
    label: 'Staff',
    path: '/empleados',
    permiso: 'empleados_ver',
    icon: staffIcon,
    gradient: 'linear-gradient(135deg, #3372D9 0%, #5933BE 100%)',
    shadow: 'rgba(51,114,217,0.35)',
  },
  {
    label: 'Horarios',
    path: '/turnos',
    permiso: 'turnos_ver',
    icon: horariosIcon,
    gradient: 'linear-gradient(135deg, #26A6B2 0%, #1A73C0 100%)',
    shadow: 'rgba(38,166,178,0.35)',
  },
  {
    label: 'Crédito',
    path: '/creditos',
    permiso: 'creditos_aprobar',
    icon: creditoIcon,
    gradient: 'linear-gradient(135deg, #F2B233 0%, #E67326 100%)',
    shadow: 'rgba(242,178,51,0.35)',
  },
  {
    label: 'Promociones',
    path: '/promociones',
    permiso: 'promociones_ver',
    icon: promocionesIcon,
    gradient: 'linear-gradient(135deg, #EB40A6 0%, #FF8C66 100%)',
    shadow: 'rgba(235,64,166,0.35)',
  },
];

export default function Buscar() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const categorias = CATEGORIAS.filter(c => !c.permiso || hasPermission(c.permiso));

  // Auto-focus la barra en desktop
  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    if (!isMobile) inputRef.current?.focus();
  }, []);

  const handleCardTap = (path) => navigate(path);

  return (
    <div className="buscar-page">
      <div className="inicio-inner">
        <PageHeader title="Buscar" />

        <div className="buscar-search-bar">
          <svg className="buscar-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            className="buscar-search-input"
            type="search"
            placeholder="Productos, marcas, códigos..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="buscar-grid">
          {categorias.map(cat => (
            <button
              key={cat.path}
              className="buscar-card"
              style={{ background: cat.gradient, '--card-shadow': cat.shadow }}
              onClick={() => handleCardTap(cat.path)}
            >
              <img
                className="buscar-card-icon"
                src={cat.icon}
                alt=""
                draggable={false}
              />
              <span className="buscar-card-label">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>{/* /inicio-inner */}
    </div>
  );
}
