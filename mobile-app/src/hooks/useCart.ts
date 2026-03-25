import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemCarrito, Producto } from '../types';

const CART_KEY = 'pos_cart';

export const useCart = () => {
  const [cart, setCart] = useState<ItemCarrito[]>([]);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_KEY);
      if (stored) setCart(JSON.parse(stored));
    } catch (e) { console.error('Error loading cart:', e); }
  };

  const saveCart = async (newCart: ItemCarrito[]) => {
    try {
      await AsyncStorage.setItem(CART_KEY, JSON.stringify(newCart));
    } catch (e) { console.error('Error saving cart:', e); }
    setCart(newCart);
  };

  const addItem = useCallback(async (product: Producto) => {
    const existing = cart.find(i => i.id === product.id);
    let newCart: ItemCarrito[];
    if (existing) {
      newCart = cart.map(i =>
        i.id === product.id
          ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio }
          : i
      );
    } else {
      newCart = [...cart, { ...product, cantidad: 1, subtotal: product.precio }];
    }
    await saveCart(newCart);
  }, [cart]);

  const updateQuantity = useCallback(async (id: string, delta: number) => {
    const newCart = cart
      .map(i => {
        if (i.id === id) {
          const newQty = i.cantidad + delta;
          return newQty > 0 ? { ...i, cantidad: newQty, subtotal: newQty * i.precio } : null;
        }
        return i;
      })
      .filter(Boolean) as ItemCarrito[];
    await saveCart(newCart);
  }, [cart]);

  const removeItem = useCallback(async (id: string) => {
    const newCart = cart.filter(i => i.id !== id);
    await saveCart(newCart);
  }, [cart]);

  const clearCart = useCallback(async () => {
    await saveCart([]);
  }, []);

  const subtotal = cart.reduce((sum, i) => sum + i.subtotal, 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return {
    cart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    iva,
    total,
    itemCount: cart.reduce((sum, i) => sum + i.cantidad, 0),
  };
};
