import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseDb';
import { FaBox, FaSearch, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const DEFAULT_CATEGORIES = ["Abarrotes", "Frescos", "Limpieza", "Higiene Personal", "Bebidas", "Golosinas", "Lacteos", "Carnes", "Otros"];
const DEFAULT_UNITS = ["Pieza", "Paquete", "Caja", "Litro", "Kilo", "Gramo", "Bolsa", "Lata", "Botella"];

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const ListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    category: DEFAULT_CATEGORIES[0],
    description: '',
    unitMeasure: DEFAULT_UNITS[0],
    minStock: '',
    memberPrice: '',
    isActive: true
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        (product.name || '').toLowerCase().includes(term) ||
        (product.sku || '').toLowerCase().includes(term) ||
        (product.category || '').toLowerCase().includes(term)
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, products, selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = [];
      
      try {
        const snapshot = await getDocs(collection(db, 'productos'));
        if (!snapshot.empty) {
          data = snapshot.docs.map(d => {
            const p = d.data();
            return {
              id: d.id,
              name: p.nombre || p.name || p.descripcion || 'Sin nombre',
              price: parseFloat(p.precio || p.price || 0),
              sku: p.sku || p.barcode || p.codigoBarras || p.codigo || '',
              category: p.categoria || p.category || 'Otros',
              unitMeasure: p.unidad || p.unit || 'Pieza',
              imagen: p.imagen || ''
            };
          });
        }
      } catch(firestoreErr) {
        console.warn("Firestore error, using API:", firestoreErr.message);
      }
      
      if (data.length === 0) {
        try {
          const response = await api.get('/products');
          data = response.data || [];
        } catch(apiErr) {
          console.warn("API error:", apiErr.message);
        }
      }
      
      if (data.length === 0) {
        setError('No se pudieron cargar los productos');
      } else {
        setProducts(data);
        const cats = [...new Set(data.map(p => p.category).filter(Boolean))];
        if (cats.length > 0) setCategories(cats);
      }
    } catch (err) {
      console.error("Error al cargar productos:", err);
      setError(err.message || 'Error desconocido al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const retryFetch = () => {
    fetchProducts();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  };

  return (
    <>
      <div className="search-bar">
        <div className="search-bar-inner">
          <div style={{ position: 'relative', flex: 1 }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7c93' }}>
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%',
                height: '44px',
                paddingLeft: '44px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '16px',
                background: '#F3F4F6'
              }}
            />
          </div>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)} 
            style={{ 
              height: '44px',
              padding: '0 12px',
              border: '1.5px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="all">Categorias</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button 
            onClick={() => setViewMode('grid')}
            style={{ 
              width: '44px',
              height: '44px',
              border: viewMode === 'grid' ? 'none' : '1.5px solid #e5e7eb',
              background: viewMode === 'grid' ? '#1B5E35' : 'white',
              color: viewMode === 'grid' ? 'white' : '#6b7c93',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <GridIcon />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            style={{ 
              width: '44px',
              height: '44px',
              border: viewMode === 'list' ? 'none' : '1.5px solid #e5e7eb',
              background: viewMode === 'list' ? '#1B5E35' : 'white',
              color: viewMode === 'list' ? 'white' : '#6b7c93',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ListIcon />
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ color: '#dc3545', marginBottom: '16px' }}>{error}</p>
            <button onClick={retryFetch} className="btn-primary-custom">Reintentar</button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                className="product-card"
              >
                <div style={{ height: '120px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {product.imagen ? (
                    <img src={product.imagen} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <FaBox style={{ fontSize: '40px', color: '#d1d5db' }} />
                  )}
                </div>
                <div className="product-card-body">
                  <div style={{ fontSize: '12px', color: '#1B5E35', fontWeight: 600, marginBottom: '4px' }}>
                    {product.category}
                  </div>
                  <div className="product-card-name">
                    {product.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px', fontFamily: 'monospace' }}>
                    SKU: {product.sku || 'N/A'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="product-card-price">
                        ${(product.price * 1.16).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '10px', color: '#9ca3af' }}>IVA incl.</div>
                    </div>
                    <button style={{ padding: '8px', background: '#1B5E35', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                      <FaEdit style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F3F4F6' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#1B5E35' }}>Producto</th>
                  <th style={{ textAlign: 'left', padding: '14px 8px', fontSize: '13px', fontWeight: 600, color: '#1B5E35' }}>Categoria</th>
                  <th style={{ textAlign: 'left', padding: '14px 8px', fontSize: '13px', fontWeight: 600, color: '#1B5E35' }}>SKU</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#1B5E35' }}>Precio</th>
                  <th style={{ textAlign: 'center', padding: '14px 8px', fontSize: '13px', fontWeight: 600, color: '#1B5E35' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#F3F4F6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {product.imagen ? (
                            <img src={product.imagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                          ) : (
                            <FaBox style={{ color: '#d1d5db' }} />
                          )}
                        </div>
                        <span style={{ fontWeight: 500 }}>{product.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      <span style={{ padding: '4px 10px', background: 'rgba(27,94,53,0.1)', color: '#1B5E35', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>
                        {product.category}
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px', fontFamily: 'monospace', color: '#6b7c93' }}>{product.sku}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#1B5E35' }}>
                      ${(product.price * 1.16).toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <button style={{ padding: '6px', background: '#1B5E35', color: 'white', border: 'none', borderRadius: '6px', marginRight: '4px', cursor: 'pointer' }}>
                        <FaEdit style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button style={{ padding: '6px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        <FaTrash style={{ width: '14px', height: '14px' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#6b7c93', fontSize: '14px' }}>
            {filteredProducts.length} productos encontrados
          </span>
          {searchTerm && (
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
              style={{ background: 'none', border: 'none', color: '#1B5E35', cursor: 'pointer', fontWeight: 500 }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Nuevo Producto</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
                <FaTrash />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Nombre del producto</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU / Codigo de barras</label>
                    <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} required className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} required className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoria</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} className="form-input">
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline-green">Cancelar</button>
                <button type="submit" className="btn-primary-custom">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Products;
