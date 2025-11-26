import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const LanguageSelector = () => {
  const { currentLanguage, switchLanguage, t } = useLanguage();
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  // Safety check
  if (!theme || !theme.colors) {
    return null;
  }

  const languages = [
    { code: 'fr', flag: '🇫🇷', name: 'Français' },
    { code: 'ar', flag: '🇹🇳', name: 'العربية' },
  ];

  const handleSelectLanguage = (langCode) => {
    switchLanguage(langCode);
    setModalVisible(false);
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, { borderColor: theme.colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.flag}>{currentLang?.flag}</Text>
        <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
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
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.option,
                  currentLanguage === lang.code && { backgroundColor: theme.colors.lightBeige },
                ]}
                onPress={() => handleSelectLanguage(lang.code)}
              >
                <Text style={styles.optionFlag}>{lang.flag}</Text>
                <Text style={[styles.optionText, { color: theme.colors.black }]}>
                  {lang.name}
                </Text>
                {currentLanguage === lang.code && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  flag: {
    fontSize: 24,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 16,
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
});

