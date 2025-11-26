import React, { createContext, useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultLanguage = {
  currentLanguage: 'fr',
  isRTL: false,
  switchLanguage: () => {},
  t: (key) => key,
};

const LanguageContext = createContext(defaultLanguage);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  return context || defaultLanguage;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('@toucheart_language');
      const lang = saved || 'fr';
      setCurrentLanguage(lang);
      setIsRTL(lang === 'ar');
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const switchLanguage = async (lang) => {
    try {
      await changeLanguage(lang);
      setCurrentLanguage(lang);
      setIsRTL(lang === 'ar');
    } catch (error) {
      console.error('Error switching language:', error);
    }
  };

  const value = {
    currentLanguage,
    isRTL,
    switchLanguage,
    t: (key) => i18n.t(key),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

