import React from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Header } from '../components/Header';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';

export const ProductDetailsScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { productId } = route.params;
  const [product, setProduct] = React.useState(null);
  const [seller, setSeller] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [sellerRating, setSellerRating] = React.useState(0);
  const [userRating, setUserRating] = React.useState(0);

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
      ratingsSnapshot.forEach((docSnap) => {
        totalRating += docSnap.data().rating || 0;
      });

      const averageRating = totalRating / ratingsSnapshot.size;
      setSellerRating(averageRating);
    } catch (error) {
      console.error('Error loading seller rating (web):', error);
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
      console.error('Error loading user rating (web):', error);
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
        rating,
        createdAt: new Date().toISOString(),
      });

      setUserRating(rating);
      await loadSellerRating(seller.id);
      Alert.alert(t('success'), 'Rating submitted!');
    } catch (error) {
      console.error('Error saving rating (web):', error);
      Alert.alert(t('error'), 'Failed to save rating');
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('216')) {
      const rest = digits.substring(3);
      if (rest.length >= 8) {
        return `+216 ${rest.substring(0, 2)} ${rest.substring(2, 5)} ${rest.substring(5)}`;
      }
      return `+${digits}`;
    } else if (digits.length >= 8) {
      return `+216 ${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`;
    }
    return phone;
  };

  React.useEffect(() => {
    const loadProduct = async () => {
      try {
        const productDoc = await getDoc(doc(db, 'products', productId));
        if (productDoc.exists()) {
          const productData = { id: productDoc.id, ...productDoc.data() };
          setProduct(productData);

          if (productData.sellerId) {
            const sellerDoc = await getDoc(doc(db, 'users', productData.sellerId));
            if (sellerDoc.exists()) {
              const sellerData = { id: sellerDoc.id, ...sellerDoc.data() };
              setSeller(sellerData);
              await loadSellerRating(productData.sellerId);
              if (user) {
                await loadUserRating(user.uid, productData.sellerId);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading product (web):', error);
        Alert.alert(t('error'), 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, user]);

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
      const phoneDigits = seller.phone.replace(/\D/g, '');
      const phoneToCall = phoneDigits.startsWith('216') ? phoneDigits : `216${phoneDigits}`;
      // On web this will try to open the default phone handler
      Linking.openURL(`tel:+${phoneToCall}`);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

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
        <Text style={[styles.title, { color: theme.colors.black }]}>{title}</Text>
        <Text style={[styles.price, { color: theme.colors.secondary }]}>
          {product.price} TND
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.darkGray }]}>
            {t('description')}
          </Text>
          <Text style={[styles.description, { color: theme.colors.black }]}>
            {description}
          </Text>
        </View>

        {seller && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.darkGray }]}>
              {t('seller')}
            </Text>
            <View style={styles.sellerInfo}>
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
                {seller.address && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color={theme.colors.gray} style={styles.infoIcon} />
                    <Text style={[styles.sellerAddress, { color: theme.colors.gray }]}>
                      {seller.address}
                    </Text>
                  </View>
                )}
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

        {/* Map is disabled on web to avoid native-only module issues */}
        {product.location && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.darkGray }]}>
              {t('location')}
            </Text>
            <Text style={{ color: theme.colors.gray, fontSize: 14 }}>
              {t('location')} map is not available on web. Please view this product in the mobile app to see the map.
            </Text>
          </View>
        )}

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
  },
  callButton: {
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});


