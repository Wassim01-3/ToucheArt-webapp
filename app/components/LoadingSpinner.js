import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export const LoadingSpinner = ({ size = 'large', color }) => {
  const theme = useTheme();

  // Safety check - use default color if theme is not ready
  const indicatorColor = color || (theme?.colors?.primary) || '#D4A574';

  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={size}
        color={indicatorColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

