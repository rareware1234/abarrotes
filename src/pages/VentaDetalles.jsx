import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import orderService from '../services/orderService';

const fmt = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const fmtDate = (v) => {
  if (!v) return '—';
  const d = v.toDate ? v.toDate() : new Date(v);
  return d.toLocaleString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const METODO_LABEL = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  mercadopago: 'MercadoPago',
  codi: 'CoDi',
  transferencia: 'Transferencia',
  credito: 'Crédito',
};

const METODO_ICON = {
  efectivo: 'bi-cash-coin',
  tarjeta: 'bi-credit-card',
  mercadopago: 'bi-qr-code',
  codi: 'bi-phone',
  transferencia: 'bi-bank',
  credito: 'bi-credit-card-2-front',
};

const VentaDetalles = () => {
  const [params] = useSearchParams();
  const id = params.get('uuid') || params.get('id');

  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError('No se especificó un ID de venta.');
      setLoading(false);
      return;
    }
    orderService.getById(id).then((res) => {
      if (!res.success) {
        setError('Error al cargar la venta. Intenta de nuevo.');
      } else if (!res.data) {
        setError(`No se encontró la venta con ID: ${id}`);
      } else {
        setOrden(res.data);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.center}>
          <div className="spinner-border text-success" style={{ width: 40, height: 40 }} role="status" />
          <p style={{ color: '#6B7C93', marginTop: 16 }}>Cargando recibo...</p>
        </div>
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div style={styles.page}>
        <div style={styles.center}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
          <p style={{ color: '#6B7C93', maxWidth: 320, textAlign: 'center' }}>
            {error || 'No hay datos de venta disponibles.'}
          </p>
          <button style={styles.btnPrimary} onClick={() => window.close()}>Cerrar</button>
        </div>
      </div>
    );
  }

  const metodo = (orden.metodoPago || '').toLowerCase();
  const shortId = (orden.id || id || '').slice(-8).toUpperCase();
  const cambio = orden.cambio || 0;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>Punto Verde</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={styles.btnSecondary} onClick={() => window.print()}>
            <i className="bi bi-printer" /> Imprimir
          </button>
          <button style={styles.btnSecondary} onClick={() => window.close()}>
            <i className="bi bi-x-lg" /> Cerrar
          </button>
        </div>
      </div>

      {/* Recibo */}
      <div style={styles.receipt}>
        {/* ID y fecha */}
        <div style={styles.receiptHead}>
          <div style={styles.badge}>Venta #{shortId}</div>
          <div style={{ fontSize: 13, color: '#6B7C93', marginTop: 4 }}>
            {fmtDate(orden.createdAt)}
          </div>
          {orden.nombreEmpleado && (
            <div style={{ fontSize: 13, color: '#6B7C93', marginTop: 2 }}>
              Atendido por: <strong>{orden.nombreEmpleado}</strong>
            </div>
          )}
          {orden.tiendaNombre && (
            <div style={{ fontSize: 13, color: '#6B7C93', marginTop: 2 }}>
              Sucursal: <strong>{orden.tiendaNombre}</strong>
            </div>
          )}
        </div>

        <hr style={{ borderColor: '#E5E7EB', margin: '16px 0' }} />

        {/* Productos */}
        <h3 style={styles.sectionTitle}>Productos</h3>
        <table style={styles.table}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              <th style={{ ...styles.th, textAlign: 'left' }}>Producto</th>
              <th style={{ ...styles.th, textAlign: 'center', width: 60 }}>Cant.</th>
              <th style={{ ...styles.th, textAlign: 'right', width: 90 }}>P. Unit.</th>
              <th style={{ ...styles.th, textAlign: 'right', width: 90 }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(orden.productos || []).map((item, i) => {
              const unitario = item.precioFinal ?? item.precioUnitario ?? item.precio ?? 0;
              const subtotalItem = unitario * (item.cantidad || 1);
              return (
                <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.nombre}</div>
                    {item.categoria && (
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.categoria}</div>
                    )}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>×{item.cantidad}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>{fmt(unitario)}</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>{fmt(subtotalItem)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <hr style={{ borderColor: '#E5E7EB', margin: '16px 0' }} />

        {/* Totales */}
        <div style={styles.totals}>
          <div style={styles.totalRow}>
            <span style={{ color: '#6B7C93' }}>Subtotal</span>
            <span>{fmt(orden.subtotal)}</span>
          </div>
          <div style={styles.totalRow}>
            <span style={{ color: '#6B7C93' }}>IVA (16%)</span>
            <span>{fmt(orden.iva)}</span>
          </div>
          <div style={{ ...styles.totalRow, ...styles.totalFinal }}>
            <span>Total</span>
            <span>{fmt(orden.total)}</span>
          </div>
          {orden.montoPagado > 0 && (
            <div style={styles.totalRow}>
              <span style={{ color: '#6B7C93' }}>Pagado</span>
              <span>{fmt(orden.montoPagado)}</span>
            </div>
          )}
          {cambio > 0 && (
            <div style={{ ...styles.totalRow, color: '#059669' }}>
              <span>Cambio</span>
              <span>{fmt(cambio)}</span>
            </div>
          )}
        </div>

        <hr style={{ borderColor: '#E5E7EB', margin: '16px 0' }} />

        {/* Método de pago */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <i className={`bi ${METODO_ICON[metodo] || 'bi-credit-card'}`} style={{ fontSize: 18, color: '#1A7A48' }} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>
            {METODO_LABEL[metodo] || orden.metodoPago || '—'}
          </span>
        </div>

        {/* Referencia / crédito */}
        {orden.referencia && (
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#9CA3AF' }}>
            Ref: {orden.referencia}
          </div>
        )}

        {/* ID completo de Firestore */}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#CBD5E1', wordBreak: 'break-all' }}>
          ID: {orden.id || id}
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#F5F5F7',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  center: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 24px',
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    className: 'no-print',
  },
  logo: {
    fontSize: 18, fontWeight: 800, color: '#1A7A48',
  },
  receipt: {
    maxWidth: 580, margin: '32px auto', padding: '28px',
    background: '#fff', borderRadius: 16,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  receiptHead: {
    textAlign: 'center',
  },
  badge: {
    display: 'inline-block',
    background: '#ECFDF5', color: '#059669',
    padding: '4px 14px', borderRadius: 20,
    fontWeight: 700, fontSize: 14,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: 700, color: '#9CA3AF',
    letterSpacing: '0.06em', textTransform: 'uppercase',
    margin: '0 0 10px 0',
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
  },
  th: {
    padding: '8px 10px', fontSize: 12, fontWeight: 600,
    color: '#6B7280', borderBottom: '1px solid #E5E7EB',
  },
  td: {
    padding: '10px', fontSize: 14, verticalAlign: 'middle',
  },
  totals: {
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  totalRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 14,
  },
  totalFinal: {
    fontSize: 18, fontWeight: 700, color: '#1A7A48',
    paddingTop: 8, borderTop: '1px solid #E5E7EB',
  },
  btnPrimary: {
    background: '#1A7A48', color: '#fff',
    border: 'none', borderRadius: 10, padding: '10px 24px',
    fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 16,
  },
  btnSecondary: {
    background: '#F3F4F6', color: '#374151',
    border: 'none', borderRadius: 8, padding: '8px 16px',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
  },
};

export default VentaDetalles;
