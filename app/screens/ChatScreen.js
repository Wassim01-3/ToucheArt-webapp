import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Header } from '../components/Header';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export const ChatScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { sellerId, productId } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [chatId, setChatId] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const flatListRef = useRef(null);
  const unsubscribeMessagesRef = useRef(null);
  const unsubscribeChatsRef = useRef(null);
  const markSeenTimeoutRef = useRef(null);
  const lastMarkedSeenRef = useRef(null);

  const loadChats = useCallback(async (_forceRefresh = false) => {
    if (!user) return;

    setLoading(true);
    try {
      if (unsubscribeChatsRef.current) {
        unsubscribeChatsRef.current();
        unsubscribeChatsRef.current = null;
      }
      // Query user's own chat list (no array-contains needed!)
      const userChatsRef = collection(db, 'userChats', user.uid, 'chats');
      // Use simple query without orderBy to avoid index/permission issues
      // We'll sort in memory instead
      const userChatsQuery = query(userChatsRef);

      unsubscribeChatsRef.current = onSnapshot(
        userChatsQuery,
        async (snapshot) => {
          if (snapshot.empty) {
            setChats([]);
            setLoading(false);
            return;
          }

          const chatsData = await Promise.all(
            snapshot.docs.map(async (chatRefDoc) => {
              const chatRefData = chatRefDoc.data();
              const otherUserId = chatRefData.otherUserId;
              
              // Load other user info
              let otherUserData = null;
              if (otherUserId) {
                try {
                  const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
                  if (otherUserDoc.exists()) {
                    otherUserData = { id: otherUserDoc.id, ...otherUserDoc.data() };
                  }
                } catch (error) {
                  console.error('Error loading other user:', error);
                }
              }
              
              // Handle lastMessageTime
              let lastMessageTime = chatRefData.lastMessageTime;
              if (lastMessageTime?.toDate) {
                lastMessageTime = lastMessageTime.toDate().toISOString();
              } else if (!lastMessageTime) {
                lastMessageTime = chatRefData.createdAt?.toDate?.().toISOString() || new Date().toISOString();
              }
              
              return {
                id: chatRefData.chatId,
                chatRefId: chatRefDoc.id,
                otherUserId: otherUserId,
                productId: chatRefData.productId,
                lastMessage: chatRefData.lastMessage || '',
                lastMessageTime: lastMessageTime,
                unreadCount: chatRefData.unreadCount || 0,
                otherUser: otherUserData,
                participants: [user.uid, otherUserId], // For compatibility
              };
            })
          );
          
          // Sort by lastMessageTime in memory (in case orderBy failed)
          chatsData.sort((a, b) => {
            const timeA = new Date(a.lastMessageTime).getTime();
            const timeB = new Date(b.lastMessageTime).getTime();
            return timeB - timeA; // Descending
          });
          
          setChats(chatsData);
          setLoading(false);
        },
        (error) => {
          console.error('Error loading chats:', error);
          setLoading(false);
          if (error.code === 'permission-denied') {
            Alert.alert(
              'Permission Error',
              'Unable to load chats. Please make sure you are logged in.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert('Error', 'Failed to load chats. Please try again.');
          }
          setChats([]);
        }
      );
    } catch (error) {
      console.error('Error loading chats:', error);
      setLoading(false);
      setChats([]);
    }
  }, [user]);

  const resetToChatList = useCallback(
    (shouldRefresh = false) => {
      setChatId(null);
      setOtherUser(null);
      setMessages([]);
      setMessage('');

      if (route?.params?.sellerId || route?.params?.productId) {
        navigation.setParams({
          ...(route.params || {}),
          sellerId: null,
          productId: null,
        });
      }

      if (shouldRefresh && user) {
        loadChats(true);
      }
    },
    [navigation, route?.params?.sellerId, route?.params?.productId, user, loadChats]
  );

  useEffect(() => {
    console.log('🟢 [DEBUG] ChatScreen useEffect triggered');
    console.log('🟢 [DEBUG] Component state:', {
      user: user ? { uid: user.uid, email: user.email } : null,
      sellerId,
      productId,
      chatId,
    });
    
    // Load user profile
    if (user) {
      loadUserProfile();
    }
    
    // Always load the chat list first
    if (user) {
      console.log('🟢 [DEBUG] User exists, calling loadChats()');
      loadChats();
    } else {
      console.warn('🟡 [DEBUG] No user found, cannot load chats');
    }
    
    // If sellerId and productId are provided, create or find the chat and open it directly
    if (sellerId && productId && user) {
      console.log('🟢 [DEBUG] sellerId and productId provided, calling loadOrCreateChat()');
      loadOrCreateChat(sellerId, productId);
    } else {
      console.log('🟡 [DEBUG] Not calling loadOrCreateChat - missing:', {
        sellerId: !sellerId,
        productId: !productId,
        user: !user,
      });
    }

    // Cleanup on unmount
    return () => {
      if (unsubscribeChatsRef.current) {
        unsubscribeChatsRef.current();
      }
    };
  }, [sellerId, productId, user, loadChats]);

  useEffect(() => {
    if (chatId) {
      loadMessages();
    }
    
    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
      }
    };
  }, [chatId]);

  // Mark messages as seen when chat is opened (debounced)
  useEffect(() => {
    if (chatId && user && messages.length > 0) {
      // Clear any pending timeout
      if (markSeenTimeoutRef.current) {
        clearTimeout(markSeenTimeoutRef.current);
      }
      
      // Debounce: wait 1 second after messages load/change before marking as seen
      markSeenTimeoutRef.current = setTimeout(() => {
        const currentChatId = chatId;
        // Only mark as seen if we're still viewing this chat
        if (currentChatId === chatId) {
          markMessagesAsSeen();
          lastMarkedSeenRef.current = Date.now();
        }
      }, 1000);
      
      return () => {
        if (markSeenTimeoutRef.current) {
          clearTimeout(markSeenTimeoutRef.current);
        }
      };
    }
  }, [chatId, user, messages.length]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadChats(true);
      }
      return undefined;
    }, [user, loadChats])
  );

  useEffect(() => {
    if (!navigation?.addListener) {
      return;
    }

    const unsubscribeTabPress = navigation.addListener('tabPress', () => {
      resetToChatList(true);
    });

    return () => {
      if (unsubscribeTabPress) {
        unsubscribeTabPress();
      }
    };
  }, [navigation, resetToChatList]);

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserProfile({ id: userDoc.id, ...userDoc.data() });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadOrCreateChat = async (otherUserId, prodId) => {
    if (!user) return;
    
    try {
      // Check user's chat list for existing chat with this user and product
      const userChatsRef = collection(db, 'userChats', user.uid, 'chats');
      const userChatsQuery = query(
        userChatsRef,
        where('otherUserId', '==', otherUserId),
        where('productId', '==', prodId)
      );
      
      const userChatsSnapshot = await getDocs(userChatsQuery);
      
      if (!userChatsSnapshot.empty) {
        // Chat exists - get the chatId from the reference
        const chatRef = userChatsSnapshot.docs[0];
        const chatData = chatRef.data();
        setChatId(chatData.chatId);
        
        // Reset unread count when opening chat
        await updateDoc(chatRef.ref, {
          unreadCount: 0,
        });
        
        // Load other user info
        const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
        if (otherUserDoc.exists()) {
          setOtherUser({ id: otherUserDoc.id, ...otherUserDoc.data() });
        }
      } else {
        // Create new chat
        const newChat = {
          participants: [user.uid, otherUserId],
          productId: prodId,
          createdAt: serverTimestamp(),
        };
        
        // Create the chat document
        const chatRef = await addDoc(collection(db, 'chats'), newChat);
        const chatId = chatRef.id;
        
        // Create chat references for both users
        const currentUserChatRef = {
          chatId: chatId,
          otherUserId: otherUserId,
          productId: prodId,
          lastMessage: '',
          lastMessageTime: serverTimestamp(),
          unreadCount: 0,
          createdAt: serverTimestamp(),
        };
        
        const otherUserChatRef = {
          chatId: chatId,
          otherUserId: user.uid,
          productId: prodId,
          lastMessage: '',
          lastMessageTime: serverTimestamp(),
          unreadCount: 0,
          createdAt: serverTimestamp(),
        };
        
        // Add to both users' chat lists
        await Promise.all([
          addDoc(collection(db, 'userChats', user.uid, 'chats'), currentUserChatRef),
          addDoc(collection(db, 'userChats', otherUserId, 'chats'), otherUserChatRef),
        ]);
        
        setChatId(chatId);
        
        // Load other user info
        const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
        if (otherUserDoc.exists()) {
          setOtherUser({ id: otherUserDoc.id, ...otherUserDoc.data() });
        }
      }
    } catch (error) {
      console.error('Error in loadOrCreateChat:', error);
      Alert.alert('Error', 'Failed to load chat. Please try again.');
    }
  };


  const loadMessages = () => {
    console.log('🟢 [DEBUG] loadMessages: Starting');
    console.log('🟢 [DEBUG] loadMessages context:', {
      chatId,
      userExists: !!user,
      userUid: user?.uid,
    });

    if (!chatId || !user) {
      console.warn('🟡 [DEBUG] loadMessages: Missing required data', {
        chatId: !chatId,
        user: !user,
      });
      return;
    }

    // Cleanup previous subscription
    if (unsubscribeMessagesRef.current) {
      console.log('🟢 [DEBUG] Cleaning up previous messages subscription');
      unsubscribeMessagesRef.current();
    }

    console.log('🟢 [DEBUG] Creating messages query for chat:', chatId);
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    console.log('🟢 [DEBUG] Setting up onSnapshot listener for messages');
    unsubscribeMessagesRef.current = onSnapshot(
      messagesQuery,
      (snapshot) => {
        console.log('🟢 [DEBUG] Messages snapshot received:', {
          size: snapshot.size,
          empty: snapshot.empty,
          docsCount: snapshot.docs.length,
        });
        
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        console.log('🟢 [DEBUG] Processed', messagesData.length, 'messages');
        setMessages(messagesData);
      
        // Scroll to bottom after messages load
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      (error) => {
        console.error('🔴 [DEBUG] Error loading messages - DETAILED ERROR INFO:');
        console.error('🔴 [DEBUG] Error code:', error.code);
        console.error('🔴 [DEBUG] Error message:', error.message);
        console.error('🔴 [DEBUG] Error name:', error.name);
        console.error('🔴 [DEBUG] Full error object:', JSON.stringify(error, null, 2));
        console.error('🔴 [DEBUG] Error stack:', error.stack);
        console.error('🔴 [DEBUG] Context:', {
          chatId,
          userUid: user?.uid,
          collectionPath: `chats/${chatId}/messages`,
        });
        
        Alert.alert('Error', 'Failed to load messages. Please try again.');
      }
    );
  };

  const markMessagesAsSeen = async () => {
    if (!chatId || !user) return;
    
    // Throttle: don't mark as seen more than once every 2 seconds
    const now = Date.now();
    if (lastMarkedSeenRef.current && (now - lastMarkedSeenRef.current) < 2000) {
      return;
    }
    
    try {
      // Get all messages from the other user (not sent by current user)
      const messagesQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('timestamp', 'desc')
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      
      // Filter messages that are from other user and not seen
      const unreadMessages = messagesSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.senderId !== user.uid && (data.seen === false || data.seen === undefined);
      });
      
      if (unreadMessages.length > 0) {
        // Update all unread messages to seen
        const updatePromises = unreadMessages.map(doc => 
          updateDoc(doc.ref, {
            seen: true,
            seenAt: serverTimestamp(),
          })
        );
        
        await Promise.all(updatePromises);
        lastMarkedSeenRef.current = Date.now();
        
        // Reset unread count for current user's chat reference
        const userChatsRef = collection(db, 'userChats', user.uid, 'chats');
        const userChatsQuery = query(userChatsRef, where('chatId', '==', chatId));
        const userChatsSnapshot = await getDocs(userChatsQuery);
        
        if (!userChatsSnapshot.empty) {
          await updateDoc(userChatsSnapshot.docs[0].ref, {
            unreadCount: 0,
          });
        }
      }
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  };

  const sendMessage = async () => {
    const messageText = message.trim();
    if (!messageText || !chatId || !user || sending) return;

    setSending(true);
    const messageToSend = messageText;
    setMessage(''); // Clear input immediately for better UX

    try {
      console.log('🟢 [DEBUG] Step 1: Sending message to chat:', chatId);
      // Send message with seen: false initially
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        text: messageToSend,
        timestamp: serverTimestamp(),
        seen: false,
      });
      console.log('🟢 [DEBUG] Step 1: Message sent successfully');

      console.log('🟢 [DEBUG] Step 2: Updating own chat reference');
      // Update current user's chat reference
      const userChatsRef = collection(db, 'userChats', user.uid, 'chats');
      const userChatsQuery = query(userChatsRef, where('chatId', '==', chatId));
      const userChatsSnapshot = await getDocs(userChatsQuery);
      
      if (!userChatsSnapshot.empty) {
        const chatRefDoc = userChatsSnapshot.docs[0];
        await updateDoc(chatRefDoc.ref, {
          lastMessage: messageToSend,
          lastMessageTime: serverTimestamp(),
          unreadCount: 0, // Reset unread count for sender
        });
        console.log('🟢 [DEBUG] Step 2: Own chat reference updated');
      } else {
        console.warn('🟡 [DEBUG] Step 2: Own chat reference not found');
      }

      console.log('🟢 [DEBUG] Step 3: Updating other user\'s chat reference');
      // Also update the other user's chat reference
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (chatDoc.exists()) {
        const participants = chatDoc.data().participants;
        const otherUserId = participants.find(id => id !== user.uid);
        if (otherUserId) {
          try {
            const otherUserChatsRef = collection(db, 'userChats', otherUserId, 'chats');
            const otherUserChatsQuery = query(otherUserChatsRef, where('chatId', '==', chatId));
            const otherUserChatsSnapshot = await getDocs(otherUserChatsQuery);
            
            if (!otherUserChatsSnapshot.empty) {
              const otherChatRefDoc = otherUserChatsSnapshot.docs[0];
              const currentUnread = otherChatRefDoc.data().unreadCount || 0;
              await updateDoc(otherChatRefDoc.ref, {
                lastMessage: messageToSend,
                lastMessageTime: serverTimestamp(),
                unreadCount: currentUnread + 1, // Increment unread count
              });
              console.log('🟢 [DEBUG] Step 3: Other user\'s chat reference updated');
            } else {
              // Chat reference doesn't exist - create it (for backward compatibility with old chats)
              console.warn('🟡 [DEBUG] Step 3: Other user\'s chat reference not found, creating it');
              const chatData = chatDoc.data();
              const otherUserChatRef = {
                chatId: chatId,
                otherUserId: user.uid,
                productId: chatData.productId || '',
                lastMessage: messageToSend,
                lastMessageTime: serverTimestamp(),
                unreadCount: 1,
                createdAt: serverTimestamp(),
              };
              await addDoc(otherUserChatsRef, otherUserChatRef);
              console.log('🟢 [DEBUG] Step 3: Created missing chat reference for other user');
            }
          } catch (error) {
            console.warn('🟡 [DEBUG] Step 3: Could not update other user\'s chat reference:', error.message);
            // Don't fail the whole operation if this step fails
          }
        }
      }

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('🔴 [DEBUG] Error sending message - DETAILED:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      setMessage(messageToSend); // Restore message on error
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.senderId === user?.uid;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !prevMessage || prevMessage.senderId !== item.senderId;
    
    // Get sender profile photo
    const senderProfile = isMyMessage ? userProfile : otherUser;
    const senderPhoto = senderProfile?.profilePhoto || senderProfile?.profileImage;
    
    // Calculate time difference for showing timestamp
    let showTime = true;
    if (prevMessage) {
      const currentTime = item.timestamp?.toDate ? item.timestamp.toDate().getTime() : new Date(item.timestamp).getTime();
      const prevTime = prevMessage.timestamp?.toDate ? prevMessage.timestamp.toDate().getTime() : new Date(prevMessage.timestamp).getTime();
      showTime = Math.abs(currentTime - prevTime) > 300000; // 5 minutes
    }
    
    // Handle timestamp (Firestore Timestamp or ISO string)
    let messageTime;
    if (item.timestamp?.toDate) {
      messageTime = item.timestamp.toDate();
    } else if (item.timestamp) {
      messageTime = new Date(item.timestamp);
    } else {
      messageTime = new Date();
    }
    
    return (
      <View
        style={[
          styles.messageRow,
          isMyMessage ? styles.myMessageRow : styles.otherMessageRow,
        ]}
      >
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            {showAvatar ? (
              senderPhoto ? (
                <Image
                  source={{ uri: senderPhoto }}
                  style={styles.messageAvatar}
                />
              ) : (
                <View style={[styles.messageAvatarPlaceholder, { backgroundColor: theme.colors.lightGray }]}>
                  <Ionicons name="person" size={16} color={theme.colors.gray} />
                </View>
              )
            ) : (
              <View style={styles.avatarSpacer} />
            )}
          </View>
        )}
        
        <View
          style={[
            styles.messageBubbleContainer,
            isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
                backgroundColor: isMyMessage ? '#0084FF' : '#E4E6EB',
            },
              isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isMyMessage ? theme.colors.white : theme.colors.black },
            ]}
          >
            {item.text}
          </Text>
          </View>
          <View style={styles.messageFooter}>
            {showTime && (
              <Text
                style={[
                  styles.messageTimestamp,
                  { color: isMyMessage ? 'rgba(255,255,255,0.7)' : theme.colors.gray },
                ]}
              >
                {messageTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
            {isMyMessage && (
              <Ionicons
                name={item.seen ? "checkmark-done" : "checkmark"}
                size={14}
                color={item.seen ? '#4FC3F7' : 'rgba(255,255,255,0.7)'}
                style={styles.seenIcon}
              />
            )}
          </View>
        </View>
        
        {isMyMessage && (
          <View style={styles.avatarContainer}>
            {showAvatar ? (
              senderPhoto ? (
                <Image
                  source={{ uri: senderPhoto }}
                  style={styles.messageAvatar}
                />
              ) : (
                <View style={[styles.messageAvatarPlaceholder, { backgroundColor: theme.colors.lightGray }]}>
                  <Ionicons name="person" size={16} color={theme.colors.gray} />
                </View>
              )
            ) : (
              <View style={styles.avatarSpacer} />
            )}
          </View>
        )}
      </View>
    );
  };

  const renderChatItem = ({ item }) => {
    const otherUser = item.otherUser;
    const unreadCount = item.unreadCount || 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.chatItem,
          { backgroundColor: theme.colors.white },
          unreadCount > 0 && styles.chatItemUnread
        ]}
        onPress={async () => {
          setChatId(item.id); // item.id is the chatId
          // Reset unread count when opening chat
          if (unreadCount > 0) {
            try {
              const userChatsRef = collection(db, 'userChats', user.uid, 'chats');
              const userChatsQuery = query(userChatsRef, where('chatId', '==', item.id));
              const userChatsSnapshot = await getDocs(userChatsQuery);
              if (!userChatsSnapshot.empty) {
                await updateDoc(userChatsSnapshot.docs[0].ref, {
                  unreadCount: 0,
                });
              }
            } catch (error) {
              console.error('Error resetting unread count:', error);
            }
          }
          // Load other user info if not already loaded
          if (!otherUser && item.otherUserId) {
            try {
              const otherUserDoc = await getDoc(doc(db, 'users', item.otherUserId));
              if (otherUserDoc.exists()) {
                setOtherUser({ id: otherUserDoc.id, ...otherUserDoc.data() });
              }
            } catch (error) {
              console.error('Error loading other user:', error);
            }
          } else if (otherUser) {
            setOtherUser(otherUser);
          }
        }}
      >
        {/* Handle both 'profilePhoto' and 'profileImage' for backward compatibility */}
        {(otherUser?.profilePhoto || otherUser?.profileImage) ? (
          <Image
            source={{ uri: otherUser.profilePhoto || otherUser.profileImage }}
            style={styles.chatAvatar}
          />
        ) : (
          <View style={[styles.chatAvatarPlaceholder, { backgroundColor: theme.colors.lightGray }]}>
            <Ionicons name="person" size={24} color={theme.colors.gray} />
          </View>
        )}
        <View style={styles.chatInfo}>
          {/* Handle both 'name' and 'fullName' for backward compatibility */}
          <View style={styles.chatNameRow}>
            <Text style={[styles.chatName, { color: theme.colors.black }]}>
              {otherUser?.name || otherUser?.fullName || 'Unknown'}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.chatLastMessage,
              { color: unreadCount > 0 ? theme.colors.black : theme.colors.gray },
              unreadCount > 0 && styles.chatLastMessageUnread
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>
        <View style={styles.chatRightSection}>
          <Text style={[styles.chatTime, { color: theme.colors.gray }]}>
            {(() => {
              try {
                if (!item.lastMessageTime) return '';
                const date = typeof item.lastMessageTime === 'string' 
                  ? new Date(item.lastMessageTime) 
                  : (item.lastMessageTime?.toDate ? item.lastMessageTime.toDate() : new Date(item.lastMessageTime));
                if (isNaN(date.getTime())) return '';
                return date.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
              } catch (e) {
                return '';
              }
            })()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Chat list view - show this when no chat is selected AND not coming from product page
  if (!chatId && !sellerId) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.lightYellow }]}>
        <Header />
        <View style={[styles.header, { backgroundColor: theme.colors.white }]}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.gray} style={styles.headerIcon} />
            <Text style={[styles.headerTitle, { color: theme.colors.black }]}>
              {t('activeChats')}
            </Text>
          </View>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
          </View>
        ) : chats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.lightGray} />
            <Text style={[styles.emptyText, { color: theme.colors.gray }]}>
              {t('noChats')}
            </Text>
            {sellerId && (
              <Text style={[styles.emptySubText, { color: theme.colors.gray }]}>
                Creating new conversation...
              </Text>
            )}
          </View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.chatRefId || item.id}
            renderItem={renderChatItem}
          />
        )}
      </View>
    );
  }

  // Chat messages view
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: '#F0F2F5' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Header />
      {otherUser && (
        <View style={[styles.chatHeader, { backgroundColor: theme.colors.white }]}>
          <TouchableOpacity 
            onPress={() => {
              setChatId(null);
              setOtherUser(null);
              setMessages([]);
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.black} />
          </TouchableOpacity>
          {(otherUser?.profilePhoto || otherUser?.profileImage) ? (
            <Image
              source={{ uri: otherUser.profilePhoto || otherUser.profileImage }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={[styles.headerAvatarPlaceholder, { backgroundColor: theme.colors.lightGray }]}>
              <Ionicons name="person" size={20} color={theme.colors.gray} />
            </View>
          )}
          <Text style={[styles.chatHeaderTitle, { color: theme.colors.black }]}>
            {otherUser.name || otherUser.fullName || 'Unknown'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      {messages.length === 0 ? (
        <View style={styles.emptyMessagesContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.lightGray} />
          <Text style={[styles.emptyMessagesText, { color: theme.colors.gray }]}>
            No messages yet. Start the conversation!
          </Text>
        </View>
      ) : (
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
          inverted={false}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={[styles.inputContainer, { backgroundColor: theme.colors.white }]}>
        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.lightGray }]}>
        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.black,
            },
          ]}
          value={message}
          onChangeText={setMessage}
          placeholder={t('typeMessage')}
          placeholderTextColor={theme.colors.gray}
          multiline
            maxLength={1000}
            editable={!sending}
        />
        </View>
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: message.trim() ? '#0084FF' : theme.colors.lightGray },
            (!message.trim() || sending) && { opacity: 0.5 },
          ]}
          onPress={sendMessage}
          disabled={!message.trim() || sending || !chatId}
          activeOpacity={0.7}
        >
          {sending ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Ionicons 
              name="send" 
              size={20} 
              color={message.trim() ? theme.colors.white : theme.colors.gray} 
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfo: {
    flex: 1,
  },
  chatNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  chatLastMessage: {
    fontSize: 14,
  },
  chatLastMessageUnread: {
    fontWeight: '600',
  },
  chatTime: {
    fontSize: 12,
  },
  chatRightSection: {
    alignItems: 'flex-end',
  },
  chatItemUnread: {
    backgroundColor: '#F0F8FF',
  },
  unreadBadge: {
    backgroundColor: '#0084FF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  messagesList: {
    padding: 12,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    marginRight: 8,
    alignItems: 'center',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSpacer: {
    width: 32,
  },
  messageBubbleContainer: {
    maxWidth: '75%',
    flexDirection: 'column',
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  myMessageBubble: {
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginHorizontal: 4,
  },
  messageTimestamp: {
    fontSize: 11,
    opacity: 0.7,
  },
  seenIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    marginRight: 8,
    maxHeight: 100,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    padding: 0,
    margin: 0,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyMessagesText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});

