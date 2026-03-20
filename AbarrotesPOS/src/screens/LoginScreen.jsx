import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, borderRadius, spacing } from '../theme';
import { authService } from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    let interval;
    if (lockoutUntil) {
      interval = setInterval(() => {
        if (Date.now() >= lockoutUntil) {
          setLockoutUntil(null);
          setAttempts(0);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handleLogin = async () => {
    if (lockoutUntil && Date.now() < lockoutUntil) return;

    if (!employeeId.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authService.login(employeeId.trim(), password);

      if (result.success) {
        navigation.replace('Home');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 3) {
          setLockoutUntil(Date.now() + 30000);
          setError('Demasiados intentos. Espera 30 segundos.');
        } else {
          setError(`Credenciales incorrectas (${3 - newAttempts} intentos)`);
        }
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const getLockoutTime = () => {
    if (!lockoutUntil) return '';
    const seconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
    return `${seconds}s`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>AD</Text>
            </View>
            <Text style={styles.title}>Abarrotes Digitales</Text>
            <Text style={styles.subtitle}>Accede a tu estación de trabajo</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Número de Empleado</Text>
              <TextInput
                style={styles.input}
                value={employeeId}
                onChangeText={(text) => setEmployeeId(text.toUpperCase())}
                placeholder="Ej: EMP001"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                editable={!loading}
              />
            </View>

            {error ? (
              <Animated.View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading || (lockoutUntil && Date.now() < lockoutUntil)}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : lockoutUntil ? (
                <Text style={styles.loginButtonText}>Espera {getLockoutTime()}</Text>
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Conexión segura</Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.white,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});

export default LoginScreen;
