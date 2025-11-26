import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

// Screens
import { LandingScreen } from '../screens/LandingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SellerRequestScreen } from '../screens/SellerRequestScreen';
import { MainHomeScreen } from '../screens/MainHomeScreen';
import { ProductDetailsScreen } from '../screens/ProductDetailsScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { SellerDashboardScreen } from '../screens/SellerDashboardScreen';
import { AdminPanelScreen } from '../screens/AdminPanelScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoadingSpinner } from '../components/LoadingSpinner';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Basic linking configuration so browser back/forward work on web
const linking = {
  prefixes: [],
  config: {
    screens: {
      Landing: '',
      Login: 'login',
      Register: 'register',
      SellerRequest: 'seller-request',
      MainHome: 'home',
      ProductDetails: 'product/:id',
      MainTabs: {
        screens: {
          Home: 'app',
          Favorites: 'favorites',
          Chat: 'chat',
          Dashboard: 'dashboard',
          Admin: 'admin',
        },
      },
      Profile: 'profile',
    },
  },
};

const MainTabs = () => {
  const { t } = useLanguage();
  const theme = useTheme();
  const { isAdmin, isVerifiedSeller, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Safety checks - ensure all contexts are ready
  if (!theme || !theme.colors || !t) {
    return <LoadingSpinner />;
  }

  // Use safe defaults for colors
  const primaryColor = theme.colors?.primary || '#D4A574';
  const grayColor = theme.colors?.gray || '#808080';
  // Monotone color for all tab icons
  const monotoneColor = '#808080';
  // App background color (lightYellow)
  const appBackgroundColor = theme.colors?.lightYellow || '#FFF8DC';

  // Listen to unread conversations count
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const userChatsRef = collection(db, 'userChats', user.uid, 'chats');
    const unsubscribe = onSnapshot(
      userChatsRef,
      (snapshot) => {
        let totalUnread = 0;
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          totalUnread += data.unreadCount || 0;
        });
        setUnreadCount(totalUnread);
      },
      (error) => {
        console.error('Error listening to unread count:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const ChatIconWithBadge = ({ focused, color, size }) => {
    return (
      <View style={styles.iconContainer}>
        <Ionicons
          name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
          size={size}
          color={color}
        />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: appBackgroundColor }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              // Use Ionicons home icon (works better with tintColor than PNG)
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Favorites') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'Chat') {
              return <ChatIconWithBadge focused={focused} color={color} size={size} />;
            } else if (route.name === 'Dashboard') {
              iconName = focused ? 'grid' : 'grid-outline';
            } else if (route.name === 'Admin') {
              iconName = focused ? 'shield' : 'shield-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4A4A4A', // Darker gray when active (filled)
          tabBarInactiveTintColor: monotoneColor, // Lighter gray when inactive (outline)
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FFFFFF', // White background (as it was)
            borderTopWidth: 1,
            borderTopColor: '#E0E0E0',
            borderTopLeftRadius: 30, // Increased corner radius
            borderTopRightRadius: 30, // Increased corner radius
            overflow: 'hidden', // Ensure rounded corners are visible
            paddingTop: 5,
            paddingBottom: 5,
            height: 60,
          },
        })}
      >
      <Tab.Screen name="Home" component={MainHomeScreen} options={{ title: t('products') }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: t('favorites') }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ title: t('chat') }} />
      {isVerifiedSeller && (
        <Tab.Screen
          name="Dashboard"
          component={SellerDashboardScreen}
          options={{ title: t('myProducts') }}
        />
      )}
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminPanelScreen}
          options={{ title: t('adminPanel') }}
        />
      )}
      </Tab.Navigator>
    </View>
  );
};

export const AppNavigator = () => {
  const { user, loading } = useAuth();
  const { isRTL } = useLanguage();
  const theme = useTheme();
  const navigationRef = useRef(null);
  const prevUserRef = useRef(user);

  // Handle navigation when user logs out
  useEffect(() => {
    // If user was logged in and now is null (logged out), navigate to Landing
    if (prevUserRef.current && !user && navigationRef.current) {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    }
    prevUserRef.current = user;
  }, [user]);

  // Wait for auth to load and ensure theme is ready
  if (loading || !theme || !theme.colors) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!user ? (
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="SellerRequest" component={SellerRequestScreen} />
            <Stack.Screen name="MainHome" component={MainHomeScreen} />
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="SellerRequest" component={SellerRequestScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

