import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Animated, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Switch, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../services/authService';
import { COLORS } from '../constants/colors';

const LoginScreen = () => {
  const [numEmpleado, setNumEmpleado] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recordarme, setRecordarme] = useState(false);
  const [loading, setLoading] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const stored = AsyncStorage.getItem('recordar_numEmpleado');
    if (stored) {
      setNumEmpleado(stored);
      setRecordarme(true);
    }

    const animate = (value: Animated.Value, duration: number, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, { toValue: 1, duration, delay, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration, delay: 0, useNativeDriver: true }),
        ])
      ).start();
    };

    animate(float1, 8000, 0);
    animate(float2, 10000, 2000);
    animate(float3, 12000, 4000);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (bloqueado && countdown === 0) {
      setBloqueado(false);
    }
  }, [countdown, bloqueado]);

  const handleLogin = async () => {
    if (!numEmpleado.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Ingresa tu número de empleado y contraseña');
      return;
    }

    if (bloqueado) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await login(numEmpleado.trim(), password);
      
      if (recordarme) {
        await AsyncStorage.setItem('recordar_numEmpleado', numEmpleado.trim().toUpperCase());
      } else {
        await AsyncStorage.removeItem('recordar_numEmpleado');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      const newIntentos = intentos + 1;
      setIntentos(newIntentos);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      if (newIntentos >= 3) {
        setBloqueado(true);
        setCountdown(30);
        Alert.alert('Cuenta bloqueada', 'Demasiados intentos fallidos. Espera 30 segundos.');
      } else {
        Alert.alert('Error', err.message || 'Credenciales incorrectas');
      }
    } finally {
      setLoading(false);
    }
  };

  const translate1 = float1.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const translate2 = float2.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });
  const translate3 = float3.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });

  return (
    <View style={styles.container}>
      <LinearGradient colors={COLORS.primaryDark as any} style={StyleSheet.absoluteFill} />

      <Animated.View style={[styles.floatingShape, styles.shape1, { transform: [{ translateY: translate1 }] }]} />
      <Animated.View style={[styles.floatingShape, styles.shape2, { transform: [{ translateY: translate2 }] }]} />
      <Animated.View style={[styles.floatingShape, styles.shape3, { transform: [{ translateX: translate3 }] }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.logoSection}>
            <View style={styles.logoWrapper}>
              <MaterialCommunityIcons name="store" size={48} color={COLORS.white} />
            </View>
            <Text style={styles.brandName}>Abarrotes Digitales</Text>
            <Text style={styles.tagline}>Tu punto de venta inteligente</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Iniciar Sesión</Text>
            <Text style={styles.cardSubtitle}>Ingresa tus credenciales para continuar</Text>

            <View style={styles.inputWrapper}>
              <Ionicons name="person" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Número de Empleado"
                placeholderTextColor={COLORS.textMuted}
                value={numEmpleado}
                onChangeText={setNumEmpleado}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!bloqueado}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputPassword]}
                placeholder="Contraseña"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!bloqueado}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsRow}>
              <View style={styles.recordarRow}>
                <Switch
                  value={recordarme}
                  onValueChange={setRecordarme}
                  trackColor={{ false: '#e0e0e0', true: COLORS.primaryLight }}
                  thumbColor={recordarme ? COLORS.primary : '#ccc'}
                />
                <Text style={styles.recordarText}>Recordarme</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, (loading || bloqueado) && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading || bloqueado}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : bloqueado ? (
                <Text style={styles.loginBtnText}>Espera {countdown}s</Text>
              ) : (
                <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            <View style={styles.securityRow}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.textMuted} />
              <Text style={styles.securityText}>Conexión segura con Firebase</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryDark },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  floatingShape: { position: 'absolute', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.05)' },
  shape1: { width: 300, height: 300, top: -100, right: -80 },
  shape2: { width: 200, height: 200, bottom: 50, left: -50 },
  shape3: { width: 150, height: 150, top: '30%', left: '60%' },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoWrapper: {
    width: 100, height: 100, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16,
  },
  brandName: { fontSize: 28, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 24,
    padding: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.15, shadowRadius: 50, elevation: 10,
  },
  cardTitle: { fontSize: 24, fontWeight: '700', color: COLORS.textDark, marginBottom: 4, textAlign: 'center' },
  cardSubtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24, textAlign: 'center' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f5f7f6', borderRadius: 14,
    borderWidth: 2, borderColor: 'transparent',
    marginBottom: 16, paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: COLORS.textDark },
  inputPassword: { paddingRight: 44 },
  eyeBtn: { position: 'absolute', right: 12 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  recordarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordarText: { fontSize: 14, color: COLORS.textMuted },
  loginBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  securityRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  securityText: { fontSize: 12, color: COLORS.textMuted },
});

export default LoginScreen;
