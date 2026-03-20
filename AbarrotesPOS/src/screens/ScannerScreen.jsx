import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, borderRadius, spacing } from '../theme';
import { productService } from '../services/api';

const ScannerScreen = ({ navigation, route }) => {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastScanned, setLastScanned] = useState(null);

  const onScanCallback = route.params?.onScan;

  useEffect(() => {
    if (route.params?.barcode) {
      handleBarcodeSubmit(route.params.barcode);
    }
  }, [route.params?.barcode]);

  const handleBarcodeSubmit = async (code) => {
    if (!code || code.length < 5) {
      setError('Código de barras inválido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await productService.searchByBarcode(code);

      if (result.success) {
        Vibration.vibrate(100);
        setLastScanned(result.product);
        
        if (onScanCallback) {
          onScanCallback(code);
          navigation.goBack();
        }
      } else {
        setError('Producto no encontrado');
        Vibration.vibrate([0, 200, 100, 200]);
      }
    } catch (err) {
      setError('Error al buscar producto');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (barcode.trim()) {
      handleBarcodeSubmit(barcode.trim());
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escanear Producto</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.scannerPlaceholder}>
          <Text style={styles.scannerIcon}>📷</Text>
          <Text style={styles.scannerText}>Cámara en desarrollo</Text>
          <Text style={styles.scannerSubtext}>
            Por ahora puedes escribir el código de barras manualmente
          </Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Código de barras</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={barcode}
              onChangeText={setBarcode}
              placeholder="Ej: 7501234567890"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading || !barcode.trim()}
            >
              <Text style={styles.submitButtonText}>
                {loading ? '...' : 'Buscar'}
              </Text>
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipTitle}>📋 Códigos comunes:</Text>
          <View style={styles.tipRow}>
            <TouchableOpacity style={styles.tipButton} onPress={() => setBarcode('7501234567890')}>
              <Text style={styles.tipText}>Coca-Cola</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tipButton} onPress={() => setBarcode('7501234567891')}>
              <Text style={styles.tipText}>Sabritas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tipButton} onPress={() => setBarcode('7501234567892')}>
              <Text style={styles.tipText}>Bimbo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {lastScanned && (
          <View style={styles.lastScanned}>
            <Text style={styles.lastScannedTitle}>Último escaneado:</Text>
            <View style={styles.lastScannedCard}>
              <Text style={styles.lastScannedName}>{lastScanned.nombre}</Text>
              <Text style={styles.lastScannedSku}>{lastScanned.sku}</Text>
              <Text style={styles.lastScannedPrice}>${lastScanned.precio.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  scannerPlaceholder: {
    height: 250,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  scannerIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  scannerText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  scannerSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 18,
    color: colors.text,
    fontFamily: 'monospace',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  tips: {
    marginBottom: spacing.xl,
  },
  tipTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  tipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tipButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipText: {
    color: colors.text,
    fontSize: 14,
  },
  lastScanned: {
    marginTop: 'auto',
    paddingBottom: spacing.lg,
  },
  lastScannedTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  lastScannedCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  lastScannedName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  lastScannedSku: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  lastScannedPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default ScannerScreen;
