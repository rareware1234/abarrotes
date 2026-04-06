import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import productService from '../services/productService';
import StatCard from '../components/StatCard';
import BadgeEstado from '../components/BadgeEstado';
import FilterChips from '../components/FilterChips';
import ConfirmModal from '../components/ConfirmModal';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const Products = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const canEdit = hasPermission('productos_editar') || hasPermission('productos_agregar');

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
    if (stock <= min) return { label: 'Bajo', color: '#F59E0B' };
    return { label: 'OK', color: '#1A7A48' };
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.precioVenta) {
      alert('Nombre y precio de venta son requeridos');
      return;
    }

    const productData = {
      ...formData,
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

  const handleEdit = (product) => {
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
      imagen: product.imagen || ''
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Productos</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', width: '200px' }}
          />
          {canEdit && (
            <button
              onClick={() => { setEditingProduct(null); setFormData({ nombre: '', codigo: '', precioCompra: '', precioVenta: '', stock: '', stockMinimo: 5, categoria: '', proveedor: '', imagen: '' }); setShowModal(true); }}
              style={{ padding: '10px 20px', background: 'var(--role-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              <i className="bi bi-plus-lg me-2"></i>Nuevo Producto
            </button>
          )}
        </div>
      </div>

      <FilterChips
        opciones={categoryOptions}
        seleccionado={selectedCategory}
        onChange={setSelectedCategory}
      />

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', marginTop: '16px' }}>
        <button
          onClick={() => setViewMode('grid')}
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: viewMode === 'grid' ? 'var(--role-primary)' : 'white', color: viewMode === 'grid' ? 'white' : 'inherit', cursor: 'pointer' }}
        >
          <i className="bi bi-grid-3x3-gap"></i>
        </button>
        <button
          onClick={() => setViewMode('list')}
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: viewMode === 'list' ? 'var(--role-primary)' : 'white', color: viewMode === 'list' ? 'white' : 'inherit', cursor: 'pointer' }}
        >
          <i className="bi bi-list-ul"></i>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <span className="spinner-border spinner-border-lg"></span>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {filteredProducts.map(product => {
            const stockInfo = getStockBadge(product.stock, product.stockMinimo);
            return (
              <div key={product.id} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
                {product.imagen && (
                  <img src={product.imagen} alt={product.nombre} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>{product.nombre}</h3>
                  <span style={{ background: stockInfo.color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                    {stockInfo.label}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{product.codigo}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--role-primary)' }}>{formatCurrency(product.precioVenta)}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>+IVA: {formatCurrency(product.precioVenta * 1.16)}</div>
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => handleEdit(product)} style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button onClick={() => setDeleteConfirm(product)} style={{ padding: '6px 10px', border: '1px solid #EF4444', borderRadius: '6px', background: 'white', color: '#EF4444', cursor: 'pointer' }}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F4F5F7' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Nombre</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Código</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Categoría</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Precio</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Stock</th>
                {canEdit && <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const stockInfo = getStockBadge(product.stock, product.stockMinimo);
                return (
                  <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>{product.nombre}</td>
                    <td style={{ padding: '12px' }}>{product.codigo}</td>
                    <td style={{ padding: '12px' }}>{product.categoria}</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{formatCurrency(product.precioVenta)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: stockInfo.color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {product.stock} ({stockInfo.label})
                      </span>
                    </td>
                    {canEdit && (
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => handleEdit(product)} style={{ marginRight: '8px', padding: '6px', border: '1px solid var(--border)', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button onClick={() => setDeleteConfirm(product)} style={{ padding: '6px', border: '1px solid #EF4444', borderRadius: '4px', background: 'white', color: '#EF4444', cursor: 'pointer' }}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="confirm-modal" style={{ maxWidth: '500px', textAlign: 'left' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <input type="text" placeholder="Nombre *" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <input type="text" placeholder="Código de barras" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input type="number" placeholder="Precio compra" value={formData.precioCompra} onChange={e => setFormData({...formData, precioCompra: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <input type="number" placeholder="Precio venta *" value={formData.precioVenta} onChange={e => setFormData({...formData, precioVenta: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <input type="number" placeholder="Stock" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <input type="number" placeholder="Stock mínimo" value={formData.stockMinimo} onChange={e => setFormData({...formData, stockMinimo: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <input type="text" placeholder="Categoría" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              </div>
              <input type="text" placeholder="Proveedor" value={formData.proveedor} onChange={e => setFormData({...formData, proveedor: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <input type="text" placeholder="URL de imagen" value={formData.imagen} onChange={e => setFormData({...formData, imagen: e.target.value})} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-outline-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1, background: 'var(--role-primary)' }}>Guardar</button>
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