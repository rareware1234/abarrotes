import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoBlanco from '../assets/logo-blanco.png';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement,
  Filler, Tooltip, Legend,
} from 'chart.js';
import { useInicioData } from '../hooks/useInicioData';
import { VentasHoyCard, VentasMesCard, BalanceCard, MetodosPagoCard, MetaMesCard, VentasMesPasadoCard, Tendencia6MesesCard } from '../components/inicio/VentasCards';
import { FormatosCard, EstadosCard, TopTiendasCard, PeoresTiendasCard, SucursalDelMesCard } from '../components/inicio/SucursalesCards';
import { MasVendidosCard, MenosVendidosCard } from '../components/inicio/ProductosCards';
import { TopEmpleadosCard, AlertaStaffCard, EmpleadoDelMesCard } from '../components/inicio/StaffCards';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement,
  Filler, Tooltip, Legend,
);

/** Carrusel horizontal con page-dots que reflejan la tarjeta centrada. */
function Carousel({ children, tight = false }) {
  const ref = useRef(null);
  const [index, setIndex] = useState(0);
  const count = React.Children.count(children);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const first = el.firstElementChild;
    if (!first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap || 16) || 16;
    const step = first.offsetWidth + gap;
    setIndex(Math.round(el.scrollLeft / step));
  };

  return (
    <>
      <div ref={ref} className={`inicio-carousel${tight ? ' inicio-carousel--tight' : ''}`} onScroll={onScroll}>
        {children}
      </div>
      {count > 1 && (
        <div className="inicio-dots">
          {Array.from({ length: count }).map((_, i) => (
            <span key={i} className={`inicio-dot${i === index ? ' active' : ''}`} />
          ))}
        </div>
      )}
    </>
  );
}

function Section({ title, to, children, tight }) {
  const navigate = useNavigate();
  return (
    <section className="inicio-section">
      <div
        className="inicio-section-head"
        onClick={() => to && navigate(to)}
        style={to ? { cursor: 'pointer' } : undefined}
      >
        <h2>{title}</h2>
        {to && <i className="bi bi-chevron-right" />}
      </div>
      <Carousel tight={tight}>{children}</Carousel>
    </section>
  );
}

const Dashboard = () => {
  const d = useInicioData();
  const navigate = useNavigate();
  const { empleado, roleTheme } = useAuth();
  const [selectedCard, setSelectedCard] = useState(null); // { key, gradient, title }

  const initial = empleado?.nombre ? empleado.nombre.charAt(0).toUpperCase() : '?';

  useEffect(() => {
    const appEl = document.querySelector('.app');
    if (!appEl) return;
    appEl.style.background = selectedCard?.gradient || '';
    return () => { appEl.style.background = ''; };
  }, [selectedCard]);

  const openCard = (key, gradient, title) => setSelectedCard({ key, gradient, title });
  const closeCard = () => setSelectedCard(null);

  const renderDetailContent = (key) => {
    switch (key) {
      case 'ventas-hoy':       return <VentasHoyCard {...d} />;
      case 'ventas-mes':       return <VentasMesCard {...d} />;
      case 'ventas-mes-pasado':return <VentasMesPasadoCard {...d} />;
      case 'tendencia':        return <Tendencia6MesesCard {...d} />;
      case 'balance':          return <BalanceCard {...d} />;
      case 'metodos-pago':     return <MetodosPagoCard {...d} />;
      case 'meta-mes':         return <MetaMesCard {...d} />;
      case 'formatos':         return <FormatosCard {...d} />;
      case 'estados':          return <EstadosCard {...d} />;
      case 'top-tiendas':      return <TopTiendasCard {...d} />;
      case 'peores-tiendas':   return <PeoresTiendasCard {...d} />;
      case 'sucursal-del-mes': return <SucursalDelMesCard {...d} />;
      case 'mas-vendidos':     return <MasVendidosCard {...d} />;
      case 'menos-vendidos':   return <MenosVendidosCard {...d} />;
      case 'empleado-del-mes': return <EmpleadoDelMesCard {...d} />;
      case 'top-empleados':    return <TopEmpleadosCard {...d} />;
      case 'alerta-staff':     return <AlertaStaffCard {...d} />;
      default: return null;
    }
  };

  return (
    <div className={`inicio-page${selectedCard ? ' inicio-card-open' : ''}`}>
      <div className="inicio-inner">
        {selectedCard ? (
          <>
            {/* ── Hero del card seleccionado ── */}
            <div className="inicio-card-detail-hero" style={{ background: selectedCard.gradient }}>
              <img src={logoBlanco} alt="" className="tb-formato-hero-watermark" />
              <button className="tb-hero-back" onClick={closeCard} style={{ color: 'rgba(255,255,255,0.9)' }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
              </button>
              <div style={{ marginTop: 20, fontSize: 28, fontWeight: 800, color: 'rgba(255,255,255,0.97)', lineHeight: 1.2 }}>
                {selectedCard.title}
              </div>
            </div>
            {/* ── Contenido del card a pantalla completa ── */}
            <div className="inicio-card-detail-body">
              {renderDetailContent(selectedCard.key)}
            </div>
          </>
        ) : (
          <>
            <header className="inicio-header">
              <h1>Inicio</h1>
            </header>

            {d.loading ? (
              <div className="inicio-spinner" />
            ) : (
              <>
                <Section title="Ventas" to="/pedidos">
                  <VentasHoyCard {...d} onCardClick={(g) => openCard('ventas-hoy', g, 'Hoy')} />
                  <VentasMesCard {...d} onCardClick={(g) => openCard('ventas-mes', g, 'Mes')} />
                  <VentasMesPasadoCard {...d} onCardClick={(g) => openCard('ventas-mes-pasado', g, 'Mes anterior')} />
                  <Tendencia6MesesCard {...d} onCardClick={(g) => openCard('tendencia', g, 'Tendencia 6 meses')} />
                  <BalanceCard {...d} onCardClick={(g) => openCard('balance', g, 'Balance')} />
                  <MetodosPagoCard {...d} onCardClick={(g) => openCard('metodos-pago', g, 'Métodos de pago')} />
                  <MetaMesCard {...d} onCardClick={(g) => openCard('meta-mes', g, 'Meta del mes')} />
                </Section>

                <Section title="Sucursales" to="/tiendas" tight>
                  <SucursalDelMesCard {...d} onCardClick={(g) => openCard('sucursal-del-mes', g, 'Sucursal del Mes')} />
                  <FormatosCard {...d} onCardClick={(g) => openCard('formatos', g, 'Formatos')} />
                  <EstadosCard {...d} onCardClick={(g) => openCard('estados', g, 'Estados')} />
                  <TopTiendasCard {...d} onCardClick={(g) => openCard('top-tiendas', g, 'Mejor desempeño')} />
                  <PeoresTiendasCard {...d} onCardClick={(g) => openCard('peores-tiendas', g, 'Peor desempeño')} />
                </Section>

                <Section title="Productos" to="/productos" tight>
                  <MasVendidosCard {...d} onCardClick={(g) => openCard('mas-vendidos', g, 'Más vendidos')} />
                  <MenosVendidosCard {...d} onCardClick={(g) => openCard('menos-vendidos', g, 'Menos vendidos')} />
                </Section>

                <Section title="Staff" to="/empleados" tight>
                  <EmpleadoDelMesCard {...d} onCardClick={(g) => openCard('empleado-del-mes', g, 'Empleado del Mes')} />
                  <TopEmpleadosCard {...d} onCardClick={(g) => openCard('top-empleados', g, 'Top empleados')} />
                  <AlertaStaffCard {...d} onCardClick={(g) => openCard('alerta-staff', g, 'Alerta staff')} />
                </Section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
