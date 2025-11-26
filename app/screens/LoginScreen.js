import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Header } from '../components/Header';

export const LoginScreen = ({ navigation }) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), 'Please fill all fields');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigation.replace('MainHome');
    } else {
      // Provide more user-friendly error messages
      let errorMessage = result.error;
      if (result.error.includes('auth/invalid-credential') || result.error.includes('auth/wrong-password') || result.error.includes('auth/user-not-found')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (result.error.includes('auth/invalid-email')) {
        errorMessage = 'Invalid email address. Please enter a valid email.';
      } else if (result.error.includes('auth/too-many-requests')) {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (result.error.includes('auth/network-request-failed')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      Alert.alert(t('error'), errorMessage);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.lightYellow }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Header />
        <Text style={[styles.title, { color: theme.colors.secondary }]}>
          {t('login')}
        </Text>

        <Input
          label={t('email')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('email')}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label={t('password')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('password')}
          secureTextEntry
        />

        <Button
          title={t('login')}
          onPress={handleLogin}
          variant="primary"
          style={styles.button}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.linkContainer}
        >
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>
            {t('register')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

