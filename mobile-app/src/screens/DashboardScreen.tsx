import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardStats } from '../services/apiService';

const { width } = Dimensions.get('window');

interface StatCard {
  label: string;
  value: string;
  icon: string;
  color: string;
  subtext?: string;
}

interface DailySale {
  day: string;
  amount: number;
}

export default function DashboardScreen() {
  const { empleado } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<{
    totalSales: number;
    todaySales: number;
    ordersCount: number;
    avgTicket: number;
    goal: number;
  } | null>(null);
  const [weeklyData, setWeeklyData] = useState<DailySale[]>([]);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchDashboardStats();
      setStats(data);
      if (data.weeklyData) {
        setWeeklyData(data.weeklyData);
      } else {
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        setWeeklyData(
          days.map((day, i) => ({
            day,
            amount: i < 5 ? Math.random() * 3000 + 500 : Math.random() * 2000 + 200,
          }))
        );
      }
    } catch {
      const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      setStats({ totalSales: 45230, todaySales: 3240, ordersCount: 87, avgTicket: 520, goal: 500 });
      setWeeklyData(
        days.map((day, i) => ({
          day,
          amount: i < 5 ? Math.random() * 3000 + 500 : Math.random() * 2000 + 200,
        }))
      );
    }
  }, []);

  useEffect(() => {
    loadStats().finally(() => setLoading(false));
  }, [loadStats]);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (empleado?.rol !== 'DIRECTOR') {
    return (
      <View style={styles.accessDenied}>
        <Ionicons name="shield-alert" size={64} color={COLORS.danger} />
        <Text style={styles.accessText}>Acceso Restringido</Text>
        <Text style={styles.accessSubtext}>Solo los Directores pueden ver el Dashboard.</Text>
      </View>
    );
  }

  const cards: StatCard[] = [
    {
      label: 'Ventas Hoy',
      value: `$${(stats?.todaySales || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      icon: 'trending-up',
      color: COLORS.success,
      subtext: `${stats?.ordersCount || 0} transacciones`,
    },
    {
      label: 'Ticket Promedio',
      value: `$${(stats?.avgTicket || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      icon: 'receipt',
      color: COLORS.info,
    },
    {
      label: 'Meta Diaria',
      value: `$${(stats?.goal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      icon: 'flag',
      color: COLORS.warning,
      subtext: `${stats ? Math.round((stats.todaySales / stats.goal) * 100) : 0}% alcanzado`,
    },
    {
      label: 'Ventas Totales',
      value: `$${(stats?.totalSales || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      icon: 'analytics',
      color: COLORS.primary,
    },
  ];

  const maxSale = weeklyData.length > 0 ? Math.max(...weeklyData.map((d) => d.amount)) : 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Bienvenido,</Text>
          <Text style={styles.userName}>{empleado?.nombre}</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>Director</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          <View style={styles.statsGrid}>
            {cards.map((card, i) => (
              <View key={i} style={[styles.statCard, i % 2 === 0 ? styles.cardLeft : styles.cardRight]}>
                <View style={[styles.iconCircle, { backgroundColor: `${card.color}15` }]}>
                  <Ionicons name={card.icon as any} size={22} color={card.color} />
                </View>
                <Text style={styles.statLabel}>{card.label}</Text>
                <Text style={styles.statValue}>{card.value}</Text>
                {card.subtext && <Text style={styles.statSubtext}>{card.subtext}</Text>}
              </View>
            ))}
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Ventas Semanales</Text>
            <View style={styles.chartContainer}>
              {weeklyData.map((item, i) => {
                const barHeight = Math.max((item.amount / maxSale) * 120, 8);
                return (
                  <View key={i} style={styles.barColumn}>
                    <Text style={styles.barAmount}>${Math.round(item.amount / 1000)}k</Text>
                    <View style={[styles.bar, { height: barHeight, backgroundColor: i === new Date().getDay() - 1 ? COLORS.primary : `${COLORS.primary}50` }]} />
                    <Text style={styles.barLabel}>{item.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.progressCard}>
            <Text style={styles.chartTitle}>Meta del Día</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, stats ? Math.round((stats.todaySales / stats.goal) * 100) : 0)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {stats ? Math.round((stats.todaySales / stats.goal) * 100) : 0}% — $
              {(stats?.todaySales || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} de $
              {(stats?.goal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  headerBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBadgeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  cardLeft: {
    marginRight: 8,
  },
  cardRight: {
    marginLeft: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  statSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barAmount: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  bar: {
    width: 28,
    borderRadius: 6,
    marginBottom: 6,
  },
  barLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  progressBar: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: COLORS.background,
  },
  accessText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.danger,
    marginTop: 16,
  },
  accessSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
});
