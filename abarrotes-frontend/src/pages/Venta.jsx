import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { useSharedOrders } from '../hooks/useSharedOrders';
import { getProfileColor } from '../data/employeeProfiles';
import { FaShoppingCart, FaTrash, FaPlus, FaMinus, FaCreditCard, FaBarcode, FaTimes, FaCheck, FaSync, FaMoneyBillWave, FaMobileAlt, FaPrint, FaPhone, FaUniversity, FaUser, FaReceipt, FaCheckCircle, FaArrowLeft, FaSearch, FaCamera, FaLightbulb, FaFire, FaSpinner, FaCopy, FaCheckCircle as FaCheckCircleAlt, FaWallet } from 'react-icons/fa';

// Instancia separada para el servicio de facturación
const billingApi = axios.create({
  baseURL: '/billing',
  headers: {
    'Content-Type': 'application/json'
  }
});

const Venta = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { addOrder } = useSharedOrders();
  
  // Colores dinámicos basados en el perfil
  const [colors, setColors] = useState({
    primary: '#1e7f5c',
    primaryDark: '#165f45',
    primaryLight: '#2fbf8c',
    secondary: '#2c3e50',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    border: '#dee2e6'
  });

  // Estado de la Venta Actual
  // Usar variable global para persistir carrito entre montajes
  if (!window.ventaCart) {
    window.ventaCart = [];
  }
  console.log('[VENTA-DEBUG] Montando Venta, window.ventaCart.length:', window.ventaCart ? window.ventaCart.length : 'undefined');
  
  // Función para actualizar el carrito y guardar en variable global
  // Maneja tanto arrays directos como funciones de actualización (functional updates)
  const updateCart = (update) => {
    let nextCart;
    if (typeof update === 'function') {
      // Si es una función, la ejecutamos con el estado actual (cart) para obtener el nuevo estado
      // Nota: Esto es una aproximación, idealmente usariamos setCart con el callback para garantizar atomicidad,
      // pero necesitamos acceder al resultado para actualizar window.ventaCart.
      // Para evitar conflictos de cierre, calculamos el nuevo estado basado en window.ventaCart o cart.
      const currentCart = window.ventaCart || cart;
      nextCart = update(currentCart);
    } else {
      nextCart = update;
    }
    
    setCart(nextCart);
    window.ventaCart = nextCart;
    console.log('[VENTA-DEBUG] Carrito actualizado y guardado:', nextCart.length, 'productos');
  };
  
  const [cart, setCart] = useState(window.ventaCart || []);
  const [scanCode, setScanCode] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Estado para autocompletar
  const [productsList, setProductsList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Estado para el modal de pago
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('01');
  const [montoPagado, setMontoPagado] = useState('');
  
  // Estado para el modal de pago con nuevo diseño
  const [paymentStep, setPaymentStep] = useState('select'); // select, qr, processing, success
  const [qrData, setQrData] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [ticketMethod, setTicketMethod] = useState('digital');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Estado para el modal de confirmación de venta
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [ventaData, setVentaData] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  
  // Estado para el método de envío de ticket
  const [selectedTicketMethod, setSelectedTicketMethod] = useState('digital'); // Por defecto digital
  const [telefonoUsuario, setTelefonoUsuario] = useState(''); // Teléfono para envío SMS
  
  // Configuración de CLABE Interbancaria
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

  // Cargar colores del perfil
  useEffect(() => {
    const profileColor = getProfileColor(localStorage.getItem('employeeProfile') || 'staff');
    const adjustColor = (color, amount) => {
      const hex = color.replace('#', '');
      const num = parseInt(hex, 16);
      const r = Math.min(255, Math.max(0, (num >> 16) + amount));
      const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
      const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
      return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    };

    setColors({
      primary: profileColor,
      primaryDark: adjustColor(profileColor, -20),
      primaryLight: adjustColor(profileColor, 20),
      secondary: '#2c3e50',
      success: '#28a745',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
      light: '#f8f9fa',
      dark: '#343a40',
      border: '#dee2e6'
    });
  }, []);

  // Guardar carrito en variable global cuando cambie
  useEffect(() => {
    window.ventaCart = cart;
    console.log('[VENTA-DEBUG] Carrito guardado en variable global:', cart.length, 'productos');
  }, [cart]);

  // Efecto para mantener el foco en el input de escaneo
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        inputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Cargar lista de productos para autocompletar
  useEffect(() => {
    const loadProducts = async () => {
      // Productos de prueba locales
      const productosPrueba = [
        // Lácteos y Refrigerados
        { id: 1, name: 'Leche Entera Lala 1L', price: 22.50, sku: '7501055301011', quantity: 1 },
        { id: 2, name: 'Yogurt Natural 1L', price: 25.00, sku: '7501055301101', quantity: 1 },
        { id: 3, name: 'Queso Fresco 500g', price: 35.00, sku: '7501055301111', quantity: 1 },
        { id: 4, name: 'Crema Ácida 200ml', price: 18.50, sku: '7501055301121', quantity: 1 },
        { id: 5, name: 'Mantequilla 200g', price: 22.00, sku: '7501055301131', quantity: 1 },
        { id: 6, name: 'Huevos Jumbo Dozen', price: 45.00, sku: '7501055301031', quantity: 1 },
        
        // Panadería y Grano
        { id: 7, name: 'Pan Bimbo Blanco 680g', price: 32.90, sku: '7501055301021', quantity: 1 },
        { id: 8, name: 'Arroz White 1kg', price: 18.00, sku: '7501055301051', quantity: 1 },
        { id: 9, name: 'Frijoles Negros La Costeña 1kg', price: 24.00, sku: '7501055301061', quantity: 1 },
        { id: 10, name: 'Azúcar Blanca 1kg', price: 16.50, sku: '7501055301161', quantity: 1 },
        { id: 11, name: 'Sal de Mesa 1kg', price: 8.00, sku: '7501055301171', quantity: 1 },
        { id: 12, name: 'Pasta San Marcos 500g', price: 14.00, sku: '7501055301181', quantity: 1 },
        
        // Despensa
        { id: 13, name: 'Aceite Vegetales Capullo 1L', price: 28.50, sku: '7501055301041', quantity: 1 },
        { id: 14, name: 'Salsa de Tomate 1kg', price: 18.00, sku: '7501055301191', quantity: 1 },
        { id: 15, name: 'Café Instantáneo 100g', price: 45.00, sku: '7501055301141', quantity: 1 },
        { id: 16, name: 'Té en Bolsa 25 unidades', price: 12.00, sku: '7501055301151', quantity: 1 },
        
        // Bebidas
        { id: 17, name: 'Agua Purificada 1.5L', price: 10.00, sku: '7501055301211', quantity: 1 },
        { id: 18, name: 'Refresco Col 2L', price: 18.00, sku: '7501055301221', quantity: 1 },
        { id: 19, name: 'Jugo de Naranja 1L', price: 20.00, sku: '7501055301091', quantity: 1 },
        { id: 20, name: 'Cerveza Modelo 6 pack', price: 75.00, sku: '7501055301201', quantity: 1 },
        { id: 59, name: 'Refresco Sabritas 2L', price: 18.00, sku: '7501055301591', quantity: 1 },
        { id: 60, name: 'Refresco Manzana 2L', price: 18.00, sku: '7501055301601', quantity: 1 },
        { id: 61, name: 'Refresco Toronja 2L', price: 18.00, sku: '7501055301611', quantity: 1 },
        { id: 62, name: 'Refresco Lima 2L', price: 18.00, sku: '7501055301621', quantity: 1 },
        { id: 63, name: 'Refresco Naranja 2L', price: 18.00, sku: '7501055301631', quantity: 1 },
        
        // Snacks y Golosinas
        { id: 21, name: 'Sabritas Original 150g', price: 18.50, sku: '7501055301231', quantity: 1 },
        { id: 22, name: 'Galletas Gamesa 400g', price: 15.50, sku: '7501055301081', quantity: 1 },
        { id: 23, name: 'Cereal Kellogg\'s 500g', price: 55.00, sku: '7501055301071', quantity: 1 },
        { id: 24, name: 'Chocolates Barra 100g', price: 12.00, sku: '7501055301241', quantity: 1 },
        { id: 25, name: 'Paletas de Caramelo 1unidad', price: 5.00, sku: '7501055301251', quantity: 1 },
        
        // Limpieza y Hogar
        { id: 26, name: 'Jabón de Barra 4 unidades', price: 25.00, sku: '7501055301261', quantity: 1 },
        { id: 27, name: 'Papel Higiénico 4 rollos', price: 30.00, sku: '7501055301271', quantity: 1 },
        { id: 28, name: 'Detergente Líquido 1L', price: 45.00, sku: '7501055301281', quantity: 1 },
        { id: 29, name: 'Suavizante 1L', price: 35.00, sku: '7501055301291', quantity: 1 },
        { id: 30, name: 'Cloro 1L', price: 15.00, sku: '7501055301301', quantity: 1 },
        
        // Abarrotes adicionales (nuevos)
        { id: 31, name: 'Atún en Lata 140g', price: 18.00, sku: '7501055301311', quantity: 1 },
        { id: 32, name: 'Sardinas en Tomato 150g', price: 15.00, sku: '7501055301321', quantity: 1 },
        { id: 33, name: 'Aceitunas Negras 200g', price: 22.00, sku: '7501055301331', quantity: 1 },
        { id: 34, name: 'Mayonesa 1kg', price: 38.00, sku: '7501055301341', quantity: 1 },
        { id: 35, name: 'Mostaza 500g', price: 18.00, sku: '7501055301351', quantity: 1 },
        { id: 36, name: 'Miel de Abeja 500g', price: 45.00, sku: '7501055301361', quantity: 1 },
        { id: 37, name: 'Vinagre de Manzana 1L', price: 12.00, sku: '7501055301371', quantity: 1 },
        { id: 38, name: 'Harina de Trigo 1kg', price: 14.00, sku: '7501055301381', quantity: 1 },
        { id: 39, name: 'Levadura Seca 100g', price: 10.00, sku: '7501055301391', quantity: 1 },
        { id: 40, name: 'Cocoa en Polvo 200g', price: 25.00, sku: '7501055301401', quantity: 1 },
        
        // Frutas y Verduras (embebidas)
        { id: 41, name: 'Manzana Granny 1kg', price: 35.00, sku: '7501055301411', quantity: 1 },
        { id: 42, name: 'Plátano 1kg', price: 15.00, sku: '7501055301421', quantity: 1 },
        { id: 43, name: 'Naranja 1kg', price: 18.00, sku: '7501055301431', quantity: 1 },
        { id: 44, name: 'Tomate 1kg', price: 20.00, sku: '7501055301441', quantity: 1 },
        { id: 45, name: 'Cebolla 1kg', price: 12.00, sku: '7501055301451', quantity: 1 },
        { id: 46, name: 'Papa 1kg', price: 10.00, sku: '7501055301461', quantity: 1 },
        { id: 47, name: 'Zanahoria 1kg', price: 14.00, sku: '7501055301471', quantity: 1 },
        { id: 48, name: 'Lechuga 1 unidad', price: 15.00, sku: '7501055301481', quantity: 1 },
        
        // Carnes (embebidas)
        { id: 49, name: 'Pollo Entero 1kg', price: 45.00, sku: '7501055301491', quantity: 1 },
        { id: 50, name: 'Carne de Res 1kg', price: 80.00, sku: '7501055301501', quantity: 1 },
        { id: 51, name: 'Carne de Cerdo 1kg', price: 70.00, sku: '7501055301511', quantity: 1 },
        { id: 52, name: 'Salchichas 1kg', price: 55.00, sku: '7501055301521', quantity: 1 },
        { id: 53, name: 'Tocino 500g', price: 45.00, sku: '7501055301531', quantity: 1 },
        { id: 64, name: 'Jamón de Pavo 200g', price: 25.00, sku: '7501055301641', quantity: 1 },
        { id: 65, name: 'Jamón de Pavo 500g', price: 45.00, sku: '7501055301651', quantity: 1 },
        { id: 66, name: 'Jamón de Cerdo 200g', price: 28.00, sku: '7501055301661', quantity: 1 },
        { id: 67, name: 'Jamón de Cerdo 500g', price: 50.00, sku: '7501055301671', quantity: 1 },
        { id: 68, name: 'Jamón Serrano 100g', price: 35.00, sku: '7501055301681', quantity: 1 },
        
        // Higiene Personal
        { id: 54, name: 'Shampoo 1L', price: 45.00, sku: '7501055301541', quantity: 1 },
        { id: 55, name: 'Jabón Líquido 1L', price: 35.00, sku: '7501055301551', quantity: 1 },
        { id: 56, name: 'Cepillo de Dientes', price: 12.00, sku: '7501055301561', quantity: 1 },
        { id: 57, name: 'Pasta de Dientes 100ml', price: 18.00, sku: '7501055301571', quantity: 1 },
        { id: 58, name: 'Desodorante 50ml', price: 25.00, sku: '7501055301581', quantity: 1 },
      ];
      
      setProductsList(productosPrueba);
      console.log('[DASHBOARD] Productos de prueba cargados:', productosPrueba.length);
      
      // Intentar cargar desde la API (opcional, para sincronizar con backend)
      try {
        const response = await api.get('/products');
        console.log('[DASHBOARD] Productos cargados desde API (sincronización):', response.data.length);
        // Si queremos combinar con productos de la API, aquí iría la lógica
        // Por ahora, mantenemos los productos de prueba como fuente principal
      } catch (error) {
        console.log('[DASHBOARD] No se pudo conectar con la API (no es crítico, usando productos locales)');
      }
    };
    loadProducts();
  }, []);

  // Sincronizar carrito con pantalla del cliente al montar
  useEffect(() => {
    console.log('[VENTA-DEBUG] Ejecutando useEffect de sincronización, cart.length:', cart.length);
    console.log('[VENTA-DEBUG] window.ventaCart.length:', window.ventaCart ? window.ventaCart.length : 'undefined');
    if (cart.length > 0) {
      console.log('[VENTA-DEBUG] Sincronizando carrito con pantalla del cliente:', cart.length, 'productos');
      
      // Enviar carrito completo usando el nuevo formato de actualización
      const productosParaCliente = cart.map(item => ({
        id: item.id,
        nombre: item.name,
        precio: item.price * 1.16, // Precio con IVA
        imagen: item.imagen || 'https://via.placeholder.com/300x300/2a2a4a/00d4ff?text=Producto',
        cantidad: item.quantity
      }));
      
      enviarACliente({ 
        type: 'actualizar_carrito',
        productos: productosParaCliente
      });
    }
  }, []); // Solo al montar

  // Manejar input para autocompletar
  // Función para obtener productos más vendidos (simulada)
  const getTopSellingProducts = () => {
    // Por ahora, tomamos los primeros 8 productos de la lista
    // En el futuro, esto debería venir del backend ordenado por ventas
    return productsList.slice(0, 8);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setScanCode(value);
    
    if (value.length > 0) {
      const filtered = productsList.filter(product => 
        product.name.toLowerCase().includes(value.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(value.toLowerCase()))
      );
      setSuggestions(filtered.slice(0, 8));
      setShowSuggestions(true);
    } else {
      // Si el texto está vacío, mostrar productos más vendidos
      const topSelling = getTopSellingProducts();
      setSuggestions(topSelling);
      setShowSuggestions(true);
    }
  };

  // Seleccionar sugerencia
  const selectSuggestion = (product) => {
    setScanCode(product.name);
    setShowSuggestions(false);
    addToCart(product);
    setScanCode('');
  };

  // Manejar escaneo o entrada manual
  const handleScan = (e) => {
    e.preventDefault();
    const code = scanCode.trim();
    console.log('[VENTA-DEBUG] handleScan ejecutado. Código:', code);
    if (!code) return;

    console.log('[VENTA-DEBUG] Productos en lista para búsqueda:', productsList.length);
    const product = productsList.find(p => 
      p.name.toLowerCase() === code.toLowerCase() || 
      p.name.toLowerCase().includes(code.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase() === code.toLowerCase())
    );

    if (product) {
      console.log('[VENTA-DEBUG] Producto encontrado:', product.name);
      addToCart(product);
      setScanCode('');
      setShowSuggestions(false);
      setMessage({ type: 'success', text: `✓ ${product.name} agregado al carrito` });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } else {
      console.log('[VENTA-DEBUG] Producto NO encontrado:', code);
      setMessage({ type: 'error', text: `❌ Producto no encontrado: "${code}"` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // Agregar producto al carrito
  const addToCart = (product) => {
    console.log('[VENTA-DEBUG] === INICIO addToCart ===');
    console.log('[VENTA-DEBUG] Producto a agregar:', product.name);
    
    updateCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        console.log('[VENTA-DEBUG] Producto ya existe en carrito, incrementando cantidad');
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: item.price * (item.quantity + 1) }
            : item
        );
      } else {
        console.log('[VENTA-DEBUG] Nuevo producto en carrito');
        return [...prevCart, { ...product, quantity: 1, subtotal: product.price }];
      }
    });

    console.log('[VENTA-DEBUG] Ejecutando enviarProductoACliente...');
    // Enviar producto a la pantalla del cliente
    enviarProductoACliente(product);
    console.log('[VENTA-DEBUG] === FIN addToCart ===');
  };

  // Función genérica para enviar datos a la pantalla del cliente
  const enviarACliente = (data) => {
    const timestamp = new Date().toISOString() + '-' + Math.random().toString(36).substr(2, 9);
    const clienteData = {
      ...data,
      timestamp: timestamp
    };
    
    console.log('[VENTA-DEBUG] === INICIO enviarACliente ===');
    console.log('[VENTA-DEBUG] Datos a enviar:', JSON.stringify(clienteData, null, 2));
    console.log('[VENTA-DEBUG] Timestamp generado:', timestamp);
    
    // Usar localStorage para comunicación entre pestañas (fallback universal)
    try {
      localStorage.setItem('cliente_pantalla', JSON.stringify(clienteData));
      console.log('[VENTA-DEBUG] ✓ Datos guardados en localStorage');
      // Forzar trigger de evento storage para navegadores que no lo hacen automáticamente
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'cliente_pantalla',
        newValue: JSON.stringify(clienteData)
      }));
    } catch (error) {
      console.error('[VENTA-DEBUG] ✗ Error guardando en localStorage:', error);
    }
    
    // Usar BroadcastChannel para notificación en tiempo real (mejorado)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('pantalla_cliente');
        channel.postMessage(clienteData);
        channel.close();
        console.log('[VENTA-DEBUG] ✓ Datos enviados por BroadcastChannel');
      } catch (error) {
        console.warn('[VENTA-DEBUG] ⚠ Error enviando por BroadcastChannel (usando fallback):', error.message);
      }
    } else {
      console.warn('[VENTA-DEBUG] ⚠ BroadcastChannel no disponible, usando localStorage únicamente');
    }
    
    console.log('[VENTA-DEBUG] === FIN enviarACliente ===');
  };

  const enviarProductoACliente = (product) => {
    // Calcular precio con IVA (16%)
    const precioConIva = product.price * 1.16;
    
    const productoLimpio = {
      id: product.id,
      nombre: product.name,
      precio: precioConIva, // Enviar precio con IVA a la pantalla del cliente
      precioBase: product.price, // Guardar precio base para referencia
      imagen: product.imagen || 'https://via.placeholder.com/300x300/2a2a4a/00d4ff?text=Producto'
    };

    const data = {
      type: 'product_scanned',
      product: productoLimpio
    };

    if (selectedPaymentMethod === '04') {
      data.transferenciaInfo = {
        clabe: config.clabeInterbancaria,
        banco: config.banco,
        beneficiario: config.nombreEmpresa
      };
    }

    enviarACliente(data);
  };

  const enviarNuevaVenta = () => {
    console.log('[VENTA-DEBUG] === INICIO enviarNuevaVenta ===');
    
    // Limpiar carrito y estado local
    updateCart([]);
    setScanCode('');
    setShowSuggestions(false);
    setMessage({ type: 'success', text: 'Nueva venta iniciada' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    
    // Limpiar carrito en variable global también
    window.ventaCart = [];
    console.log('[VENTA-DEBUG] Carrito limpiado en variable global');
    
    // Enviar mensaje a pantalla del cliente
    enviarACliente({
      type: 'nueva_venta'
    });
    
    console.log('[VENTA-DEBUG] === FIN enviarNuevaVenta ===');
  };

  const enviarVentaCompletada = () => {
    enviarACliente({
      type: 'venta_completada'
    });
  };

  const limpiarTransferenciaCliente = () => {
    enviarACliente({
      type: 'clear_transferencia'
    });
  };

  const enviarInfoTransferencia = () => {
    console.log('[VENTA-DEBUG] Enviando info de transferencia a cliente');
    enviarACliente({
      type: 'transferencia_info',
      clabe: config.clabeInterbancaria,
      banco: config.banco,
      beneficiario: config.nombreEmpresa
    });
  };

  const updateQuantity = (id, delta) => {
    updateCart(prevCart => {
      const newCart = prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty, subtotal: item.price * newQty };
        }
        return item;
      }).filter(Boolean);
      
      // Actualizar variable global
      window.ventaCart = newCart;
      
      // Sincronizar con pantalla del cliente
      if (newCart.length === 0) {
        console.log('[VENTA-DEBUG] Carrito vacío después de actualizar cantidad');
        enviarACliente({ type: 'nueva_venta' });
      } else {
        console.log('[VENTA-DEBUG] Sincronizando carrito actualizado por cambio de cantidad');
        const productosParaCliente = newCart.map(item => ({
          id: item.id,
          nombre: item.name,
          precio: item.price * 1.16, // Precio con IVA
          imagen: item.imagen || 'https://via.placeholder.com/300x300/2a2a4a/00d4ff?text=Producto',
          cantidad: item.quantity
        }));
        
        enviarACliente({ 
          type: 'actualizar_carrito',
          productos: productosParaCliente
        });
      }
      
      return newCart;
    });
  };

  const removeItem = (id) => {
    updateCart(prevCart => {
      const newCart = prevCart.filter(item => item.id !== id);
      
      // Actualizar variable global
      window.ventaCart = newCart;
      
      // Si el carrito queda vacío, enviar mensaje para bloquear pantalla del cliente
      if (newCart.length === 0) {
        console.log('[VENTA-DEBUG] Carrito vacío, enviando mensaje a pantalla del cliente');
        enviarACliente({ type: 'nueva_venta' });
      } else {
        // Si aún hay productos, enviar carrito completo actualizado sin limpiar pantalla
        console.log('[VENTA-DEBUG] Enviando carrito actualizado a pantalla del cliente');
        
        // Enviar lista completa de productos actualizada
        const productosParaCliente = newCart.map(item => ({
          id: item.id,
          nombre: item.name,
          precio: item.price * 1.16, // Precio con IVA
          imagen: item.imagen || 'https://via.placeholder.com/300x300/2a2a4a/00d4ff?text=Producto',
          cantidad: item.quantity
        }));
        
        enviarACliente({ 
          type: 'actualizar_carrito',
          productos: productosParaCliente
        });
      }
      
      return newCart;
    });
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  };

  // Calcular totales con IVA para mostrar en la interfaz
  const calculateTotalsWithIVA = () => {
    const subtotalBase = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const subtotalConIVA = subtotalBase * 1.16;
    const ivaIncluido = subtotalBase * 0.16 * 1.16;
    const totalConIVA = subtotalBase * 1.16; // subtotal + iva ya incluido en el subtotal
    return { subtotalConIVA, ivaIncluido, totalConIVA };
  };

  const { subtotal, iva, total } = calculateTotals();
  const { subtotalConIVA, ivaIncluido, totalConIVA } = calculateTotalsWithIVA();

  const openPaymentModal = () => {
    if (cart.length === 0) {
      setMessage({ type: 'error', text: 'El carrito está vacío' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      return;
    }
    setSelectedPaymentMethod('01'); // Resetear a Efectivo por defecto al abrir modal
    setShowPaymentModal(true);
  };

  const confirmPayment = () => {
    if (!montoPagado || parseFloat(montoPagado) < totalConIVA) {
      setMessage({ type: 'error', text: 'Monto insuficiente' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      return;
    }

    const cambio = parseFloat(montoPagado) - totalConIVA;
    
    // Obtener employeeId del localStorage para sincronizar con versión móvil
    const employeeId = localStorage.getItem('employeeId') || 'DEMO001';
    
    const ventaData = {
      cart,
      total: totalConIVA,
      montoPagado: parseFloat(montoPagado),
      cambio,
      metodoPago: selectedPaymentMethod,
      fecha: new Date().toISOString(),
      employeeId: employeeId
    };

    setVentaData(ventaData);
    
    // Enviar venta completada a la pantalla del cliente
    enviarVentaCompletada();
    
    // Procesar ticket inmediatamente basado en la selección del usuario
    const ticketUuid = 'TKT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const ticketData = {
      uuid: ticketUuid,
      items: cart,
      total: totalConIVA,
      fecha: new Date().toLocaleString('es-MX'),
      empresa: config.nombreEmpresa,
      rfc: config.rfcEmpresa
    };
    
    if (selectedTicketMethod === 'digital') {
      if (!telefonoUsuario || telefonoUsuario.length !== 10) {
        setMessage({ type: 'error', text: 'Por favor ingrese un número de teléfono válido a 10 dígitos' });
        return;
      }
      enviarTicketPorSMS(ventaData, ticketUuid, telefonoUsuario);
      setMessage({ type: 'success', text: 'Ticket enviado por SMS' });
    } else if (selectedTicketMethod === 'impreso') {
      setMessage({ type: 'success', text: 'Imprimiendo ticket...' });
      // Crear contenido HTML para el ticket
      const ticketHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ticket - ${ticketUuid}</title>
          <style>
            body { font-family: monospace; text-align: center; padding: 20px; }
            .ticket { max-width: 300px; margin: 0 auto; border: 1px dashed #000; padding: 15px; }
            h4 { margin-bottom: 10px; }
            p { margin: 5px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <h4>${ticketData.empresa}</h4>
            <p>RFC: ${ticketData.rfc}</p>
            <p>${ticketData.fecha}</p>
            <p>Ticket: ${ticketData.uuid}</p>
            <hr/>
            ${ticketData.items.map(item => `
              <div class="item">
                <span>${item.name} x${item.quantity}</span>
                <span>$${(item.subtotal * 1.16).toFixed(2)}</span>
              </div>
            `).join('')}
            <hr/>
            <div class="total">
              <span>TOTAL: $${ticketData.total.toFixed(2)}</span>
            </div>
            <p style="margin-top: 10px;">¡Gracias por su compra!</p>
          </div>
        </body>
        </html>
      `;
      
      // Abrir ventana nueva con el ticket
      const printWindow = window.open('', '_blank');
      printWindow.document.write(ticketHtml);
      printWindow.document.close();
      
      // Esperar a que cargue la ventana y luego imprimir
      printWindow.onload = function() {
        printWindow.print();
      };
    }
    
    // Limpiar carrito y cerrar modal de pago
    updateCart([]);
    setScanCode('');
    setShowSuggestions(false);
    setMontoPagado('');
    setSelectedPaymentMethod('01');
    setShowPaymentModal(false);
    
    // Enviar nueva venta a la pantalla del cliente
    enviarNuevaVenta();
    
    // Limpiar mensaje después de un tiempo
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const enviarTicketPorSMS = async (ventaData, ticketUuid, telefono) => {
    try {
      // Obtener employeeId del localStorage para sincronizar con versión móvil
      const employeeId = localStorage.getItem('employeeId') || 'DEMO001';
      
      // Preparar datos para el microservicio de tickets
      const ticketRequest = {
        ventaId: Date.now(), // Usar timestamp como ID temporal
        employeeId: employeeId, // Agregar employeeId para sincronización
        telefono: telefono,
        items: cart.map(item => ({
          nombre: item.name,
          cantidad: item.quantity,
          precio: item.price * 1.16, // Precio con IVA
          subtotal: item.subtotal * 1.16 // Subtotal con IVA
        })),
        total: totalConIVA, // Total con IVA
        fechaVenta: new Date().toLocaleString('es-MX'),
        metodoPago: selectedPaymentMethod === '01' ? 'Efectivo' : 
                   selectedPaymentMethod === '04' ? 'Transferencia' :
                   selectedPaymentMethod === '03' ? 'Tarjeta de Crédito' : 'Tarjeta de Débito'
      };

      // Llamar al microservicio de tickets
      const response = await axios.post('http://localhost:8086/api/tickets/generar-y-enviar', ticketRequest);
      
      console.log('[VENTA-DEBUG] Ticket enviado por SMS:', response.data);
      return response.data;
    } catch (error) {
      console.error('[VENTA-DEBUG] Error enviando ticket por SMS:', error);
      return null;
    }
  };

  const finalizarVenta = () => {
    // Generar ticket
    const ticketUuid = 'TKT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const ticketData = {
      uuid: ticketUuid,
      items: cart,
      total: totalConIVA,
      fecha: new Date().toLocaleString('es-MX'),
      empresa: config.nombreEmpresa,
      rfc: config.rfcEmpresa
    };
    
    setTicketData(ticketData);
    
    // Guardar pedido en el sistema compartido (móvil y escritorio)
    addOrder({
      uuid: ticketUuid,
      items: cart,
      total: totalConIVA,
      montoPagado: parseFloat(montoPagado),
      cambio: parseFloat(montoPagado) - totalConIVA,
      metodoPago: selectedPaymentMethod,
      fecha: new Date().toISOString()
    });
    
    // Enviar ticket por SMS (asíncrono, no bloquea la UI)
    enviarTicketPorSMS(ventaData, ticketUuid);
    
    // Limpiar carrito
    updateCart([]);
    setScanCode('');
    setShowConfirmationModal(false);
    setMontoPagado('');
    setSelectedPaymentMethod('01');
    
    // Enviar nueva venta a la pantalla del cliente
    enviarNuevaVenta();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Generar QR para MercadoPago o CoDi
  const generateQRPayment = (type) => {
    setPaymentLoading(true);
    setPaymentStep('processing');
    
    setTimeout(() => {
      const reference = Math.floor(1000000 + Math.random() * 9000000);
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        type === 'mercadopago' 
          ? `mercadopago://pay?amount=${totalConIVA}&ref=${reference}` 
          : `codi://pay?amount=${totalConIVA}&ref=${reference}`
      )}`;
      
      setQrData({
        qrCode: qrCodeUrl,
        referencia: reference.toString(),
        tipo: type === 'mercadopago' ? 'MercadoPago QR' : 'CoDi'
      });
      setPaymentStep('qr');
      setPaymentLoading(false);
    }, 1500);
  };

  const cancelPayment = () => {
    setShowPaymentModal(false);
    setMontoPagado('');
    setSelectedPaymentMethod('01');
    setPaymentStep('select');
    setQrData(null);
    limpiarTransferenciaCliente();
  };

  return (
    <>
      <div className="container-fluid p-0" style={{ backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
        {/* Header */}
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
          {/* Columna Izquierda: Buscador y Carrito */}
          <div className="col-md-8 d-flex flex-column p-4">
            {/* Barra de Escaneo */}
            <form onSubmit={handleScan} className="mb-4">
              <div className="position-relative">
                <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-upc-scan text-muted" style={{ fontSize: '1.5rem' }}></i>
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Escanear código o buscar producto..."
                    value={scanCode}
                    onChange={handleInputChange}
                    onClick={() => {
                      // Si las sugerencias ya están visibles, ocultarlas (toggle)
                      if (showSuggestions) {
                        setShowSuggestions(false);
                      } else {
                        // Si no están visibles, mostrarlas
                        if (scanCode.length > 0) {
                          setShowSuggestions(true);
                        } else {
                          // Mostrar productos más vendidos al hacer clic sin texto
                          const topSelling = getTopSellingProducts();
                          setSuggestions(topSelling);
                          setShowSuggestions(true);
                        }
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    autoFocus
                    style={{ fontSize: '1.2rem' }}
                  />
                  <button className="btn btn-primary px-4" type="submit" style={{ backgroundColor: colors.primary, borderColor: colors.primary }}>
                    Agregar
                  </button>
                </div>
                
                {/* Sugerencias de autocompletar */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="position-absolute w-100 bg-white shadow-lg rounded-3 mt-1 overflow-hidden border" style={{ zIndex: 9999, borderColor: '#dadce0' }}>
                    <div className="p-2" style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                      <small className="text-muted fw-medium">
                        {scanCode ? `Resultados de búsqueda (${suggestions.length})` : `5 opciones de más vendidos (${suggestions.length})`}
                      </small>
                    </div>
                    <div className="overflow-auto" style={{ maxHeight: '300px' }}>
                      {suggestions.map((product, index) => (
                        <div 
                          key={product.id} 
                          className={`d-flex align-items-center px-3 py-2 ${index < suggestions.length - 1 ? 'border-bottom' : ''}`}
                          onClick={() => selectSuggestion(product)}
                          style={{ 
                            cursor: 'pointer',
                            backgroundColor: '#fff',
                            transition: 'all 0.15s ease',
                            borderBottom: '1px solid #f5f5f5'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e8f0fe';
                            e.currentTarget.style.borderLeft = '3px solid #1a73e8';
                            e.currentTarget.style.paddingLeft = 'calc(0.75rem - 3px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#fff';
                            e.currentTarget.style.borderLeft = 'none';
                            e.currentTarget.style.paddingLeft = '0.75rem';
                          }}
                        >
                          <div className="me-3 text-muted" style={{ minWidth: '24px' }}>
                            <i className="bi bi-box-seam"></i>
                          </div>
                          <div className="flex-grow-1" style={{ minWidth: '0' }}>
                            <div className="fw-medium text-truncate" style={{ color: '#202124', fontSize: '0.95rem' }}>
                              {product.name}
                            </div>
                            <div className="text-muted small text-truncate" style={{ fontSize: '0.8rem' }}>
                              {product.category || 'Producto'} • SKU: {product.sku || 'N/A'}
                            </div>
                          </div>
                          <div className="text-end ms-3" style={{ minWidth: '80px' }}>
                            <div className="fw-bold" style={{ color: '#1a73e8', fontSize: '1rem' }}>
                              ${product.price ? (product.price * 1.16).toFixed(2) : '0.00'}
                            </div>
                            <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                              MXN
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

            {/* Lista de Productos en Carrito */}
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
                          <td className="ps-4 py-3 fw-medium">{item.name}</td>
                          <td className="text-center">
                            <div className="btn-group btn-group-sm" role="group">
                              <button type="button" className="btn btn-outline-secondary" onClick={() => updateQuantity(item.id, -1)}>-</button>
                              <button type="button" className="btn btn-outline-secondary disabled text-dark" style={{ minWidth: '40px' }}>{item.quantity}</button>
                              <button type="button" className="btn btn-outline-secondary" onClick={() => updateQuantity(item.id, 1)}>+</button>
                            </div>
                          </td>
                          <td className="text-end pe-4">${(item.price * 1.16).toFixed(2)}</td>
                          <td className="text-end pe-4 fw-bold">${(item.subtotal * 1.16).toFixed(2)}</td>
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

          {/* Columna Derecha: Resumen de Pago */}
          <div className="col-md-4 bg-white shadow-lg p-4 d-flex flex-column" style={{ minHeight: '100vh', overflowY: 'auto' }}>
            <h4 className="mb-4 fw-bold">Resumen de Venta</h4>
            
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Subtotal (con IVA)</span>
              <span className="fw-medium">${subtotalConIVA.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">IVA (16%)</span>
              <span className="fw-medium">${iva.toFixed(2)}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between mb-4">
              <span className="h5 mb-0 fw-bold">Total</span>
              <span className="h4 mb-0 fw-bold text-primary">${totalConIVA.toFixed(2)}</span>
            </div>

            {/* Botón de Pago */}
            <button 
              className="btn btn-primary btn-lg w-100 mb-3" 
              style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
              onClick={openPaymentModal}
            >
              <i className="bi bi-credit-card me-2"></i> Proceder a Pago
            </button>

            <button 
              className="btn btn-outline-danger w-100"
              onClick={enviarNuevaVenta}
            >
              <i className="bi bi-plus-circle me-2"></i> Nueva Venta
            </button>
            
            {/* Espacio flexible para empujar el contenido hacia abajo */}
            <div className="flex-grow-1"></div>
            
            {/* Información del usuario logueado */}
            <div className="mt-4 pt-3 border-top text-center">
              <small className="text-muted">
                Empleado: <strong>{localStorage.getItem('employeeName') || 'No identificado'}</strong>
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Pago - Glassmorphism Design */}
      {showPaymentModal && (
        <div className="payment-modal-overlay">
          {/* Background Circles */}
          <div className="payment-bg-circles">
            <div className="payment-circle payment-circle-1"></div>
            <div className="payment-circle payment-circle-2"></div>
            <div className="payment-circle payment-circle-3"></div>
            <div className="payment-circle payment-circle-4"></div>
          </div>

          <div className="payment-modal-container">
            {/* Header */}
            <div className="payment-header">
              <div className="payment-header-content">
                <div className="payment-logo">
                  <FaReceipt />
                </div>
                <div>
                  <h2 className="payment-title">Método de Pago</h2>
                  <p className="payment-subtitle">Total a pagar</p>
                </div>
              </div>
              <button className="payment-close-btn" onClick={cancelPayment}>
                <FaTimes />
              </button>
            </div>

            {/* Total */}
            <div className="payment-total-section">
              <span className="payment-total-label">Total</span>
              <span className="payment-total-amount">${totalConIVA.toFixed(2)}</span>
            </div>

            {/* Content */}
            <div className="payment-content">
              {/* Payment Methods Grid */}
              {paymentStep === 'select' && (
                <>
                  <div className="payment-methods-grid">
                    <button 
                      className={`payment-method-card ${selectedPaymentMethod === '01' ? 'active' : ''}`}
                      onClick={() => setSelectedPaymentMethod('01')}
                      style={{ '--method-color': '#22c55e' }}
                    >
                      <div className="payment-method-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}>
                        <FaMoneyBillWave style={{ color: '#22c55e' }} />
                      </div>
                      <span className="payment-method-name">Efectivo</span>
                      <span className="payment-method-desc">Pago en moneda</span>
                    </button>

                    <button 
                      className={`payment-method-card ${selectedPaymentMethod === '06' ? 'active' : ''}`}
                      onClick={() => { setSelectedPaymentMethod('06'); generateQRPayment('mercadopago'); }}
                      style={{ '--method-color': '#00b1ea' }}
                    >
                      <div className="payment-method-icon" style={{ backgroundColor: 'rgba(0, 177, 234, 0.15)' }}>
                        <FaMobileAlt style={{ color: '#00b1ea' }} />
                      </div>
                      <span className="payment-method-name">MercadoPago</span>
                      <span className="payment-method-desc">QR Code</span>
                    </button>

                    <button 
                      className={`payment-method-card ${selectedPaymentMethod === '07' ? 'active' : ''}`}
                      onClick={() => { setSelectedPaymentMethod('07'); generateQRPayment('codi'); }}
                      style={{ '--method-color': '#f59e0b' }}
                    >
                      <div className="payment-method-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                        <FaMobileAlt style={{ color: '#f59e0b' }} />
                      </div>
                      <span className="payment-method-name">CoDi</span>
                      <span className="payment-method-desc">BANXICO</span>
                    </button>

                    <button 
                      className={`payment-method-card ${selectedPaymentMethod === '03' ? 'active' : ''}`}
                      onClick={() => setSelectedPaymentMethod('03')}
                      style={{ '--method-color': '#3b82f6' }}
                    >
                      <div className="payment-method-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                        <FaCreditCard style={{ color: '#3b82f6' }} />
                      </div>
                      <span className="payment-method-name">Tarjeta</span>
                      <span className="payment-method-desc">Débito/Crédito</span>
                    </button>

                    <button 
                      className={`payment-method-card ${selectedPaymentMethod === '04' ? 'active' : ''}`}
                      onClick={() => { setSelectedPaymentMethod('04'); enviarInfoTransferencia(); }}
                      style={{ '--method-color': '#10b981' }}
                    >
                      <div className="payment-method-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                        <FaUniversity style={{ color: '#10b981' }} />
                      </div>
                      <span className="payment-method-name">Transferencia</span>
                      <span className="payment-method-desc">SPEI</span>
                    </button>
                  </div>

                  {/* Cash Input */}
                  {selectedPaymentMethod === '01' && (
                    <div className="payment-cash-section">
                      <label className="payment-cash-label">Monto recibido</label>
                      <div className="payment-quick-amounts payment-bills">
                        <button className="payment-bill-btn" onClick={() => setMontoPagado('50')}>
                          <span className="bill-icon">$</span>
                          <span className="bill-value">50</span>
                        </button>
                        <button className="payment-bill-btn" onClick={() => setMontoPagado('100')}>
                          <span className="bill-icon">$</span>
                          <span className="bill-value">100</span>
                        </button>
                        <button className="payment-bill-btn" onClick={() => setMontoPagado('200')}>
                          <span className="bill-icon">$</span>
                          <span className="bill-value">200</span>
                        </button>
                        <button className="payment-bill-btn" onClick={() => setMontoPagado('500')}>
                          <span className="bill-icon">$</span>
                          <span className="bill-value">500</span>
                        </button>
                      </div>
                      <div className="payment-quick-total">
                        <button className="payment-total-btn" onClick={() => setMontoPagado(Math.ceil(totalConIVA).toString())}>
                          Exacta: ${totalConIVA.toFixed(2)}
                        </button>
                      </div>
                      <input 
                        type="number" 
                        className="payment-cash-input"
                        value={montoPagado}
                        onChange={(e) => setMontoPagado(e.target.value)}
                        placeholder="0.00"
                      />
                      {montoPagado && parseFloat(montoPagado) >= totalConIVA && (
                        <div className="payment-change">
                          <span>Cambio:</span>
                          <span className="payment-change-amount">${(parseFloat(montoPagado) - totalConIVA).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Transfer Info */}
                  {selectedPaymentMethod === '04' && (
                    <div className="payment-transfer-section">
                      <div className="payment-transfer-info">
                        <div className="payment-transfer-row">
                          <span className="payment-transfer-label">CLABE</span>
                          <span className="payment-transfer-value">{config.clabeInterbancaria}</span>
                        </div>
                        <div className="payment-transfer-row">
                          <span className="payment-transfer-label">Banco</span>
                          <span className="payment-transfer-value">{config.banco}</span>
                        </div>
                        <div className="payment-transfer-row">
                          <span className="payment-transfer-label">Beneficiario</span>
                          <span className="payment-transfer-value">{config.nombreEmpresa}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ticket Type */}
                  <div className="payment-ticket-section">
                    <label className="payment-ticket-label">Tipo de ticket</label>
                    <div className="payment-ticket-options">
                      <button 
                        className={`payment-ticket-btn ${ticketMethod === 'digital' ? 'active' : ''}`}
                        onClick={() => setTicketMethod('digital')}
                      >
                        <FaMobileAlt className="me-2" />Digital
                      </button>
                      <button 
                        className={`payment-ticket-btn ${ticketMethod === 'impreso' ? 'active' : ''}`}
                        onClick={() => setTicketMethod('impreso')}
                      >
                        <FaPrint className="me-2" />Impreso
                      </button>
                    </div>
                    {ticketMethod === 'digital' && (
                      <input 
                        type="tel" 
                        className="payment-phone-input"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Teléfono a 10 dígitos"
                        maxLength="10"
                      />
                    )}
                  </div>
                </>
              )}

              {/* QR Section */}
              {paymentStep === 'qr' && qrData && (
                <div className="payment-qr-section">
                  <div className="payment-qr-header">
                    <div className="payment-qr-icon-wrapper">
                      <FaMobileAlt style={{ fontSize: '1.5rem', color: selectedPaymentMethod === '06' ? '#00b1ea' : '#f59e0b' }} />
                    </div>
                    <span className="payment-qr-title">
                      {selectedPaymentMethod === '06' ? 'MercadoPago QR' : 'CoDi'}
                    </span>
                  </div>
                  <p className="payment-qr-instruction">Muestra el QR al cliente para cobrar</p>
                  <div className="payment-qr-container">
                    <img src={qrData.qrCode} alt="QR Code" className="payment-qr-image" />
                  </div>
                  <div className="payment-qr-reference">
                    <span className="payment-qr-ref-label">Referencia:</span>
                    <span className="payment-qr-ref-value">{qrData.referencia}</span>
                    <button className="payment-copy-btn" onClick={() => navigator.clipboard.writeText(qrData.referencia)}>
                      <FaCopy />
                    </button>
                  </div>
                  <div className="payment-qr-time">
                    <FaSync className="me-1" />
                    El cliente tiene 30 min para pagar
                  </div>
                </div>
              )}

              {/* Processing */}
              {paymentStep === 'processing' && (
                <div className="payment-processing">
                  <div className="payment-spinner"></div>
                  <p>Generando código QR...</p>
                </div>
              )}

              {/* Success */}
              {paymentStep === 'success' && (
                <div className="payment-success">
                  <div className="payment-success-icon">
                    <FaCheckCircle style={{ fontSize: '2.5rem' }} />
                  </div>
                  <h3>¡Pago Exitoso!</h3>
                  <p>Venta completada correctamente</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="payment-footer">
              {paymentStep === 'select' && (
                <>
                  <button 
                    className="payment-confirm-btn"
                    onClick={confirmPayment}
                    disabled={selectedPaymentMethod === '01' && parseFloat(montoPagado || 0) < totalConIVA}
                  >
                    <FaCheckCircle />
                    Confirmar Pago
                  </button>
                  <button 
                    className="payment-cancel-btn"
                    onClick={cancelPayment}
                  >
                    Cancelar
                  </button>
                </>
              )}
              {paymentStep === 'qr' && (
                <button 
                  className="payment-confirm-btn" 
                  style={{ backgroundColor: '#22c55e' }}
                  onClick={() => {
                    confirmPayment();
                    setPaymentStep('success');
                  }}
                >
                  <FaCheckCircle />
                  Pago Recibido
                </button>
              )}
              {paymentStep === 'success' && (
                <button 
                  className="payment-confirm-btn"
                  onClick={() => { 
                    setShowPaymentModal(false); 
                    setPaymentStep('select'); 
                    setQrData(null);
                    enviarNuevaVenta();
                  }}
                >
                  Nueva Venta
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Venta;