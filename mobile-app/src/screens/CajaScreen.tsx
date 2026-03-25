import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, FlatList, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { fetchCajaEstado, abrirCaja, cerrarCaja } from '../services/apiService';

export default function CajaScreen() {
  const { empleado } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [montoApertura, setMontoApertura] = useState('');
  const [montoCierre, setMontoCierre] = useState('');
  const [resumen, setResumen] = useState({ totalVentas: 0, totalEfectivo: 0, totalTarjeta: 0, totalTransferencia: 0, cantidad: 0 });
  const [cajaId, setCajaId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadEstado = async () => {
    if (!empleado?.uid) return;
    try {
      const data = await fetchCajaEstado(empleado.uid);
      if (data && data.estado === 'abierta') {
        setCajaAbierta(true);
        setCajaId(data.id);
        setResumen(data.resumen || { totalVentas: 0, totalEfectivo: 0, totalTarjeta: 0, totalTransferencia: 0, cantidad: 0 });
      } else {
        setCajaAbierta(false);
      }
    } catch {
      setCajaAbierta(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEstado(); }, [empleado?.uid]);

  const handleAbrir = async () => {
    if (!montoApertura || parseFloat(montoApertura) < 0) {
      Alert.alert('Monto requerido', 'Ingresa el monto inicial de la caja.');
      return;
    }
    setSubmitting(true);
    try {
      await abrirCaja(empleado!.uid, parseFloat(montoApertura));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMontoApertura('');
      loadEstado();
    } catch {
      Alert.alert('Error', 'No se pudo abrir la caja. Intenta de nuevo.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCerrar = async () => {
    if (!montoCierre || parseFloat(montoCierre) < 0) {
      Alert.alert('Monto requerido', 'Ingresa el monto de cierre.');
      return;
    }
    Alert.alert('Confirmar', '¿Estás seguro de cerrar la caja?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar',
        style: 'destructive',
        onPress: async () => {
          setSubmitting(true);
          try {
            await cerrarCaja(cajaId!, parseFloat(montoCierre));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setMontoCierre('');
            loadEstado();
          } catch {
            Alert.alert('Error', 'No se pudo cerrar la caja. Intenta de nuevo.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!cajaAbierta) {
    return (
      <View style={styles.container}>
        <View style={styles.openCard}>
          <Ionicons name="cash-register" size={64} color={COLORS.primary} />
          <Text style={styles.openTitle}>Abrir Caja</Text>
          <Text style={styles.openSubtitle}>Ingresa el monto inicial en efectivo</Text>
          <TextInput
            style={styles.montoInput}
            placeholder="0.00"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={montoApertura}
            onChangeText={setMontoApertura}
          />
          <TouchableOpacity
            style={[styles.actionBtn, submitting && styles.btnDisabled]}
            onPress={handleAbrir}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.actionBtnText}>Abrir Caja</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusBadge}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>CAJA ABIERTA</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: COLORS.success }]}>
          <Text style={styles.statLabel}>Total Ventas</Text>
          <Text style={styles.statValue}>${resumen.totalVentas.toFixed(2)}</Text>
          <Text style={styles.statCount}>{resumen.cantidad} transacciones</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.primary }]}>
          <Text style={styles.statLabel}>Efectivo</Text>
          <Text style={[styles.statValue, { color: COLORS.primary }]}>${resumen.totalEfectivo.toFixed(2)}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.info }]}>
          <Text style={styles.statLabel}>Tarjeta</Text>
          <Text style={[styles.statValue, { color: COLORS.info }]}>${resumen.totalTarjeta.toFixed(2)}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.warning }]}>
          <Text style={styles.statLabel}>Transferencia</Text>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>${resumen.totalTransferencia.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.closeSection}>
        <Text style={styles.closeTitle}>Cerrar Caja</Text>
        <TextInput
          style={styles.montoInput}
          placeholder="Monto de cierre"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="numeric"
          value={montoCierre}
          onChangeText={setMontoCierre}
        />
        <TouchableOpacity
          style={[styles.closeBtn, submitting && styles.btnDisabled]}
          onPress={handleCerrar}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.actionBtnText}>Confirmar Cierre</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  openCard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  openTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textDark, marginTop: 20, marginBottom: 8 },
  openSubtitle: { fontSize: 15, color: COLORS.textMuted, marginBottom: 32, textAlign: 'center' },
  montoInput: { width: '100%', backgroundColor: COLORS.white, borderRadius: 14, padding: 16, fontSize: 32, fontWeight: '700', textAlign: 'center', color: COLORS.textDark, marginBottom: 24 },
  actionBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 48, width: '100%', alignItems: 'center' },
  actionBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.success, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 20, alignSelf: 'center', marginBottom: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.white, marginRight: 8 },
  statusText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  statsGrid: { gap: 12 },
  statCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  statLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: COLORS.success },
  statCount: { fontSize: 12, color: COLORS.textMuted },
  closeSection: { marginTop: 24, backgroundColor: COLORS.white, borderRadius: 14, padding: 20 },
  closeTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: 16, textAlign: 'center' },
  closeBtn: { backgroundColor: COLORS.danger, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
});
