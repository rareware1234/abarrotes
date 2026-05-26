import { useState, useEffect } from 'react';

// Hook para manejar pedidos compartidos entre móvil y escritorio
export const useSharedOrders = () => {
  const [orders, setOrders] = useState([]);

  // Cargar pedidos del localStorage al iniciar
  useEffect(() => {
    const loadOrders = () => {
      try {
        const savedOrders = localStorage.getItem('sharedOrders');
        if (savedOrders) {
          setOrders(JSON.parse(savedOrders));
        }
      } catch (error) {
        console.error('Error cargando pedidos compartidos:', error);
      }
    };

    loadOrders();
    
    // Escuchar cambios en el localStorage desde otras pestañas/dispositivos
    window.addEventListener('storage', (e) => {
      if (e.key === 'sharedOrders') {
        loadOrders();
      }
    });
  }, []);

  // Guardar pedidos en localStorage
  const saveOrders = (newOrders) => {
    try {
      localStorage.setItem('sharedOrders', JSON.stringify(newOrders));
      setOrders(newOrders);
    } catch (error) {
      console.error('Error guardando pedidos compartidos:', error);
    }
  };

  // Agregar un nuevo pedido
  const addOrder = (orderData) => {
    const newOrder = {
      ...orderData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      employeeId: localStorage.getItem('employeeId') || 'DEMO001'
    };
    
    const newOrders = [newOrder, ...orders];
    saveOrders(newOrders);
    return newOrder;
  };

  // Obtener pedidos por empleado
  const getOrdersByEmployee = (employeeId) => {
    return orders.filter(order => order.employeeId === employeeId);
  };

  // Obtener pedidos del día actual
  const getTodayOrders = () => {
    const today = new Date().toISOString().split('T')[0];
    return orders.filter(order => order.timestamp.startsWith(today));
  };

  // Obtener total de ventas del día
  const getTodaySalesTotal = () => {
    const todayOrders = getTodayOrders();
    return todayOrders.reduce((total, order) => total + (order.total || 0), 0);
  };

  return {
    orders,
    addOrder,
    getOrdersByEmployee,
    getTodayOrders,
    getTodaySalesTotal
  };
};
