import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { ROLES_COLOR } from '../constants/roles';
import { Tarea } from '../types';
import { doc, getDocs, collection, query, where, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function TasksScreen() {
  const { empleado } = useAuth();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'todas' | 'PENDIENTE' | 'COMPLETADA'>('todas');
  const [showCreate, setShowCreate] = useState(false);

  const loadTareas = async () => {
    if (!empleado?.uid) return;
    try {
      const q = query(collection(db, 'tareas'), where('asignadoA', '==', empleado.uid));
      const snap = await getDocs(q);
      const data: Tarea[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() } as Tarea));
      data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setTareas(data);
    } catch (err) {
      console.error('Error loading tareas:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadTareas(); }, [empleado?.uid]);

  const changeStatus = async (tarea: Tarea, nuevoEstado: Tarea['estado']) => {
    try {
      await updateDoc(doc(db, 'tareas', tarea.id), { estado: nuevoEstado });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadTareas();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la tarea.');
    }
  };

  const filteredTareas = tareas.filter(t => filter === 'todas' || t.estado === filter);

  const getPrioridadColor = (p: string) => {
    if (p === 'ALTA') return COLORS.danger;
    if (p === 'MEDIA') return COLORS.warning;
    return COLORS.success;
  };

  const renderTarea = ({ item }: { item: Tarea }) => (
    <View style={styles.tareaCard}>
      <View style={styles.tareaHeader}>
        <View style={[styles.prioridadBadge, { backgroundColor: getPrioridadColor(item.prioridad) }]}>
          <Text style={styles.prioridadText}>{item.prioridad}</Text>
        </View>
        <View style={[styles.estadoBadge, item.estado === 'COMPLETADA' && styles.estadoCompletada]}>
          <Text style={[styles.estadoText, item.estado === 'COMPLETADA' && { color: COLORS.success }]}>{item.estado.replace('_', ' ')}</Text>
        </View>
      </View>
      <Text style={styles.tareaTitulo}>{item.titulo}</Text>
      {item.descripcion && <Text style={styles.tareaDesc}>{item.descripcion}</Text>}
      {item.fechaVencimiento && (
        <Text style={styles.tareaFecha}>Vence: {new Date(item.fechaVencimiento).toLocaleDateString('es-MX')}</Text>
      )}
      <View style={styles.tareaActions}>
        {item.estado === 'PENDIENTE' && (
          <TouchableOpacity onPress={() => changeStatus(item, 'EN_PROGRESO')} style={styles.actionBtn}>
            <Ionicons name="play" size={16} color={COLORS.info} />
            <Text style={[styles.actionBtnText, { color: COLORS.info }]}>Iniciar</Text>
          </TouchableOpacity>
        )}
        {item.estado === 'EN_PROGRESO' && (
          <TouchableOpacity onPress={() => changeStatus(item, 'COMPLETADA')} style={styles.actionBtn}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={[styles.actionBtnText, { color: COLORS.success }]}>Completar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {(['todas', 'PENDIENTE', 'COMPLETADA'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'todas' ? 'Todas' : f === 'PENDIENTE' ? 'Pendientes' : 'Completadas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTareas}
        renderItem={renderTarea}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTareas(); }} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay tareas</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center', backgroundColor: '#f5f7f6' },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  filterTextActive: { color: COLORS.white },
  list: { padding: 12, gap: 12 },
  tareaCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tareaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  prioridadBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  prioridadText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: '#f5f7f6' },
  estadoCompletada: { backgroundColor: '#e8f5e9' },
  estadoText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  tareaTitulo: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },
  tareaDesc: { fontSize: 13, color: COLORS.textMuted, marginBottom: 6 },
  tareaFecha: { fontSize: 12, color: COLORS.textMuted, marginBottom: 10 },
  tareaActions: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: 15 },
});
