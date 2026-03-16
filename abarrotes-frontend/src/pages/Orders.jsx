import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    userId: '',
    status: 'PENDIENTE'
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        userId: parseInt(formData.userId),
        items: [] // Empty items for manual creation
      };

      await api.post('/orders', payload);
      alert('Pedido creado exitosamente');
      setShowModal(false);
      fetchOrders(); // Recargar lista
      setFormData({ userId: '', status: 'PENDIENTE' });
    } catch (error) {
      console.error("Error al crear pedido:", error);
      alert('Error al guardar el pedido. Revisa la consola.');
    }
  };

  if (loading) return <div className="p-4">Cargando pedidos...</div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Pedidos</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-lg"></i> Nuevo Pedido
        </button>
      </div>

      {/* Tabla de Pedidos */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light text-primary">
              <tr>
                <th>ID Pedido</th>
                <th>ID Usuario</th>
                <th>Fecha</th>
                <th className="text-end">Total</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
               {orders.map((order) => (
                 <tr key={order.id}>
                   <td><strong>#{order.id}</strong></td>
                   <td>{order.usuario?.nombre || order.userId}</td>
                   <td>{new Date(order.fechaPedido).toLocaleDateString()}</td>
                   <td className="text-end fw-bold">${order.montoTotal?.toFixed(2)}</td>
                   <td>
                     <span className={`badge ${
                       order.estado === 'PENDIENTE' ? 'bg-warning' : 
                       order.estado === 'PAGADO' ? 'bg-success' : 'bg-secondary'
                     }`}>
                       {order.estado}
                     </span>
                   </td>
                   <td className="text-center">
                     <button className="btn btn-sm btn-outline-primary me-1">Ver Detalles</button>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Nuevo Pedido */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Nuevo Pedido</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">ID Usuario</label>
                    <input type="number" className="form-control" name="userId" value={formData.userId} onChange={handleInputChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Estado</label>
                    <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="PAGADO">Pagado</option>
                      <option value="ENVIADO">Enviado</option>
                      <option value="ENTREGADO">Entregado</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Crear Pedido</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
