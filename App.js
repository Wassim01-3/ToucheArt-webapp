import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from './app/context/AuthContext';
import { LanguageProvider } from './app/context/LanguageContext';
import { ThemeProvider } from './app/context/ThemeContext';
import { AppNavigator } from './app/navigation/AppNavigator';
import i18n from './app/utils/i18n';
import * as Notifications from 'expo-notifications';
import { Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import Constants from 'expo-constants';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const DismissKeyboardView = ({ children }) => (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    {children}
  </TouchableWithoutFeedback>
);

export default function App() {
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  const registerForPushNotifications = async () => {
    try {
      // Skip push notifications in Expo Go (not fully supported in SDK 53+)
      const isExpoGo = Constants.executionEnvironment === 'storeClient';
      if (isExpoGo) {
        console.log('Push notifications are limited in Expo Go. Use a development build for full functionality.');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      // Try to get push token - handle projectId requirement gracefully
      try {
        // Try with projectId from app.json extra config if available
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const tokenOptions = projectId ? { projectId } : {};
        
        const token = await Notifications.getExpoPushTokenAsync(tokenOptions);
        console.log('Push token:', token.data);
      } catch (tokenError) {
        // If projectId is not available, skip token generation (non-critical)
        console.log('Push token generation skipped:', tokenError.message);
        console.log('To enable push notifications, add projectId to app.json or use EAS project.');
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } catch (error) {
      // Silently handle notification errors - don't crash the app
      console.log('Notification setup skipped:', error.message);
    }
  };

  return (
    <DismissKeyboardView>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                {Platform.OS !== 'web' && <StatusBar style="auto" />}
                <AppNavigator />
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </I18nextProvider>
      </SafeAreaProvider>
    </DismissKeyboardView>
  );
}

