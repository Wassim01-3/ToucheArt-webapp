import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Header } from '../components/Header';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase';

export const FavoritesScreen = ({ navigation }) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(favoritesQuery);
      const favoriteIds = [];
      const favoriteDocs = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        favoriteIds.push(data.productId);
        favoriteDocs.push({ id: doc.id, productId: data.productId });
      });

      setFavorites(favoriteDocs);

      // Load product details
      const productsData = await Promise.all(
        favoriteIds.map(async (productId) => {
          const productDoc = await getDoc(doc(db, 'products', productId));
          if (productDoc.exists()) {
            return { id: productDoc.id, ...productDoc.data() };
          }
          return null;
        })
      );

      setProducts(productsData.filter(Boolean));
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load favorites when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );


  const toggleFavorite = async (productId) => {
    try {
      const favorite = favorites.find(fav => fav.productId === productId);
      if (favorite) {
        await deleteDoc(doc(db, 'favorites', favorite.id));
        setFavorites(favorites.filter(fav => fav.productId !== productId));
        setProducts(products.filter(p => p.id !== productId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert(t('error'), 'Failed to remove favorite');
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.lightYellow }]}>
        <Text style={[styles.emptyText, { color: theme.colors.gray }]}>
          Please login to view favorites
        </Text>
      </View>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.lightYellow }]}>
      <Header />
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.gray }]}>
            {t('noFavorites')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
              onFavoritePress={() => toggleFavorite(item.id)}
              isFavorite={true}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
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

