import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, borderRadius, spacing } from '../theme';
import { useCartStore, useProductStore } from '../store';
import { productService, saleService } from '../services/api';
import { useAuthStore } from '../store';

const POSScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showProductList, setShowProductList] = useState(false);
  
  const { items, total, addItem, removeItem, updateQuantity, clearCart, getItemCount } = useCartStore();
  const { products, filteredProducts, setProducts, setSearchQuery: setStoreSearchQuery } = useProductStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    setStoreSearchQuery(searchQuery);
    setShowProductList(searchQuery.length > 0);
  }, [searchQuery]);

  const loadProducts = async () => {
    const result = await productService.getProducts();
    if (result.success) {
      setProducts(result.products);
    }
  };

  const handleAddProduct = (product) => {
    addItem(product);
    setSearchQuery('');
    setShowProductList(false);
  };

  const handleScanSuccess = useCallback((barcode) => {
    const product = products.find(p => p.sku === barcode);
    if (product) {
      handleAddProduct(product);
    } else {
      Alert.alert('Producto no encontrado', `No hay productos con código: ${barcode}`);
    }
  }, [products]);

  useEffect(() => {
    if (navigation.getState().routes[navigation.getState().index].params?.barcode) {
      const barcode = navigation.getState().routes[navigation.getState().index].params.barcode;
      handleScanSuccess(barcode);
      navigation.setParams({ barcode: undefined });
    }
  }, [navigation.getState()]);

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega productos antes de cobrar');
      return;
    }

    setLoading(true);
    try {
      const result = await saleService.createSale(items, total, user?.id);
      if (result.success) {
        Alert.alert(
          'Venta completada',
          `Total: $${total.toFixed(2)}\nFolio: ${result.sale.id}`,
          [{ text: 'OK', onPress: () => clearCart() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo completar la venta');
    } finally {
      setLoading(false);
    }
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity style={styles.productItem} onPress={() => handleAddProduct(item)}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.nombre}</Text>
        <Text style={styles.productSku}>{item.sku}</Text>
      </View>
      <Text style={styles.productPrice}>${item.precio.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName} numberOfLines={2}>{item.nombre}</Text>
        <Text style={styles.cartItemPrice}>${item.precio.toFixed(2)} c/u</Text>
      </View>
      <View style={styles.cartItemActions}>
        <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.cartItemTotal}>${(item.precio * item.quantity).toFixed(2)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Venta</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Scanner', { onScan: handleScanSuccess })}>
          <Text style={styles.scanButton}>📷</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar producto por nombre o SKU..."
          placeholderTextColor={colors.textMuted}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => { setSearchQuery(''); setShowProductList(false); }}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {showProductList && filteredProducts.length > 0 && (
        <View style={styles.productListContainer}>
          <FlatList
            data={filteredProducts.slice(0, 6)}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProductItem}
            style={styles.productList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {!showProductList && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Buscar producto</Text>
          <Text style={styles.emptySubtitle}>Escribe el nombre o SKU del producto</Text>
          <TouchableOpacity style={styles.scanButtonLarge} onPress={() => navigation.navigate('Scanner', { onScan: handleScanSuccess })}>
            <Text style={styles.scanButtonLargeText}>📷 Escanear código de barras</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.cartButton} onPress={() => setShowCart(true)} activeOpacity={0.9}>
        <View style={styles.cartButtonContent}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartButtonTitle}>Ver Carrito</Text>
            <Text style={styles.cartButtonSubtitle}>{getItemCount()} productos</Text>
          </View>
          <Text style={styles.cartButtonTotal}>${total.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>

      <Modal visible={showCart} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.cartModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Carrito de Compras</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyCart}>
                <Text style={styles.emptyCartText}>El carrito está vacío</Text>
              </View>
            ) : (
              <FlatList
                data={items}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderCartItem}
                style={styles.cartList}
              />
            )}

            <View style={styles.cartFooter}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.checkoutButton, items.length === 0 && styles.checkoutButtonDisabled]}
                onPress={handleCheckout}
                disabled={items.length === 0 || loading}
              >
                <Text style={styles.checkoutButtonText}>
                  {loading ? 'Procesando...' : '💰 Cobrar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    fontSize: 32,
    color: colors.text,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  scanButton: {
    fontSize: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  clearButton: {
    padding: spacing.md,
  },
  clearButtonText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  productListContainer: {
    flex: 1,
    marginHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    maxHeight: 300,
  },
  productList: {
    flex: 1,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  productSku: {
    fontSize: 12,
    color: colors.textMuted,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  scanButtonLarge: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  scanButtonLargeText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cartButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  cartButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartInfo: {},
  cartButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  cartButtonSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  cartButtonTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  cartModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: colors.textMuted,
  },
  cartList: {
    maxHeight: 300,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  cartItemPrice: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  quantityText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    width: 32,
    textAlign: 'center',
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    minWidth: 70,
    textAlign: 'right',
  },
  emptyCart: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyCartText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  cartFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  checkoutButton: {
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    opacity: 0.5,
  },
  checkoutButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default POSScreen;
