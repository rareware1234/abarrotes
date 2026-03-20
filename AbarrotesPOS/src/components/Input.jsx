import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing } from '../theme';

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  icon: Icon,
  rightIcon: RightIcon,
  onRightIconPress,
  editable = true,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSecure = secureTextEntry && !showPassword;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          error && styles.error,
          !editable && styles.disabled,
        ]}
      >
        {Icon && <View style={styles.iconContainer}>{Icon}</View>}
        <TextInput
          style={[styles.input, Icon && styles.inputWithIcon, RightIcon && styles.inputWithRightIcon]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.toggleText}>{showPassword ? 'Ocultar' : 'Ver'}</Text>
          </TouchableOpacity>
        ) : RightIcon ? (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {RightIcon}
          </TouchableOpacity>
        ) : null}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  focused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },
  error: {
    borderColor: colors.error,
  },
  disabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  iconContainer: {
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
