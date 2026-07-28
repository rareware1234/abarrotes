import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useNavigate } from 'react-router-dom';

const normalizeMarca = (s) =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();


const BRAND_GRADIENTS = [
  ['rgb(51,115,217)', 'rgb(26,64,166)'],
  ['rgb(217,89,140)', 'rgb(153,51,115)'],
  ['rgb(51,166,140)', 'rgb(20,102,89)'],
  ['rgb(242,140,51)', 'rgb(179,77,26)'],
  ['rgb(140,89,217)', 'rgb(77,38,166)'],
  ['rgb(77,166,77)', 'rgb(26,102,38)'],
  ['rgb(204,77,77)', 'rgb(140,38,51)'],
  ['rgb(89,140,191)', 'rgb(38,77,128)'],
];
const brandGradient = (seed) => {
  const [a, b] = BRAND_GRADIENTS[Math.abs(seed) % BRAND_GRADIENTS.length];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
};

function BrandCard({ nombre, seed, logo, firebaseGradient, onClick }) {
  const [hovered, setHovered] = useState(false);
  const gradient = firebaseGradient ?? brandGradient(seed);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: '0 0 auto',
        width: 300, height: 188,
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.18)',
        background: gradient ?? 'rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 18, cursor: 'pointer', overflow: 'hidden',
        outline: 'none',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.15s ease',
      }}
    >
      {logo
        ? <img src={logo} alt={nombre} style={{ maxWidth: '80%', maxHeight: '64%', objectFit: 'contain' }} />
        : <span style={{
            fontSize: 26, fontWeight: 800, color: 'rgba(255,255,255,0.9)',
            textAlign: 'center', lineHeight: 1.1,
          }}>
            {nombre}
          </span>
      }
    </button>
  );
}

function SectionRow({ title, count, items, onSeeAll, onCardClick, logoFor, gradientFor, seedFor }) {
  return (
    <div style={{ marginBottom: 32 }}>
      {/* Section header */}
      <button
        onClick={onSeeAll}
        className="inicio-section-head"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 12, alignSelf: 'stretch', width: '100%',
        }}
      >
        <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>
          {title}
        </span>
        <i className="bi bi-chevron-right" style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.6)' }} />
        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
          {count}
        </span>
      </button>

      {/* Horizontal scroll */}
      <div className="inicio-carousel" style={{ paddingBottom: 8 }}>
        {items.map((nombre) => (
          <BrandCard
            key={nombre}
            nombre={nombre}
            seed={seedFor(nombre)}
            logo={logoFor(nombre)}
            firebaseGradient={gradientFor(nombre)}
            onClick={() => onCardClick(nombre)}
          />
        ))}
      </div>
    </div>
  );
}

export default function Proveedores() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [marcaCustom, setMarcaCustom] = useState({});
  const [ingresos, setIngresos] = useState({});
  const [loading, setLoading] = useState(true);
  const [seeAllSection, setSeeAllSection] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const fecha30 = new Date();
        fecha30.setDate(fecha30.getDate() - 30);
        const fecha30Str = fecha30.toISOString().split('T')[0];

        const [prodSnap, custSnap, ordenesSnap] = await Promise.all([
          getDocs(collection(db, 'productos')),
          getDocs(collection(db, 'marcaCustomizaciones')),
          getDocs(query(collection(db, 'ordenes'), where('fecha', '>=', fecha30Str))).catch(() => null),
        ]);

        if (cancelled) return;

        const prods = [];
        prodSnap.forEach(d => prods.push({ id: d.id, ...d.data() }));
        setProductos(prods);

        const cust = {};
        custSnap.forEach(d => {
          const data = d.data();
          cust[d.id] = {
            color: (typeof data.r === 'number' && typeof data.g === 'number' && typeof data.b === 'number')
              ? [data.r, data.g, data.b] : null,
            logo: data.logoBase64 ? `data:image/png;base64,${data.logoBase64}` : null,
          };
        });
        setMarcaCustom(cust);

        if (ordenesSnap) {
          const prodMap = {};
          prods.forEach(p => { if (p.proveedor) prodMap[p.id] = p.proveedor; });
          const rev = {};
          ordenesSnap.forEach(d => {
            const orden = d.data();
            const items = orden.productos || orden.items || [];
            items.forEach(item => {
              const prov = prodMap[item.id];
              if (prov) rev[prov] = (rev[prov] || 0) + (item.precioUnitario || 0) * (item.cantidad || 0);
            });
          });
          setIngresos(rev);
        }
      } catch (e) {
        console.error('Error cargando proveedores:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const marcas = useMemo(
    () => [...new Set(productos.map(p => p.proveedor).filter(Boolean))].sort(),
    [productos]
  );

  const countByMarca = useMemo(() => {
    const c = {};
    productos.forEach(p => { if (p.proveedor) c[p.proveedor] = (c[p.proveedor] || 0) + 1; });
    return c;
  }, [productos]);

  const masVendidas = useMemo(
    () => [...marcas].sort((a, b) => (ingresos[b] || 0) - (ingresos[a] || 0)),
    [marcas, ingresos]
  );

  const masProductos = useMemo(
    () => [...marcas].sort((a, b) => (countByMarca[b] || 0) - (countByMarca[a] || 0)),
    [marcas, countByMarca]
  );

  const seedFor = (nombre) => marcas.indexOf(nombre);
  seedFor.__counts = countByMarca;

  const logoFor = (nombre) => marcaCustom[normalizeMarca(nombre)]?.logo || null;

  const gradientFor = (nombre) => {
    const cust = marcaCustom[normalizeMarca(nombre)];
    if (!cust?.color) return null;
    const to255 = (x) => Math.round(Math.max(0, Math.min(1, x)) * 255);
    const [r, g, b] = cust.color;
    const c1 = `rgb(${to255(r)}, ${to255(g)}, ${to255(b)})`;
    const c2 = `rgb(${to255(r - 0.45)}, ${to255(g - 0.45)}, ${to255(b - 0.45)})`;
    return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
  };

  const revenueFor = (nombre) => ingresos[nombre] || 0;

  const handleCardClick = (nombre) => {
    navigate('/productos', { state: { filterMarca: nombre } });
  };

  const seeAllItems = seeAllSection === 'masVendidas' ? masVendidas
    : seeAllSection === 'masProductos' ? masProductos
    : seeAllSection === 'todas' ? marcas
    : null;

  return (
    <div className="proveedores-page inicio-page" style={{
      background: 'linear-gradient(145deg, var(--role-dark) 0%, var(--role-primary) 100%)',
    }}>
      <div className="inicio-inner" style={{ gap: 24 }}>
        <header className="inicio-header">
          <h1>Proveedores</h1>
        </header>

      <div style={{ paddingBottom: 32 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
            <div className="spinner-border" style={{ color: 'rgba(255,255,255,0.7)', width: 28, height: 28, borderWidth: 3 }} />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>Cargando proveedores…</p>
          </div>
        ) : marcas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <i className="bi bi-building-x" style={{ fontSize: 40, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 12 }} />
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, margin: 0 }}>Sin marcas registradas</p>
          </div>
        ) : seeAllSection ? (
          /* "See all" expanded view */
          <div>
            <button
              onClick={() => setSeeAllSection(null)}
              className="inicio-section-head"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                marginBottom: 20,
                color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 600,
              }}
            >
              <i className="bi bi-chevron-left" /> Proveedores
            </button>
            <div className="inicio-padded" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 14,
            }}>
              {seeAllItems.map((nombre) => (
                <BrandCard
                  key={nombre}
                  nombre={nombre}
                  seed={seedFor(nombre)}
                  logo={logoFor(nombre)}
                  firebaseGradient={gradientFor(nombre)}
                  onClick={() => handleCardClick(nombre)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Main browse: 3 sections */
          <>
            <SectionRow
              title="Más vendidas"
              count={masVendidas.length}
              items={masVendidas.slice(0, 12)}
              onSeeAll={() => setSeeAllSection('masVendidas')}
              onCardClick={handleCardClick}
              logoFor={logoFor}
              gradientFor={gradientFor}
              seedFor={seedFor}
            />
            <SectionRow
              title="Más productos"
              count={masProductos.length}
              items={masProductos.slice(0, 12)}
              onSeeAll={() => setSeeAllSection('masProductos')}
              onCardClick={handleCardClick}
              logoFor={logoFor}
              gradientFor={gradientFor}
              seedFor={seedFor}
            />
            <SectionRow
              title="Todas las marcas"
              count={marcas.length}
              items={marcas.slice(0, 12)}
              onSeeAll={() => setSeeAllSection('todas')}
              onCardClick={handleCardClick}
              logoFor={logoFor}
              gradientFor={gradientFor}
              seedFor={seedFor}
            />
          </>
        )}
      </div>
      </div>
    </div>
  );
}
