import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

// Listas fijas para los selects
const CATEGORIES = [
  "Abarrotes",
  "Frescos",
  "Limpieza",
  "Higiene Personal",
  "Bebidas",
  "Golosinas",
  "Lácteos",
  "Carnes",
  "Otros"
];

const UNITS = [
  "Pieza",
  "Paquete",
  "Caja",
  "Litro",
  "Kilo",
  "Gramo",
  "Bolsa",
  "Lata",
  "Botella"
];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    category: CATEGORIES[0], // Valor por defecto
    description: '',
    unitMeasure: UNITS[0], // Valor por defecto
    minStock: '',
    memberPrice: '',
    isActive: true
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Filtrar productos cuando cambie el término de búsqueda o la lista de productos
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term)
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products');
      let data = response.data;
      
      // Si la API devuelve pocos productos o está vacía, usar productos de prueba
      if (!data || data.length < 10) {
        console.log("API devolvió pocos productos, cargando productos de prueba locales...");
        data = getProductosPrueba();
      }
      
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar productos desde API, usando productos de prueba:", error);
      setProducts(getProductosPrueba());
      setLoading(false);
    }
  };

  // Función para generar productos de prueba
  const getProductosPrueba = () => {
    return [
      { id: 1, name: 'Leche Entera Lala 1L', price: 22.50, sku: '7501055301011', category: 'Lácteos', unitMeasure: 'Litro', minStock: 10, memberPrice: 21.00, isActive: true },
      { id: 2, name: 'Pan Bimbo Blanco 680g', price: 32.90, sku: '7501055301021', category: 'Panadería', unitMeasure: 'Pieza', minStock: 20, memberPrice: 31.00, isActive: true },
      { id: 3, name: 'Huevos Jumbo Dozen', price: 45.00, sku: '7501055301031', category: 'Lácteos', unitMeasure: 'Caja', minStock: 15, memberPrice: 43.00, isActive: true },
      { id: 4, name: 'Aceite Vegetales Capullo 1L', price: 28.50, sku: '7501055301041', category: 'Despensa', unitMeasure: 'Litro', minStock: 10, memberPrice: 27.00, isActive: true },
      { id: 5, name: 'Arroz White 1kg', price: 18.00, sku: '7501055301051', category: 'Abarrotes', unitMeasure: 'Kilo', minStock: 20, memberPrice: 17.00, isActive: true },
      { id: 6, name: 'Frijoles Negros La Costeña 1kg', price: 24.00, sku: '7501055301061', category: 'Abarrotes', unitMeasure: 'Kilo', minStock: 15, memberPrice: 22.50, isActive: true },
      { id: 7, name: 'Cereal Kellogg\'s 500g', price: 55.00, sku: '7501055301071', category: 'Golosinas', unitMeasure: 'Paquete', minStock: 10, memberPrice: 52.00, isActive: true },
      { id: 8, name: 'Galletas Gamesa 400g', price: 15.50, sku: '7501055301081', category: 'Golosinas', unitMeasure: 'Paquete', minStock: 25, memberPrice: 14.50, isActive: true },
      { id: 9, name: 'Jugo de Naranja 1L', price: 20.00, sku: '7501055301091', category: 'Bebidas', unitMeasure: 'Litro', minStock: 15, memberPrice: 19.00, isActive: true },
      { id: 10, name: 'Yogurt Natural 1L', price: 25.00, sku: '7501055301101', category: 'Lácteos', unitMeasure: 'Litro', minStock: 10, memberPrice: 23.50, isActive: true },
      { id: 11, name: 'Queso Fresco 500g', price: 35.00, sku: '7501055301111', category: 'Lácteos', unitMeasure: 'Pieza', minStock: 10, memberPrice: 33.00, isActive: true },
      { id: 12, name: 'Crema Ácida 200ml', price: 18.50, sku: '7501055301121', category: 'Lácteos', unitMeasure: 'Pieza', minStock: 15, memberPrice: 17.50, isActive: true },
      { id: 13, name: 'Mantequilla 200g', price: 22.00, sku: '7501055301131', category: 'Lácteos', unitMeasure: 'Pieza', minStock: 15, memberPrice: 21.00, isActive: true },
      { id: 14, name: 'Café Instantáneo 100g', price: 45.00, sku: '7501055301141', category: 'Abarrotes', unitMeasure: 'Pieza', minStock: 10, memberPrice: 42.00, isActive: true },
      { id: 15, name: 'Té en Bolsa 25 unidades', price: 12.00, sku: '7501055301151', category: 'Abarrotes', unitMeasure: 'Caja', minStock: 20, memberPrice: 11.00, isActive: true },
      { id: 16, name: 'Azúcar Blanca 1kg', price: 16.50, sku: '7501055301161', category: 'Abarrotes', unitMeasure: 'Kilo', minStock: 20, memberPrice: 15.50, isActive: true },
      { id: 17, name: 'Sal de Mesa 1kg', price: 8.00, sku: '7501055301171', category: 'Abarrotes', unitMeasure: 'Kilo', minStock: 20, memberPrice: 7.50, isActive: true },
      { id: 18, name: 'Pasta San Marcos 500g', price: 14.00, sku: '7501055301181', category: 'Abarrotes', unitMeasure: 'Paquete', minStock: 25, memberPrice: 13.00, isActive: true },
      { id: 19, name: 'Salsa de Tomate 1kg', price: 18.00, sku: '7501055301191', category: 'Despensa', unitMeasure: 'Lata', minStock: 15, memberPrice: 17.00, isActive: true },
      { id: 20, name: 'Cerveza Modelo 6 pack', price: 75.00, sku: '7501055301201', category: 'Bebidas', unitMeasure: 'Caja', minStock: 10, memberPrice: 72.00, isActive: true },
    ];
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

    // Validación básica de campos numéricos
    if (!formData.price || !formData.memberPrice || !formData.minStock) {
      alert('Por favor, completa los campos numéricos requeridos.');
      return;
    }

    try {
      // Convertir precios y cantidades a números
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        memberPrice: parseFloat(formData.memberPrice),
        minStock: parseInt(formData.minStock)
      };

      console.log("Enviando payload:", JSON.stringify(payload, null, 2));

      const response = await api.post('/api/products', payload);
      
      console.log("Respuesta del servidor:", response.data);
      
      alert('Producto creado exitosamente');
      setShowModal(false);
      fetchProducts(); // Recargar lista
      setFormData({ // Resetear formulario
        name: '', sku: '', price: '', category: CATEGORIES[0], description: '',
        unitMeasure: UNITS[0], minStock: '', memberPrice: '', isActive: true
      });
    } catch (error) {
      console.error("Error al crear producto:", error);
      if (error.response) {
        console.error("Datos de error del servidor:", error.response.data);
        console.error("Código de estado:", error.response.status);
        console.error("Headers:", error.response.headers);
      } else if (error.request) {
        console.error("No se recibió respuesta del servidor:", error.request);
      }
      alert('Error al guardar el producto. Revisa la consola.');
    }
  };

  if (loading) return <div className="p-4">Cargando productos...</div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Productos</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-lg"></i> Nuevo Producto
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre, SKU o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="new-password"
              style={{
                backgroundColor: 'white',
                color: '#212529'
              }}
            />
            {searchTerm && (
              <button className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light text-primary">
              <tr>
                <th>SKU</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th className="text-end">Precio</th>
                <th className="text-end">Precio Socio</th>
                <th>Unidad</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td><span className="badge bg-secondary">{product.sku}</span></td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td className="text-end">${product.price ? (product.price * 1.16).toFixed(2) : '0.00'}</td>
                  <td className="text-end">${product.memberPrice ? (product.memberPrice * 1.16).toFixed(2) : '0.00'}</td>
                  <td>{product.unitMeasure}</td>
                  <td className="text-center">
                    <button className="btn btn-sm btn-outline-primary me-1">Editar</button>
                    <button className="btn btn-sm btn-outline-danger">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Contador de productos */}
      <div className="mt-2 text-muted small">
        Mostrando {filteredProducts.length} de {products.length} productos
      </div>

      {/* Modal para Nuevo Producto */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Nuevo Producto</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Nombre</label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">SKU</label>
                      <input type="text" className="form-control" name="sku" value={formData.sku} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Precio</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input type="number" step="0.01" className="form-control" name="price" value={formData.price} onChange={handleInputChange} required />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Precio Socio</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input type="number" step="0.01" className="form-control" name="memberPrice" value={formData.memberPrice} onChange={handleInputChange} required />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Categoría</label>
                      <select className="form-select" name="category" value={formData.category} onChange={handleInputChange} required>
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Descripción</label>
                      <textarea className="form-control" name="description" value={formData.description} onChange={handleInputChange} rows="2"></textarea>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Unidad de Medida</label>
                      <select className="form-select" name="unitMeasure" value={formData.unitMeasure} onChange={handleInputChange} required>
                        {UNITS.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Stock Mínimo</label>
                      <input type="number" className="form-control" name="minStock" value={formData.minStock} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12">
                      <div className="form-check">
                        <input type="checkbox" className="form-check-input" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                        <label className="form-check-label">Producto Activo</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Guardar Producto</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
