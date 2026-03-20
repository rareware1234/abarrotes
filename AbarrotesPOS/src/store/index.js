import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: (userData, token) => {
        set({
          user: userData,
          token: token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const useCartStore = create((set, get) => ({
  items: [],
  total: 0,

  addItem: (product) => {
    const items = get().items;
    const existingIndex = items.findIndex(item => item.id === product.id);

    if (existingIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += 1;
      set({ items: updatedItems, total: calculateTotal(updatedItems) });
    } else {
      const newItems = [...items, { ...product, quantity: 1 }];
      set({ items: newItems, total: calculateTotal(newItems) });
    }
  },

  removeItem: (productId) => {
    const items = get().items.filter(item => item.id !== productId);
    set({ items, total: calculateTotal(items) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const items = get().items.map(item =>
      item.id === productId ? { ...item, quantity } : item
    );
    set({ items, total: calculateTotal(items) });
  },

  clearCart: () => {
    set({ items: [], total: 0 });
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));

const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
};

export const useProductStore = create((set, get) => ({
  products: [],
  searchQuery: '',
  filteredProducts: [],

  setProducts: (products) => {
    set({ products, filteredProducts: products });
  },

  setSearchQuery: (query) => {
    const products = get().products;
    const filtered = products.filter(product =>
      product.nombre.toLowerCase().includes(query.toLowerCase()) ||
      product.sku?.toLowerCase().includes(query.toLowerCase()) ||
      product.codigo?.toLowerCase().includes(query.toLowerCase())
    );
    set({ searchQuery: query, filteredProducts: filtered });
  },

  getPopularProducts: () => {
    return get().products.slice(0, 8);
  },
}));
