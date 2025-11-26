import React from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LanguageSelector } from './LanguageSelector';
import { UserDropdown } from './UserDropdown';

export const Header = ({ showLanguageSelector = false }) => {
  const navigation = useNavigation();
  
  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      {showLanguageSelector ? (
        <LanguageSelector />
      ) : (
        <UserDropdown />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -25, // Further reduced space between content and bottom
    marginTop: -10,
    paddingHorizontal: 5,
    paddingTop: 0,
    paddingBottom: -15, // Further reduced bottom padding
    minHeight: 50, // Reduced header height
  },
  logoContainer: {
    margin: 0,
    marginLeft: -10,
    marginTop: -8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  logo: {
    width: 140,
    height: 140,
  },
});

