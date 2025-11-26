import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const VerifiedBadge = ({ size = 18 }) => {
  // Facebook-style verified badge: blue circle with white checkmark
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name="checkmark" size={size * 0.7} color="#FFFFFF" />
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#1877F2', // Facebook blue
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
});

