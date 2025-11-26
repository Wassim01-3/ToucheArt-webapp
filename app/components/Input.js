import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  multiline = false,
  numberOfLines = 1,
  style,
  ...props
}) => {
  const theme = useTheme();
  const { isRTL } = useLanguage();

  // Safety check
  if (!theme || !theme.colors) {
    return null;
  }

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.colors.darkGray }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            borderColor: error ? theme.colors.error : theme.colors.lightGray,
            backgroundColor: theme.colors.white,
            color: theme.colors.black,
          },
          multiline && styles.multiline,
          style,
        ].filter(Boolean)}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.gray}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlign={isRTL ? 'right' : 'left'}
        {...props}
      />
      {error && <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 50,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});

