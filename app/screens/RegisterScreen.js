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
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Header } from '../components/Header';
import { uploadImage } from '../services/cloudinary';
import { GOVERNORATES } from '../utils/constants';
import { Picker } from '@react-native-picker/picker';

export const RegisterScreen = ({ navigation }) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('error'), 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword || !phone || !address || !governorate) {
      Alert.alert(t('error'), 'Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('error'), 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('error'), 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    let photoUrl = '';

    if (profilePhoto) {
      try {
        photoUrl = await uploadImage(profilePhoto, 'profiles');
      } catch (error) {
        Alert.alert(t('error'), 'Failed to upload profile photo');
        setLoading(false);
        return;
      }
    }

    const result = await register(email, password, {
      name,
      phone,
      address,
      governorate,
      profilePhoto: photoUrl,
    });
    setLoading(false);

    if (result.success) {
      Alert.alert(t('success'), 'Registration successful!', [
        { text: 'OK', onPress: () => navigation.replace('MainHome') },
      ]);
    } else {
      Alert.alert(t('error'), result.error);
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
          {t('register')}
        </Text>

        {/* Profile Photo */}
        <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: theme.colors.lightGray }]}>
              <Text style={[styles.photoText, { color: theme.colors.gray }]}>
                {t('profilePhoto')}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Input
          label={t('name')}
          value={name}
          onChangeText={setName}
          placeholder={t('name')}
        />

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

        <Input
          label={t('confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t('confirmPassword')}
          secureTextEntry
        />

        <Input
          label={t('phone')}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('phone')}
          keyboardType="phone-pad"
        />

        <Input
          label={t('address')}
          value={address}
          onChangeText={setAddress}
          placeholder={t('address')}
        />

        <View style={styles.pickerContainer}>
          <Text style={[styles.label, { color: theme.colors.darkGray }]}>
            {t('governorate')}
          </Text>
          <View style={[styles.pickerWrapper, { backgroundColor: theme.colors.white }]}>
            <Picker
              selectedValue={governorate}
              onValueChange={setGovernorate}
              style={styles.picker}
            >
              <Picker.Item label={t('governorate')} value="" />
              {GOVERNORATES.map((gov) => (
                <Picker.Item key={gov} label={gov} value={gov} />
              ))}
            </Picker>
          </View>
        </View>

        <Button
          title={t('submit')}
          onPress={handleRegister}
          variant="primary"
          style={styles.button}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.linkContainer}
        >
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>
            {t('login')}
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
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    fontSize: 12,
    textAlign: 'center',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
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

