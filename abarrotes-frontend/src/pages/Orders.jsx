import React, { useState, useEffect } from 'react';
import orderService from '../services/orderService';
import BadgeEstado from '../components/BadgeEstado';
import FilterChips from '../components/FilterChips';
import StatCard from '../components/StatCard';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const formatDate = (date) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
};

const OrderDetailModal = ({ orden, onClose }) => {
  if (!orden) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirm-modal" style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Detalle de Orden</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ background: '#F4F5F7', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><strong>ID:</strong> {orden.id}</div>
            <div><strong>Fecha:</strong> {formatDate(orden.createdAt)}</div>
            <div><strong>Método:</strong> {orden.metodoPago}</div>
            <div><strong>Estado:</strong> <BadgeEstado estado={orden.status} /></div>
          </div>
        </div>

        <h4 style={{ marginBottom: '12px' }}>Productos</h4>
        <div style={{ marginBottom: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F4F5F7' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Producto</th>
                <th style={{ padding: '10px', textAlign: 'center', fontSize: '13px' }}>Cant.</th>
                <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>Precio</th>
                <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {orden.productos?.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px' }}>{item.nombre}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{item.cantidad}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(item.precioFinal || item.precioUnitario)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency((item.precioFinal || item.precioUnitario) * item.cantidad)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ borderTop: '2px solid var(--border)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Subtotal</span>
            <span>{formatCurrency(orden.subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>IVA (16%)</span>
            <span>{formatCurrency(orden.iva)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 700 }}>
            <span>Total</span>
            <span style={{ color: 'var(--role-primary)' }}>{formatCurrency(orden.total)}</span>
          </div>
          {orden.metodoPago === 'efectivo' && orden.efectivoRecibido && (
            <div style={{ marginTop: '12px', padding: '12px', background: '#F4F5F7', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Recibido</span>
                <span>{formatCurrency(orden.efectivoRecibido)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span>Cambio</span>
                <span style={{ color: '#1A7A48' }}>{formatCurrency(orden.cambio)}</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
          <button onClick={handlePrint} className="btn btn-outline-secondary" style={{ flex: 1 }}>
            <i className="bi bi-printer me-2"></i>Imprimir
          </button>
          <button onClick={onClose} className="btn btn-primary" style={{ flex: 1, background: 'var(--role-primary)' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

const Orders = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('hoy');
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [stats, setStats] = useState({ count: 0, total: 0 });

  useEffect(() => {
    fetchOrdenes();
  }, [filtro]);

  const fetchOrdenes = async () => {
    setLoading(true);
    const result = await orderService.getOrdenes(filtro);
    if (result.success) {
      setOrdenes(result.data);
      const total = result.data.reduce((sum, o) => sum + (o.total || 0), 0);
      setStats({ count: result.data.length, total });
    }
    setLoading(false);
  };

  const handleVerDetalle = (orden) => {
    setSelectedOrden(orden);
  };

  const filterOptions = [
    { value: 'hoy', label: 'Hoy' },
    { value: 'semana', label: 'Semana' },
    { value: 'mes', label: 'Mes' },
    { value: 'todas', label: 'Todas' }
  ];

  return (
    <div className="orders-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Pedidos</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: '#F4F5F7', padding: '8px 16px', borderRadius: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{stats.count} órdenes</span>
            <span style={{ marginLeft: '12px', fontWeight: 600 }}>{formatCurrency(stats.total)}</span>
          </div>
        </div>
      </div>

      <FilterChips opciones={filterOptions} seleccionado={filtro} onChange={setFiltro} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <span className="spinner-border spinner-border-lg"></span>
        </div>
      ) : ordenes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <i className="bi bi-inbox" style={{ fontSize: '64px', opacity: 0.3 }}></i>
          <p>No hay pedidos en este período</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', marginTop: '20px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F4F5F7' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Fecha/Hora</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Método</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>Productos</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map(orden => (
                <tr 
                  key={orden.id} 
                  onClick={() => handleVerDetalle(orden)}
                  style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                >
                  <td style={{ padding: '12px', fontFamily: 'monospace' }}>{orden.id.slice(-8)}</td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>{formatDate(orden.createdAt)}</td>
                  <td style={{ padding: '12px' }}>
                    <i className={`bi ${orden.metodoPago === 'efectivo' ? 'bi-cash' : 'bi-credit-card'}`}></i> {orden.metodoPago}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{orden.productos?.length || 0}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(orden.total)}</td>
                  <td style={{ padding: '12px' }}>
                    <BadgeEstado estado={orden.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrden && (
        <OrderDetailModal orden={selectedOrden} onClose={() => setSelectedOrden(null)} />
      )}
    </div>
  );
};

export default Orders;