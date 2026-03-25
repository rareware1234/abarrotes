import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
  FaBox, FaSearch, FaSync, FaWhatsapp, FaGlobe, FaMobileAlt,
  FaStore, FaMotorcycle, FaClock, FaCheck, FaPlay, FaCheckCircle,
  FaTimes, FaUser, FaMapMarker, FaPhone, FaShoppingBag
} from 'react-icons/fa';

const ORDER_STATUS = {
  NUEVO: { label: 'Nuevo', color: '#ff9800', bg: '#fff3e0', icon: FaClock },
  CONFIRMADO: { label: 'Confirmado', color: '#2196f3', bg: '#e3f2fd', icon: FaCheck },
  PREPARANDO: { label: 'Preparando', color: '#9c27b0', bg: '#f3e5f5', icon: FaPlay },
  LISTO: { label: 'Listo', color: '#4caf50', bg: '#e8f5e9', icon: FaCheckCircle },
  EN_REPARTO: { label: 'En Reparto', color: '#00bcd4', bg: '#e0f7fa', icon: FaMotorcycle },
  ENTREGADO: { label: 'Entregado', color: '#00843D', bg: '#e8f5e9', icon: FaCheck },
  CANCELADO: { label: 'Cancelado', color: '#f44336', bg: '#ffebee', icon: FaTimes }
};

const ORDER_TYPES = {
  PICKUP: { label: 'Pickup', icon: FaStore },
  DELIVERY: { label: 'Delivery', icon: FaMotorcycle }
};

const CHANNELS = {
  WHATSAPP: { label: 'WhatsApp', color: '#25D366', icon: FaWhatsapp },
  APP: { label: 'App', color: '#00843D', icon: FaMobileAlt },
  WEB: { label: 'Web', color: '#2196f3', icon: FaGlobe },
  POS: { label: 'POS', color: '#6c757d', icon: FaStore }
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await api.get('/orders', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const mockOrders = generateMockOrders();
      setOrders(mockOrders);
    } catch (err) {
      console.warn("Error al cargar pedidos:", err.message);
      const mockOrders = generateMockOrders();
      setOrders(mockOrders);
    } finally {
      setLoading(false);
    }
  };

  const generateMockOrders = () => {
    const now = new Date();
    return [
      {
        id: 'PED-001',
        channel: 'WHATSAPP',
        type: 'PICKUP',
        status: 'NUEVO',
        customer: { name: 'Maria García', phone: '+52 618 123 4567' },
        items: [
          { name: 'Coca Cola 600ml', quantity: 3, price: 18.00 },
          { name: 'Bimbo Pan', quantity: 1, price: 32.00 },
          { name: 'Huevos 12p', quantity: 1, price: 45.00 }
        ],
        subtotal: 95.00,
        total: 110.20,
        createdAt: new Date(now.getTime() - 10 * 60000).toISOString(),
        notes: 'Sin bolsas, favor de separar'
      },
      {
        id: 'PED-002',
        channel: 'APP',
        type: 'DELIVERY',
        status: 'PREPARANDO',
        customer: { name: 'Juan Pérez', phone: '+52 618 987 6543', address: 'Av. Reforma #123, Col. Centro' },
        items: [
          { name: 'Leche Lala 1L', quantity: 4, price: 24.00 },
          { name: 'Mantequilla', quantity: 2, price: 38.00 }
        ],
        subtotal: 100.00,
        total: 116.00,
        createdAt: new Date(now.getTime() - 25 * 60000).toISOString(),
        deliveryFee: 20.00,
        notes: 'Timbre dos veces'
      },
      {
        id: 'PED-003',
        channel: 'WEB',
        type: 'PICKUP',
        status: 'LISTO',
        customer: { name: 'Ana López', phone: '+52 618 456 7890' },
        items: [
          { name: 'Cerveza Modelo 6', quantity: 1, price: 96.00 },
          { name: 'Botanas Mix', quantity: 2, price: 35.00 }
        ],
        subtotal: 166.00,
        total: 192.56,
        createdAt: new Date(now.getTime() - 45 * 60000).toISOString(),
        notes: ''
      },
      {
        id: 'PED-004',
        channel: 'WHATSAPP',
        type: 'DELIVERY',
        status: 'EN_REPARTO',
        customer: { name: 'Carlos Mendoza', phone: '+52 618 321 0987', address: 'Blvd. Durango #456, Fracc. Las Palmas' },
        items: [
          { name: 'Agua Bonafont 1L', quantity: 6, price: 12.00 },
          { name: 'Jabón Zote', quantity: 3, price: 15.00 }
        ],
        subtotal: 107.00,
        total: 124.12,
        createdAt: new Date(now.getTime() - 60 * 60000).toISOString(),
        deliveryFee: 25.00,
        driver: 'Roberto',
        notes: 'Casa blanca con reja negra'
      },
      {
        id: 'PED-005',
        channel: 'APP',
        type: 'PICKUP',
        status: 'ENTREGADO',
        customer: { name: 'Laura Ruiz', phone: '+52 618 654 3210' },
        items: [
          { name: 'Refresco Pepsi 2L', quantity: 2, price: 28.00 },
          { name: 'Sabritas Original', quantity: 3, price: 18.00 }
        ],
        subtotal: 110.00,
        total: 127.60,
        createdAt: new Date(now.getTime() - 120 * 60000).toISOString(),
        notes: ''
      },
      {
        id: 'PED-006',
        channel: 'WEB',
        type: 'DELIVERY',
        status: 'CONFIRMADO',
        customer: { name: 'Miguel Torres', phone: '+52 618 111 2222', address: 'Calle 5 de Mayo #789' },
        items: [
          { name: 'Galletas Oreo', quantity: 4, price: 14.00 },
          { name: 'Ketchup Catsup', quantity: 2, price: 22.00 }
        ],
        subtotal: 100.00,
        total: 116.00,
        createdAt: new Date(now.getTime() - 5 * 60000).toISOString(),
        deliveryFee: 20.00,
        notes: 'Llamar al llegar'
      }
    ];
  };

  const getFilteredOrders = () => {
    let filtered = orders;

    if (activeTab === 'pickup') {
      filtered = filtered.filter(o => o.type === 'PICKUP');
    } else if (activeTab === 'delivery') {
      filtered = filtered.filter(o => o.type === 'DELIVERY');
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o => 
        o.id.toLowerCase().includes(term) ||
        o.customer.name.toLowerCase().includes(term) ||
        o.customer.phone.includes(term)
      );
    }

    return filtered;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
  };

  const getStatusCount = (status) => {
    if (status === 'all') return orders.length;
    return orders.filter(o => o.status === status).length;
  };

  const filteredOrders = getFilteredOrders();

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 60000);
    
    if (diff < 1) return 'Ahora mismo';
    if (diff < 60) return `Hace ${diff} min`;
    if (diff < 1440) return `Hace ${Math.floor(diff / 60)} hr`;
    return date.toLocaleDateString('es-MX');
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
        background: '#f4f7f6',
        padding: '8px 4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {/* Type Tabs */}
        <div className="card border-0 shadow-sm mb-2" style={{ borderRadius: '12px' }}>
          <div className="card-body p-2">
            <div className="d-flex gap-2">
              <button
                className={`btn flex-fill ${activeTab === 'all' ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab('all')}
                style={{ borderRadius: '8px', fontWeight: '600', fontSize: '0.8rem', padding: '6px 4px' }}
              >
                <FaShoppingBag className="me-1" />Todos
              </button>
              <button
                className={`btn flex-fill ${activeTab === 'pickup' ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab('pickup')}
                style={{ borderRadius: '8px', fontWeight: '600', fontSize: '0.8rem', padding: '6px 4px' }}
              >
                <FaStore className="me-1" />Pickup
              </button>
              <button
                className={`btn flex-fill ${activeTab === 'delivery' ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab('delivery')}
                style={{ borderRadius: '8px', fontWeight: '600', fontSize: '0.8rem', padding: '6px 4px' }}
              >
                <FaMotorcycle className="me-1" />Delivery
              </button>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="card border-0 shadow-sm mb-2" style={{ borderRadius: '12px' }}>
          <div className="card-body p-2" style={{ overflowX: 'auto' }}>
            <div className="d-flex gap-1" style={{ minWidth: 'max-content' }}>
              {Object.entries(ORDER_STATUS).slice(0, 5).map(([key, status]) => (
                <button
                  key={key}
                  className={`btn ${statusFilter === key ? '' : 'btn-outline-secondary'}`}
                  onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                  style={{ 
                    borderRadius: '16px', 
                    fontWeight: '500',
                    fontSize: '0.7rem',
                    padding: '4px 8px',
                    backgroundColor: statusFilter === key ? status.color : 'transparent',
                    color: statusFilter === key ? 'white' : status.color,
                    borderColor: status.color,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <div className="card-body p-2">
            <div className="input-group" style={{ borderRadius: '8px', overflow: 'hidden' }}>
              <span className="input-group-text bg-white border-end-0" style={{ padding: '8px' }}>
                <FaSearch style={{ color: '#00843D', fontSize: '0.9rem' }} />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ borderRadius: '0 8px 8px 0', fontSize: '0.9rem', padding: '8px' }}
              />
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

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="mt-2 text-muted">Cargando pedidos...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
          <div className="card-body text-center py-5">
            <FaBox style={{ fontSize: '4rem', color: '#ddd' }} />
            <h4 className="mt-3 text-muted">No hay pedidos</h4>
            <p className="text-muted">Los pedidos aparecerán aquí</p>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredOrders.map((order) => {
            const StatusIcon = ORDER_STATUS[order.status]?.icon || FaClock;
            const ChannelIcon = CHANNELS[order.channel]?.icon || FaGlobe;
            const ChannelColor = CHANNELS[order.channel]?.color || '#6c757d';
            const TypeIcon = ORDER_TYPES[order.type]?.icon || FaStore;
            
            return (
              <div 
                key={order.id}
                className="card border-0 shadow-sm"
                style={{ borderRadius: '16px', cursor: 'pointer' }}
                onClick={() => openOrderDetail(order)}
              >
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge" style={{ backgroundColor: ChannelColor, color: 'white', fontSize: '0.75rem' }}>
                        <ChannelIcon className="me-1" />
                        {CHANNELS[order.channel]?.label}
                      </span>
                      <span className="badge" style={{ backgroundColor: order.type === 'PICKUP' ? '#00843D' : '#ff9800', color: 'white', fontSize: '0.75rem' }}>
                        <TypeIcon className="me-1" />
                        {ORDER_TYPES[order.type]?.label}
                      </span>
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                      <FaClock className="me-1" />
                      {getTimeAgo(order.createdAt)}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="mb-1 fw-bold" style={{ color: '#00843D' }}>#{order.id}</h5>
                      <p className="mb-0 text-dark fw-medium">
                        <FaUser className="me-2" />
                        {order.customer.name}
                      </p>
                    </div>
                    <div className="text-end">
                      <h4 className="mb-0 fw-bold" style={{ color: '#00843D' }}>${order.total.toFixed(2)}</h4>
                      <span className="badge mt-1" style={{ 
                        backgroundColor: ORDER_STATUS[order.status]?.bg, 
                        color: ORDER_STATUS[order.status]?.color 
                      }}>
                        <StatusIcon className="me-1" />
                        {ORDER_STATUS[order.status]?.label}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                      <FaShoppingBag className="me-2" />
                      {order.items.length} producto{order.items.length > 1 ? 's' : ''}
                      {order.type === 'DELIVERY' && (
                        <span className="ms-3">
                          <FaMapMarker className="me-1" />
                          {order.customer.address?.substring(0, 30)}...
                        </span>
                      )}
                    </div>
                    {order.type === 'DELIVERY' && order.driver && (
                      <span className="badge bg-info">
                        <FaMotorcycle className="me-1" />
                        {order.driver}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div 
          className="position-fixed"
          style={{ 
            top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            className="bg-white"
            style={{ 
              width: '90%', maxWidth: '500px', maxHeight: '90vh', 
              borderRadius: '16px', overflow: 'auto',
              padding: '24px'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h3 className="mb-1 fw-bold" style={{ color: '#00843D' }}>#{selectedOrder.id}</h3>
                <div className="d-flex gap-2">
                  <span className="badge" style={{ backgroundColor: CHANNELS[selectedOrder.channel]?.color, color: 'white' }}>
                    {CHANNELS[selectedOrder.channel]?.icon && React.createElement(CHANNELS[selectedOrder.channel].icon, { className: 'me-1' })}
                    {CHANNELS[selectedOrder.channel]?.label}
                  </span>
                  <span className="badge" style={{ backgroundColor: selectedOrder.type === 'PICKUP' ? '#00843D' : '#ff9800', color: 'white' }}>
                    {ORDER_TYPES[selectedOrder.type]?.icon && React.createElement(ORDER_TYPES[selectedOrder.type].icon, { className: 'me-1' })}
                    {ORDER_TYPES[selectedOrder.type]?.label}
                  </span>
                </div>
              </div>
              <button 
                className="btn btn-outline-secondary"
                style={{ borderRadius: '50%', width: '40px', height: '40px' }}
                onClick={() => setShowDetailModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            {/* Status */}
            <div className="mb-4">
              <label className="text-muted small">Estado</label>
              <div className="d-flex flex-wrap gap-2 mt-1">
                {Object.entries(ORDER_STATUS).map(([key, status]) => (
                  <button
                    key={key}
                    className={`btn btn-sm ${selectedOrder.status === key ? '' : 'btn-outline-secondary'}`}
                    onClick={() => updateOrderStatus(selectedOrder.id, key)}
                    style={{ 
                      backgroundColor: selectedOrder.status === key ? status.color : 'transparent',
                      color: selectedOrder.status === key ? 'white' : status.color,
                      borderColor: status.color
                    }}
                  >
                    {status.icon && React.createElement(status.icon, { className: 'me-1', style: { fontSize: '0.7rem' } })}
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-4 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
              <h6 className="fw-bold mb-3">Datos del Cliente</h6>
              <p className="mb-1"><FaUser className="me-2 text-muted" />{selectedOrder.customer.name}</p>
              <p className="mb-1"><FaPhone className="me-2 text-muted" />{selectedOrder.customer.phone}</p>
              {selectedOrder.type === 'DELIVERY' && (
                <p className="mb-0"><FaMapMarker className="me-2 text-muted" />{selectedOrder.customer.address}</p>
              )}
            </div>

            {/* Items */}
            <div className="mb-4">
              <h6 className="fw-bold mb-3">Productos</h6>
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="d-flex justify-content-between py-2 border-bottom">
                  <div>
                    <span className="fw-medium">{item.name}</span>
                    <span className="text-muted ms-2">x{item.quantity}</span>
                  </div>
                  <span className="fw-bold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="d-flex justify-content-between py-2 mt-2">
                <span className="text-muted">Subtotal</span>
                <span>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              {selectedOrder.deliveryFee > 0 && (
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">Envío</span>
                  <span>${selectedOrder.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between py-2 fw-bold">
                <span>Total</span>
                <span style={{ color: '#00843D', fontSize: '1.2rem' }}>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="mb-4 p-3" style={{ backgroundColor: '#fff3e0', borderRadius: '12px' }}>
                <h6 className="fw-bold mb-2">Notas</h6>
                <p className="mb-0 text-muted">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="d-flex gap-2">
              {selectedOrder.status === 'NUEVO' && (
                <button 
                  className="btn flex-fill"
                  style={{ backgroundColor: '#2196f3', color: 'white' }}
                  onClick={() => updateOrderStatus(selectedOrder.id, 'CONFIRMADO')}
                >
                  <FaCheck className="me-2" /> Confirmar
                </button>
              )}
              {selectedOrder.status === 'CONFIRMADO' && (
                <button 
                  className="btn flex-fill"
                  style={{ backgroundColor: '#9c27b0', color: 'white' }}
                  onClick={() => updateOrderStatus(selectedOrder.id, 'PREPARANDO')}
                >
                  <FaPlay className="me-2" /> Iniciar Preparación
                </button>
              )}
              {selectedOrder.status === 'PREPARANDO' && (
                <button 
                  className="btn flex-fill"
                  style={{ backgroundColor: '#4caf50', color: 'white' }}
                  onClick={() => updateOrderStatus(selectedOrder.id, 'LISTO')}
                >
                  <FaCheckCircle className="me-2" /> Marcar Listo
                </button>
              )}
              {selectedOrder.status === 'LISTO' && selectedOrder.type === 'DELIVERY' && (
                <button 
                  className="btn flex-fill"
                  style={{ backgroundColor: '#00bcd4', color: 'white' }}
                  onClick={() => updateOrderStatus(selectedOrder.id, 'EN_REPARTO')}
                >
                  <FaMotorcycle className="me-2" /> Enviar a Reparto
                </button>
              )}
              {(selectedOrder.status === 'LISTO' && selectedOrder.type === 'PICKUP') && (
                <button 
                  className="btn flex-fill"
                  style={{ backgroundColor: '#00843D', color: 'white' }}
                  onClick={() => updateOrderStatus(selectedOrder.id, 'ENTREGADO')}
                >
                  <FaCheckCircle className="me-2" /> Entregado
                </button>
              )}
              {selectedOrder.status === 'EN_REPARTO' && (
                <button 
                  className="btn flex-fill"
                  style={{ backgroundColor: '#00843D', color: 'white' }}
                  onClick={() => updateOrderStatus(selectedOrder.id, 'ENTREGADO')}
                >
                  <FaCheckCircle className="me-2" /> Entregado
                </button>
              )}
              <button 
                className="btn btn-outline-danger"
                onClick={() => updateOrderStatus(selectedOrder.id, 'CANCELADO')}
              >
                <FaTimes />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Orders;
