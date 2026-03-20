import { useAuthStore } from '../store';

const API_BASE_URL = 'http://192.168.100.14:8080/api';

const MOCK_EMPLOYEES = [
  { id: 'EMP001', nombre: 'Juan García', profile: 'Cajero', color: '#1e7f5c', password: '123456' },
  { id: 'EMP003', nombre: 'Carlos Rodríguez', profile: 'Supervisor', color: '#2563eb', password: '123456' },
  { id: 'EMP005', nombre: 'Pedro Sánchez', profile: 'Director', color: '#dc2626', password: '123456' },
];

export const authService = {
  login: async (employeeId, password) => {
    await simulateDelay(800);

    const employee = MOCK_EMPLOYEES.find(
      emp => emp.id === employeeId.toUpperCase() && emp.password === password
    );

    if (employee) {
      const { password: _, ...userWithoutPassword } = employee;
      const mockToken = `mock_jwt_token_${Date.now()}`;
      useAuthStore.getState().login(userWithoutPassword, mockToken);
      return { success: true, user: userWithoutPassword, token: mockToken };
    }

    return { success: false, error: 'Credenciales incorrectas' };
  },

  logout: () => {
    useAuthStore.getState().logout();
  },

  getCurrentUser: () => {
    const { user, token, isAuthenticated } = useAuthStore.getState();
    return isAuthenticated ? user : null;
  },

  isAuthenticated: () => {
    return useAuthStore.getState().isAuthenticated;
  },
};

export const productService = {
  getProducts: async () => {
    await simulateDelay(300);

    const mockProducts = [
      { id: 1, nombre: 'Coca-Cola 600ml', sku: '7501234567890', precio: 18.50, categoria: 'Bebidas', stock: 50 },
      { id: 2, nombre: 'Sabritas Original 150g', sku: '7501234567891', precio: 22.00, categoria: 'Botanas', stock: 30 },
      { id: 3, nombre: 'Bimbo Blanco 450g', sku: '7501234567892', precio: 32.00, categoria: 'Panificación', stock: 20 },
      { id: 4, nombre: 'Leche Liconsa 1L', sku: '7501234567893', precio: 24.50, categoria: 'Lácteos', stock: 40 },
      { id: 5, nombre: 'Huevo Rojo 12 pzas', sku: '7501234567894', precio: 38.00, categoria: 'Huevos', stock: 25 },
      { id: 6, nombre: 'Frijol Negro 1kg', sku: '7501234567895', precio: 28.00, categoria: 'Granos', stock: 35 },
      { id: 7, nombre: 'Aceite Culinary 900ml', sku: '7501234567896', precio: 42.00, categoria: 'Aceites', stock: 15 },
      { id: 8, nombre: 'Azúcar Standard 1kg', sku: '7501234567897', precio: 26.00, categoria: 'Endulzantes', stock: 30 },
      { id: 9, nombre: 'Café Instantáneo 200g', sku: '7501234567898', precio: 55.00, categoria: 'Café', stock: 20 },
      { id: 10, nombre: 'Jabón Zote 400g', sku: '7501234567899', precio: 18.00, categoria: 'Limpieza', stock: 45 },
      { id: 11, nombre: 'Detergente Persil 1.5L', sku: '7501234567900', precio: 85.00, categoria: 'Limpieza', stock: 18 },
      { id: 12, nombre: 'Agua Ciel 1.5L', sku: '7501234567901', precio: 12.00, categoria: 'Bebidas', stock: 60 },
      { id: 13, nombre: 'Galletas María 600g', sku: '7501234567902', precio: 35.00, categoria: 'Galletas', stock: 40 },
      { id: 14, nombre: 'Pasta Dental Colgate 150g', sku: '7501234567903', precio: 48.00, categoria: 'Higiene', stock: 25 },
      { id: 15, nombre: 'Papel Higiénico Regency 12p', sku: '7501234567904', precio: 65.00, categoria: 'Higiene', stock: 30 },
    ];

    return { success: true, products: mockProducts };
  },

  searchByBarcode: async (barcode) => {
    await simulateDelay(200);

    const { products } = await productService.getProducts();
    const product = products.find(p => p.sku === barcode);

    if (product) {
      return { success: true, product };
    }

    return { success: false, error: 'Producto no encontrado' };
  },
};

export const saleService = {
  createSale: async (items, total, employeeId) => {
    await simulateDelay(500);

    return {
      success: true,
      sale: {
        id: `VENTA-${Date.now()}`,
        items: items,
        total: total,
        employeeId: employeeId,
        fecha: new Date().toISOString(),
        status: 'completada',
      },
    };
  },
};

const simulateDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
