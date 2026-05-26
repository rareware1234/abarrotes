import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import productService from '../services/productService';
import StatCard from '../components/StatCard';
import BadgeEstado from '../components/BadgeEstado';
import FilterChips from '../components/FilterChips';
import ConfirmModal from '../components/ConfirmModal';
import sinImagen from '../assets/sin-imagen.png';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const Products = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const canEdit = hasPermission('productos_editar') || hasPermission('productos_agregar');

  useEffect(() => {
    if (!canEdit) return;
    const handler = () => {
      setEditingProduct(null);
      setFormData({ nombre: '', codigo: '', precioCompra: '', precioVenta: '', stock: '', stockMinimo: 5, categoria: '', proveedor: '', imagen: '' });
      setShowModal(true);
    };
    window.addEventListener('open-nuevo-producto', handler);
    return () => window.removeEventListener('open-nuevo-producto', handler);
  }, [canEdit]);

  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    precioCompra: '',
    precioVenta: '',
    stock: '',
    stockMinimo: 5,
    categoria: '',
    proveedor: '',
    imagen: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const result = await productService.fetchAll();
    if (result.success) {
      setProducts(result.data);
      const cats = [...new Set(result.data.map(p => p.categoria).filter(Boolean))];
      setCategories(cats);
    }
    setLoading(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'todos' || p.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockBadge = (stock, min) => {
    if (stock === 0) return { label: 'Agotado', color: '#EF4444' };
    if (stock <= (min || 5)) return { label: 'Bajo', color: '#F59E0B' };
    return { label: 'OK', color: '#10B981' };
  };

  const getProductColor = (product) => {
    if (product.colorHex) return product.colorHex;
    const colors = ['#1A7A48', '#2563EB', '#7C3AED', '#F97316', '#EC4899', '#0891B2', '#059669'];
    const hash = (product.nombre || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.precioVenta) {
      alert('Nombre y precio de venta son requeridos');
      return;
    }

    // Schema canónico (ver SCHEMA.md): imagenUrl, no "imagen"
    const { imagen, ...rest } = formData;
    const productData = {
      ...rest,
      imagenUrl: imagen || rest.imagenUrl || '',
      precioCompra: parseFloat(formData.precioCompra) || 0,
      precioVenta: parseFloat(formData.precioVenta),
      stock: parseInt(formData.stock) || 0,
      stockMinimo: parseInt(formData.stockMinimo) || 5
    };

    let result;
    if (editingProduct) {
      result = await productService.update(editingProduct.id, productData);
    } else {
      result = await productService.create(productData);
    }

    if (result.success) {
      setShowModal(false);
      setEditingProduct(null);
      setFormData({ nombre: '', codigo: '', precioCompra: '', precioVenta: '', stock: '', stockMinimo: 5, categoria: '', proveedor: '', imagen: '' });
      fetchProducts();
    } else {
      alert('Error al guardar: ' + result.error);
    }
  };

  const handleView = (product) => {
    setViewingProduct(product);
  };

  const handleEdit = (product) => {
    setViewingProduct(null);
    setEditingProduct(product);
    setFormData({
      nombre: product.nombre || '',
      codigo: product.codigo || '',
      precioCompra: product.precioCompra?.toString() || '',
      precioVenta: product.precioVenta?.toString() || '',
      stock: product.stock?.toString() || '',
      stockMinimo: product.stockMinimo || 5,
      categoria: product.categoria || '',
      proveedor: product.proveedor || '',
      imagen: product.imagenUrl || product.imagen || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await productService.remove(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchProducts();
    }
  };

  const categoryOptions = [
    { value: 'todos', label: 'Todos' },
    ...categories.map(c => ({ value: c, label: c }))
  ];

  return (
    <div className="products-container">
      <div className="tiendas-header">
        <div>
          <h1>Productos</h1>
          <div className="tiendas-subtitle">{filteredProducts.length} productos en inventario</div>
        </div>
        <div className="tiendas-header-actions">
          {canEdit && (
            <button className="tiendas-add-btn" onClick={() => { setEditingProduct(null); setFormData({ nombre: '', codigo: '', precioCompra: '', precioVenta: '', stock: '', stockMinimo: 5, categoria: '', proveedor: '', imagen: '' }); setShowModal(true); }}>+</button>
          )}
        </div>
      </div>

      <div className="mobile-sticky-header">
        <div className="tiendas-search">
          <div className="tiendas-search-inner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Buscar por nombre o código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, minHeight: 'auto', minWidth: 'auto' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>

        <FilterChips
          opciones={categoryOptions}
          seleccionado={selectedCategory}
          onChange={setSelectedCategory}
          hasSearchBar
        />
      </div>

      <div className="products-scroll-area">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <span className="spinner-border spinner-border-lg"></span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {filteredProducts.map(product => {
            const stockInfo = getStockBadge(product.stock, product.stockMinimo);
            const color = getProductColor(product);
            return (
              <div key={product.id} style={{
                background: 'white', borderRadius: '16px', overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
              onClick={() => handleView(product)}
              >
                <div style={{
                  height: '120px', position: 'relative', overflow: 'hidden',
                  background: `linear-gradient(135deg, ${color}22, ${color}44)`
                }}>
                  {product.imagen || product.imagenUrl ? (
                    <img
                      src={product.imagen || product.imagenUrl}
                      alt={product.nombre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = sinImagen; e.target.style.objectFit = 'contain'; e.target.style.padding = '16px'; }}
                    />
                  ) : (
                    <img
                      src={sinImagen}
                      alt="Sin imagen"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '16px' }}
                    />
                  )}
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)',
                    padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: stockInfo.color }}></div>
                    <span style={{ color: stockInfo.color }}>{product.stock === 0 ? 'Agotado' : product.stock <= (product.stockMinimo || 5) ? 'Bajo' : `${product.stock} uds`}</span>
                  </div>
                </div>

                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.nombre}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontFamily: 'monospace' }}>{product.codigo || '—'}</span>
                    {product.categoria && <><span style={{ color: '#D1D5DB' }}>·</span><span>{product.categoria}</span></>}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--role-primary)' }}>{formatCurrency(product.precioVenta)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      </div>{/* /products-scroll-area */}

      {/* Panel detalle producto — bottom sheet */}
      {viewingProduct && (() => {
        const p = viewingProduct;
        const stockInfo = getStockBadge(p.stock, p.stockMinimo);
        const color = getProductColor(p);
        const margen = p.precioCompra && p.precioVenta
          ? (((p.precioVenta - p.precioCompra) / p.precioCompra) * 100).toFixed(0)
          : null;
        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: window.innerWidth >= 768 ? 'center' : 'flex-end', justifyContent: 'center' }}
            onClick={() => setViewingProduct(null)}
          >
            <div
              style={{ background: '#fff', borderRadius: window.innerWidth >= 768 ? '24px' : '24px 24px 0 0', width: '100%', maxWidth: '520px', height: window.innerWidth >= 768 ? 'auto' : '90dvh', maxHeight: window.innerWidth >= 768 ? '90vh' : 'none', overflow: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Imagen grande */}
              <div style={{ position: 'relative', height: '260px', background: `linear-gradient(135deg, ${color}22, ${color}55)`, borderRadius: '24px 24px 0 0', overflow: 'hidden', flexShrink: 0 }}>
                <img
                  src={p.imagen || p.imagenUrl || sinImagen}
                  alt={p.nombre}
                  style={{ width: '100%', height: '100%', objectFit: p.imagen || p.imagenUrl ? 'cover' : 'contain', padding: p.imagen || p.imagenUrl ? '0' : '40px' }}
                  onError={e => { e.target.src = sinImagen; e.target.style.objectFit = 'contain'; e.target.style.padding = '40px'; }}
                />
                {/* Botón cerrar */}
                <button
                  onClick={() => setViewingProduct(null)}
                  style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                {/* Badge stock */}
                <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: '20px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stockInfo.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: stockInfo.color }}>{p.stock === 0 ? 'Agotado' : p.stock <= (p.stockMinimo || 5) ? `Stock bajo · ${p.stock} uds` : `${p.stock} en stock`}</span>
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '20px 20px 8px' }}>
                {p.categoria && (
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--role-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{p.categoria}</div>
                )}
                <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: '#1C1E21' }}>{p.nombre}</h2>
                {p.codigo && (
                  <div style={{ fontSize: '13px', color: '#9CA3AF', fontFamily: 'monospace', marginBottom: '16px' }}>{p.codigo}</div>
                )}

                {/* Precios */}
                <div style={{ display: 'grid', gridTemplateColumns: margen ? '1fr 1fr 1fr' : '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500, marginBottom: '4px' }}>VENTA</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--role-primary)' }}>{formatCurrency(p.precioVenta)}</div>
                  </div>
                  {p.precioCompra > 0 && (
                    <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500, marginBottom: '4px' }}>COSTO</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#374151' }}>{formatCurrency(p.precioCompra)}</div>
                    </div>
                  )}
                  {margen && (
                    <div style={{ background: '#F0FDF4', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500, marginBottom: '4px' }}>MARGEN</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#16A34A' }}>{margen}%</div>
                    </div>
                  )}
                </div>

                {/* Detalles adicionales */}
                {(p.proveedor || p.stockMinimo) && (
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {p.proveedor && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: '#6B7C93' }}>Proveedor</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1C1E21' }}>{p.proveedor}</span>
                      </div>
                    )}
                    {p.stockMinimo && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: '#6B7C93' }}>Stock mínimo</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1C1E21' }}>{p.stockMinimo} uds</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Botones de acción */}
                {canEdit && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px', paddingBottom: '8px' }}>
                    <button
                      onClick={() => { setDeleteConfirm(p); setViewingProduct(null); }}
                      style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1.5px solid #FCA5A5', background: '#FFF1F2', color: '#DC2626', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={() => handleEdit(p)}
                      style={{ flex: 2, padding: '14px', borderRadius: '14px', border: 'none', background: 'var(--role-primary)', color: 'white', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}
                    >
                      Editar producto
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: window.innerWidth >= 768 ? 'center' : 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: window.innerWidth >= 768 ? '24px' : '24px 24px 0 0', width: '100%', maxWidth: '480px', height: window.innerWidth >= 768 ? 'auto' : '92dvh', maxHeight: window.innerWidth >= 768 ? '92vh' : 'none', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1C1E21' }}>{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h3>
                {editingProduct && <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{editingProduct.nombre}</div>}
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#6B7C93" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Campos — scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', WebkitOverflowScrolling: 'touch' }}>
              {/* Sección: Información básica */}
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--role-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Información básica</div>
              <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6B7C93', marginBottom: '5px' }}>Nombre *</label>
                  <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. Detergente Ariel 1kg" style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E4E6EA', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6B7C93', marginBottom: '5px' }}>Código de barras</label>
                    <input type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} placeholder="7501234567890" style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E4E6EA', borderRadius: '10px', fontSize: '15px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6B7C93', marginBottom: '5px' }}>Categoría</label>
                    <input type="text" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} placeholder="Limpieza" style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E4E6EA', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>

              {/* Sección: Precios */}
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--role-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Precios</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6B7C93', marginBottom: '5px' }}>Costo de compra</label>
                  <input type="number" value={formData.precioCompra} onChange={e => setFormData({...formData, precioCompra: e.target.value})} placeholder="0.00" style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E4E6EA', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6B7C93', marginBottom: '5px' }}>Precio de venta *</label>
                  <input type="number" value={formData.precioVenta} onChange={e => setFormData({...formData, precioVenta: e.target.value})} placeholder="0.00" style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E4E6EA', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Sección: Inventario */}
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--role-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Inventario</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6B7C93', marginBottom: '5px' }}>Stock actual</label>
                  <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="0" style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E4E6EA', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6B7C93', marginBottom: '5px' }}>Stock mínimo</label>
                  <input type="number" value={formData.stockMinimo} onChange={e => setFormData({...formData, stockMinimo: e.target.value})} placeholder="5" style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E4E6EA', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Sección: Otros */}
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--role-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Otros</div>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6B7C93', marginBottom: '5px' }}>Proveedor</label>
                  <input type="text" value={formData.proveedor} onChange={e => setFormData({...formData, proveedor: e.target.value})} placeholder="Nombre del proveedor" style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E4E6EA', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6B7C93', marginBottom: '5px' }}>URL de imagen</label>
                  <input type="url" value={formData.imagen} onChange={e => setFormData({...formData, imagen: e.target.value})} placeholder="https://..." style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E4E6EA', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            {/* Footer fijo */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '10px', flexShrink: 0, paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '1.5px solid #E4E6EA', background: 'white', fontSize: '15px', fontWeight: 600, color: '#6B7C93', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSave} style={{ flex: 2, padding: '13px', borderRadius: '12px', border: 'none', background: 'var(--role-primary)', fontSize: '15px', fontWeight: 600, color: 'white', cursor: 'pointer' }}>
                {editingProduct ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal
          titulo="Eliminar Producto"
          mensaje={`¿Estás seguro de eliminar "${deleteConfirm.nombre}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
          tipo="danger"
        />
      )}
    </div>
  );
};

export default Products;