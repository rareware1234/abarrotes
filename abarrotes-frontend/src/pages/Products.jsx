import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseDb';
import { FaBox, FaSearch, FaPlus, FaTh, FaList, FaExclamationTriangle, FaSync, FaEdit, FaTrash } from 'react-icons/fa';

const DEFAULT_CATEGORIES = ["Abarrotes", "Frescos", "Limpieza", "Higiene Personal", "Bebidas", "Golosinas", "Lácteos", "Carnes", "Otros"];
const DEFAULT_UNITS = ["Pieza", "Paquete", "Caja", "Litro", "Kilo", "Gramo", "Bolsa", "Lata", "Botella"];

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
      
      // Try Firestore first
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
      
      // Fallback to API
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
    // ... existing code
  };

  return (
    <>
      {/* Filters Section - sticky below global navbar */}
      <div style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: '#f4f7f6',
        padding: '8px 4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {/* Filters Bar */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <div className="card-body p-2">
            <div className="d-flex gap-2 align-items-center">
              <div className="flex-grow-1">
                <div className="input-group" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                  <span className="input-group-text bg-white border-end-0" style={{ padding: '8px' }}>
                    <i className="bi bi-search" style={{ color: '#00843D', fontSize: '0.9rem' }}></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => { document.body.style.position = 'fixed'; document.body.style.height = '100dvh'; }}
                    onBlur={() => { document.body.style.position = ''; document.body.style.height = ''; }}
                    style={{ borderRadius: '0 8px 8px 0', fontSize: '16px', padding: '8px' }}
                  />
                </div>
              </div>
              <select className="form-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ borderRadius: '8px', fontSize: '0.85rem', padding: '8px', width: 'auto' }}>
                <option value="all">Categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button 
                className={`btn ${viewMode === 'grid' ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setViewMode('grid')}
                style={{ borderRadius: '8px', padding: '8px' }}
              >
                <i className="bi bi-grid-3x3-gap"></i>
              </button>
              <button 
                className={`btn ${viewMode === 'list' ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setViewMode('list')}
                style={{ borderRadius: '8px', padding: '8px' }}
              >
                <i className="bi bi-list-ul"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content - goes into main-content from App.jsx */}
      <div style={{ 
        paddingTop: '8px',
        paddingLeft: '8px', 
        paddingRight: '8px',
        paddingBottom: '8px',
        backgroundColor: '#f4f7f6'
      }}>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="products-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '20px'
        }}>
          {filteredProducts.map((product) => (
            <div 
              key={product.id}
              className="card border-0 shadow-sm"
              style={{ borderRadius: '16px', overflow: 'hidden', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
            >
              <div style={{ height: '160px', backgroundColor: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {product.imagen ? (
                  <img src={product.imagen} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <i className="bi bi-box-seam" style={{ fontSize: '4rem', color: '#ddd' }}></i>
                )}
              </div>
              <div className="card-body p-3">
                <div style={{ fontSize: '0.85rem', color: '#00843D', fontWeight: '600', marginBottom: '4px' }}>
                  {product.category}
                </div>
                <div style={{ 
                  fontSize: '0.95rem', 
                  color: '#333', 
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: '8px'
                }}>
                  {product.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '8px' }}>
                  SKU: {product.sku || 'N/A'}
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#00843D' }}>
                      ${(product.price * 1.16).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#888' }}>IVA incluido</div>
                  </div>
                  <button className="btn btn-sm" style={{ backgroundColor: '#00843D', color: 'white', borderRadius: '8px' }}>
                    <i className="bi bi-pencil"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th className="border-0 ps-4 py-3" style={{ color: '#00843D', fontWeight: '600' }}>Producto</th>
                  <th className="border-0" style={{ color: '#00843D', fontWeight: '600' }}>Categoría</th>
                  <th className="border-0" style={{ color: '#00843D', fontWeight: '600' }}>SKU</th>
                  <th className="border-0 text-end pe-4" style={{ color: '#00843D', fontWeight: '600' }}>Precio</th>
                  <th className="border-0 text-center" style={{ color: '#00843D', fontWeight: '600' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ width: '48px', height: '48px', backgroundColor: '#f8f8f8', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {product.imagen ? (
                            <img src={product.imagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <i className="bi bi-box-seam" style={{ color: '#ccc' }}></i>
                          )}
                        </div>
                        <span style={{ fontWeight: '500' }}>{product.name}</span>
                      </div>
                    </td>
                    <td><span className="badge" style={{ backgroundColor: '#e8f5ec', color: '#00843D' }}>{product.category}</span></td>
                    <td style={{ color: '#666', fontFamily: 'monospace' }}>{product.sku}</td>
                    <td className="text-end pe-4" style={{ fontWeight: '700', color: '#00843D' }}>${(product.price * 1.16).toFixed(2)}</td>
                    <td className="text-center">
                      <button className="btn btn-sm me-1" style={{ backgroundColor: '#00843D', color: 'white', borderRadius: '6px' }}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm" style={{ backgroundColor: '#dc3545', color: 'white', borderRadius: '6px' }}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="mt-4 d-flex justify-content-between align-items-center">
        <span className="text-muted" style={{ fontSize: '0.9rem' }}>
          {filteredProducts.length} productos encontrados
        </span>
        {searchTerm && (
          <button className="btn btn-link text-success" onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>
            Limpiar filtros
          </button>
        )}
      </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header" style={{ backgroundColor: '#00843D', color: 'white' }}>
                <h5 className="modal-title">Nuevo Producto</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Nombre del producto</label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} required style={{ borderRadius: '10px' }} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">SKU / Código de barras</label>
                      <input type="text" className="form-control" name="sku" value={formData.sku} onChange={handleInputChange} required style={{ borderRadius: '10px' }} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Precio</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input type="number" className="form-control" name="price" value={formData.price} onChange={handleInputChange} required style={{ borderRadius: '10px' }} />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Precio Socio</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input type="number" className="form-control" name="memberPrice" value={formData.memberPrice} onChange={handleInputChange} style={{ borderRadius: '10px' }} />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Categoría</label>
                      <select className="form-select" name="category" value={formData.category} onChange={handleInputChange} style={{ borderRadius: '10px' }}>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Unidad de medida</label>
                      <select className="form-select" name="unitMeasure" value={formData.unitMeasure} onChange={handleInputChange} style={{ borderRadius: '10px' }}>
                        {DEFAULT_UNITS.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Stock mínimo</label>
                      <input type="number" className="form-control" name="minStock" value={formData.minStock} onChange={handleInputChange} style={{ borderRadius: '10px' }} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)} style={{ borderRadius: '10px' }}>Cancelar</button>
                  <button type="submit" className="btn" style={{ backgroundColor: '#00843D', color: 'white', borderRadius: '10px' }}>Guardar Producto</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Products;
