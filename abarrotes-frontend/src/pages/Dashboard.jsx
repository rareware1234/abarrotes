import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';

// Instancia separada para el servicio de facturación
const billingApi = axios.create({
  baseURL: '/billing',
  headers: {
    'Content-Type': 'application/json'
  }
});

const Dashboard = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null); // Referencia para el input de escaneo

  // Estado de la Venta Actual
  const [cart, setCart] = useState([]);
  const [scanCode, setScanCode] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Estado para el modal de pago
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('01'); // Por defecto: Efectivo
  
  // Estado para el modal de confirmación de venta
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [ventaData, setVentaData] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  
  // Configuración de CLABE Interbancaria (cargada desde localStorage o valores por defecto)
  const [config, setConfig] = useState({
    clabeInterbancaria: '044185002754631919',
    nombreEmpresa: 'Abarrotes Digitales',
    banco: 'BBVA',
    regimenFiscal: '612',
    lugarExpedicion: '06000',
    rfcEmpresa: 'AAD980314XXX',
    direccionEmpresa: 'Av. Principal #123, Col. Centro, CDMX'
  });

  // Cargar configuración desde localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('sistemaConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  // Efecto para mantener el foco en el input de escaneo
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Enfocar input con Ctrl + B
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        inputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Manejar escaneo o entrada manual
  const handleScan = async (e) => {
    e.preventDefault();
    const code = scanCode.trim();
    if (!code) return;

    try {
      // Intentar buscar el producto por SKU o Codigo de Barras
      // Optimizado: busqueda directa por SKU primero (más eficiente)
      let product = null;
      
      // Intentar buscar directamente por SKU si parece un SKU válido
      if (code.length >= 3 && !code.includes(' ')) {
        try {
          const response = await api.get(`/products/search?sku=${encodeURIComponent(code)}`);
          if (response.data && response.data.length > 0) {
            product = response.data[0];
          }
        } catch (searchError) {
          // Si el endpoint de búsqueda no existe, continuar con búsqueda local
          console.log("Endpoint de búsqueda no disponible, usando búsqueda local");
        }
      }
      
      // Si no encontramos por SKU, buscar en todos los productos (fallback)
      if (!product) {
        const response = await api.get(`/products`);
        const products = response.data;
        product = products.find(p => p.nombre.toLowerCase().includes(code.toLowerCase()));
      }

      if (product) {
        addToCart(product);
        setScanCode('');
        setMessage({ type: 'success', text: `Producto agregado: ${product.nombre}` });
        // Limpiar mensaje después de 2 segundos
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      } else {
        setMessage({ type: 'error', text: `Producto no encontrado: ${code}` });
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error("Error al buscar producto:", error);
      setMessage({ type: 'error', text: 'Error de conexión al buscar producto' });
    }
  };

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.precio }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1, subtotal: product.precio }];
      }
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null; // Marcar para eliminar
          return { ...item, quantity: newQty, subtotal: newQty * item.precio };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeItem = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handlePayment = () => {
    if (cart.length === 0) {
      setMessage({ type: 'warning', text: 'El carrito está vacío' });
      return;
    }
    
    // Mostrar modal de pago en lugar de enviar la orden directamente
    setShowPaymentModal(true);
  };

  const confirmPayment = () => {
    // Formato esperado por el backend monolítico
    const newOrder = {
      userId: 1, // Usuario genérico de prueba
      items: cart.map(item => ({ productId: item.id, quantity: item.quantity }))
    };

    console.log("Enviando orden:", newOrder);

    api.post('/orders', newOrder)
      .then(orderRes => {
        console.log("Orden creada:", orderRes.data);
        
        // Ahora generar el ticket de facturación
        const billingRequest = {
          orderId: orderRes.data.id,
          items: cart.map(item => ({
            productId: item.id,
            descripcion: item.nombre,
            cantidad: item.quantity,
            precio: item.precio
          })),
          formaPago: selectedPaymentMethod
        };

        console.log("Generando ticket:", billingRequest);
        
        return billingApi.post('/api/billing/ticket', billingRequest);
      })
      .then(billingRes => {
        console.log("Ticket generado:", billingRes.data);
        
        // Calcular totales para la página de detalles
        const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
        const totalImpuestos = subtotal * 0.16;
        const total = subtotal + totalImpuestos;
        
        // Preparar datos para la página de detalles
        const ventaDataLocal = {
          items: cart.map(item => ({
            nombre: item.nombre,
            quantity: item.quantity,
            subtotal: item.precio * item.quantity
          })),
          subtotal: subtotal,
          totalImpuestos: totalImpuestos,
          total: total,
          formaPago: selectedPaymentMethod
        };
        
        const ticketDataLocal = {
          uuid: billingRes.data.uuid,
          fechaEmision: billingRes.data.fechaEmision
        };
        
        // Guardar datos y mostrar modal de confirmación
        setVentaData(ventaDataLocal);
        setTicketData(ticketDataLocal);
        setShowConfirmationModal(true);
        
        // Limpiar carrito
        setCart([]);
        setShowPaymentModal(false);
      })
      .catch(err => {
        console.error("Error details:", err.response ? err.response.data : err.message);
        const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error desconocido';
        setMessage({ type: 'error', text: `Error: ${errorMsg}` });
        setShowPaymentModal(false);
      });
  };

  const cancelPayment = () => {
    setShowPaymentModal(false);
  };

  return (
    <>
      <div className="container-fluid p-0 d-flex flex-column" style={{ backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
      
      {/* Header / Barra Superior */}
      <div className="d-flex justify-content-between align-items-center px-4 py-3 bg-white shadow-sm">
        <div className="d-flex align-items-center">
           <img src="/src/assets/logo.png" alt="Logo" style={{ height: '40px', marginRight: '15px' }} />
           <h4 className="mb-0 fw-bold text-dark">Punto de Venta</h4>
        </div>
        <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary rounded-pill" onClick={() => navigate('/productos')}>
                <i className="bi bi-box-seam me-2"></i> Inventario
            </button>
            <button className="btn btn-outline-secondary rounded-pill" onClick={() => navigate('/pedidos')}>
                <i className="bi bi-clock-history me-2"></i> Historial
            </button>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-grow-1 d-flex">
        
        {/* Columna Izquierda: Buscador y Lista de Productos (Opcional) */}
        <div className="col-md-8 d-flex flex-column p-4">
          
          {/* Barra de Escaneo */}
          <form onSubmit={handleScan} className="mb-4">
            <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-upc-scan text-muted" style={{ fontSize: '1.5rem' }}></i>
              </span>
              <input
                ref={inputRef}
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Escanear código o peso..."
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                autoFocus
                style={{ fontSize: '1.2rem' }}
              />
              <button className="btn btn-primary px-4" type="submit" style={{ backgroundColor: '#006241', borderColor: '#006241' }}>
                Agregar
              </button>
            </div>
            <small className="text-muted ms-2">Presiona Ctrl+B para enfocar rápidamente</small>
          </form>

          {/* Mensaje de Feedback */}
          {message.text && (
            <div className={`alert alert-${message.type === 'success' ? 'success' : message.type === 'error' ? 'danger' : 'warning'} d-flex align-items-center mb-3`} role="alert">
              <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
              {message.text}
            </div>
          )}

          {/* Lista de Productos en Carrito (Estilo Ticket) */}
          <div className="card border-0 shadow-sm flex-grow-1 rounded-4 overflow-hidden">
            <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Artículos en Venta</h5>
              <span className="badge bg-secondary rounded-pill">{cart.length} items</span>
            </div>
            <div className="card-body p-0 overflow-auto" style={{ maxHeight: '60vh' }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light sticky-top">
                  <tr>
                    <th className="border-0 ps-4 py-3">Producto</th>
                    <th className="border-0 text-center">Cant.</th>
                    <th className="border-0 text-end pe-4">Precio</th>
                    <th className="border-0 text-end pe-4">Subtotal</th>
                    <th className="border-0"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted">
                        <i className="bi bi-cart-x display-4 d-block mb-2"></i>
                        El carrito está vacío<br/>
                        <small>Escanee un producto para comenzar</small>
                      </td>
                    </tr>
                  ) : (
                    cart.map((item) => (
                      <tr key={item.id} className="border-bottom">
                        <td className="ps-4 py-3 fw-medium">{item.nombre}</td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm" role="group">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => updateQuantity(item.id, -1)}>-</button>
                            <button type="button" className="btn btn-outline-secondary disabled text-dark" style={{ minWidth: '40px' }}>{item.quantity}</button>
                            <button type="button" className="btn btn-outline-secondary" onClick={() => updateQuantity(item.id, 1)}>+</button>
                          </div>
                        </td>
                        <td className="text-end pe-4">${item.precio.toFixed(2)}</td>
                        <td className="text-end pe-4 fw-bold">${item.subtotal.toFixed(2)}</td>
                        <td className="text-end pe-3">
                          <button className="btn btn-link text-danger p-0" onClick={() => removeItem(item.id)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Resumen de Pago (Panel Lateral) */}
        <div className="col-md-4 bg-white shadow-lg p-4 d-flex flex-column" style={{ minHeight: '100vh' }}>
          <h4 className="mb-4 fw-bold">Resumen de Venta</h4>
          
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Subtotal</span>
            <span className="fw-medium">${total.toFixed(2)}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">IVA (16%)</span>
            <span className="fw-medium">${(total * 0.16).toFixed(2)}</span>
          </div>
          <hr />
          <div className="d-flex justify-content-between mb-5">
            <span className="h5 mb-0 fw-bold">Total</span>
            <span className="h4 mb-0 fw-bold text-primary">${(total * 1.16).toFixed(2)}</span>
          </div>

          {/* Teclado Rápido (Útil para bascula o cantidades manuales) */}
          <div className="mb-4">
            <label className="form-label small text-muted text-uppercase">Cantidad Manual</label>
            <div className="input-group mb-2">
                <input type="number" className="form-control form-control-lg text-center" placeholder="0" />
                <button className="btn btn-outline-secondary">KG</button>
                <button className="btn btn-outline-secondary">Und</button>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="mt-auto">
            <div className="d-grid gap-3">
              <button 
                className="btn btn-lg py-3 rounded-4 fw-bold text-white shadow-sm"
                style={{ backgroundColor: '#006241', borderColor: '#006241' }}
                onClick={handlePayment}
              >
                <i className="bi bi-credit-card-2-front me-2"></i> Cobrar
              </button>
              <button 
                className="btn btn-lg py-3 rounded-4 fw-bold btn-outline-secondary"
                onClick={() => setCart([])}
              >
                <i className="bi bi-x-circle me-2"></i> Cancelar Venta
              </button>
            </div>
          </div>
          
          <div className="mt-4 text-center text-muted small">
            <p>Usa la pistola de código o la báscula conectada.</p>
          </div>
        </div>

      </div>
    </div>
    
    // Modal de Pago
    {showPaymentModal && (
      <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header" style={{ backgroundColor: '#006241', color: 'white' }}>
              <h5 className="modal-title">Finalizar Venta</h5>
              <button type="button" className="btn-close btn-close-white" onClick={cancelPayment}></button>
            </div>
            <div className="modal-body">
              <div className="text-center mb-4">
                <h3 className="fw-bold" style={{ color: '#006241' }}>
                  Total: ${total.toFixed(2)}
                </h3>
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">Método de Pago</label>
                <div className="d-grid gap-2">
                  <button 
                    className={`btn btn-lg py-3 ${selectedPaymentMethod === '01' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSelectedPaymentMethod('01')}
                  >
                    <i className="bi bi-cash me-2"></i> Efectivo
                  </button>
                  <button 
                    className={`btn btn-lg py-3 ${selectedPaymentMethod === '03' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSelectedPaymentMethod('03')}
                  >
                    <i className="bi bi-credit-card me-2"></i> Tarjeta
                  </button>
                  <button 
                    className={`btn btn-lg py-3 ${selectedPaymentMethod === '04' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSelectedPaymentMethod('04')}
                  >
                    <i className="bi bi-phone me-2"></i> Transferencia
                  </button>
                </div>
              </div>
              
              {/* Sección de QR para Transferencia */}
              {selectedPaymentMethod === '04' && (
                <div className="mt-4 p-3 bg-light rounded text-center">
                  <h6 className="mb-3">Código QR para Transferencia</h6>
                  <div className="d-flex justify-content-center mb-3">
                    <div className="p-2 bg-white rounded shadow-sm">
                      <QRCodeCanvas 
                        value={config.clabeInterbancaria} 
                        size={150}
                        level={"H"}
                        includeMargin={true}
                      />
                    </div>
                  </div>
                  <div className="text-start">
                    <p className="mb-1"><strong>CLABE:</strong> {config.clabeInterbancaria}</p>
                    <p className="mb-1"><strong>Banco:</strong> {config.banco}</p>
                    <p className="mb-0"><strong>Beneficiario:</strong> {config.nombreEmpresa}</p>
                  </div>
                </div>
              )}
              
              <div className="mt-4 p-3 bg-light rounded">
                <h6>Resumen del Pedido</h6>
                <ul className="list-unstyled mb-0">
                  {cart.map((item, index) => (
                    <li key={index} className="d-flex justify-content-between mb-1">
                      <span>{item.nombre} x {item.quantity}</span>
                      <span>${item.subtotal.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-lg" onClick={cancelPayment}>
                <i className="bi bi-x-circle me-2"></i> Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-lg" 
                style={{ backgroundColor: '#006241', borderColor: '#006241' }}
                onClick={confirmPayment}
              >
                <i className="bi bi-check-circle me-2"></i> Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    
    {/* Modal de Confirmación de Venta */}
    {showConfirmationModal && ticketData && (
      <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header" style={{ backgroundColor: '#006241', color: 'white' }}>
              <h5 className="modal-title">
                <i className="bi bi-check-circle me-2"></i> Venta Exitosa
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowConfirmationModal(false)}></button>
            </div>
            <div className="modal-body text-center py-4">
              <div className="mb-3">
                <i className="bi bi-receipt" style={{ fontSize: '4rem', color: '#006241' }}></i>
              </div>
              <h6 className="text-muted mb-2">UUID del Comprobante</h6>
              <p className="fw-bold mb-3" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {ticketData.uuid}
              </p>
              <div className="alert alert-success" role="alert">
                <i className="bi bi-check-circle me-2"></i> Venta registrada exitosamente
              </div>
            </div>
            <div className="modal-footer justify-content-center">
              <button 
                className="btn btn-primary btn-lg" 
                style={{ backgroundColor: '#006241', borderColor: '#006241' }}
                onClick={() => {
                  // Navegar a la página de detalles en una nueva pestaña
                  window.open(`/venta-detalles?uuid=${ticketData.uuid}`, '_blank');
                  setShowConfirmationModal(false);
                }}
              >
                <i className="bi bi-eye me-2"></i> Ver Detalles
              </button>
              <button 
                className="btn btn-outline-primary btn-lg"
                style={{ borderColor: '#006241', color: '#006241' }}
                onClick={() => setShowConfirmationModal(false)}
              >
                <i className="bi bi-plus-circle me-2"></i> Nueva Venta
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Dashboard;
