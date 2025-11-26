import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Header } from '../components/Header';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { GOVERNORATES } from '../utils/constants';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export const MainHomeScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(route?.params?.governorate || '');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadProducts();
    if (user) {
      loadFavorites();
    }
  }, [user]);

  useEffect(() => {
    if (route?.params?.governorate !== undefined) {
      setSelectedGovernorate(route.params.governorate);
    }
  }, [route?.params?.governorate]);

  useEffect(() => {
    filterProducts();
  }, [selectedGovernorate, products]);

  const loadProducts = async () => {
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(favoritesQuery);
      const favoritesData = querySnapshot.docs.map(doc => doc.data().productId);
      setFavorites(favoritesData);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const filterProducts = () => {
    if (!selectedGovernorate) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(
      product => product.governorate === selectedGovernorate
    );
    setFilteredProducts(filtered);
  };

  const toggleFavorite = async (productId) => {
    if (!user) {
      Alert.alert(t('error'), 'Please login to add favorites');
      return;
    }

    try {
      const favoriteRef = doc(db, 'favorites', `${user.uid}_${productId}`);
      const favoriteDoc = await getDoc(favoriteRef);

      if (favoriteDoc.exists()) {
        await deleteDoc(favoriteRef);
        setFavorites(favorites.filter(id => id !== productId));
      } else {
        await setDoc(favoriteRef, {
          userId: user.uid,
          productId,
          createdAt: new Date().toISOString(),
        });
        setFavorites([...favorites, productId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
    if (user) {
      loadFavorites();
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.lightYellow }]}>
      <Header />
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

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.gray }]}>
            {t('noProducts')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
              onFavoritePress={() => toggleFavorite(item.id)}
              onMessagePress={async () => {
                if (!user) {
                  Alert.alert(t('error'), 'Please login to message seller');
                  navigation.navigate('Login');
                  return;
                }
                // Load seller info and navigate to chat
                try {
                  const productDoc = await getDoc(doc(db, 'products', item.id));
                  if (productDoc.exists()) {
                    const productData = productDoc.data();
                    if (productData.sellerId) {
                      navigation.navigate('Chat', { sellerId: productData.sellerId, productId: item.id });
                    }
                  }
                } catch (error) {
                  console.error('Error loading seller info:', error);
                  Alert.alert(t('error'), 'Failed to load seller information');
                }
              }}
              isFavorite={favorites.includes(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  governorateSection: {
    marginTop: 5,
    marginBottom: 30,
    paddingHorizontal: 40,
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
  listContent: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
  },
});

