import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // Estado para el formulario de recepción
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    unitCost: '',
    expiryDate: ''
  });

  useEffect(() => {
    fetchInventory();
    fetchProducts();
  }, []);

  const fetchInventory = async () => {
    try {
      // Como no hay un endpoint único para todo el inventario, 
      // vamos a obtener los productos y calcular el stock disponible para cada uno.
      const response = await api.get('/products');
      
      // Para cada producto, obtenemos el stock disponible
      const inventoryData = await Promise.all(
        response.data.map(async (product) => {
          try {
            const stockResponse = await api.get(`/inventory/stock/${product.id}`);
            return {
              ...product,
              availableStock: stockResponse.data
            };
          } catch (error) {
            return {
              ...product,
              availableStock: 0
            };
          }
        })
      );
      
      setInventory(inventoryData);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmitReception = async (e) => {
    e.preventDefault();
    try {
      // Construir la URL con query parameters como espera el backend
      const params = new URLSearchParams({
        productId: formData.productId,
        quantity: formData.quantity,
        unitCost: formData.unitCost,
        expiryDate: formData.expiryDate + 'T00:00:00' // Añadir hora para formato correcto
      });

      await api.post(`/inventory/receive?${params.toString()}`);
      alert('Entrada de inventario registrada exitosamente');
      setShowModal(false);
      fetchInventory(); // Recargar lista
      setFormData({ productId: '', quantity: '', unitCost: '', expiryDate: '' });
    } catch (error) {
      console.error("Error al registrar entrada:", error);
      alert('Error al registrar la entrada. Revisa la consola.');
    }
  };

  if (loading) return <div className="p-4">Cargando inventario...</div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Inventario</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-box-arrow-in-down"></i> Registrar Entrada
        </button>
      </div>

      {/* Tabla de Inventario */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light text-primary">
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th className="text-end">Stock Disponible</th>
                <th className="text-end">Stock Mínimo</th>
                <th className="text-end">Stock Máximo</th>
                <th className="text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong><br/>
                    <small className="text-muted">SKU: {item.sku}</small>
                  </td>
                  <td>{item.category}</td>
                  <td className="text-end fw-bold">{item.availableStock}</td>
                  <td className="text-end">{item.minStock}</td>
                  <td className="text-end">{item.maxStock}</td>
                  <td className="text-center">
                    {item.availableStock < item.minStock ? (
                      <span className="badge bg-danger">Stock Bajo</span>
                    ) : (
                      <span className="badge bg-success">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Registrar Entrada */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Registrar Entrada de Inventario</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmitReception}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Producto</label>
                    <select className="form-select" name="productId" value={formData.productId} onChange={handleInputChange} required>
                      <option value="">Seleccionar producto...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label">Cantidad</label>
                      <input type="number" className="form-control" name="quantity" value={formData.quantity} onChange={handleInputChange} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Costo Unitario ($)</label>
                      <input type="number" step="0.01" className="form-control" name="unitCost" value={formData.unitCost} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Fecha de Caducidad</label>
                      <input type="date" className="form-control" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Registrar Entrada</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
