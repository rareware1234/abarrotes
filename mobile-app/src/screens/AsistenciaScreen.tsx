import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { RegistroAsistencia } from '../types';
import { doc, getDocs, collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function AsistenciaScreen() {
  const { empleado } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [registros, setRegistros] = useState<RegistroAsistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [todayRegistro, setTodayRegistro] = useState<RegistroAsistencia | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!empleado?.uid) return;
    const loadRegistros = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const q = query(
          collection(db, 'asistencia'),
          where('empleadoId', '==', empleado.uid),
        );
        const snap = await getDocs(q);
        const data: RegistroAsistencia[] = [];
        snap.forEach(d => data.push({ id: d.id, ...d.data() } as RegistroAsistencia));
        data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRegistros(data);
        const todayEntry = data.find(r => new Date(r.timestamp) >= today);
        setTodayRegistro(todayEntry || null);
      } catch (err) {
        console.error('Error loading asistencia:', err);
      } finally {
        setLoading(false);
      }
    };
    loadRegistros();
  }, [empleado?.uid]);

  const registrar = async (tipo: 'ENTRADA' | 'SALIDA') => {
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'asistencia'), {
        empleadoId: empleado!.uid,
        tipo,
        timestamp: serverTimestamp(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Registrado', `${tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} registrada exitosamente.`);
      const newReg: RegistroAsistencia = { id: Date.now().toString(), empleadoId: empleado!.uid, tipo, timestamp: new Date().toISOString() };
      setRegistros([newReg, ...registros]);
      setTodayRegistro(newReg);
    } catch {
      Alert.alert('Error', 'No se pudo registrar. Intenta de nuevo.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  const renderItem = ({ item }: { item: RegistroAsistencia }) => (
    <View style={styles.registroItem}>
      <Ionicons name={item.tipo === 'ENTRADA' ? 'log-in' : 'log-out'} size={20} color={item.tipo === 'ENTRADA' ? COLORS.success : COLORS.warning} />
      <View style={styles.registroInfo}>
        <Text style={styles.registroTipo}>{item.tipo}</Text>
        <Text style={styles.registroFecha}>{new Date(item.timestamp).toLocaleString('es-MX')}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.clockCard}>
        <Text style={styles.clockTime}>{currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
        <Text style={styles.clockDate}>{currentTime.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>

        {todayRegistro ? (
          <View style={styles.todayStatus}>
            <View style={[styles.todayBadge, todayRegistro.tipo === 'ENTRADA' ? styles.badgeEntrada : styles.badgeSalida]}>
              <Text style={styles.todayBadgeText}>
                {todayRegistro.tipo === 'ENTRADA' ? 'Entrada registrada' : 'Salida registrada'}
              </Text>
            </View>
            <Text style={styles.todayTime}>{new Date(todayRegistro.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
        ) : (
          <Text style={styles.sinRegistro}>Sin registro hoy</Text>
        )}

        <View style={styles.buttonsRow}>
          {!todayRegistro || todayRegistro.tipo === 'SALIDA' ? (
            <TouchableOpacity style={[styles.registerBtn, styles.entradaBtn, submitting && styles.btnDisabled]} onPress={() => registrar('ENTRADA')} disabled={submitting}>
              <Ionicons name="log-in" size={28} color={COLORS.white} />
              <Text style={styles.registerBtnText}>Entrada</Text>
            </TouchableOpacity>
          ) : null}
          {todayRegistro?.tipo === 'ENTRADA' ? (
            <TouchableOpacity style={[styles.registerBtn, styles.salidaBtn, submitting && styles.btnDisabled]} onPress={() => registrar('SALIDA')} disabled={submitting}>
              <Ionicons name="log-out" size={28} color={COLORS.white} />
              <Text style={styles.registerBtnText}>Salida</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Historial</Text>
      <FlatList data={registros.slice(0, 20)} renderItem={renderItem} keyExtractor={item => item.id} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.emptyText}>Sin registros</Text>} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  clockCard: { backgroundColor: COLORS.white, margin: 16, borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  clockTime: { fontSize: 56, fontWeight: '200', color: COLORS.textDark, letterSpacing: -2 },
  clockDate: { fontSize: 16, color: COLORS.textMuted, marginTop: 4, textTransform: 'capitalize' },
  todayStatus: { alignItems: 'center', marginTop: 16 },
  todayBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  badgeEntrada: { backgroundColor: '#e8f5e9' },
  badgeSalida: { backgroundColor: '#fff3e0' },
  todayBadgeText: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  todayTime: { fontSize: 18, fontWeight: '600', color: COLORS.textDark, marginTop: 4 },
  sinRegistro: { fontSize: 15, color: COLORS.textMuted, marginTop: 16 },
  buttonsRow: { flexDirection: 'row', gap: 16, marginTop: 24, width: '100%' },
  registerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  entradaBtn: { backgroundColor: COLORS.success },
  salidaBtn: { backgroundColor: COLORS.warning },
  registerBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginHorizontal: 16, marginBottom: 12 },
  list: { paddingHorizontal: 16, gap: 8 },
  registroItem: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  registroInfo: { flex: 1 },
  registroTipo: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  registroFecha: { fontSize: 12, color: COLORS.textMuted },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 20 },
});
