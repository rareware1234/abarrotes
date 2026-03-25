import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useCart } from '../hooks/useCart';
import { fetchProductos } from '../services/apiService';
import { Producto } from '../types';

const { width } = Dimensions.get('window');

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanCooldown, setScanCooldown] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const { addItem } = useCart();

  useEffect(() => {
    fetchProductos().then(setProductos).catch(() => {});
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    const code = result.data;
    if (scanCooldown || code === lastScanned) return;

    setLastScanned(code);
    setScanCooldown(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const producto = productos.find(p => p.sku === code || p.id === code);
    if (producto) {
      addItem(producto);
      Alert.alert('Producto agregado', `${producto.nombre} - $${producto.precio.toFixed(2)}`);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('No encontrado', `SKU: ${code}`);
    }

    setTimeout(() => { setScanCooldown(false); setLastScanned(null); }, 1500);
  };

  if (!permission) {
    return <View style={styles.container}><Text style={styles.loadingText}>Verificando permisos...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={64} color={COLORS.primary} />
          <Text style={styles.permissionTitle}>Cámara requerida</Text>
          <Text style={styles.permissionText}>Necesitamos acceso a la cámara para escanear códigos de barras de productos.</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Permitir cámara</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const scanLineY = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] });

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flash}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={scanCooldown ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />
          </View>
        </View>

        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.flashBtn} onPress={() => setFlash(!flash)}>
            <Ionicons name={flash ? 'flash' : 'flash-outline'} size={28} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.hint}>Apunta al código de barras</Text>
          <View style={{ width: 48 }} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingText: { color: COLORS.white, textAlign: 'center', marginTop: 100 },
  permissionCard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: COLORS.background },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textDark, marginTop: 20, marginBottom: 12 },
  permissionText: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  permissionBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  permissionBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  scanArea: { width: 280, height: 200, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: COLORS.primary },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanLine: { position: 'absolute', left: 10, right: 10, height: 2, backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8 },
  bottomControls: { backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 20, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flashBtn: { width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  hint: { color: COLORS.white, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
