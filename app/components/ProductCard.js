import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export const ProductCard = ({ product, onPress, onFavoritePress, onMessagePress, isFavorite = false }) => {
  const theme = useTheme();
  const { isRTL } = useLanguage();
  const { t, i18n } = useTranslation();

  // Safety checks
  if (!theme || !theme.colors || !product) {
    return null;
  }

  const renderImage = ({ item }) => (
    <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
  );

  const title = i18n.language === 'ar' && product.titleAr ? product.titleAr : product.title;
  const price = `${product.price} TND`;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.white }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        {product.photos && product.photos.length > 0 ? (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: product.photos[0] }} 
              style={styles.image} 
              resizeMode="cover" 
            />
          </View>
        ) : (
          <View style={[styles.imageContainer, styles.placeholder]}>
            <Ionicons name="image-outline" size={50} color={theme.colors.gray} />
          </View>
        )}
        
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.black }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[styles.price, { color: theme.colors.secondary }]}>
            {price}
          </Text>
          <Text style={[styles.address, { color: theme.colors.gray }]} numberOfLines={1}>
            {product.address}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onFavoritePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? theme.colors.error : theme.colors.gray}
          />
        </TouchableOpacity>

        {onMessagePress && (
          <TouchableOpacity
            style={[styles.messageButton, { backgroundColor: theme.colors.primary }]}
            onPress={(e) => {
              e.stopPropagation();
              onMessagePress();
            }}
          >
            <Ionicons
              name="chatbubble-outline"
              size={16}
              color={theme.colors.white}
              style={styles.messageIcon}
            />
            <Text style={[styles.messageText, { color: theme.colors.white }]}>
              {t('message') || 'Message'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    width: '48%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardContent: {
    flex: 1,
    flexDirection: 'column',
  },
  imageContainer: {
    width: '100%',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
    flex: 1,
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    marginBottom: 8,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: 'auto',
  },
  messageIcon: {
    marginRight: 6,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

