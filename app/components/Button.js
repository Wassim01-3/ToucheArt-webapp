import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const { isRTL } = useLanguage();

  // Safety check
  if (!theme || !theme.colors) {
    return null;
  }

  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: theme.colors.primary };
      case 'secondary':
        return { backgroundColor: theme.colors.secondary };
      case 'accent':
        return { backgroundColor: theme.colors.accent };
      case 'outline':
        return { 
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: theme.colors.primary,
        };
      default:
        return { backgroundColor: theme.colors.primary };
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') {
      return theme.colors.primary;
    }
    return theme.colors.white;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        disabled && styles.disabled,
        style,
      ].filter(Boolean)}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle].filter(Boolean)}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

