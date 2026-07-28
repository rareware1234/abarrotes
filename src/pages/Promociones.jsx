import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import promocionService from '../services/promocionService';
import productService from '../services/productService';
import orderService from '../services/orderService';
import logoBlanco from '../assets/logo-blanco.png';
import ConfirmModal from '../components/ConfirmModal';

const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
const fmtCompact = (v) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}K`;
  return fmt(v);
};

const getWeekBounds = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const lunes = new Date(now);
  lunes.setDate(now.getDate() + diff);
  lunes.setHours(0, 0, 0, 0);
  const lunesAnterior = new Date(lunes);
  lunesAnterior.setDate(lunes.getDate() - 7);
  return { inicioSemana: lunes, inicioSemanaAnterior: lunesAnterior };
};

/* ── PVWordmark ─────────────────────────────────────────────────────────────── */
function PVWordmark() {
  return <img src={logoBlanco} alt="" className="hero-card-emblem" />;
}

/* ── BarChart ───────────────────────────────────────────────────────────────── */
function BarChart({ data, width = 220, height = 44 }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data, 1);
  const bw = Math.max(2, width / data.length - 3);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((v, i) => {
        const bh = Math.max(3, (v / max) * height * 0.85);
        return <rect key={i} x={i * (bw + 3)} y={height - bh} width={bw} height={bh} fill="rgba(255,255,255,0.78)" rx="2" />;
      })}
    </svg>
  );
}

/* ── PromoSection ───────────────────────────────────────────────────────────── */
function PromoSection({ title, children }) {
  return (
    <section className="inicio-section">
      <div className="inicio-section-head" style={{ cursor: 'default' }}>
        <h2>{title}</h2>
      </div>
      <div className="inicio-carousel inicio-carousel--tight">{children}</div>
    </section>
  );
}

/* ── ResumenCard (280×320, matches macOS heroCardShell) ─────────────────────── */
function ResumenCard({ title, value, badge, statValue, statLabel, stat2Value, stat2Label, footer, gradient, chart }) {
  return (
    <div className="hero-card" style={{
      background: gradient, width: 280, height: 320,
      justifyContent: 'space-between', flexShrink: 0,
    }}>
      <PVWordmark />
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.1, paddingRight: 72, marginTop: 6 }}>{title}</div>
        <div style={{ fontSize: 34, fontWeight: 900, color: '#fff', marginTop: 6, lineHeight: 1.05 }}>{value}</div>
        {badge && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.18)', borderRadius: 20,
            padding: '4px 10px', marginTop: 8,
            fontSize: 12, fontWeight: 700, color: '#fff',
          }}>
            {badge}
          </div>
        )}
        {(statLabel || stat2Label) && (
          <div style={{ display: 'flex', gap: 24, marginTop: 10 }}>
            {statLabel && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{statValue}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.78)' }}>{statLabel}</div>
              </div>
            )}
            {stat2Label && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{stat2Value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.78)' }}>{stat2Label}</div>
              </div>
            )}
          </div>
        )}
      </div>
      {chart && <div style={{ marginTop: 'auto' }}>{chart}</div>}
      {footer && <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.78)', lineHeight: 1.4 }}>{footer}</div>}
    </div>
  );
}

/* ── InventarioCard (180×220, matches macOS countCard) ──────────────────────── */
function InventarioCard({ title, count, gradient }) {
  return (
    <div className="hero-card" style={{
      background: gradient, width: 180, height: 220,
      justifyContent: 'space-between', flexShrink: 0,
    }}>
      <PVWordmark />
      <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2, paddingRight: 60, marginTop: 6 }}>{title}</div>
      <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.78)' }}>
        {count === 1 ? 'producto' : count === 0 ? 'productos' : 'productos'}
      </div>
    </div>
  );
}

/* ── SugerenciaHeroCard (320×260, matches macOS sugerenciaCard) ─────────────── */
function SugerenciaHeroCard({ title, description, actionLabel, gradient, onAction }) {
  return (
    <div className="hero-card" style={{
      background: gradient, width: 320, height: 260,
      justifyContent: 'space-between', flexShrink: 0,
    }}>
      <PVWordmark />
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, paddingRight: 72, marginTop: 6 }}>{title}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.92)', lineHeight: 1.5, flex: 1, margin: '8px 0' }}>{description}</div>
      <button
        onClick={onAction}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.20)',
          border: '1px solid rgba(255,255,255,0.40)',
          borderRadius: 20, padding: '7px 14px',
          color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 900 }}>+</span> {actionLabel}
      </button>
    </div>
  );
}

/* ── PromocionHeroCard (full-width, matches macOS PromocionHeroCard) ─────────── */
const TIPO_CFG = {
  descuento_porcentaje: {
    label: 'DESCUENTO %',
    gradient: 'linear-gradient(135deg, rgb(26,122,72) 0%, rgb(10,58,34) 100%)',
  },
  precio_especial: {
    label: 'PRECIO ESPECIAL',
    gradient: 'linear-gradient(135deg, rgb(217,148,0) 0%, rgb(130,75,0) 100%)',
  },
  nxm: {
    label: 'NxM',
    gradient: 'linear-gradient(135deg, rgb(220,55,60) 0%, rgb(140,20,25) 100%)',
  },
};

function PromocionHeroCard({ promo, canEdit, onEdit, onToggle, onDelete }) {
  const cfg = TIPO_CFG[promo.tipo] || TIPO_CFG.descuento_porcentaje;

  const fmtDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const hoy = new Date();
  const inicio = promo.fechaInicio?.toDate ? promo.fechaInicio.toDate() : new Date(promo.fechaInicio || 0);
  const fin    = promo.fechaFin?.toDate   ? promo.fechaFin.toDate()   : new Date(promo.fechaFin || 0);
  const vigente = promo.activa !== false && inicio <= hoy && hoy <= fin;

  const descripcionCorta = (() => {
    if (promo.tipo === 'descuento_porcentaje') return `${promo.valor}% de descuento`;
    if (promo.tipo === 'precio_especial') return `Precio especial: $${promo.precioEspecial || promo.valor}`;
    if (promo.tipo === 'nxm') return `Lleva ${promo.lleva || promo.valor} paga ${promo.paga || promo.valorSecundario}`;
    return '';
  })();

  const afectados = (promo.productos?.length || 0) + (promo.categorias?.length || 0);

  return (
    <div style={{
      background: cfg.gradient, borderRadius: 18, padding: 18,
      border: '1px solid rgba(255,255,255,0.20)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>
            {cfg.label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginTop: 4, lineHeight: 1.15 }}>
            {promo.nombre}
          </div>
        </div>
        <img src={logoBlanco} alt="" style={{ height: 15, opacity: 0.92, flexShrink: 0, pointerEvents: 'none' }} />
      </div>

      <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{descripcionCorta}</div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <span style={{ background: 'rgba(255,255,255,0.16)', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="bi bi-stack" /> {afectados} afectados
        </span>
        <span style={{ background: 'rgba(255,255,255,0.16)', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="bi bi-calendar3" /> {fmtDate(promo.fechaInicio)} – {fmtDate(promo.fechaFin)}
        </span>
        <span style={{
          marginLeft: 'auto',
          background: vigente ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.30)',
          borderRadius: 20, padding: '4px 10px',
          fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: 0.5, textTransform: 'uppercase',
        }}>
          {vigente ? 'Vigente' : 'Vencida'}
        </span>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.18)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          onClick={() => canEdit && onToggle(promo)}
          style={{
            width: 38, height: 22, borderRadius: 11, position: 'relative', flexShrink: 0,
            background: promo.activa !== false ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)',
            cursor: canEdit ? 'pointer' : 'default', transition: 'background 0.2s',
          }}
        >
          <div style={{
            position: 'absolute', top: 3,
            left: promo.activa !== false ? 18 : 3,
            width: 16, height: 16, borderRadius: '50%',
            background: 'white', transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>
          {promo.activa !== false ? 'Activada' : 'Desactivada'}
        </span>
        <div style={{ flex: 1 }} />
        {canEdit && (
          <>
            <button onClick={() => onEdit(promo)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', padding: '4px 0' }}>Editar</button>
            <button onClick={() => onDelete(promo)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: 800, cursor: 'pointer', padding: '4px 0' }}>Eliminar</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════════════════════════ */
const Promociones = () => {
  const { hasPermission, empleado } = useAuth();
  const [promociones, setPromociones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const showToast = (msg, ms = 3000) => { setToast(msg); setTimeout(() => setToast(''), ms); };
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const canEdit = hasPermission('promociones_crear') || hasPermission('promociones_editar');

  const emptyForm = { nombre: '', tipo: 'descuento_porcentaje', valor: '', valorSecundario: '', categorias: [], fechaInicio: '', fechaFin: '', activa: true };
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [promosResult, productosResult, ordenesResult] = await Promise.all([
      promocionService.fetchAll(),
      productService.fetchAll(),
      orderService.getOrdenes('mes'),
    ]);
    if (promosResult.success) setPromociones(promosResult.data);
    if (productosResult.success) setProductos(productosResult.data);
    if (ordenesResult.success) setOrdenes(ordenesResult.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Analytics ── */
  const { inicioSemana, inicioSemanaAnterior } = getWeekBounds();

  const ordenesSemana = ordenes.filter(o => {
    const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0);
    return d >= inicioSemana;
  });
  const ordenesSemanaAnterior = ordenes.filter(o => {
    const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0);
    return d >= inicioSemanaAnterior && d < inicioSemana;
  });
  const ventasSemana = ordenesSemana.reduce((s, o) => s + (o.total || 0), 0);
  const ventasSemanaAnterior = ordenesSemanaAnterior.reduce((s, o) => s + (o.total || 0), 0);
  const tendencia = ventasSemanaAnterior > 0 ? ((ventasSemana - ventasSemanaAnterior) / ventasSemanaAnterior) * 100 : 0;

  const categoriasConteo = {};
  ordenesSemana.forEach(o => {
    (o.productos || o.items || []).forEach(item => {
      const cat = item.categoria || 'Sin categoría';
      categoriasConteo[cat] = (categoriasConteo[cat] || 0) + (item.cantidad || 1);
    });
  });
  const categoriasMasVendidas = Object.entries(categoriasConteo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([categoria, cantidad]) => ({ categoria, cantidad }));
  const topCategoria = categoriasMasVendidas[0] || null;

  const categoriasVendidas = new Set(categoriasMasVendidas.map(c => c.categoria));
  const todasCategorias = new Set(productos.map(p => p.categoria).filter(Boolean));
  const categoriasSinVentas = [...todasCategorias].filter(c => !categoriasVendidas.has(c)).sort();

  const productosStockBajo = productos.filter(p => p.stock > 0 && p.stock <= (p.stockMinimo || 5));
  const productosAgotados  = productos.filter(p => p.stock === 0);
  const productosExceso    = productos.filter(p => (p.stockMinimo || 0) > 0 && p.stock > (p.stockMinimo || 0) * 3);

  const hoy = new Date();
  const promocionesActivas = promociones.filter(p => {
    if (!p.activa) return false;
    const i = p.fechaInicio?.toDate ? p.fechaInicio.toDate() : new Date(p.fechaInicio);
    const f = p.fechaFin?.toDate ? p.fechaFin.toDate() : new Date(p.fechaFin);
    return i <= hoy && hoy <= f;
  }).length;

  const totalAlertas = productosAgotados.length + productosStockBajo.length;

  /* ── Sugerencias ── */
  const sugerencias = [];
  if (productosExceso.length > 0) {
    sugerencias.push({
      titulo: 'Mover inventario',
      descripcion: `${productosExceso.length} productos tienen más de 3× su stock mínimo. Un descuento puede moverlos.`,
      actionLabel: 'Crear descuento',
      gradient: 'linear-gradient(135deg, rgb(77,128,199) 0%, rgb(26,56,122) 100%)',
    });
  }
  if (categoriasSinVentas.length > 0) {
    sugerencias.push({
      titulo: 'Reactivar categorías',
      descripcion: `${categoriasSinVentas.length} categorías sin ventas esta semana. Una promo puede activarlas.`,
      actionLabel: 'Crear promoción',
      gradient: 'linear-gradient(135deg, rgb(217,158,56) 0%, rgb(133,77,26) 100%)',
    });
  }
  if (topCategoria && categoriasMasVendidas.length >= 2) {
    sugerencias.push({
      titulo: 'Aprovecha el momentum',
      descripcion: `"${topCategoria.categoria}" lidera con ${topCategoria.cantidad} uds. Un 3×2 puede subir el ticket promedio.`,
      actionLabel: 'Crear 3×2',
      gradient: 'linear-gradient(135deg, rgb(224,97,82) 0%, rgb(140,36,26) 100%)',
    });
  }

  /* ── Handlers ── */
  const abrirNueva = () => { setEditingPromo(null); setFormData(emptyForm); setShowModal(true); };

  const handleSave = async () => {
    if (!formData.nombre || !formData.fechaInicio || !formData.fechaFin) {
      showToast('Nombre y fechas son requeridos');
      return;
    }
    const promoData = {
      ...formData,
      valor: parseFloat(formData.valor) || 0,
      paga: formData.tipo === 'nxm' ? (parseFloat(formData.valorSecundario) || 0) : undefined,
      valorSecundario: formData.tipo === 'nxm' ? (parseFloat(formData.valorSecundario) || 0) : undefined,
      fechaInicio: new Date(formData.fechaInicio),
      fechaFin: new Date(formData.fechaFin),
    };
    const result = editingPromo
      ? await promocionService.update(editingPromo.id, promoData)
      : await promocionService.create(promoData);
    if (result.success) {
      setShowModal(false); setEditingPromo(null); setFormData(emptyForm);
      fetchData();
      showToast(editingPromo ? 'Promoción actualizada' : 'Promoción creada');
    } else {
      showToast('Error: ' + result.error);
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    const toDateStr = (ts) => {
      if (!ts) return '';
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toISOString().split('T')[0];
    };
    setFormData({
      nombre: promo.nombre || '',
      tipo: promo.tipo || 'descuento_porcentaje',
      valor: promo.valor?.toString() || '',
      valorSecundario: (promo.paga || promo.valorSecundario)?.toString() || '',
      categorias: promo.categorias || [],
      fechaInicio: toDateStr(promo.fechaInicio),
      fechaFin: toDateStr(promo.fechaFin),
      activa: promo.activa !== false,
    });
    setShowModal(true);
  };

  const handleToggle = async (promo) => { await promocionService.toggle(promo.id); fetchData(); };
  const handleDelete = async () => {
    if (deleteConfirm) { await promocionService.remove(deleteConfirm.id); setDeleteConfirm(null); fetchData(); }
  };

  /* ── Staff lock ── */
  if (empleado?.rol === 'staff') {
    return (
      <div className="promociones-container inicio-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 40 }}>
        <i className="bi bi-lock-fill" style={{ fontSize: 44, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }} />
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Acceso Restringido</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', maxWidth: 300 }}>
          Las promociones son gestionadas por managers y administradores.
        </div>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="promociones-container inicio-page">
      <div className="inicio-inner" style={{ gap: 32 }}>

        <header className="inicio-header">
          <h1>Promociones</h1>
          {canEdit && (
            <button
              onClick={abrirNueva}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.18)',
                border: '1.2px solid rgba(255,255,255,0.4)',
                borderRadius: 20, padding: '7px 16px',
                color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800 }}>+</span> Crear
            </button>
          )}
        </header>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="spinner-border" style={{ color: 'rgba(255,255,255,0.7)', width: 28, height: 28, borderWidth: 3 }} />
          </div>
        ) : (
          <>
            {/* ── Resumen ── */}
            <PromoSection title="Resumen">
              {/* Ventas semana */}
              <ResumenCard
                title="Ventas semana"
                value={fmtCompact(ventasSemana)}
                badge={`${tendencia >= 0 ? '↑' : '↓'} ${Math.abs(tendencia).toFixed(1)}% vs anterior`}
                statValue={fmtCompact(ventasSemanaAnterior)} statLabel="semana anterior"
                footer="Datos para tomar decisiones de promociones."
                gradient="linear-gradient(135deg, rgb(77,128,199) 0%, rgb(26,56,122) 100%)"
              />
              {/* Activas */}
              <ResumenCard
                title="Activas"
                value={`${promocionesActivas}`}
                statValue={`${promociones.length}`} statLabel="totales"
                stat2Value={`${promociones.length - promocionesActivas}`} stat2Label="inactivas"
                footer={promocionesActivas === 0
                  ? 'Crea tu primera promoción desde el botón "Crear".'
                  : 'Promociones vigentes en este momento.'}
                gradient="linear-gradient(135deg, rgb(77,179,128) 0%, rgb(26,107,82) 100%)"
              />
              {/* Más vendida */}
              <ResumenCard
                title="Más vendida"
                value={topCategoria?.categoria ?? '—'}
                statValue={topCategoria ? `${topCategoria.cantidad}` : '0'} statLabel="unidades"
                stat2Value={categoriasMasVendidas.length > 1 ? `${categoriasMasVendidas.length}` : undefined}
                stat2Label={categoriasMasVendidas.length > 1 ? 'categorías top' : undefined}
                footer={!topCategoria ? 'Sin ventas registradas esta semana.' : undefined}
                gradient="linear-gradient(135deg, rgb(217,128,82) 0%, rgb(133,56,26) 100%)"
                chart={categoriasMasVendidas.length > 1
                  ? <BarChart data={categoriasMasVendidas.map(c => c.cantidad)} width={220} height={44} />
                  : undefined}
              />
              {/* Alertas */}
              <ResumenCard
                title="Alertas"
                value={`${totalAlertas}`}
                statValue={`${productosAgotados.length}`} statLabel="agotados"
                stat2Value={`${productosStockBajo.length}`} stat2Label="stock bajo"
                footer={totalAlertas === 0
                  ? 'Inventario sin alertas.'
                  : 'Evita promocionar productos que no puedes surtir.'}
                gradient="linear-gradient(135deg, rgb(224,97,82) 0%, rgb(140,36,26) 100%)"
              />
            </PromoSection>

            {/* ── Inventario ── */}
            <PromoSection title="Inventario">
              <InventarioCard title="Productos"    count={productos.length}         gradient="linear-gradient(135deg, rgb(77,128,199) 0%, rgb(26,56,122) 100%)" />
              <InventarioCard title="Stock bajo"   count={productosStockBajo.length} gradient="linear-gradient(135deg, rgb(217,158,56) 0%, rgb(133,77,26) 100%)" />
              <InventarioCard title="Agotados"     count={productosAgotados.length}  gradient="linear-gradient(135deg, rgb(224,82,82) 0%, rgb(140,26,26) 100%)" />
              <InventarioCard title="Exceso stock" count={productosExceso.length}    gradient="linear-gradient(135deg, rgb(107,102,173) 0%, rgb(56,51,97) 100%)" />
              <InventarioCard title="Sin ventas"   count={categoriasSinVentas.length} gradient="linear-gradient(135deg, rgb(115,115,128) 0%, rgb(51,51,64) 100%)" />
            </PromoSection>

            {/* ── Sugerencias (conditional) ── */}
            {sugerencias.length > 0 && (
              <PromoSection title="Sugerencias">
                {sugerencias.map(s => (
                  <SugerenciaHeroCard
                    key={s.titulo}
                    title={s.titulo}
                    description={s.descripcion}
                    actionLabel={s.actionLabel}
                    gradient={s.gradient}
                    onAction={abrirNueva}
                  />
                ))}
              </PromoSection>
            )}

            {/* ── Activas (vertical list) ── */}
            <section style={{ padding: '0 20px', paddingBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Activas</h2>
                <span style={{
                  fontSize: 13, fontWeight: 800, color: '#fff',
                  background: 'rgba(255,255,255,0.18)', padding: '2px 10px', borderRadius: 20,
                }}>
                  {promociones.length}
                </span>
              </div>

              {promociones.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '36px 20px',
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 18,
                }}>
                  <i className="bi bi-tag-slash" style={{ fontSize: 36, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 12 }} />
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Sin promociones activas</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
                    {sugerencias.length > 0 ? 'Usa las sugerencias de arriba para crear la primera' : 'Crea una desde el botón "Crear"'}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {promociones.map(promo => (
                    <PromocionHeroCard
                      key={promo.id}
                      promo={promo}
                      canEdit={canEdit}
                      onEdit={handleEdit}
                      onToggle={handleToggle}
                      onDelete={setDeleteConfirm}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="confirm-modal" style={{ maxWidth: '460px', textAlign: 'left', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>{editingPromo ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <input
                type="text" placeholder="Nombre *" value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '15px' }}
              />
              <select
                value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
              >
                <option value="descuento_porcentaje">Descuento Porcentaje</option>
                <option value="precio_especial">Precio Especial</option>
                <option value="nxm">Lleva N paga M</option>
              </select>
              <input
                type="number" placeholder={formData.tipo === 'nxm' ? 'Lleva (N)' : 'Porcentaje %'}
                value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })}
                style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
              />
              {formData.tipo === 'nxm' && (
                <input
                  type="number" placeholder="Paga (M)"
                  value={formData.valorSecundario} onChange={e => setFormData({ ...formData, valorSecundario: e.target.value })}
                  style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#6B7C93', display: 'block', marginBottom: '4px' }}>Fecha inicio</label>
                  <input
                    type="date" value={formData.fechaInicio}
                    onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6B7C93', display: 'block', marginBottom: '4px' }}>Fecha fin</label>
                  <input
                    type="date" value={formData.fechaFin}
                    onChange={e => setFormData({ ...formData, fechaFin: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
                  />
                </div>
              </div>
              {productos.length > 0 && (
                <div>
                  <label style={{ fontSize: '12px', color: '#6B7C93', display: 'block', marginBottom: '6px' }}>Categorías</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[...new Set(productos.map(p => p.categoria).filter(Boolean))].sort().map(cat => (
                      <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px' }}>
                        <input
                          type="checkbox"
                          checked={formData.categorias.includes(cat)}
                          onChange={e => {
                            const cats = e.target.checked
                              ? [...formData.categorias, cat]
                              : formData.categorias.filter(c => c !== cat);
                            setFormData({ ...formData, categorias: cats });
                          }}
                        />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.activa} onChange={e => setFormData({ ...formData, activa: e.target.checked })} />
                <span style={{ fontSize: '14px' }}>Activa</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-outline-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleSave} style={{ flex: 1, padding: '12px', background: 'var(--role-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal
          titulo="Eliminar Promoción"
          mensaje={`¿Eliminar "${deleteConfirm.nombre}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
          tipo="danger"
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#1e293b', color: 'white', padding: '10px 20px',
          borderRadius: 10, fontSize: 14, fontWeight: 500,
          zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.25)', whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default Promociones;
