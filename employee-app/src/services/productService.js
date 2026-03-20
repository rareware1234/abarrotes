import api from './api';

export const productService = {
  // Obtener producto por código de barras (para escáner)
  getProductByBarcode: async (barcode) => {
    try {
      // Intentar buscar por código de barras en el backend
      // Primero intentar con el endpoint de scanner
      try {
        const response = await api.get(`/api/scanner/product/${barcode}`);
        const product = response.data;
        
        // Mapear datos para consistencia
        return {
          id: product.id || product.productId,
          name: product.nombreProducto || product.name,
          price: product.precio || product.price,
          barcode: barcode,
          image: product.imagen || product.image || `https://via.placeholder.com/200?text=${encodeURIComponent(product.nombreProducto || product.name)}`,
          description: product.descripcion || product.description,
          stock: product.stock || 0,
          category: product.categoria || product.category
        };
      } catch (scannerError) {
        // Si falla, intentar con endpoint de productos
        const response = await api.get(`/api/products/barcode/${barcode}`);
        const product = response.data;
        
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          barcode: product.barcode || product.sku,
          image: product.image || `https://via.placeholder.com/200?text=${encodeURIComponent(product.name)}`,
          description: product.description,
          stock: product.stock || 0,
          category: product.category
        };
      }
    } catch (error) {
      console.error('Error obteniendo producto por barcode:', error);
      
      // Si todo falla, buscar en productos de demo
      const demoProducts = await productService.getRecentProducts();
      const foundProduct = demoProducts.find(p => 
        p.barcode === barcode || p.sku === barcode
      );
      
      if (foundProduct) {
        return foundProduct;
      }
      
      throw new Error('Producto no encontrado');
    }
  },

  // Escanear producto por código de barras (alias)
  scanProduct: async (barcode) => {
    try {
      // Intentar buscar por código de barras en el backend
      const response = await api.get(`/api/products/barcode/${barcode}`);
      const product = response.data;
      
      // Mapear datos para consistencia
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        barcode: product.barcode || product.sku,
        image: product.image || `https://via.placeholder.com/150?text=${encodeURIComponent(product.name)}`,
        sku: product.sku,
        category: product.category,
        description: product.description
      };
    } catch (error) {
      console.error('Error escaneando producto:', error);
      
      // Si hay error, buscar en productos de demo
      const demoProducts = await productService.getRecentProducts();
      const foundProduct = demoProducts.find(p => 
        p.barcode === barcode || p.sku === barcode
      );
      
      if (foundProduct) {
        return foundProduct;
      }
      
      throw new Error('Producto no encontrado');
    }
  },

  // Buscar productos por término de búsqueda
  searchProducts: async (searchTerm) => {
    try {
      // Usar el endpoint de búsqueda del backend (case-sensitive)
      // Intentar con la primera letra mayúscula
      const searchWithCap = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
      const response = await api.get(`/api/products/search?q=${encodeURIComponent(searchWithCap)}`);
      return response.data;
    } catch (error) {
      console.error('Error buscando productos:', error);
      // Retornar productos de demo que coincidan
      const demoProducts = await productService.getRecentProducts();
      return demoProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm)) ||
        (p.sku && p.sku.includes(searchTerm))
      );
    }
  },

  // Obtener productos recientes (para demo)
  getRecentProducts: async () => {
    // En producción, esto debería consumir un endpoint del backend
    // Usamos los mismos SKU que el backend para consistencia
    return [
      {
        id: 1,
        name: 'Leche Entera',
        price: 20.00,
        barcode: 'PROD001',
        sku: 'PROD001',
        image: 'https://via.placeholder.com/150?text=Leche',
        category: 'Frescos'
      },
      {
        id: 2,
        name: 'Arroz Grano',
        price: 45.00,
        barcode: 'PROD002',
        sku: 'PROD002',
        image: 'https://via.placeholder.com/150?text=Arroz',
        category: 'Abarrotes'
      },
      {
        id: 3,
        name: 'Frijol Negro',
        price: 38.00,
        barcode: 'PROD003',
        sku: 'PROD003',
        image: 'https://via.placeholder.com/150?text=Frijol',
        category: 'Abarrotes'
      },
      {
        id: 4,
        name: 'Galletas Oreo',
        price: 35.00,
        barcode: '7501055301234',
        sku: 'SKU004',
        image: 'https://via.placeholder.com/150?text=Oreo',
        category: 'Golosinas'
      },
      {
        id: 5,
        name: 'Cereal Integral',
        price: 55.00,
        barcode: '7501055301235',
        sku: 'SKU005',
        image: 'https://via.placeholder.com/150?text=Cereal',
        category: 'Abarrotes'
      }
    ];
  }
};

export default productService;
