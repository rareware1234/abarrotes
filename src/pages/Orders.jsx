import React, { useState, useEffect } from 'react';
import orderService from '../services/orderService';
import { useEmpresa } from '../context/EmpresaContext';
import BadgeEstado from '../components/BadgeEstado';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);

const formatDate = (date) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(d);
};

const METHOD_ICON = {
  efectivo: 'bi-cash',
  tarjeta: 'bi-credit-card',
  mercadopago: 'bi-qr-code',
  codi: 'bi-phone',
  credito: 'bi-credit-card-2-front',
  transferencia: 'bi-arrow-left-right',
};

/* ── Order detail modal ──────────────────────────────────────────────────── */
const OrderDetailModal = ({ orden, onClose }) => {
  if (!orden) return null;

  const esPendiente = orden.metodoPago === 'credito' || orden.estado === 'pendiente';

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

        {esPendiente && (
          <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ color: '#F97316', fontSize: 16 }} />
            <span style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>Pago pendiente por cobrar: {formatCurrency(orden.total)}</span>
          </div>
        )}

        <div style={{ background: '#F4F5F7', padding: 16, borderRadius: 8, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
            <div><strong>Fecha:</strong> {formatDate(orden.createdAt)}</div>
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
                <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(item.precioFinal || item.precioUnitario)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>
                  {formatCurrency((item.precioFinal || item.precioUnitario) * item.cantidad)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: '2px solid var(--border)', paddingTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>Subtotal</span><span>{formatCurrency(orden.subtotal)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>IVA (16%)</span><span>{formatCurrency(orden.iva)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 700 }}>
            <span>{esPendiente ? 'Por cobrar' : 'Total'}</span>
            <span style={{ color: esPendiente ? '#F97316' : 'var(--role-primary)' }}>{formatCurrency(orden.total)}</span>
          </div>
          {orden.metodoPago === 'efectivo' && (orden.montoPagado ?? orden.efectivoRecibido) && (
            <div style={{ marginTop: 12, padding: 12, background: '#F4F5F7', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Recibido</span><span>{formatCurrency(orden.montoPagado ?? orden.efectivoRecibido)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}><span>Cambio</span><span style={{ color: 'var(--role-primary)' }}>{formatCurrency(orden.cambio)}</span></div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <button
            onClick={() => window.open(`${window.location.origin}${window.location.pathname}#/venta-detalles?uuid=${orden.id}`, '_blank')}
            className="btn btn-outline-secondary"
            style={{ flex: 1 }}
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

/* ── Pending payments card ─────────────────────────────────────────────────── */
const PagoCard = ({ orden, onClick }) => {
  const esCredito = orden.metodoPago === 'credito';
  const color = esCredito ? '#F97316' : '#EAB308';
  const bg    = esCredito ? '#FFF7ED' : '#FEFCE8';
  const icon  = esCredito ? 'bi-credit-card-2-front-fill' : 'bi-clock-fill';
  const label = esCredito ? 'Crédito' : 'Pendiente';

  return (
    <div onClick={onClick} style={{ background: 'white', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14, transition: 'transform 0.1s', marginBottom: 8 }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
      onMouseLeave={e => e.currentTarget.style.transform = ''}>
      <div style={{ width: 46, height: 46, borderRadius: 23, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`bi ${icon}`} style={{ color, fontSize: 18 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>#{orden.id.slice(-8).toUpperCase()}</span>
          <span style={{ fontSize: 10, fontWeight: 800, color, background: bg, padding: '2px 7px', borderRadius: 10 }}>{label}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {formatDate(orden.createdAt)}
          {orden.productos?.length ? ` · ${orden.productos.length} art.` : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 17, color }}>{formatCurrency(orden.total)}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>por cobrar</div>
      </div>
    </div>
  );
};

/* ── Main component ────────────────────────────────────────────────────────── */
const exportCSV = (ordenes) => {
  const today = new Date().toISOString().slice(0, 10);
  const rows = [
    ['ID', 'Fecha', 'Empleado', 'Sucursal', 'Método', 'Artículos', 'Subtotal', 'IVA', 'Total', 'Estado'],
    ...ordenes.map(o => {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0);
      return [
        o.id,
        d.toLocaleString('es-MX'),
        o.nombreEmpleado || '',
        o.tiendaNombre || '',
        o.metodoPago || '',
        o.productos?.length || 0,
        (o.subtotal || 0).toFixed(2),
        (o.iva || 0).toFixed(2),
        (o.total || 0).toFixed(2),
        o.estado || '',
      ];
    }),
  ];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `pedidos-${today}.csv`; a.click();
  URL.revokeObjectURL(url);
};

const Orders = () => {
  const { activaId } = useEmpresa();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [mainTab, setMainTab] = useState('todos');

  useEffect(() => { fetchOrdenes(); }, [activaId]);

  const fetchOrdenes = async () => {
    setLoading(true);
    // Scopeado a la empresa activa (por sus tiendas) — igual que macOS.
    const result = await orderService.fetchAllForActiveEmpresa('todas');
    if (result.success) setOrdenes(result.data);
    setLoading(false);
  };

  const pendientes = ordenes.filter(o =>
    o.metodoPago?.toLowerCase() === 'credito' || o.estado?.toLowerCase() === 'pendiente'
  );

  const totalPendiente = pendientes.reduce((s, o) => s + (o.total || 0), 0);
  const stats = { count: ordenes.length, total: ordenes.reduce((s, o) => s + (o.total || 0), 0) };

  return (
    <div className="orders-container inicio-page">
      <div className="inicio-inner" style={{ gap: 20 }}>
        <header className="inicio-header">
          <h1>Pedidos</h1>
        </header>

        <div style={{ padding: '0 20px', paddingBottom: 32 }}>
        {mainTab === 'todos' && (
          <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <span className="spinner-border spinner-border-lg" />
            </div>
          ) : ordenes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.5)' }}>
              <i className="bi bi-inbox" style={{ fontSize: 64, opacity: 0.3 }} />
              <p>No hay pedidos registrados</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ordenes.map(orden => {
                const esPendiente = orden.estado === 'pendiente' || orden.status === 'pendiente';
                const iconMetodo = METHOD_ICON[orden.metodoPago] || 'bi-cash-coin';
                return (
                  <div key={orden.id} onClick={() => setSelectedOrden(orden)}
                    style={{ background: 'white', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14, transition: 'transform 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = ''}>
                    <div style={{ width: 46, height: 46, borderRadius: 23, background: 'var(--role-tinted-bg, rgba(26,122,72,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`bi ${iconMetodo}`} style={{ color: 'var(--role-primary)', fontSize: 18 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>#{orden.id.slice(-8).toUpperCase()}</span>
                        <BadgeEstado estado={orden.estado || orden.status} />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatDate(orden.createdAt)}
                        {orden.productos?.length ? ` · ${orden.productos.length} art.` : ''}
                        {orden.nombreEmpleado ? ` · ${orden.nombreEmpleado}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 17, color: esPendiente ? '#F97316' : 'var(--role-primary)' }}>{formatCurrency(orden.total)}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>{orden.metodoPago || '—'}</div>
                    </div>
                    <i className="bi bi-chevron-right" style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {mainTab === 'pendientes' && (
        <div>
          {pendientes.length > 0 && (
            <div style={{ background: 'white', borderRadius: 14, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid rgba(249,115,22,0.25)' }}>
              <div style={{ width: 46, height: 46, borderRadius: 23, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-exclamation-bubble-fill" style={{ color: '#F97316', fontSize: 18 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total por cobrar</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{pendientes.length} pago{pendientes.length !== 1 ? 's' : ''} pendiente{pendientes.length !== 1 ? 's' : ''}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 22, color: '#F97316' }}>{formatCurrency(totalPendiente)}</div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <span className="spinner-border spinner-border-lg" />
            </div>
          ) : pendientes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <i className="bi bi-check-circle" style={{ fontSize: 64, opacity: 0.3 }} />
              <p style={{ marginTop: 12 }}>Sin pagos pendientes</p>
              <p style={{ fontSize: 13 }}>Todas las ventas de este período están cobradas</p>
            </div>
          ) : (
            <div>
              {pendientes.map(orden => (
                <PagoCard key={orden.id} orden={orden} onClick={() => setSelectedOrden(orden)} />
              ))}
            </div>
          )}
        </div>
      )}
        </div>
      </div>

      {selectedOrden && (
        <OrderDetailModal orden={selectedOrden} onClose={() => setSelectedOrden(null)} />
      )}
    </div>
  );
};

export default Orders;
