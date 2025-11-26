import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, Platform, Alert } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';

export const UserDropdown = ({ navigation: navProp }) => {
  const navigation = useNavigation();
  const nav = navProp || navigation;
  const { user, userData, logout } = useAuth();
  const theme = useTheme();
  const { t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  // Safety check
  if (!theme || !theme.colors) {
    return null;
  }

  const handleLogout = async () => {
    // On web, the native Alert API is limited, so we log out directly
    if (Platform.OS === 'web') {
      setModalVisible(false);
      await logout();
      return;
    }

    Alert.alert(
      t('logout') || 'Logout',
      t('confirmLogout') || 'Are you sure you want to logout?',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('logout') || 'Logout',
          style: 'destructive',
          onPress: async () => {
            setModalVisible(false);
            await logout();
            // The AppNavigator will automatically handle navigation when user becomes null
            // It will switch to the logged-out stack which includes Landing as the first screen
          },
        },
      ]
    );
  };

  const handleProfile = () => {
    setModalVisible(false);
    if (nav) {
      nav.navigate('Profile');
    }
  };

  const handleSignIn = () => {
    setModalVisible(false);
    if (nav) {
      nav.navigate('Login');
    }
  };

  const handleSignUp = () => {
    setModalVisible(false);
    if (nav) {
      nav.navigate('Register');
    }
  };

  // For logged-in users
  if (user && userData) {
    // Handle both 'name' and 'fullName' for backward compatibility
    const displayName = userData.name || userData.fullName || user.email?.split('@')[0] || 'User';
    // Handle both 'profilePhoto' and 'profileImage' for backward compatibility
    const avatar = userData.profilePhoto || userData.profileImage;

    return (
      <>
        <TouchableOpacity
          style={styles.userButton}
          onPress={() => setModalVisible(true)}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="person" size={20} color={theme.colors.white} />
            </View>
          )}
          <Text style={[styles.userName, { color: theme.colors.black }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.gray} />
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.colors.white }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleProfile}
              >
                <Ionicons name="person-outline" size={20} color={theme.colors.black} />
                <Text style={[styles.menuItemText, { color: theme.colors.black }]}>
                  {t('profile') || 'Profile'}
                </Text>
              </TouchableOpacity>
              <View style={[styles.divider, { backgroundColor: theme.colors.lightGray }]} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
                <Text style={[styles.menuItemText, { color: theme.colors.error }]}>
                  {t('logout') || 'Logout'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

  // For guests
  return (
    <>
      <TouchableOpacity
        style={[styles.guestButton, { borderColor: theme.colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
        <Ionicons name="chevron-down" size={16} color={theme.colors.primary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.white }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSignIn}
            >
              <Ionicons name="log-in-outline" size={20} color={theme.colors.black} />
              <Text style={[styles.menuItemText, { color: theme.colors.black }]}>
                {t('login') || 'Sign In'}
              </Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: theme.colors.lightGray }]} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSignUp}
            >
              <Ionicons name="person-add-outline" size={20} color={theme.colors.black} />
              <Text style={[styles.menuItemText, { color: theme.colors.black }]}>
                {t('register') || 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: 150,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 4,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});

