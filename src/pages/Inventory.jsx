import React, { useState, useEffect } from 'react';
import productService from '../services/productService';

const fmt = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const stockStatus = (stock, minimo = 5) => {
  if (stock <= 0)       return { label: 'Sin stock',  color: '#EF4444', bg: '#FEF2F2' };
  if (stock <= minimo)  return { label: 'Stock bajo', color: '#F97316', bg: '#FFF7ED' };
  return                       { label: 'Normal',     color: '#22C55E', bg: '#F0FDF4' };
};

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({ quantity: '', unitCost: '', expiryDate: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await productService.fetchAll();
    if (res.success) {
      setProducts(res.data);
      setFiltered(res.data);
    } else {
      setError('Error al cargar productos de Firestore.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const term = search.toLowerCase().trim();
    if (!term) { setFiltered(products); return; }
    setFiltered(products.filter(p =>
      (p.nombre || '').toLowerCase().includes(term) ||
      (p.codigo || p.sku || '').toLowerCase().includes(term) ||
      (p.categoria || '').toLowerCase().includes(term) ||
      (p.proveedor || '').toLowerCase().includes(term)
    ));
  }, [search, products]);

  const openEntrada = (product) => {
    setSelectedProduct(product);
    setFormData({ quantity: '', unitCost: '', expiryDate: '' });
    setShowModal(true);
  };

  const handleEntrada = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const qty = parseInt(formData.quantity);
    if (!qty || qty <= 0) return;

    setSaving(true);
    const nuevoStock = (selectedProduct.stock || 0) + qty;
    const update = {
      stock: nuevoStock,
      ...(formData.unitCost && { precioCompra: parseFloat(formData.unitCost) }),
      ...(formData.expiryDate && { fechaCaducidad: formData.expiryDate }),
    };

    const res = await productService.update(selectedProduct.id, update);
    setSaving(false);

    if (res.success) {
      setToast({ message: `+${qty} unidades agregadas a ${selectedProduct.nombre}`, type: 'success' });
      setShowModal(false);
      load();
    } else {
      setToast({ message: 'Error al actualizar stock', type: 'error' });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const stats = {
    total: products.length,
    sinStock: products.filter(p => (p.stock || 0) <= 0).length,
    bajo: products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.stockMinimo || 5)).length,
    valorTotal: products.reduce((s, p) => s + ((p.precioCompra || 0) * (p.stock || 0)), 0),
  };

  return (
    <div style={{ padding: '20px 24px' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 12,
          background: toast.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          color: toast.type === 'success' ? '#065F46' : '#991B1B',
          border: `1px solid ${toast.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          fontWeight: 600, fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Inventario</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {loading ? 'Cargando...' : `${products.length} productos`}
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: 'var(--role-primary)', color: '#fff',
            border: 'none', borderRadius: 12, padding: '10px 20px',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <i className="bi bi-box-arrow-in-down" /> Registrar Entrada
        </button>
      </div>

      {/* KPI chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total productos', value: stats.total, color: '#2563EB' },
          { label: 'Sin stock', value: stats.sinStock, color: stats.sinStock > 0 ? '#EF4444' : '#9CA3AF' },
          { label: 'Stock bajo', value: stats.bajo, color: stats.bajo > 0 ? '#F97316' : '#9CA3AF' },
          { label: 'Valor inventario', value: fmt(stats.valorTotal), color: '#059669', wide: true },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid var(--border, #E5E7EB)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Búsqueda */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <i className="bi bi-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input
          type="text"
          placeholder="Buscar por nombre, código, categoría o proveedor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', height: 44, paddingLeft: 40, paddingRight: search ? 36 : 14,
            border: '1px solid var(--border, #E5E7EB)', borderRadius: 12,
            fontSize: 14, outline: 'none', boxSizing: 'border-box',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
            <i className="bi bi-x-lg" />
          </button>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div className="spinner-border" role="status" />
          <p style={{ marginTop: 16 }}>Cargando inventario...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#EF4444' }}>{error}</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border, #E5E7EB)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Producto', 'Categoría', 'Stock', 'Mínimo', 'Costo compra', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6B7280', borderBottom: '1px solid var(--border, #E5E7EB)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    {search ? 'Sin resultados para esta búsqueda' : 'No hay productos'}
                  </td>
                </tr>
              ) : filtered.map(p => {
                const img = p.imagenUrl || p.imagenes?.[0] || null;
                const st = stockStatus(p.stock || 0, p.stockMinimo || 5);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {img ? (
                          <img src={img} alt={p.nombre} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className="bi bi-box" style={{ color: '#9CA3AF' }} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nombre}</div>
                          {(p.codigo || p.sku) && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.codigo || p.sku}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{p.categoria || '—'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 15, color: st.color }}>{p.stock ?? 0}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{p.stockMinimo ?? 5}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{p.precioCompra ? fmt(p.precioCompra) : '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => openEntrada(p)}
                        title="Registrar entrada"
                        style={{ background: 'none', border: '1px solid var(--border, #E5E7EB)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--role-primary)' }}
                      >
                        <i className="bi bi-box-arrow-in-down" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid #F3F4F6' }}>
            Mostrando {filtered.length} de {products.length} productos
          </div>
        </div>
      )}

      {/* Modal entrada de inventario */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                {selectedProduct ? `Entrada: ${selectedProduct.nombre}` : 'Registrar Entrada'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>

            {!selectedProduct && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Producto</label>
                <select
                  onChange={e => setSelectedProduct(products.find(p => p.id === e.target.value) || null)}
                  style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid var(--border, #E5E7EB)', padding: '0 12px', fontSize: 14 }}
                >
                  <option value="">Seleccionar...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            )}

            <form onSubmit={handleEntrada}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Cantidad *</label>
                  <input
                    type="number" min="1" required
                    value={formData.quantity}
                    onChange={e => setFormData(f => ({ ...f, quantity: e.target.value }))}
                    style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid var(--border, #E5E7EB)', padding: '0 12px', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Costo unitario</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={formData.unitCost}
                    placeholder="$0.00"
                    onChange={e => setFormData(f => ({ ...f, unitCost: e.target.value }))}
                    style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid var(--border, #E5E7EB)', padding: '0 12px', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Fecha de caducidad</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={e => setFormData(f => ({ ...f, expiryDate: e.target.value }))}
                  style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid var(--border, #E5E7EB)', padding: '0 12px', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              {selectedProduct && (
                <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#065F46' }}>
                  Stock actual: <strong>{selectedProduct.stock ?? 0}</strong>
                  {formData.quantity && <> → <strong>{(selectedProduct.stock || 0) + parseInt(formData.quantity || 0)}</strong></>}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, height: 46, background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving || !selectedProduct}
                  style={{ flex: 1, height: 46, background: 'var(--role-primary)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
