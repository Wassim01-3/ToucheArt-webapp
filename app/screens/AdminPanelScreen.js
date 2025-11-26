import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Header } from '../components/Header';
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  where,
  setDoc,
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

export const AdminPanelScreen = ({ navigation }) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'complaints'
  const [sellerRequests, setSellerRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'requests') {
        const requestsQuery = query(
          collection(db, 'sellerRequests'),
          orderBy('createdAt', 'desc')
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        setSellerRequests(
          requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        );
      } else {
        const complaintsQuery = query(
          collection(db, 'complaints'),
          orderBy('createdAt', 'desc')
        );
        const complaintsSnapshot = await getDocs(complaintsQuery);
        setComplaints(
          complaintsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        );
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, userId, requestData) => {
    try {
      let finalUserId = userId;
      
      // If userId is empty or doesn't exist, create a new user account
      if (!userId || userId === '') {
        console.log('Creating new user account for:', requestData.email);
        
        // Create Firebase Auth user with email and password (password = email)
        let userCredential;
        try {
          userCredential = await createUserWithEmailAndPassword(
            auth,
            requestData.email,
            requestData.email // password = email
          );
          finalUserId = userCredential.user.uid;
          console.log('Firebase Auth user created with UID:', finalUserId);
        } catch (authError) {
          console.error('Error creating Firebase Auth user:', authError);
          // If user already exists, try to sign in to get the UID
          if (authError.code === 'auth/email-already-in-use') {
            Alert.alert(
              t('error'),
              'User with this email already exists. Please check if the user document exists in Firestore.'
            );
            return;
          }
          throw authError;
        }

        // Create user document in Firestore with seller data
        try {
          await setDoc(doc(db, 'users', finalUserId), {
            email: requestData.email,
            name: requestData.fullName, // Use 'name' to match standard user registration
            phone: requestData.phone,
            address: requestData.address,
            governorate: requestData.governorate,
            profilePhoto: requestData.profileImage || '', // Use 'profilePhoto' to match standard user registration
            verifiedSeller: true,
            role: 'seller',
            createdAt: new Date().toISOString(),
          });
          console.log('Firestore user document created successfully');
        } catch (firestoreError) {
          console.error('Error creating Firestore user document:', firestoreError);
          throw firestoreError;
        }
      } else {
        console.log('Updating existing user:', finalUserId);
        // Update existing user to verified seller
        await updateDoc(doc(db, 'users', finalUserId), {
          verifiedSeller: true,
          name: requestData.fullName || undefined, // Use 'name' to match standard user registration
          phone: requestData.phone || undefined,
          address: requestData.address || undefined,
          governorate: requestData.governorate || undefined,
          profilePhoto: requestData.profileImage || undefined, // Use 'profilePhoto' to match standard user registration
        });
        console.log('Existing user updated successfully');
      }

      // Update request status with the userId
      await updateDoc(doc(db, 'sellerRequests', requestId), {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        userId: finalUserId,
      });
      console.log('Seller request updated successfully');

      Alert.alert(
        t('success'),
        `Seller request approved! ${!userId || userId === '' ? 'Account created with password = email.' : 'User verified.'}`
      );
      loadData();
    } catch (error) {
      console.error('Error approving request:', error);
      Alert.alert(
        t('error'),
        `Failed to approve request: ${error.message || error.code || 'Unknown error'}`
      );
    }
  };

  const handleReject = async (requestId) => {
    Alert.alert(
      t('reject'),
      'Are you sure you want to reject this request?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('reject'),
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'sellerRequests', requestId), {
                status: 'rejected',
                rejectedAt: new Date().toISOString(),
              });
              Alert.alert(t('success'), 'Request rejected');
              loadData();
            } catch (error) {
              Alert.alert(t('error'), 'Failed to reject request');
            }
          },
        },
      ]
    );
  };

  const viewRequestDetails = (request) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const viewComplaintDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setModalVisible(true);
  };

  const handleMessageReporter = (complaint) => {
    if (!complaint?.userId) {
      Alert.alert(t('error'), t('reclamationMissingUser'));
      return;
    }

    navigation.navigate('Chat', {
      sellerId: complaint.userId,
      productId: complaint.referenceId || `reclamation_${complaint.id}`,
    });
  };

  const getLabel = useCallback(
    (key, fallback) => {
      if (!t) return fallback;
      const value = t(key);
      if (!value || value === key) {
        return fallback;
      }
      return value;
    },
    [t]
  );

  const handleDeleteUser = (request) => {
    if (!request) return;
    if (!request.userId) {
      Alert.alert(getLabel('error', 'Error'), getLabel('userIdMissing', 'Cannot delete user: missing user ID.'));
      return;
    }

    Alert.alert(
      getLabel('deleteUser', 'Delete user'),
      getLabel(
        'deleteUserConfirm',
        'This will permanently remove the seller account, related products, chats, and the request. Continue?'
      ),
      [
        { text: getLabel('cancel', 'Cancel'), style: 'cancel' },
        {
          text: getLabel('delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const userId = request.userId;

              const deleteDocs = async (queryRef) => {
                const snapshot = await getDocs(queryRef);
                await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
                return snapshot;
              };

              // Delete user products and keep track of their IDs
              const productsSnapshot = await deleteDocs(
                query(collection(db, 'products'), where('sellerId', '==', userId))
              );
              const productIds = productsSnapshot.docs.map((docSnap) => docSnap.id);

              // Delete favorites created by the user
              await deleteDocs(query(collection(db, 'favorites'), where('userId', '==', userId)));

              // Delete favorites referencing the user's products
              await Promise.all(
                productIds.map(async (productId) => {
                  await deleteDocs(query(collection(db, 'favorites'), where('productId', '==', productId)));
                })
              );

              // Delete user chat references
              await deleteDocs(collection(db, 'userChats', userId, 'chats'));

              // Delete chats and related userChats/messages
              const chatsSnapshot = await getDocs(
                query(collection(db, 'chats'), where('participants', 'array-contains', userId))
              );
              await Promise.all(
                chatsSnapshot.docs.map(async (chatDoc) => {
                  const chatId = chatDoc.id;
                  const participants = chatDoc.data().participants || [];

                  // Delete messages
                  await deleteDocs(collection(db, 'chats', chatId, 'messages'));

                  // Delete participant chat references
                  await Promise.all(
                    participants.map(async (participantId) => {
                      const participantChatsRef = collection(db, 'userChats', participantId, 'chats');
                      const participantChatSnapshot = await getDocs(
                        query(participantChatsRef, where('chatId', '==', chatId))
                      );
                      await Promise.all(participantChatSnapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
                    })
                  );

                  await deleteDoc(chatDoc.ref);
                })
              );

              // Delete seller request and user document
              await deleteDoc(doc(db, 'sellerRequests', request.id));
              await deleteDoc(doc(db, 'users', userId));

              Alert.alert(getLabel('success', 'Success'), getLabel('userDeleted', 'User deleted successfully.'));
              setModalVisible(false);
              setSelectedRequest(null);
              loadData();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert(
                getLabel('error', 'Error'),
                getLabel('deleteUserFailed', 'Failed to delete user. Please try again.')
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatSectionLabel = (label) => {
    if (!label) return '';
    return label.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\s+/g, ' ').trim();
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return t('unknownDate') || 'Unknown date';
    try {
      const dateObj = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
      return dateObj.toLocaleString();
    } catch (error) {
      return t('unknownDate') || 'Unknown date';
    }
  };

  const renderDetailRow = (icon, label, value) => (
    <View style={styles.detailRow} key={`${label}-${value}`}>
      <View style={styles.detailIconWrapper}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={styles.detailTextWrapper}>
        <Text style={[styles.detailLabel, { color: theme.colors.gray }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: theme.colors.black }]}>
          {value || getLabel('notProvided', 'Not provided')}
        </Text>
      </View>
    </View>
  );

  const renderSectionTitle = (label) => (
    <View style={styles.sectionTitleRow} key={label}>
      <View style={[styles.sectionAccent, { backgroundColor: theme.colors.primary }]} />
      <Text style={[styles.sectionTitle, { color: theme.colors.black }]}>
        {formatSectionLabel(label)}
      </Text>
    </View>
  );

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.lightYellow }]}>
        <Header />
        <Text style={[styles.emptyText, { color: theme.colors.error }]}>
          Access denied. Admin only.
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
      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: theme.colors.white }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'requests' && { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab('requests')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'requests' ? theme.colors.primary : theme.colors.gray },
            ]}
          >
            {t('sellerRequests')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'complaints' && { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab('complaints')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'complaints' ? theme.colors.primary : theme.colors.gray },
            ]}
          >
            {t('complaints')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'requests' ? (
          sellerRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.gray }]}>
                No seller requests
              </Text>
            </View>
          ) : (
            sellerRequests.map((request) => {
              const requestDate = formatDate(request.createdAt);
              return (
              <View
                key={request.id}
                style={[styles.card, { backgroundColor: theme.colors.white }]}
              >
                <TouchableOpacity onPress={() => viewRequestDetails(request)}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      {request.profileImage ? (
                        <Image source={{ uri: request.profileImage }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.lightGray }]}>
                          <Ionicons name="person-outline" size={24} color={theme.colors.gray} />
                        </View>
                      )}
                      <View style={styles.cardInfo}>
                        <View style={styles.cardTitleRow}>
                          <Text style={[styles.cardTitle, { color: theme.colors.black }]}>
                            {request.fullName || t('unknownUser')}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  request.status === 'approved'
                                    ? theme.colors.success
                                    : request.status === 'rejected'
                                    ? theme.colors.error
                                    : theme.colors.warning,
                              },
                            ]}
                          >
                            <Text style={[styles.statusText, { color: theme.colors.white }]}>
                              {request.status || 'pending'}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.cardSubtitle, { color: theme.colors.gray }]}>
                          {request.email || t('noEmail')}
                        </Text>
                        <View style={styles.metaRow}>
                          <View style={styles.metaItem}>
                            <Ionicons name="location-outline" size={14} color={theme.colors.gray} />
                            <Text style={[styles.metaText, { color: theme.colors.gray }]}>
                              {request.governorate || t('noLocation')}
                            </Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={14} color={theme.colors.gray} />
                            <Text style={[styles.metaText, { color: theme.colors.gray }]}>
                              {requestDate}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.gray} />
                  </View>
                </TouchableOpacity>

                {request.status === 'pending' && (
                  <View style={styles.cardActions}>
                    <Button
                      title={t('approve')}
                      onPress={() => handleApprove(request.id, request.userId, request)}
                      variant="primary"
                      style={styles.actionButton}
                    />
                    <Button
                      title={t('reject')}
                      onPress={() => handleReject(request.id)}
                      variant="secondary"
                      style={styles.actionButton}
                    />
                  </View>
                )}
              </View>
            );
            })
          )
        ) : (
          complaints.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.gray }]}>
                No complaints
              </Text>
            </View>
          ) : (
            complaints.map((complaint) => (
              <View
                key={complaint.id}
                style={[styles.card, { backgroundColor: theme.colors.white }]}
              >
                <TouchableOpacity onPress={() => viewComplaintDetails(complaint)}>
                  <Text style={[styles.cardTitle, { color: theme.colors.black }]}>
                    {complaint.userName || complaint.userEmail || complaint.userId || t('unknownUser')}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: theme.colors.gray }]}>
                    {complaint.reason}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: theme.colors.gray }]}>
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                <Button
                  title={t('messageReporter')}
                  onPress={() => handleMessageReporter(complaint)}
                  variant="secondary"
                  style={styles.messageButton}
                />
              </View>
            ))
          )
        )}
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedRequest(null);
          setSelectedComplaint(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.lightYellow }]}>
            <View style={[styles.modalHeader, { backgroundColor: theme.colors.white }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.black }]}>
              {selectedRequest ? 'Request Details' : 'Complaint Details'}
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.colors.error }]}
              onPress={() => {
              setModalVisible(false);
              setSelectedRequest(null);
              setSelectedComplaint(null);
            }}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedRequest && (
              <>
                <View style={[styles.profileCard, { backgroundColor: theme.colors.white }]}>
                  <View style={styles.profileHeader}>
                    {selectedRequest.profileImage ? (
                      <Image source={{ uri: selectedRequest.profileImage }} style={styles.modalAvatar} />
                    ) : (
                      <View style={[styles.modalAvatarPlaceholder, { backgroundColor: theme.colors.lightGray }]}>
                        <Ionicons name="person-outline" size={36} color={theme.colors.gray} />
                      </View>
                    )}
                    <View style={styles.profileInfo}>
                      <Text style={[styles.profileName, { color: theme.colors.black }]}>
                        {selectedRequest.fullName || t('unknownUser')}
                      </Text>
                      <View style={styles.profileBadges}>
                        <View
                          style={[
                            styles.statusBadge,
                            styles.profileBadge,
                            {
                              backgroundColor:
                                selectedRequest.status === 'approved'
                                  ? theme.colors.success
                                  : selectedRequest.status === 'rejected'
                                  ? theme.colors.error
                                  : theme.colors.warning,
                            },
                          ]}
                        >
                          <Text style={[styles.statusText, { color: theme.colors.white }]}>
                            {selectedRequest.status || 'pending'}
                          </Text>
                        </View>
                        <View style={[styles.profileBadge, { backgroundColor: theme.colors.lightGray }]}>
                          <Text style={[styles.profileBadgeText, { color: theme.colors.gray }]}>
                            {formatDate(selectedRequest.createdAt)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.sectionGroup}>
                  {renderSectionTitle(getLabel('contactInformation', 'Contact information'))}
                  <View style={[styles.sectionCard, { backgroundColor: theme.colors.white }]}>
                    {renderDetailRow('mail-outline', getLabel('email', 'Email'), selectedRequest.email)}
                    {renderDetailRow('call-outline', getLabel('phone', 'Phone'), selectedRequest.phone)}
                  </View>
                </View>

                <View style={styles.sectionGroup}>
                  {renderSectionTitle(getLabel('addressInformation', 'Address'))}
                  <View style={[styles.sectionCard, { backgroundColor: theme.colors.white }]}>
                    {renderDetailRow('location-outline', getLabel('address', 'Address'), selectedRequest.address)}
                    {renderDetailRow('map-outline', getLabel('governorate', 'Governorate'), selectedRequest.governorate)}
                  </View>
                </View>

                {selectedRequest.identityCard && (
                  <View style={styles.sectionGroup}>
                    {renderSectionTitle(getLabel('documents', 'Documents'))}
                    <View style={[styles.sectionCard, { backgroundColor: theme.colors.white }]}>
                      <Image
                        source={{ uri: selectedRequest.identityCard }}
                        style={styles.modalImage}
                      />
                      <Text style={[styles.detailLabel, { color: theme.colors.gray }]}>
                        {getLabel('nationalIdPreview', 'National ID preview')}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedRequest.status === 'pending' && (
                  <View style={styles.modalActions}>
                    <Button
                      title={t('approve')}
                      onPress={() => {
                        handleApprove(selectedRequest.id, selectedRequest.userId, selectedRequest);
                        setModalVisible(false);
                        setSelectedRequest(null);
                      }}
                      variant="primary"
                      style={styles.modalActionButton}
                    />
                    <Button
                      title={t('reject')}
                      onPress={() => {
                        handleReject(selectedRequest.id);
                        setModalVisible(false);
                        setSelectedRequest(null);
                      }}
                      variant="secondary"
                      style={styles.modalActionButton}
                    />
                  </View>
                )}
              </>
            )}

            {selectedComplaint && (
              <>
                <View style={styles.sectionGroup}>
                  {renderSectionTitle(getLabel('complaintDetails', 'Complaint details'))}
                  <View style={[styles.sectionCard, { backgroundColor: theme.colors.white }]}>
                    {renderDetailRow('alert-circle-outline', getLabel('reason', 'Reason'), selectedComplaint.reason)}
                    {renderDetailRow('document-text-outline', getLabel('details', 'Details'), selectedComplaint.details)}
                    {renderDetailRow(
                      'person-circle-outline',
                      getLabel('reclamationFrom', 'From'),
                      selectedComplaint.userName || selectedComplaint.userEmail || selectedComplaint.userId || t('unknownUser')
                    )}
                    {renderDetailRow('time-outline', getLabel('date', 'Date'), formatDate(selectedComplaint.createdAt))}
                  </View>
                </View>
                <Button
                  title={t('messageReporter')}
                  onPress={() => {
                    handleMessageReporter(selectedComplaint);
                    setModalVisible(false);
                    setSelectedComplaint(null);
                  }}
                  variant="primary"
                  style={styles.modalActionButton}
                />
              </>
            )}
          </ScrollView>

          {selectedRequest && (
            <View style={[styles.modalFooter, { backgroundColor: theme.colors.white }]}>
              <Button
                title={getLabel('deleteUser', 'Delete user')}
                onPress={() => handleDeleteUser(selectedRequest)}
                style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
                textStyle={styles.deleteButtonText}
              />
            </View>
          )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
  },
  card: {
    padding: 16,
    margin: 16,
    borderRadius: 8,
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
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
  },
  messageButton: {
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
    maxHeight: '80%',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  profileCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  modalAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  profileBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  profileBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionGroup: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  sectionAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    marginRight: 12,
    marginTop: 2,
  },
  detailTextWrapper: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 12,
  },
  modalActionButton: {
    marginTop: 16,
  },
  deleteButton: {
    borderRadius: 12,
  },
  deleteButtonText: {
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});

