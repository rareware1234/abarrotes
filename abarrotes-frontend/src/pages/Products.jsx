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

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setLoading(false);
    }
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

      const response = await api.post('/products', payload);
      
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
              {products.map((product) => (
                <tr key={product.id}>
                  <td><span className="badge bg-secondary">{product.sku}</span></td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td className="text-end">${product.price?.toFixed(2)}</td>
                  <td className="text-end">${product.memberPrice?.toFixed(2)}</td>
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
