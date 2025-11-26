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
  Linking,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Asset } from 'expo-asset';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Header } from '../components/Header';
import { uploadImage } from '../services/cloudinary';
import { GOVERNORATES } from '../utils/constants';
import { doc, collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';

export const SellerRequestScreen = ({ navigation }) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [identityCard, setIdentityCard] = useState(null);
  const [acceptedConditions, setAcceptedConditions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const pickImage = async (setImage) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('error'), 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const viewConditions = async () => {
    try {
      setPdfLoading(true);
      // Load the PDF asset using expo-asset
      const assetModule = require('../assets/Termes___Conditions.pdf');
      const asset = Asset.fromModule(assetModule);
      await asset.downloadAsync();
      
      // Get the local URI
      const localUri = asset.localUri || asset.uri;
      
      if (!localUri) {
        throw new Error('PDF URI not available');
      }

      // For Expo Go, we'll use expo-sharing to open PDF in external app
      // This is the most reliable solution that works in Expo Go
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'application/pdf',
          dialogTitle: t('conditions') || 'Terms and Conditions',
          UTI: 'com.adobe.pdf', // iOS specific
        });
      } else {
        Alert.alert(t('error'), 'Could not open PDF. Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      Alert.alert(t('error'), 'Could not load the conditions PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!fullName || !email || !phone || !address || !governorate || !profileImage || !identityCard) {
      Alert.alert(t('error'), 'Please fill all fields');
      return;
    }

    if (!acceptedConditions) {
      Alert.alert(t('error'), 'You must accept the conditions');
      return;
    }

    setLoading(true);

    try {
      // Upload images
      const [profileUrl, identityUrl] = await Promise.all([
        uploadImage(profileImage, 'seller-requests'),
        uploadImage(identityCard, 'seller-requests'),
      ]);

      // Submit request to Firestore
      await addDoc(collection(db, 'sellerRequests'), {
        userId: user?.uid || '',
        fullName,
        email,
        phone,
        address,
        governorate,
        profileImage: profileUrl,
        identityCard: identityUrl,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      Alert.alert(t('success'), 'Request submitted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
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
          {t('becomeSeller')}
        </Text>

        <Input
          label={t('fullName')}
          value={fullName}
          onChangeText={setFullName}
          placeholder={t('fullName')}
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
          <TouchableOpacity
            style={[styles.governoratePicker, { backgroundColor: theme.colors.white }]}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.pickerTextContainer}>
              <Text style={[styles.pickerText, { color: governorate ? theme.colors.black : theme.colors.gray }]}>
                {governorate || t('governorate')}
              </Text>
            </View>
          </TouchableOpacity>
          <Modal
            visible={showPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPicker(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setShowPicker(false)}
            >
               <View style={styles.modalContent}>
                 <View style={styles.modalHeader}>
                   <View style={{ flex: 1 }} />
                   <TouchableOpacity
                     onPress={() => setShowPicker(false)}
                     style={styles.modalButton}
                   >
                     <Text style={[styles.modalButtonText, { color: theme.colors.secondary }]}>
                       Done
                     </Text>
                   </TouchableOpacity>
                 </View>
                <FlatList
                  data={GOVERNORATES}
                  keyExtractor={(item) => item}
                  style={styles.listContainer}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.listItem,
                        governorate === item && styles.selectedItem,
                        { backgroundColor: governorate === item ? theme.colors.lightGray : 'white' }
                      ]}
                      onPress={() => {
                        setGovernorate(item);
                        setShowPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.listItemText,
                          {
                            color: governorate === item
                              ? theme.colors.secondary
                              : theme.colors.black,
                            fontWeight: governorate === item ? '600' : '400',
                          }
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  ListHeaderComponent={
                    <TouchableOpacity
                      style={[
                        styles.listItem,
                        governorate === '' && styles.selectedItem,
                        { backgroundColor: governorate === '' ? theme.colors.lightGray : 'white' }
                      ]}
                      onPress={() => {
                        setGovernorate('');
                        setShowPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.listItemText,
                          {
                            color: governorate === ''
                              ? theme.colors.secondary
                              : theme.colors.black,
                            fontWeight: governorate === '' ? '600' : '400',
                          }
                        ]}
                      >
                        {t('governorate')}
                      </Text>
                    </TouchableOpacity>
                  }
                />
              </View>
            </Pressable>
          </Modal>
        </View>

        <View style={styles.imageSection}>
          <Text style={[styles.label, { color: theme.colors.darkGray }]}>
            {t('profilePhoto')}
          </Text>
          <TouchableOpacity onPress={() => pickImage(setProfileImage)} style={styles.imageButton}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.image} />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.lightGray }]}>
                <Text style={[styles.imageText, { color: theme.colors.gray }]}>
                  {t('profilePhoto')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.imageSection}>
          <Text style={[styles.label, { color: theme.colors.darkGray }]}>
            {t('identityCard')}
          </Text>
          <TouchableOpacity onPress={() => pickImage(setIdentityCard)} style={styles.imageButton}>
            {identityCard ? (
              <Image source={{ uri: identityCard }} style={styles.image} />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.lightGray }]}>
                <Text style={[styles.imageText, { color: theme.colors.gray }]}>
                  {t('identityCard')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.conditionsContainer}
          onPress={() => setAcceptedConditions(!acceptedConditions)}
        >
          <View style={[styles.checkbox, acceptedConditions && { backgroundColor: theme.colors.primary }]}>
            {acceptedConditions && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.conditionsText, { color: theme.colors.darkGray }]}>
            {t('acceptConditions')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={viewConditions}
          disabled={pdfLoading}
          style={pdfLoading && { opacity: 0.6 }}
        >
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>
            {pdfLoading ? (t('loading') || 'Loading...') : t('viewConditions')}
          </Text>
        </TouchableOpacity>

        <Button
          title={t('submit')}
          onPress={handleSubmit}
          variant="primary"
          style={styles.button}
          disabled={!acceptedConditions}
        />
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
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  governoratePicker: {
    borderRadius: 8,
    minHeight: 50,
    ...Platform.select({
      android: {
        elevation: 2,
        overflow: 'hidden',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
      },
    }),
  },
  pickerTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 50,
  },
  pickerText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '70%',
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  listItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedItem: {
    backgroundColor: '#f5f5f5',
  },
  listItemText: {
    fontSize: 16,
    textAlign: 'center',
  },
  imageSection: {
    marginBottom: 16,
  },
  imageButton: {
    marginTop: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    fontSize: 14,
  },
  conditionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  conditionsText: {
    flex: 1,
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
    marginBottom: 20,
  },
  button: {
    marginTop: 8,
  },
});

