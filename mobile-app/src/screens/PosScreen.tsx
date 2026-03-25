import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  Modal, Animated, Alert, ActivityIndicator, Dimensions, ScrollView,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../context/AuthContext';
import { fetchProductos, guardarProductosCache, crearOrden } from '../services/apiService';
import { Producto, MetodoPago, ConfigEmpresa } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const { width } = Dimensions.get('window');

export default function PosScreen() {
  const { cart, addItem, updateQuantity, removeItem, clearCart, subtotal, iva, total, itemCount } = useCart();
  const { empleado } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtered, setFiltered] = useState<Producto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<MetodoPago>('EFECTIVO');
  const [montoPagado, setMontoPagado] = useState('');
  const [ticketMethod, setTicketMethod] = useState<'digital' | 'impreso'>('digital');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [config, setConfig] = useState<ConfigEmpresa | null>(null);
  const [saleSuccess, setSaleSuccess] = useState<{ total: number; cambio: number } | null>(null);
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const loadData = async () => {
    try {
      const prods = await fetchProductos();
      setProductos(prods);
      setFiltered(prods.slice(0, 20));
      await guardarProductosCache(prods);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los productos. Verifica tu conexión.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadConfig = async () => {
    try {
      const snap = await getDoc(doc(db, 'config', 'empresa'));
      if (snap.exists()) setConfig(snap.data() as ConfigEmpresa);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadData(); loadConfig(); }, []);

  useEffect(() => {
    if (search.trim()) {
      const term = search.toLowerCase();
      const results = productos.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)
      ).slice(0, 30);
      setFiltered(results);
    } else {
      setFiltered(productos.slice(0, 20));
    }
  }, [search, productos]);

  const handleAdd = useCallback((product: Producto) => {
    addItem(product);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
  }, [addItem]);

  const handleConfirmPayment = async () => {
    if (paymentMethod === 'EFECTIVO' && (!montoPagado || parseFloat(montoPagado) < total)) {
      Alert.alert('Monto insuficiente', 'El monto recibido debe ser mayor o igual al total.');
      return;
    }

    try {
      const orden = {
        empleadoId: empleado?.uid || '',
        items: cart.map(i => ({ id: i.id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad, subtotal: i.subtotal })),
        subtotal,
        iva,
        total,
        montoPagado: paymentMethod === 'EFECTIVO' ? parseFloat(montoPagado) : total,
        cambio: paymentMethod === 'EFECTIVO' ? parseFloat(montoPagado) - total : 0,
        metodoPago: paymentMethod,
        estado: 'COMPLETADA',
        fechaCreacion: new Date().toISOString(),
      };

      await crearOrden(orden);
      const cambio = paymentMethod === 'EFECTIVO' ? parseFloat(montoPagado) - total : 0;
      setSaleSuccess({ total, cambio });
      setShowPayment(false);
      setShowSuccess(true);
      setMontoPagado('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'No se pudo procesar la venta. Intenta de nuevo.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const renderProduct = ({ item }: { item: Producto }) => (
    <TouchableOpacity
      style={[styles.productCard, item.stock === 0 && styles.productAgotado]}
      onPress={() => handleAdd(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productIcon}>
        <Ionicons name="cube" size={24} color={item.stock === 0 ? '#999' : COLORS.primary} />
      </View>
      <Text style={[styles.productName, item.stock === 0 && styles.textAgotado]} numberOfLines={2}>
        {item.nombre}
      </Text>
      <Text style={styles.productSku}>{item.sku.slice(-6)}</Text>
      <Text style={[styles.productPrice, item.stock === 0 && styles.textAgotado]}>
        ${item.precio.toFixed(2)}
      </Text>
      {item.stock === 0 && <View style={styles.agotadoOverlay}><Text style={styles.agotadoText}>AGOTADO</Text></View>}
    </TouchableOpacity>
  );

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName} numberOfLines={1}>{item.nombre}</Text>
        <Text style={styles.cartItemPrice}>${item.precio.toFixed(2)} c/u</Text>
      </View>
      <View style={styles.cartItemControls}>
        <TouchableOpacity onPress={() => { updateQuantity(item.id, -1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={styles.qtyBtn}>
          <Ionicons name="remove" size={16} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.cantidad}</Text>
        <TouchableOpacity onPress={() => { updateQuantity(item.id, 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={styles.qtyBtn}>
          <Ionicons name="add" size={16} color={COLORS.textDark} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { removeItem(item.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} style={styles.deleteBtn}>
          <Ionicons name="trash" size={16} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
      <Text style={styles.cartItemSubtotal}>${item.subtotal.toFixed(2)}</Text>
    </View>
  );

  const PaymentModal = () => (
    <Modal visible={showPayment} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Método de Pago</Text>
            <TouchableOpacity onPress={() => setShowPayment(false)}>
              <Ionicons name="close" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>
          <Text style={styles.totalLabel}>Total a pagar</Text>
          <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>

          <View style={styles.methodsGrid}>
            {(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'MERCADOPAGO', 'CODI'] as MetodoPago[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.methodBtn, paymentMethod === m && styles.methodBtnActive]}
                onPress={() => { setPaymentMethod(m); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Ionicons
                  name={m === 'EFECTIVO' ? 'cash' : m === 'TARJETA' ? 'card' : m === 'TRANSFERENCIA' ? 'swap-horizontal' : 'qr-code'}
                  size={24}
                  color={paymentMethod === m ? COLORS.white : COLORS.primary}
                />
                <Text style={[styles.methodText, paymentMethod === m && { color: COLORS.white }]}>
                  {m === 'MERCADOPAGO' ? 'MercadoPago' : m === 'CODI' ? 'CoDi' : m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {paymentMethod === 'EFECTIVO' && (
            <View style={styles.cashSection}>
              <Text style={styles.inputLabel}>Monto recibido</Text>
              <View style={styles.billButtons}>
                {[50, 100, 200, 500].map(b => (
                  <TouchableOpacity key={b} style={styles.billBtn} onPress={() => setMontoPagado(b.toString())}>
                    <Text style={styles.billBtnText}>${b}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.billBtn} onPress={() => setMontoPagado(Math.ceil(total).toString())}>
                  <Text style={styles.billBtnText}>EXACTA</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.cashInput}
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={montoPagado}
                onChangeText={setMontoPagado}
              />
              {montoPagado && parseFloat(montoPagado) >= total && (
                <Text style={styles.cambioText}>
                  Cambio: <Text style={styles.cambioAmount}>${(parseFloat(montoPagado) - total).toFixed(2)}</Text>
                </Text>
              )}
            </View>
          )}

          {paymentMethod === 'TRANSFERENCIA' && config && (
            <View style={styles.transferSection}>
              <Text style={styles.transferLabel}>CLABE: <Text style={styles.transferValue}>{config.clabeInterbancaria}</Text></Text>
              <Text style={styles.transferLabel}>Banco: <Text style={styles.transferValue}>{config.banco}</Text></Text>
              <Text style={styles.transferLabel}>Beneficiario: <Text style={styles.transferValue}>{config.nombreEmpresa}</Text></Text>
            </View>
          )}

          {(paymentMethod === 'MERCADOPAGO' || paymentMethod === 'CODI') && (
            <View style={styles.qrSection}>
              <QRCode value={`${paymentMethod}-${Date.now()}-${total.toFixed(2)}`} size={180} />
              <Text style={styles.qrRef}>Ref: {Date.now().toString().slice(-8)}</Text>
            </View>
          )}

          <View style={styles.ticketSection}>
            <Text style={styles.inputLabel}>Tipo de ticket</Text>
            <View style={styles.ticketBtns}>
              <TouchableOpacity style={[styles.ticketBtn, ticketMethod === 'digital' && styles.ticketBtnActive]} onPress={() => setTicketMethod('digital')}>
                <Ionicons name="phone-portrait" size={20} color={ticketMethod === 'digital' ? COLORS.white : COLORS.primary} />
                <Text style={[styles.ticketBtnText, ticketMethod === 'digital' && { color: COLORS.white }]}>Digital</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ticketBtn, ticketMethod === 'impreso' && styles.ticketBtnActive]} onPress={() => setTicketMethod('impreso')}>
                <Ionicons name="print" size={20} color={ticketMethod === 'impreso' ? COLORS.white : COLORS.primary} />
                <Text style={[styles.ticketBtnText, ticketMethod === 'impreso' && { color: COLORS.white }]}>Impreso</Text>
              </TouchableOpacity>
            </View>
            {ticketMethod === 'digital' && (
              <TextInput
                style={styles.phoneInput}
                placeholder="Teléfono a 10 dígitos"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            )}
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, paymentMethod === 'EFECTIVO' && parseFloat(montoPagado || '0') < total && styles.confirmBtnDisabled]}
            onPress={handleConfirmPayment}
            disabled={paymentMethod === 'EFECTIVO' && parseFloat(montoPagado || '0') < total}
          >
            <Text style={styles.confirmBtnText}>Confirmar Pago</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const SuccessOverlay = () => (
    <Modal visible={showSuccess} animationType="fade" transparent>
      <View style={styles.successOverlay}>
        <Animated.View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>¡Venta Exitosa!</Text>
          {saleSuccess && (
            <>
              <Text style={styles.successTotal}>Total: ${saleSuccess.total.toFixed(2)}</Text>
              {saleSuccess.cambio > 0 && (
                <Text style={styles.successCambio}>Cambio: ${saleSuccess.cambio.toFixed(2)}</Text>
              )}
            </>
          )}
          <TouchableOpacity style={styles.newSaleBtn} onPress={() => {
            clearCart();
            setShowSuccess(false);
            setSaleSuccess(null);
          }}>
            <Text style={styles.newSaleBtnText}>Nueva Venta</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar producto o SKU..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderProduct}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron productos</Text>}
      />

      {cart.length > 0 && (
        <View style={styles.cartFooter}>
          <Animated.View style={[styles.cartSummary, { transform: [{ scale: bounceAnim }] }]}>
            <View style={styles.cartInfo}>
              <Ionicons name="cart" size={24} color={COLORS.white} />
              <Text style={styles.cartCount}>{itemCount} productos</Text>
            </View>
            <Text style={styles.cartTotal}>${total.toFixed(2)}</Text>
            <TouchableOpacity style={styles.cobrarBtn} onPress={() => setShowPayment(true)}>
              <Text style={styles.cobrarBtnText}>COBRAR</Text>
            </TouchableOpacity>
          </Animated.View>

          <FlatList
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cartItemsList}
          />
        </View>
      )}

      <PaymentModal />
      <SuccessOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, color: COLORS.textMuted },
  header: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f7f6', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: COLORS.textDark },
  productList: { padding: 12 },
  productRow: { justifyContent: 'space-between' },
  productCard: { width: (width - 36) / 2, backgroundColor: COLORS.white, borderRadius: 16, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  productAgotado: { opacity: 0.6 },
  productIcon: { width: 44, height: 44, backgroundColor: '#f0f5f0', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: 4 },
  productSku: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  textAgotado: { color: '#999' },
  agotadoOverlay: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.danger, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  agotadoText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40 },
  cartFooter: { backgroundColor: COLORS.white, borderTopWidth: 3, borderTopColor: COLORS.primary, paddingBottom: 20 },
  cartSummary: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  cartInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  cartCount: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  cartTotal: { color: COLORS.white, fontSize: 20, fontWeight: '800', marginRight: 12 },
  cobrarBtn: { backgroundColor: COLORS.success, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  cobrarBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  cartItemsList: { paddingHorizontal: 16, gap: 8 },
  cartItem: { backgroundColor: '#f5f7f6', borderRadius: 12, padding: 10, marginRight: 8, width: 140 },
  cartItemInfo: { marginBottom: 6 },
  cartItemName: { fontSize: 12, fontWeight: '600', color: COLORS.textDark },
  cartItemPrice: { fontSize: 10, color: COLORS.textMuted },
  cartItemControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: { width: 24, height: 24, backgroundColor: COLORS.white, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 12, fontWeight: '600', minWidth: 20, textAlign: 'center' },
  deleteBtn: { marginLeft: 4 },
  cartItemSubtotal: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textDark },
  totalLabel: { textAlign: 'center', color: COLORS.textMuted, fontSize: 14 },
  totalAmount: { textAlign: 'center', fontSize: 36, fontWeight: '800', color: COLORS.primary, marginBottom: 20 },
  methodsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  methodBtn: { width: '31%', backgroundColor: '#f5f7f6', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  methodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  methodText: { fontSize: 11, fontWeight: '600', marginTop: 4, color: COLORS.primary },
  cashSection: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 8 },
  billButtons: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  billBtn: { flex: 1, backgroundColor: '#f5f7f6', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  billBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  cashInput: { backgroundColor: '#f5f7f6', borderRadius: 12, padding: 14, fontSize: 24, fontWeight: '700', textAlign: 'center', color: COLORS.textDark },
  cambioText: { textAlign: 'center', marginTop: 10, fontSize: 14, color: COLORS.success },
  cambioAmount: { fontWeight: '800', fontSize: 16 },
  transferSection: { backgroundColor: '#f5f7f6', borderRadius: 12, padding: 16, marginBottom: 20 },
  transferLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },
  transferValue: { fontWeight: '700', color: COLORS.textDark },
  qrSection: { alignItems: 'center', marginBottom: 20 },
  qrRef: { marginTop: 12, fontSize: 13, color: COLORS.textMuted },
  ticketSection: { marginBottom: 20 },
  ticketBtns: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  ticketBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f5f7f6', borderRadius: 10, paddingVertical: 12, borderWidth: 2, borderColor: 'transparent' },
  ticketBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  ticketBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  phoneInput: { backgroundColor: '#f5f7f6', borderRadius: 12, padding: 14, fontSize: 16, color: COLORS.textDark },
  confirmBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  successCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 32, alignItems: 'center', width: width - 48, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.25, shadowRadius: 40 },
  successIcon: { marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '800', color: COLORS.success, marginBottom: 8 },
  successTotal: { fontSize: 20, fontWeight: '700', color: COLORS.textDark },
  successCambio: { fontSize: 16, color: COLORS.textMuted, marginTop: 4 },
  newSaleBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 24 },
  newSaleBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
