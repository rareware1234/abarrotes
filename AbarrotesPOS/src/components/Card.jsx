import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, shadows } from '../theme';

export const Card = ({ children, style, onPress, variant = 'default' }) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return shadows.md;
      case 'outlined':
        return { borderWidth: 1, borderColor: colors.border };
      default:
        return shadows.sm;
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, getVariantStyle(), style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, getVariantStyle(), style]}>{children}</View>;
};

export const ProductCard = ({ product, onAdd, onPress }) => {
  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <View style={styles.productNameContainer}>
            <Text style={styles.productName} numberOfLines={2}>
              {product.nombre}
            </Text>
          </View>
          {product.stock <= 10 && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Bajo</Text>
            </View>
          )}
        </View>
        <Text style={styles.productSku}>{product.sku}</Text>
        <Text style={styles.productPrice}>${product.precio.toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => onAdd(product)}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export const CartItemCard = ({ item, onIncrement, onDecrement, onRemove }) => {
  return (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName} numberOfLines={2}>
          {item.nombre}
        </Text>
        <Text style={styles.cartItemPrice}>${item.precio.toFixed(2)} c/u</Text>
      </View>
      <View style={styles.cartItemActions}>
        <TouchableOpacity style={styles.quantityButton} onPress={onDecrement}>
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityText}>{item.quantity}</Text>
        </View>
        <TouchableOpacity style={styles.quantityButton} onPress={onIncrement}>
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.cartItemTotal}>${(item.precio * item.quantity).toFixed(2)}</Text>
    </View>
  );
};

const Text = ({ children, style, numberOfLines }) => (
  <RNText style={style} numberOfLines={numberOfLines}>
    {children}
  </RNText>
);

import { Text as RNText } from 'react-native';

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  productCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  productNameContainer: {
    flex: 1,
  },
  productName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  productSku: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  productPrice: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  lowStockBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  lowStockText: {
    color: colors.black,
    fontSize: 10,
    fontWeight: '600',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 28,
  },
  cartItem: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  cartItemPrice: {
    color: colors.textMuted,
    fontSize: 12,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  quantityContainer: {
    width: 32,
    alignItems: 'center',
  },
  quantityText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  cartItemTotal: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    minWidth: 70,
    textAlign: 'right',
  },
});
