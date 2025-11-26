import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Image,
  Platform,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Header } from '../components/Header';
import { uploadMultipleImages } from '../services/cloudinary';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { GOVERNORATES } from '../utils/constants';

export const SellerDashboardScreen = ({ navigation }) => {
  const theme = useTheme();
  const { t, isRTL } = useLanguage();
  const { user, isVerifiedSeller } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showGovernoratePicker, setShowGovernoratePicker] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    price: '',
    address: '',
    governorate: '',
    photos: [],
  });

  useEffect(() => {
    if (isVerifiedSeller) {
      loadProducts();
    }
  }, [isVerifiedSeller]);

  const loadProducts = async () => {
    if (!user) return;

    try {
      const productsQuery = query(
        collection(db, 'products'),
        where('sellerId', '==', user.uid)
      );
      const querySnapshot = await getDocs(productsQuery);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('error'), 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({
        ...formData,
        photos: [...formData.photos, ...result.assets.map(asset => asset.uri)],
      });
    }
  };

  const removePhoto = (index) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    setFormData({ ...formData, photos: newPhotos });
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      titleAr: '',
      description: '',
      descriptionAr: '',
      price: '',
      address: '',
      governorate: '',
      photos: [],
    });
    setModalVisible(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title || '',
      titleAr: product.titleAr || '',
      description: product.description || '',
      descriptionAr: product.descriptionAr || '',
      price: product.price?.toString() || '',
      address: product.address || '',
      governorate: product.governorate || '',
      photos: product.photos || [],
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.price || !formData.address) {
      Alert.alert(t('error'), 'Please fill all required fields');
      return;
    }

    try {
      let photoUrls = formData.photos.filter(photo => photo.startsWith('http'));
      const newPhotos = formData.photos.filter(photo => !photo.startsWith('http'));

      if (newPhotos.length > 0) {
        const uploadedUrls = await uploadMultipleImages(newPhotos, 'products');
        photoUrls = [...photoUrls, ...uploadedUrls];
      }

      const productData = {
        title: formData.title,
        titleAr: formData.titleAr,
        description: formData.description,
        descriptionAr: formData.descriptionAr,
        price: parseFloat(formData.price),
        address: formData.address,
        governorate: formData.governorate,
        photos: photoUrls,
        sellerId: user.uid,
        updatedAt: new Date().toISOString(),
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        productData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'products'), productData);
      }

      setModalVisible(false);
      loadProducts();
      Alert.alert(t('success'), editingProduct ? 'Product updated!' : 'Product added!');
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert(t('error'), 'Failed to save product');
    }
  };

  const handleDelete = (productId) => {
    Alert.alert(
      t('delete'),
      'Are you sure you want to delete this product?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'products', productId));
              loadProducts();
            } catch (error) {
              Alert.alert(t('error'), 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  if (!isVerifiedSeller) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.lightYellow }]}>
        <Header />
        <Text style={[styles.emptyText, { color: theme.colors.gray }]}>
          You need to be a verified seller to access this dashboard
        </Text>
        <Button
          title={t('becomeSeller')}
          onPress={() => navigation.navigate('SellerRequest')}
          variant="primary"
          style={styles.button}
        />
      </View>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.lightYellow }]}>
      <Header />
      <View style={[styles.header, { backgroundColor: theme.colors.white }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.black }]}>
          {t('myProducts')}
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.gray }]}>
            {t('noProducts')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.productItem, { backgroundColor: theme.colors.white }]}>
              {item.photos && item.photos.length > 0 && (
                <Image source={{ uri: item.photos[0] }} style={styles.productImage} />
              )}
              <View style={styles.productInfo}>
                <Text style={[styles.productTitle, { color: theme.colors.black }]}>
                  {isRTL && item.titleAr ? item.titleAr : item.title}
                </Text>
                <Text style={[styles.productPrice, { color: theme.colors.secondary }]}>
                  {item.price} TND
                </Text>
              </View>
              <View style={styles.productActions}>
                <TouchableOpacity
                  onPress={() => openEditModal(item)}
                  style={[styles.actionButton, { backgroundColor: theme.colors.accent }]}
                >
                  <Ionicons name="pencil" size={20} color={theme.colors.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                >
                  <Ionicons name="trash" size={20} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Add/Edit Product Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.lightYellow }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.white }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.black }]}>
              {editingProduct ? t('editProduct') : t('addProduct')}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.colors.black} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Input
              label={t('productTitle')}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder={t('productTitle')}
            />

            <Input
              label={t('productTitleAr')}
              value={formData.titleAr}
              onChangeText={(text) => setFormData({ ...formData, titleAr: text })}
              placeholder={t('productTitleAr')}
            />

            <Input
              label={t('description')}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder={t('description')}
              multiline
              numberOfLines={4}
            />

            <Input
              label={t('descriptionAr')}
              value={formData.descriptionAr}
              onChangeText={(text) => setFormData({ ...formData, descriptionAr: text })}
              placeholder={t('descriptionAr')}
              multiline
              numberOfLines={4}
            />

            <Input
              label={t('price')}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              placeholder={t('price')}
              keyboardType="numeric"
            />

            <Input
              label={t('address')}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder={t('address')}
            />

            <View style={styles.pickerContainer}>
              <Text style={[styles.label, { color: theme.colors.darkGray }]}>
                {t('governorate')}
              </Text>
              <TouchableOpacity
                style={[styles.governoratePicker, { backgroundColor: theme.colors.white }]}
                onPress={() => setShowGovernoratePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.pickerTextContainer}>
                  <Text style={[styles.pickerText, { color: formData.governorate ? theme.colors.black : theme.colors.gray }]}>
                    {formData.governorate || t('governorate')}
                  </Text>
                </View>
              </TouchableOpacity>
              <Modal
                visible={showGovernoratePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowGovernoratePicker(false)}
              >
                <Pressable
                  style={styles.modalOverlay}
                  onPress={() => setShowGovernoratePicker(false)}
                >
                  <View style={styles.governorateModalContent}>
                    <View style={styles.governorateModalHeader}>
                      <View style={{ flex: 1 }} />
                      <TouchableOpacity
                        onPress={() => setShowGovernoratePicker(false)}
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
                            formData.governorate === item && styles.selectedItem,
                            { backgroundColor: formData.governorate === item ? theme.colors.lightGray : 'white' }
                          ]}
                          onPress={() => {
                            setFormData({ ...formData, governorate: item });
                            setShowGovernoratePicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.listItemText,
                              {
                                color: formData.governorate === item
                                  ? theme.colors.secondary
                                  : theme.colors.black,
                                fontWeight: formData.governorate === item ? '600' : '400',
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
                            formData.governorate === '' && styles.selectedItem,
                            { backgroundColor: formData.governorate === '' ? theme.colors.lightGray : 'white' }
                          ]}
                          onPress={() => {
                            setFormData({ ...formData, governorate: '' });
                            setShowGovernoratePicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.listItemText,
                              {
                                color: formData.governorate === ''
                                  ? theme.colors.secondary
                                  : theme.colors.black,
                                fontWeight: formData.governorate === '' ? '600' : '400',
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

            <View style={styles.photosSection}>
              <Text style={[styles.label, { color: theme.colors.darkGray }]}>
                {t('photos')}
              </Text>
              <Button
                title="Add Photos"
                onPress={pickImages}
                variant="outline"
                style={styles.addPhotoButton}
              />
              <View style={styles.photosGrid}>
                {formData.photos.map((photo, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Image source={{ uri: photo }} style={styles.photoPreview} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            <Button
              title={t('save')}
              onPress={handleSubmit}
              variant="primary"
              style={styles.submitButton}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  productItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
  },
  button: {
    marginTop: 20,
    width: 200,
  },
  modalContainer: {
    flex: 1,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
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
  governorateModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '70%',
    minHeight: 300,
  },
  governorateModalHeader: {
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
  photosSection: {
    marginBottom: 16,
  },
  addPhotoButton: {
    marginBottom: 12,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoItem: {
    position: 'relative',
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  submitButton: {
    marginTop: 20,
  },
});

