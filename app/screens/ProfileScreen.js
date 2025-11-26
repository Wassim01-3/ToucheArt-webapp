import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  FlatList,
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
import { submitReclamation } from '../services/reclamationService';
import { GOVERNORATES } from '../utils/constants';
import { Ionicons } from '@expo/vector-icons';

export const ProfileScreen = ({ navigation }) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const { user, userData, updateUserData } = useAuth();
  // Handle both 'name' and 'fullName' for backward compatibility
  const [name, setName] = useState(userData?.name || userData?.fullName || '');
  const [email, setEmail] = useState(userData?.email || user?.email || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [address, setAddress] = useState(userData?.address || '');
  const [governorate, setGovernorate] = useState(userData?.governorate || '');
  // Handle both 'profilePhoto' and 'profileImage' for backward compatibility
  const [profilePhoto, setProfilePhoto] = useState(userData?.profilePhoto || userData?.profileImage || null);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [reclamationModalVisible, setReclamationModalVisible] = useState(false);
  const [reclamationSubmitting, setReclamationSubmitting] = useState(false);
  const [reclamationForm, setReclamationForm] = useState({
    subject: '',
    message: '',
    referenceId: '',
  });

  // Update form fields when userData changes (e.g., when it loads)
  useEffect(() => {
    if (userData) {
      setName(userData.name || userData.fullName || '');
      setEmail(userData.email || user?.email || '');
      setPhone(userData.phone || '');
      setAddress(userData.address || '');
      setGovernorate(userData.governorate || '');
      setProfilePhoto(userData.profilePhoto || userData.profileImage || null);
    }
  }, [userData, user?.email]);

  // Safety check
  if (!theme || !theme.colors || !user) {
    return <LoadingSpinner />;
  }

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

  const handleUpdate = async () => {
    if (!name || !email || !phone || !address || !governorate) {
      Alert.alert(t('error'), 'Please fill all fields');
      return;
    }

    setLoading(true);
    // Handle both 'profilePhoto' and 'profileImage' for backward compatibility
    let photoUrl = userData?.profilePhoto || userData?.profileImage || '';

    if (profilePhoto && profilePhoto !== userData?.profilePhoto && profilePhoto !== userData?.profileImage) {
      try {
        photoUrl = await uploadImage(profilePhoto, 'profiles');
      } catch (error) {
        Alert.alert(t('error'), 'Failed to upload profile photo');
        setLoading(false);
        return;
      }
    }

    const result = await updateUserData({
      name,
      email,
      phone,
      address,
      governorate,
      profilePhoto: photoUrl,
    });

    setLoading(false);

    if (result.success) {
      Alert.alert(t('success'), 'Profile updated successfully!');
    } else {
      Alert.alert(t('error'), result.error);
    }
  };

  const closeReclamationModal = () => {
    setReclamationModalVisible(false);
    setReclamationForm({
      subject: '',
      message: '',
      referenceId: '',
    });
    setReclamationSubmitting(false);
  };

  const handleReclamationSubmit = async () => {
    if (!reclamationForm.subject || !reclamationForm.message) {
      Alert.alert(t('error'), t('reclamationValidationMessage'));
      return;
    }

    try {
      setReclamationSubmitting(true);
      await submitReclamation({
        userId: user.uid,
        userEmail: user.email || '',
        userName: userData?.name || userData?.fullName || '',
        userRole: userData?.role || (userData?.verifiedSeller ? 'seller' : 'user'),
        subject: reclamationForm.subject,
        message: reclamationForm.message,
        referenceId: reclamationForm.referenceId,
      });
      Alert.alert(t('success'), t('reclamationSuccessMessage'));
      closeReclamationModal();
    } catch (error) {
      console.error('Failed to submit reclamation:', error);
      Alert.alert(t('error'), t('reclamationErrorMessage'));
      setReclamationSubmitting(false);
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
          {t('profile') || 'Profile'}
        </Text>

        {/* Profile Photo */}
        <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: theme.colors.lightGray }]}>
              <Ionicons name="person" size={40} color={theme.colors.gray} />
            </View>
          )}
          <View style={[styles.editIcon, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="camera" size={16} color={theme.colors.white} />
          </View>
        </TouchableOpacity>

        <Input
          label={t('name') || 'Name'}
          value={name}
          onChangeText={setName}
          placeholder={t('name') || 'Name'}
        />

        <Input
          label={t('email') || 'Email'}
          value={email}
          onChangeText={setEmail}
          placeholder={t('email') || 'Email'}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={false}
        />

        <Input
          label={t('phone') || 'Phone'}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('phone') || 'Phone'}
          keyboardType="phone-pad"
        />

        <Input
          label={t('address') || 'Address'}
          value={address}
          onChangeText={setAddress}
          placeholder={t('address') || 'Address'}
        />

        <View style={styles.pickerContainer}>
          <Text style={[styles.label, { color: theme.colors.darkGray }]}>
            {t('governorate') || 'Governorate'}
          </Text>
          <TouchableOpacity
            style={[styles.governoratePicker, { backgroundColor: theme.colors.white }]}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.pickerTextContainer}>
              <Text style={[styles.pickerText, { color: governorate ? theme.colors.black : theme.colors.gray }]}>
                {governorate || t('governorate') || 'Governorate'}
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
                        {t('governorate') || 'Governorate'}
                      </Text>
                    </TouchableOpacity>
                  }
                />
              </View>
            </Pressable>
          </Modal>
        </View>

        <Button
          title={t('update') || 'Update Profile'}
          onPress={handleUpdate}
          variant="primary"
          style={styles.button}
        />

        <Button
          title={t('openReclamationForm')}
          onPress={() => setReclamationModalVisible(true)}
          variant="secondary"
          style={styles.secondaryButton}
        />
      </ScrollView>

      <Modal
        visible={reclamationModalVisible}
        animationType="slide"
        onRequestClose={closeReclamationModal}
      >
        <View style={[styles.reclamationModalContainer, { backgroundColor: theme.colors.lightYellow }]}>
          <View style={[styles.reclamationModalHeader, { backgroundColor: theme.colors.white }]}>
            <Text style={[styles.reclamationModalTitle, { color: theme.colors.black }]}>
              {t('reclamationModalTitle')}
            </Text>
            <TouchableOpacity onPress={closeReclamationModal}>
              <Ionicons name="close" size={24} color={theme.colors.black} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.reclamationModalContent}>
            <Text style={[styles.reclamationHelperText, { color: theme.colors.darkGray }]}>
              {t('reclamationModalDescription')}
            </Text>

            <Input
              label={t('reclamationSubjectLabel')}
              value={reclamationForm.subject}
              onChangeText={(text) => setReclamationForm((prev) => ({ ...prev, subject: text }))}
              placeholder={t('reclamationSubjectLabel')}
            />

            <Input
              label={t('reclamationMessageLabel')}
              value={reclamationForm.message}
              onChangeText={(text) => setReclamationForm((prev) => ({ ...prev, message: text }))}
              placeholder={t('reclamationMessageLabel')}
              multiline
              numberOfLines={5}
            />

            <Input
              label={t('reclamationReferenceLabel')}
              value={reclamationForm.referenceId}
              onChangeText={(text) => setReclamationForm((prev) => ({ ...prev, referenceId: text }))}
              placeholder={t('reclamationReferencePlaceholder')}
            />

            <Button
              title={t('submitReclamation')}
              onPress={handleReclamationSubmit}
              variant="primary"
              style={styles.submitButton}
              disabled={reclamationSubmitting}
              loading={reclamationSubmitting}
            />
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 10,
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
    position: 'relative',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
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
  button: {
    marginTop: 8,
  },
  secondaryButton: {
    marginTop: 16,
  },
  reclamationModalContainer: {
    flex: 1,
  },
  reclamationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  reclamationModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  reclamationModalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  reclamationHelperText: {
    fontSize: 14,
    marginBottom: 16,
  },
});

