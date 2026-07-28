import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useEmpresa } from '../context/EmpresaContext';
import tiendaService from '../services/tiendaService';
import { scopeOrdenes, getActivaId } from '../lib/empresaActiva';
import BadgeEstado from '../components/BadgeEstado';

const fmt = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const fmtDate = (date) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d);
};

const METHOD_ICON = {
  efectivo: 'bi-cash', tarjeta: 'bi-credit-card',
  mercadopago: 'bi-qr-code', codi: 'bi-phone',
  credito: 'bi-credit-card-2-front', transferencia: 'bi-arrow-left-right',
};

/* ── Detalle de orden ───────────────────────────────────────────────────── */
const OrderDetailModal = ({ orden, onClose }) => {
  if (!orden) return null;
  const esCredito = orden.metodoPago === 'credito';
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirm-modal" style={{ maxWidth: 600, maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0 }}>Orden #{orden.id.slice(-8).toUpperCase()}</h3>
            {orden.nombreEmpleado && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Atendido por: {orden.nombreEmpleado}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ background: esCredito ? '#FFF7ED' : '#FFFBEB', border: `1px solid ${esCredito ? '#FED7AA' : '#FDE68A'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="bi bi-exclamation-triangle-fill" style={{ color: esCredito ? '#F97316' : '#EAB308', fontSize: 16 }} />
          <span style={{ fontSize: 13, color: esCredito ? '#92400E' : '#713F12', fontWeight: 600 }}>
            Pago pendiente: {fmt(orden.total)}
          </span>
        </div>

        <div style={{ background: '#F4F5F7', padding: 16, borderRadius: 8, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
            <div><strong>Fecha:</strong> {fmtDate(orden.createdAt)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <strong>Método:</strong>
              <i className={`bi ${METHOD_ICON[orden.metodoPago] || 'bi-credit-card'}`} />
              {orden.metodoPago}
            </div>
            <div><strong>Estado:</strong> <BadgeEstado estado={orden.estado || orden.status} /></div>
            {orden.tiendaNombre && <div><strong>Sucursal:</strong> {orden.tiendaNombre}</div>}
          </div>
        </div>

        <h4 style={{ marginBottom: 12 }}>Productos</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
          <thead>
            <tr style={{ background: '#F4F5F7' }}>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: 13 }}>Producto</th>
              <th style={{ padding: '10px', textAlign: 'center', fontSize: 13 }}>Cant.</th>
              <th style={{ padding: '10px', textAlign: 'right', fontSize: 13 }}>Precio</th>
              <th style={{ padding: '10px', textAlign: 'right', fontSize: 13 }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {orden.productos?.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px' }}>{item.nombre}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>×{item.cantidad}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{fmt(item.precioFinal || item.precioUnitario)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>
                  {fmt((item.precioFinal || item.precioUnitario) * item.cantidad)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: '2px solid var(--border)', paddingTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>Subtotal</span><span>{fmt(orden.subtotal)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>IVA (16%)</span><span>{fmt(orden.iva)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 700 }}>
            <span>Por cobrar</span><span style={{ color: '#F97316' }}>{fmt(orden.total)}</span>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <button
            onClick={() => window.open(`${window.location.origin}${window.location.pathname}#/venta-detalles?uuid=${orden.id}`, '_blank')}
            className="btn btn-outline-secondary" style={{ flex: 1 }}
          >
            <i className="bi bi-receipt me-2" />Ver recibo
          </button>
          <button onClick={onClose} className="btn btn-primary" style={{ flex: 1, background: 'var(--role-primary)', border: 'none' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Tarjeta de pago pendiente ──────────────────────────────────────────── */
const PagoCard = ({ orden, onClick }) => {
  const esCredito = orden.metodoPago === 'credito';
  const accent = esCredito ? '#FB923C' : '#FBBF24';
  const icon   = esCredito ? 'bi-credit-card-2-front-fill' : 'bi-clock-fill';
  const label  = esCredito ? 'Crédito' : 'Pendiente';

  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 14, padding: '14px 16px',
        cursor: 'pointer',
        border: '1px solid rgba(255,255,255,0.14)',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
    >
      <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`bi ${icon}`} style={{ color: accent, fontSize: 18 }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#fff' }}>
            #{orden.id.slice(-8).toUpperCase()}
          </span>
          <span style={{ fontSize: 10, fontWeight: 800, color: accent, background: 'rgba(255,255,255,0.1)', padding: '2px 7px', borderRadius: 10 }}>
            {label}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
          {fmtDate(orden.createdAt)}
          {orden.tiendaNombre ? ` · ${orden.tiendaNombre}` : ''}
          {orden.productos?.length ? ` · ${orden.productos.length} art.` : ''}
        </div>
        {orden.nombreEmpleado && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            {orden.nombreEmpleado}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 17, color: accent }}>{fmt(orden.total)}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase' }}>por cobrar</div>
      </div>
    </div>
  );
};

/* ── Componente principal ───────────────────────────────────────────────── */
const Pagos = () => {
  const { activaId } = useEmpresa();
  const [ordenes, setOrdenes]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [selectedOrden, setSelectedOrden] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // Dos queries en paralelo: crédito + pendiente, directo al índice
        const [creditoSnap, pendienteSnap] = await Promise.all([
          getDocs(query(collection(db, 'ordenes'), where('metodoPago', '==', 'credito'))),
          getDocs(query(collection(db, 'ordenes'), where('estado', '==', 'pendiente'))),
        ]);
        if (cancelled) return;

        // Combinar y deduplicar por id
        const seen = new Set();
        const data = [];
        [...creditoSnap.docs, ...pendienteSnap.docs].forEach(d => {
          if (!seen.has(d.id)) {
            seen.add(d.id);
            data.push({ id: d.id, ...d.data() });
          }
        });

        // Ordenar por fecha descendente
        data.sort((a, b) => {
          const ta = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const tb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return tb - ta;
        });

        // Scopear a la empresa activa por sus tiendas (igual que macOS).
        const tRes = await tiendaService.fetchAllForActiveEmpresa();
        if (cancelled) return;
        const ids = new Set((tRes.success ? tRes.data : []).map((t) => t.id));
        setOrdenes(scopeOrdenes(data, ids, getActivaId()));
      } catch (e) {
        console.error('Error cargando pagos:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activaId]);

  const filteredPagos = search
    ? ordenes.filter(o => {
        const s = search.toLowerCase();
        return (
          o.id?.toLowerCase().includes(s) ||
          o.metodoPago?.toLowerCase().includes(s) ||
          o.nombreEmpleado?.toLowerCase().includes(s) ||
          o.tiendaNombre?.toLowerCase().includes(s)
        );
      })
    : ordenes;

  const totalPendiente = filteredPagos.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="pagos-page inicio-page">
      <div className="inicio-inner">

        {/* ── Título ── */}
        <header className="inicio-header">
          <h1>Pagos</h1>
          {filteredPagos.length > 0 && (
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: 'rgba(255,255,255,0.75)',
              background: 'rgba(255,255,255,0.12)',
              padding: '4px 12px', borderRadius: 20,
              whiteSpace: 'nowrap',
            }}>
              {filteredPagos.length} · {fmt(totalPendiente)}
            </span>
          )}
        </header>

        {/* ── Búsqueda ── */}
        <div className="inicio-padded">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 10, padding: '0 12px', height: 38,
          }}>
            <i className="bi bi-search" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por orden, método, empleado…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13 }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
              >×</button>
            )}
          </div>
        </div>

        {/* ── Banner total ── */}
        {filteredPagos.length > 0 && (
          <div className="inicio-padded">
            <div style={{
              background: 'rgba(249,115,22,0.14)',
              borderRadius: 14, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 14,
              border: '1px solid rgba(249,115,22,0.28)',
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-exclamation-bubble-fill" style={{ color: '#FB923C', fontSize: 18 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Total por cobrar
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                  {filteredPagos.length} pago{filteredPagos.length !== 1 ? 's' : ''} pendiente{filteredPagos.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 22, color: '#FB923C' }}>{fmt(totalPendiente)}</div>
            </div>
          </div>
        )}

        {/* ── Lista ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <span className="spinner-border" style={{ color: 'rgba(255,255,255,0.7)', width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : filteredPagos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.55)' }}>
            <i className="bi bi-check-circle" style={{ fontSize: 60, opacity: 0.35, display: 'block', marginBottom: 14 }} />
            <p style={{ fontWeight: 700, color: '#fff', marginBottom: 4, fontSize: 16 }}>Sin pagos pendientes</p>
            <p style={{ fontSize: 13 }}>Todas las ventas están cobradas</p>
          </div>
        ) : (
          <div className="inicio-padded" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredPagos.map(orden => (
              <PagoCard key={orden.id} orden={orden} onClick={() => setSelectedOrden(orden)} />
            ))}
          </div>
        )}

      </div>

      {selectedOrden && (
        <OrderDetailModal orden={selectedOrden} onClose={() => setSelectedOrden(null)} />
      )}
    </div>
  );
};

export default Pagos;
