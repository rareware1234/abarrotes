import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, borderRadius, spacing } from '../theme';
import { useAuthStore } from '../store';

const MenuCard = ({ title, icon, color, onPress }) => (
  <TouchableOpacity style={[styles.menuCard, { borderLeftColor: color }]} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.menuIcon, { backgroundColor: color + '20' }]}>
      <Text style={[styles.menuIconText, { color }]}>{icon}</Text>
    </View>
    <Text style={styles.menuTitle}>{title}</Text>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
  const { user } = useAuthStore();

  const menuItems = [
    { id: 1, title: 'Nueva Venta', icon: '💰', color: colors.success, route: 'POS' },
    { id: 2, title: 'Escanear Producto', icon: '📷', color: colors.primary, route: 'Scanner' },
    { id: 3, title: 'Consultar Productos', icon: '📦', color: '#8b5cf6', route: 'Products' },
    { id: 4, title: 'Historial de Ventas', icon: '📋', color: '#f59e0b', route: 'History' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.nombre || 'Empleado'}</Text>
            <View style={styles.profileBadge}>
              <Text style={styles.profileText}>{user?.profile || 'Cajero'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.profileInitial}>
              {user?.nombre?.charAt(0) || 'U'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            {menuItems.map((item) => (
              <MenuCard
                key={item.id}
                title={item.title}
                icon={item.icon}
                color={item.color}
                onPress={() => navigation.navigate(item.route)}
              />
            ))}
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Resumen del Día</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>$2,450.00</Text>
              <Text style={styles.statLabel}>Ventas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>42</Text>
              <Text style={styles.statLabel}>Transacciones</Text>
            </View>
          </View>
        </View>

        <View style={styles.tipsSection}>
          <Text style={styles.tipText}>
            💡 Atajos: Toca dos veces en "Nueva Venta" para abrir rápidamente
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  profileBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  profileText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  profileButton: {
    width: 50,
       height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
  },
  quickActions: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  quickActionsGrid: {
    gap: spacing.sm,
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuIconText: {
    fontSize: 24,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  menuArrow: {
    fontSize: 24,
    color: colors.textMuted,
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tipsSection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  tipText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default HomeScreen;
