import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
// Temporarily disabled Carousel due to compatibility issues
// import Carousel from 'react-native-snap-carousel';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Header } from '../components/Header';
import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';

export const ProductDetailsScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sellerRating, setSellerRating] = useState(0);
  const [userRating, setUserRating] = useState(0); // User's rating for this seller

  const loadSellerRating = async (sellerId) => {
    try {
      const ratingsQuery = query(
        collection(db, 'ratings'),
        where('sellerId', '==', sellerId)
      );
      const ratingsSnapshot = await getDocs(ratingsQuery);
      
      if (ratingsSnapshot.empty) {
        setSellerRating(0);
        return;
      }
      
      let totalRating = 0;
      ratingsSnapshot.forEach((doc) => {
        totalRating += doc.data().rating || 0;
      });
      
      const averageRating = totalRating / ratingsSnapshot.size;
      setSellerRating(averageRating);
    } catch (error) {
      console.error('Error loading seller rating:', error);
      setSellerRating(0);
    }
  };

  const loadUserRating = async (userId, sellerId) => {
    try {
      const ratingDoc = await getDoc(doc(db, 'ratings', `${userId}_${sellerId}`));
      if (ratingDoc.exists()) {
        setUserRating(ratingDoc.data().rating || 0);
      }
    } catch (error) {
      console.error('Error loading user rating:', error);
    }
  };

  const handleStarPress = async (rating) => {
    if (!user) {
      Alert.alert(t('error'), 'Please login to rate seller');
      navigation.navigate('Login');
      return;
    }

    if (!seller) return;

    try {
      const ratingId = `${user.uid}_${seller.id}`;
      await setDoc(doc(db, 'ratings', ratingId), {
        userId: user.uid,
        sellerId: seller.id,
        rating: rating,
        createdAt: new Date().toISOString(),
      });

      setUserRating(rating);
      // Reload seller rating to update average
      await loadSellerRating(seller.id);
      Alert.alert(t('success'), 'Rating submitted!');
    } catch (error) {
      console.error('Error saving rating:', error);
      Alert.alert(t('error'), 'Failed to save rating');
    }
  };

  // Format phone number to +216 XX XXX XXX
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // If starts with 216, add +, otherwise assume it's local and add +216
    if (digits.startsWith('216')) {
      const rest = digits.substring(3);
      if (rest.length >= 8) {
        return `+216 ${rest.substring(0, 2)} ${rest.substring(2, 5)} ${rest.substring(5)}`;
      }
      return `+${digits}`;
    } else if (digits.length >= 8) {
      return `+216 ${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`;
    }
    return phone; // Return original if can't format
  };

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (productDoc.exists()) {
        const productData = { id: productDoc.id, ...productDoc.data() };
        setProduct(productData);

        // Load seller info
        if (productData.sellerId) {
          const sellerDoc = await getDoc(doc(db, 'users', productData.sellerId));
          if (sellerDoc.exists()) {
            const sellerData = { id: sellerDoc.id, ...sellerDoc.data() };
            setSeller(sellerData);
            
            // Load ratings and calculate average
            await loadSellerRating(productData.sellerId);
            
            // Load user's rating if logged in
            if (user) {
              await loadUserRating(user.uid, productData.sellerId);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert(t('error'), 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleChat = () => {
    if (!user) {
      Alert.alert(t('error'), 'Please login to chat');
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('Chat', { sellerId: seller.id, productId });
  };

  const handleCall = () => {
    if (seller?.phone) {
      // Use original phone number for calling (remove formatting)
      const phoneDigits = seller.phone.replace(/\D/g, '');
      const phoneToCall = phoneDigits.startsWith('216') ? phoneDigits : `216${phoneDigits}`;
      Linking.openURL(`tel:+${phoneToCall}`);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Safety check
  if (!theme || !theme.colors) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <Text>{t('error')}</Text>
      </View>
    );
  }

  const title = isRTL && product.titleAr ? product.titleAr : product.title;
  const description = isRTL && product.descriptionAr ? product.descriptionAr : product.description;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.white }]}>
      <Header />
      {/* Image Display */}
      {product.photos && product.photos.length > 0 && (
        <View style={styles.carouselContainer}>
          <Image 
            source={{ uri: product.photos[0] }} 
            style={styles.carouselImage} 
            resizeMode="cover" 
          />
        </View>
      )}

      <View style={styles.content}>
        {/* Title and Price */}
        <Text style={[styles.title, { color: theme.colors.black }]}>{title}</Text>
        <Text style={[styles.price, { color: theme.colors.secondary }]}>
          {product.price} TND
        </Text>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.darkGray }]}>
            {t('description')}
          </Text>
          <Text style={[styles.description, { color: theme.colors.black }]}>
            {description}
          </Text>
        </View>

        {/* Seller Info */}
        {seller && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.darkGray }]}>
              {t('seller')}
            </Text>
            <View style={styles.sellerInfo}>
              {/* Seller Avatar */}
              {(seller.profilePhoto || seller.profileImage) ? (
                <Image
                  source={{ uri: seller.profilePhoto || seller.profileImage }}
                  style={styles.sellerPhoto}
                />
              ) : (
                <View style={[styles.sellerPhotoPlaceholder, { backgroundColor: theme.colors.lightGray }]}>
                  <Ionicons name="person" size={30} color={theme.colors.gray} />
                </View>
              )}
              <View style={styles.sellerDetails}>
                {/* Name, Verified Badge, and Rating */}
                <View style={styles.sellerNameRow}>
                  <Text style={[styles.sellerName, { color: theme.colors.black }]}>
                    {seller.name || seller.fullName}
                  </Text>
                  {seller.verifiedSeller && <VerifiedBadge />}
                  <View style={styles.ratingContainer}>
                    <View style={styles.rating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          onPress={() => handleStarPress(star)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={star <= (userRating || sellerRating) ? 'star' : 'star-outline'}
                            size={18}
                            color="#FFB800"
                            style={styles.star}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                    {sellerRating > 0 && (
                      <Text style={[styles.ratingText, { color: theme.colors.gray }]}>
                        ({sellerRating.toFixed(1)})
                      </Text>
                    )}
                  </View>
                </View>
                {/* Address on separate line */}
                {seller.address && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color={theme.colors.gray} style={styles.infoIcon} />
                    <Text style={[styles.sellerAddress, { color: theme.colors.gray }]}>
                      {seller.address}
                    </Text>
                  </View>
                )}
                {/* Phone on separate line */}
                {seller.phone && (
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={16} color={theme.colors.gray} style={styles.infoIcon} />
                    <Text style={[styles.sellerPhone, { color: theme.colors.gray }]}>
                      {formatPhoneNumber(seller.phone)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Map */}
        {product.location && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.darkGray }]}>
              {t('location')}
            </Text>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: product.location.latitude,
                longitude: product.location.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
            >
              <Marker
                coordinate={{
                  latitude: product.location.latitude,
                  longitude: product.location.longitude,
                }}
                title={title}
              />
            </MapView>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.chatButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleChat}
          >
            <Ionicons name="chatbubble-outline" size={20} color={theme.colors.white} style={styles.buttonIcon} />
            <Text style={[styles.buttonText, { color: theme.colors.white }]}>
              Message
            </Text>
          </TouchableOpacity>
          {seller?.phone && (
            <TouchableOpacity
              style={[styles.actionButton, styles.callButton, { backgroundColor: theme.colors.secondary }]}
              onPress={handleCall}
            >
              <Ionicons name="call-outline" size={20} color={theme.colors.white} style={styles.buttonIcon} />
              <Text style={[styles.buttonText, { color: theme.colors.white }]}>
                Appeler
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carouselContainer: {
    height: 300,
  },
  carouselImage: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sellerPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  sellerPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  sellerAddress: {
    fontSize: 14,
    flex: 1,
  },
  sellerPhone: {
    fontSize: 14,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  actions: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  chatButton: {
    // Primary color applied via style prop
  },
  callButton: {
    // Secondary color applied via style prop
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

