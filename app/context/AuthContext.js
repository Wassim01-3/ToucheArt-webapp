import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { ADMIN_EMAIL } from '../utils/constants';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          // Check if admin
          if (firebaseUser.email === ADMIN_EMAIL) {
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              role: 'admin'
            });
            setUserData({ ...data, role: 'admin' });
          }
        } else {
          // If user document doesn't exist, create it (especially for admin users)
          if (firebaseUser.email === ADMIN_EMAIL) {
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              email: firebaseUser.email,
              name: 'Admin User',
              phone: '',
              address: '',
              governorate: '',
              profilePhoto: '',
              role: 'admin',
              verifiedSeller: false,
              createdAt: new Date().toISOString(),
            });
            setUserData({
              email: firebaseUser.email,
              name: 'Admin User',
              phone: '',
              address: '',
              governorate: '',
              profilePhoto: '',
              role: 'admin',
              verifiedSeller: false,
              createdAt: new Date().toISOString(),
            });
          }
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email, password, userInfo) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        name: userInfo.name,
        phone: userInfo.phone,
        address: userInfo.address,
        governorate: userInfo.governorate,
        profilePhoto: userInfo.profilePhoto || '',
        role: 'user',
        verifiedSeller: false,
        createdAt: new Date().toISOString(),
      });

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateUserData = async (updates) => {
    if (!user) return { success: false, error: 'No user logged in' };
    
    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
      setUserData({ ...userData, ...updates });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    userData,
    loading,
    register,
    login,
    logout,
    updateUserData,
    isAdmin: userData?.role === 'admin',
    isVerifiedSeller: userData?.verifiedSeller === true,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

