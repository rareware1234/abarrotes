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
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, borderRadius, spacing } from '../theme';
import { useCartStore, useProductStore } from '../store';
import { productService, saleService, paymentService, PAYMENT_METHODS } from '../services/api';
import { useAuthStore } from '../store';

const PaymentMethodButton = ({ method, selected, onPress }) => (
  <TouchableOpacity
    style={[
      styles.paymentMethodBtn,
      { borderColor: selected ? method.color : colors.border },
      { backgroundColor: selected ? method.color + '20' : colors.surface },
    ]}
    onPress={onPress}
  >
    <Text style={styles.paymentMethodIcon}>{method.icono}</Text>
    <Text style={styles.paymentMethodName}>{method.nombre}</Text>
  </TouchableOpacity>
);

const POSScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showProductList, setShowProductList] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS.EFECTIVO);
  const [cashAmount, setCashAmount] = useState('');
  const [qrData, setQrData] = useState(null);
  const [paymentStep, setPaymentStep] = useState('select'); // select, qr, processing, success
  
  const { items, total, addItem, updateQuantity, clearCart, getItemCount } = useCartStore();
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

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega productos antes de cobrar');
      return;
    }
    setShowPayment(true);
    setShowCart(false);
  };

  const processPayment = async () => {
    if (selectedPayment.id === 'efectivo' && parseFloat(cashAmount || 0) < total) {
      Alert.alert('Monto insuficiente', 'El monto recibido es menor al total');
      return;
    }

    setPaymentStep('processing');

    if (selectedPayment.id === 'mercadopago_qr' || selectedPayment.id === 'codi') {
      const result = await paymentService.generateQR(selectedPayment, total);
      if (result.success) {
        setQrData(result);
        setPaymentStep('qr');
      }
    } else {
      const result = await paymentService.processPayment(selectedPayment, total, parseFloat(cashAmount || 0));
      if (result.success) {
        setPaymentStep('success');
      }
    }
  };

  const confirmQRPayment = () => {
    setPaymentStep('success');
  };

  const completeSale = () => {
    clearCart();
    setShowPayment(false);
    setPaymentStep('select');
    setSelectedPayment(PAYMENT_METHODS.EFECTIVO);
    setCashAmount('');
    setQrData(null);
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

      {/* Cart Modal */}
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
                disabled={items.length === 0}
              >
                <Text style={styles.checkoutButtonText}>💰 Cobrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPayment} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.cartModal, { maxHeight: '95%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Método de Pago</Text>
              <TouchableOpacity onPress={() => { setShowPayment(false); setPaymentStep('select'); }}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Total */}
            <View style={styles.totalHeader}>
              <Text style={styles.totalHeaderLabel}>Total a pagar</Text>
              <Text style={styles.totalHeaderAmount}>${total.toFixed(2)}</Text>
            </View>

            {/* Payment Methods */}
            {paymentStep === 'select' && (
              <View style={styles.paymentMethods}>
                <View style={styles.paymentMethodsGrid}>
                  <PaymentMethodButton
                    method={PAYMENT_METHODS.EFECTIVO}
                    selected={selectedPayment.id === 'efectivo'}
                    onPress={() => setSelectedPayment(PAYMENT_METHODS.EFECTIVO)}
                  />
                  <PaymentMethodButton
                    method={PAYMENT_METHODS.MERCADOPAGO_QR}
                    selected={selectedPayment.id === 'mercadopago_qr'}
                    onPress={() => setSelectedPayment(PAYMENT_METHODS.MERCADOPAGO_QR)}
                  />
                  <PaymentMethodButton
                    method={PAYMENT_METHODS.CODI}
                    selected={selectedPayment.id === 'codi'}
                    onPress={() => setSelectedPayment(PAYMENT_METHODS.CODI)}
                  />
                  <PaymentMethodButton
                    method={PAYMENT_METHODS.TARJETA_DEBITO}
                    selected={selectedPayment.id === 'tarjeta_debito'}
                    onPress={() => setSelectedPayment(PAYMENT_METHODS.TARJETA_DEBITO)}
                  />
                  <PaymentMethodButton
                    method={PAYMENT_METHODS.TARJETA_CREDITO}
                    selected={selectedPayment.id === 'tarjeta_credito'}
                    onPress={() => setSelectedPayment(PAYMENT_METHODS.TARJETA_CREDITO)}
                  />
                  <PaymentMethodButton
                    method={PAYMENT_METHODS.TRANSFERENCIA}
                    selected={selectedPayment.id === 'transferencia'}
                    onPress={() => setSelectedPayment(PAYMENT_METHODS.TRANSFERENCIA)}
                  />
                </View>

                {/* Cash input */}
                {selectedPayment.id === 'efectivo' && (
                  <View style={styles.cashSection}>
                    <Text style={styles.cashLabel}>Monto Recibido</Text>
                    <View style={styles.quickAmounts}>
                      <TouchableOpacity style={styles.quickAmountBtn} onPress={() => setCashAmount(Math.ceil(total).toString())}>
                        <Text style={styles.quickAmountText}>${Math.ceil(total)}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.quickAmountBtn} onPress={() => setCashAmount((Math.ceil(total / 100) * 100).toString())}>
                        <Text style={styles.quickAmountText}>${Math.ceil(total / 100) * 100}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.quickAmountBtn} onPress={() => setCashAmount('500')}>
                        <Text style={styles.quickAmountText}>$500</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.quickAmountBtn} onPress={() => setCashAmount('1000')}>
                        <Text style={styles.quickAmountText}>$1000</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.cashInput}
                      value={cashAmount}
                      onChangeText={setCashAmount}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      placeholderTextColor={colors.textMuted}
                    />
                    {cashAmount && parseFloat(cashAmount) >= total && (
                      <View style={styles.changeDisplay}>
                        <Text style={styles.changeLabel}>Cambio:</Text>
                        <Text style={styles.changeAmount}>${(parseFloat(cashAmount) - total).toFixed(2)}</Text>
                      </View>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.payButton,
                    selectedPayment.id === 'efectivo' && parseFloat(cashAmount || 0) < total && styles.payButtonDisabled
                  ]}
                  onPress={processPayment}
                  disabled={selectedPayment.id === 'efectivo' && parseFloat(cashAmount || 0) < total}
                >
                  <Text style={styles.payButtonText}>Confirmar Pago</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* QR Display */}
            {paymentStep === 'qr' && qrData && (
              <View style={styles.qrSection}>
                <Text style={styles.qrTitle}>📱 {selectedPayment.nombre}</Text>
                <Text style={styles.qrSubtitle}>Muestra el QR al cliente para cobrar</Text>
                <View style={styles.qrContainer}>
                  <Image source={{ uri: qrData.qrCode }} style={styles.qrImage} />
                </View>
                <View style={styles.referenceBox}>
                  <Text style={styles.referenceLabel}>Referencia:</Text>
                  <Text style={styles.referenceValue}>{qrData.referencia}</Text>
                </View>
                <TouchableOpacity style={styles.confirmQRButton} onPress={confirmQRPayment}>
                  <Text style={styles.confirmQRButtonText}>✓ Pago Recibido</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Processing */}
            {paymentStep === 'processing' && (
              <View style={styles.processingSection}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.processingText}>Procesando...</Text>
              </View>
            )}

            {/* Success */}
            {paymentStep === 'success' && (
              <View style={styles.successSection}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successTitle}>¡Pago Exitoso!</Text>
                <Text style={styles.successSubtitle}>Venta completada correctamente</Text>
                <TouchableOpacity style={styles.doneButton} onPress={completeSale}>
                  <Text style={styles.doneButtonText}>Nueva Venta</Text>
                </TouchableOpacity>
              </View>
            )}
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
    maxHeight: 200,
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
    marginHorizontal: spacing.sm,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  quantityText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    width: 28,
    textAlign: 'center',
  },
  cartItemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    minWidth: 60,
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
  // Payment Modal Styles
  totalHeader: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    alignItems: 'center',
  },
  totalHeaderLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  totalHeaderAmount: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '700',
  },
  paymentMethods: {
    padding: spacing.md,
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  paymentMethodBtn: {
    width: '31%',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  paymentMethodIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  paymentMethodName: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  cashSection: {
    marginBottom: spacing.md,
  },
  cashLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  quickAmountBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  quickAmountText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  cashInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
  },
  changeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  changeLabel: {
    color: colors.success,
    fontSize: 16,
  },
  changeAmount: {
    color: colors.success,
    fontSize: 24,
    fontWeight: '700',
  },
  payButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  // QR Section
  qrSection: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  qrTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  qrSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  qrContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  referenceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  referenceLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  referenceValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  confirmQRButton: {
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
  },
  confirmQRButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  // Processing
  processingSection: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  processingText: {
    color: colors.text,
    fontSize: 16,
    marginTop: spacing.md,
  },
  // Success
  successSection: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 64,
    color: colors.success,
    marginBottom: spacing.md,
  },
  successTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.xl,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default POSScreen;
