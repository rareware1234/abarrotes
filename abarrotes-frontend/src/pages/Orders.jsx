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
  ENTREGADO: { label: 'Entregado', color: '#1B5E35', bg: '#e8f5e9', icon: FaCheck },
  CANCELADO: { label: 'Cancelado', color: '#f44336', bg: '#ffebee', icon: FaTimes }
};

const ORDER_TYPES = {
  PICKUP: { label: 'Pickup', icon: FaStore },
  DELIVERY: { label: 'Delivery', icon: FaMotorcycle }
};

const CHANNELS = {
  WHATSAPP: { label: 'WhatsApp', color: '#25D366', icon: FaWhatsapp },
  APP: { label: 'App', color: '#1B5E35', icon: FaMobileAlt },
  WEB: { label: 'Web', color: '#2196f3', icon: FaGlobe },
  POS: { label: 'POS', color: '#6c757d', icon: FaStore }
};

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

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
        customer: { name: 'Maria Garcia', phone: '+52 618 123 4567' },
        items: [
          { name: 'Coca Cola 600ml', quantity: 3, price: 18.00 },
          { name: 'Bimbo Pan', quantity: 1, price: 32.00 },
          { name: 'Huevos 12p', quantity: 1, price: 45.00 }
        ],
        subtotal: 95.00,
        total: 110.20,
        createdAt: new Date(now.getTime() - 10 * 60000).toISOString(),
        notes: 'Sin bolsas'
      },
      {
        id: 'PED-002',
        channel: 'APP',
        type: 'DELIVERY',
        status: 'PREPARANDO',
        customer: { name: 'Juan Perez', phone: '+52 618 987 6543', address: 'Av. Reforma #123, Col. Centro' },
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
        customer: { name: 'Ana Lopez', phone: '+52 618 456 7890' },
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
          { name: 'Jabon Zote', quantity: 3, price: 15.00 }
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
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
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
    
    if (diff < 1) return 'Ahora';
    if (diff < 60) return `Hace ${diff} min`;
    if (diff < 1440) return `Hace ${Math.floor(diff / 60)} hr`;
    return date.toLocaleDateString('es-MX');
  };

  return (
    <>
      <div className="search-bar">
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '8px 16px',
              border: activeTab === 'all' ? 'none' : '1.5px solid #e5e7eb',
              background: activeTab === 'all' ? '#1B5E35' : 'white',
              color: activeTab === 'all' ? 'white' : '#6b7c93',
              borderRadius: '20px',
              fontWeight: 500,
              fontSize: '14px',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveTab('pickup')}
            style={{
              padding: '8px 16px',
              border: activeTab === 'pickup' ? 'none' : '1.5px solid #e5e7eb',
              background: activeTab === 'pickup' ? '#1B5E35' : 'white',
              color: activeTab === 'pickup' ? 'white' : '#6b7c93',
              borderRadius: '20px',
              fontWeight: 500,
              fontSize: '14px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FaStore style={{ width: '14px', height: '14px' }} />
            Pickup
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            style={{
              padding: '8px 16px',
              border: activeTab === 'delivery' ? 'none' : '1.5px solid #e5e7eb',
              background: activeTab === 'delivery' ? '#1B5E35' : 'white',
              color: activeTab === 'delivery' ? 'white' : '#6b7c93',
              borderRadius: '20px',
              fontWeight: 500,
              fontSize: '14px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FaMotorcycle style={{ width: '14px', height: '14px' }} />
            Delivery
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px' }}>
          {Object.entries(ORDER_STATUS).slice(0, 5).map(([key, status]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
              style={{
                padding: '6px 12px',
                border: statusFilter === key ? 'none' : `1.5px solid ${status.color}`,
                background: statusFilter === key ? status.color : 'transparent',
                color: statusFilter === key ? 'white' : status.color,
                borderRadius: '20px',
                fontWeight: 500,
                fontSize: '12px',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {status.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7c93' }}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Buscar pedidos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              height: '44px',
              paddingLeft: '44px',
              border: '1.5px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '16px',
              background: 'white'
            }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '48px 24px', textAlign: 'center' }}>
            <FaBox style={{ fontSize: '48px', color: '#d1d5db' }} />
            <h4 style={{ marginTop: '16px', color: '#6b7c93' }}>No hay pedidos</h4>
            <p style={{ color: '#9ca3af' }}>Los pedidos apareceran aqui</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredOrders.map((order) => {
              const StatusIcon = ORDER_STATUS[order.status]?.icon || FaClock;
              const ChannelIcon = CHANNELS[order.channel]?.icon || FaGlobe;
              const ChannelColor = CHANNELS[order.channel]?.color || '#6c757d';
              const TypeIcon = ORDER_TYPES[order.type]?.icon || FaStore;
              
              return (
                <div 
                  key={order.id}
                  onClick={() => openOrderDetail(order)}
                  style={{ 
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    padding: '16px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '4px 10px', background: ChannelColor, color: 'white', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                        <ChannelIcon style={{ marginRight: '4px' }} />
                        {CHANNELS[order.channel]?.label}
                      </span>
                      <span style={{ padding: '4px 10px', background: order.type === 'PICKUP' ? '#1B5E35' : '#ff9800', color: 'white', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                        <TypeIcon style={{ marginRight: '4px' }} />
                        {ORDER_TYPES[order.type]?.label}
                      </span>
                    </div>
                    <span style={{ color: '#6b7c93', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FaClock style={{ width: '12px', height: '12px' }} />
                      {getTimeAgo(order.createdAt)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h5 style={{ margin: '0 0 4px 0', color: '#1B5E35', fontSize: '15px', fontWeight: 600 }}>#{order.id}</h5>
                      <p style={{ margin: 0, color: '#1a2b3c', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaUser style={{ width: '14px', height: '14px', color: '#6b7c93' }} />
                        {order.customer.name}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h4 style={{ margin: '0 0 4px 0', color: '#1B5E35', fontSize: '18px', fontWeight: 700 }}>${order.total.toFixed(2)}</h4>
                      <span style={{ 
                        padding: '4px 10px',
                        background: ORDER_STATUS[order.status]?.bg,
                        color: ORDER_STATUS[order.status]?.color,
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        <StatusIcon style={{ marginRight: '4px' }} />
                        {ORDER_STATUS[order.status]?.label}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6b7c93', fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaShoppingBag style={{ width: '14px', height: '14px' }} />
                      {order.items.length} producto{order.items.length > 1 ? 's' : ''}
                      {order.type === 'DELIVERY' && (
                        <span style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaMapMarker style={{ width: '12px', height: '12px' }} />
                          {order.customer.address?.substring(0, 25)}...
                        </span>
                      )}
                    </span>
                    {order.type === 'DELIVERY' && order.driver && (
                      <span style={{ padding: '4px 8px', background: '#e0f7fa', color: '#00bcd4', borderRadius: '12px', fontSize: '11px', fontWeight: 500 }}>
                        <FaMotorcycle style={{ marginRight: '4px' }} />
                        {order.driver}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showDetailModal && selectedOrder && (
        <div 
          style={{ 
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.5)', 
            zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            style={{ 
              background: 'white',
              width: '100%', maxWidth: '500px', maxHeight: '90vh', 
              borderRadius: '16px', overflow: 'auto',
              padding: '24px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#1B5E35', fontSize: '20px', fontWeight: 700 }}>#{selectedOrder.id}</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ padding: '4px 10px', background: CHANNELS[selectedOrder.channel]?.color, color: 'white', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                    {CHANNELS[selectedOrder.channel]?.label}
                  </span>
                  <span style={{ padding: '4px 10px', background: selectedOrder.type === 'PICKUP' ? '#1B5E35' : '#ff9800', color: 'white', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                    {ORDER_TYPES[selectedOrder.type]?.label}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                style={{ 
                  width: '40px', height: '40px',
                  border: '1.5px solid #e5e7eb',
                  background: 'white',
                  borderRadius: '50%',
                  cursor: 'pointer'
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#6b7c93', textTransform: 'uppercase', fontWeight: 600 }}>Estado</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {Object.entries(ORDER_STATUS).map(([key, status]) => (
                  <button
                    key={key}
                    onClick={() => updateOrderStatus(selectedOrder.id, key)}
                    style={{ 
                      padding: '6px 12px',
                      background: selectedOrder.status === key ? status.color : 'transparent',
                      color: selectedOrder.status === key ? 'white' : status.color,
                      border: `1.5px solid ${status.color}`,
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px', background: '#F3F4F6', borderRadius: '12px', marginBottom: '16px' }}>
              <h6 style={{ margin: '0 0 12px 0', fontWeight: 600 }}>Datos del Cliente</h6>
              <p style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaUser style={{ color: '#6b7c93', width: '16px', height: '16px' }} />
                {selectedOrder.customer.name}
              </p>
              <p style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaPhone style={{ color: '#6b7c93', width: '16px', height: '16px' }} />
                {selectedOrder.customer.phone}
              </p>
              {selectedOrder.type === 'DELIVERY' && (
                <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <FaMapMarker style={{ color: '#6b7c93', width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }} />
                  {selectedOrder.customer.address}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h6 style={{ margin: '0 0 12px 0', fontWeight: 600 }}>Productos</h6>
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                    <span style={{ color: '#6b7c93', marginLeft: '8px' }}>x{item.quantity}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: '#6b7c93' }}>Subtotal</span>
                <span>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              {selectedOrder.deliveryFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: '#6b7c93' }}>Envio</span>
                  <span>${selectedOrder.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #e5e7eb', marginTop: '8px' }}>
                <span style={{ fontWeight: 600 }}>Total</span>
                <span style={{ color: '#1B5E35', fontSize: '18px', fontWeight: 700 }}>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {selectedOrder.notes && (
              <div style={{ padding: '12px', background: '#fff3e0', borderRadius: '12px', marginBottom: '16px' }}>
                <h6 style={{ margin: '0 0 4px 0', fontWeight: 600 }}>Notas</h6>
                <p style={{ margin: 0, color: '#6b7c93', fontSize: '14px' }}>{selectedOrder.notes}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {selectedOrder.status === 'NUEVO' && (
                <button 
                  onClick={() => updateOrderStatus(selectedOrder.id, 'CONFIRMADO')}
                  className="btn-primary-custom"
                  style={{ flex: 1, background: '#2196f3' }}
                >
                  <FaCheck />Confirmar
                </button>
              )}
              {selectedOrder.status === 'CONFIRMADO' && (
                <button 
                  onClick={() => updateOrderStatus(selectedOrder.id, 'PREPARANDO')}
                  className="btn-primary-custom"
                  style={{ flex: 1, background: '#9c27b0' }}
                >
                  <FaPlay />Preparar
                </button>
              )}
              {selectedOrder.status === 'PREPARANDO' && (
                <button 
                  onClick={() => updateOrderStatus(selectedOrder.id, 'LISTO')}
                  className="btn-primary-custom"
                  style={{ flex: 1, background: '#4caf50' }}
                >
                  <FaCheckCircle />Marcar Listo
                </button>
              )}
              {selectedOrder.status === 'LISTO' && selectedOrder.type === 'DELIVERY' && (
                <button 
                  onClick={() => updateOrderStatus(selectedOrder.id, 'EN_REPARTO')}
                  className="btn-primary-custom"
                  style={{ flex: 1, background: '#00bcd4' }}
                >
                  <FaMotorcycle />Enviar
                </button>
              )}
              {(selectedOrder.status === 'LISTO' && selectedOrder.type === 'PICKUP') && (
                <button 
                  onClick={() => updateOrderStatus(selectedOrder.id, 'ENTREGADO')}
                  className="btn-primary-custom"
                  style={{ flex: 1 }}
                >
                  <FaCheckCircle />Entregado
                </button>
              )}
              {selectedOrder.status === 'EN_REPARTO' && (
                <button 
                  onClick={() => updateOrderStatus(selectedOrder.id, 'ENTREGADO')}
                  className="btn-primary-custom"
                  style={{ flex: 1 }}
                >
                  <FaCheckCircle />Entregado
                </button>
              )}
              <button 
                onClick={() => updateOrderStatus(selectedOrder.id, 'CANCELADO')}
                className="btn-outline-danger-custom"
              >
                <FaTimes />Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Orders;
