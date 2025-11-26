import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { Input } from '../components/Input';
import { GOVERNORATES } from '../utils/constants';
import { Picker } from '@react-native-picker/picker';

export const LandingScreen = ({ navigation }) => {
  const theme = useTheme();
  const { isRTL, t } = useLanguage();
  const { i18n } = useTranslation();
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  // Safety check
  if (!theme || !theme.colors || !t) {
    return null;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.lightYellow }]}
      contentContainerStyle={styles.content}
      nestedScrollEnabled={false}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={true}
      bounces={false}
    >
      {/* Header */}
      <Header showLanguageSelector={true} />

      {/* Title and Description */}
      <View style={styles.titleSection}>
        <Text style={[styles.title, { color: theme.colors.secondary }]}>
          {t('welcome')}
        </Text>
        <Text style={[styles.description, { color: theme.colors.darkGray }]}>
          {t('landingDescription')}
        </Text>
      </View>

      {/* Governorate Selector */}
      <View style={styles.governorateSection}>
        <TouchableOpacity
          style={[styles.pickerContainer, { backgroundColor: theme.colors.white }]}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
        >
          <View style={styles.pickerTextContainer}>
            <Text style={[styles.pickerText, { color: selectedGovernorate ? theme.colors.black : theme.colors.gray }]}>
              {selectedGovernorate || t('governorate')}
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
                      selectedGovernorate === item && styles.selectedItem,
                      { backgroundColor: selectedGovernorate === item ? theme.colors.lightGray : 'white' }
                    ]}
                    onPress={() => {
                      setSelectedGovernorate(item);
                      setShowPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.listItemText,
                        {
                          color: selectedGovernorate === item
                            ? theme.colors.secondary
                            : theme.colors.black,
                          fontWeight: selectedGovernorate === item ? '600' : '400',
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
                      selectedGovernorate === '' && styles.selectedItem,
                      { backgroundColor: selectedGovernorate === '' ? theme.colors.lightGray : 'white' }
                    ]}
                    onPress={() => {
                      setSelectedGovernorate('');
                      setShowPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.listItemText,
                        {
                          color: selectedGovernorate === ''
                            ? theme.colors.secondary
                            : theme.colors.black,
                          fontWeight: selectedGovernorate === '' ? '600' : '400',
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

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <Button
          title={t('continueAsGuest')}
          onPress={() => navigation.navigate('MainHome', { governorate: selectedGovernorate })}
          variant="outline"
          style={styles.button}
        />
        <Button
          title={t('login')}
          onPress={() => navigation.navigate('Login')}
          variant="primary"
          style={[styles.button, { backgroundColor: theme.colors.secondary }]}
        />
        <Button
          title={t('register')}
          onPress={() => navigation.navigate('Register')}
          variant="secondary"
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate('SellerRequest')}
          style={styles.linkButton}
        >
          <Text style={[styles.linkText, { color: theme.colors.secondary }]}>
            {t('becomeSeller')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  governorateSection: {
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
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
  pickerWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 50,
  },
  picker: {
    height: 50,
    width: '100%',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
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
  buttonsContainer: {
    gap: 16,
    marginTop: 40,
    paddingHorizontal: 10,
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  button: {
    width: '75%',
    alignSelf: 'center',
  },
});

