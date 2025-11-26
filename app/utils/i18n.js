import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import fr from '../locales/fr.json';
import ar from '../locales/ar.json';

const LANGUAGE_KEY = '@toucheart_language';

// Get saved language or default to French
const getSavedLanguage = async () => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    return saved || 'fr';
  } catch {
    return 'fr';
  }
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
    },
    lng: 'fr', // Default language
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
  });

// Load saved language
getSavedLanguage().then(lng => {
  i18n.changeLanguage(lng);
});

export const changeLanguage = async (lng) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    i18n.changeLanguage(lng);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

export default i18n;

