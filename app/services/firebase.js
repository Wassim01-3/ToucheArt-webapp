import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
// NOTE: Replace these with your actual Firebase config values
const firebaseConfig = {
    apiKey: "AIzaSyCPTMAZs0cj3UrMpLriWQqPlvbQFBVHPxg",
    authDomain: "toucheart-5457a.firebaseapp.com",
    projectId: "toucheart-5457a",
    storageBucket: "toucheart-5457a.firebasestorage.app",
    messagingSenderId: "294309982980",
    appId: "1:294309982980:web:9cc9af77a3037fef239651"
  };

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth with AsyncStorage persistence
// Use try-catch to handle case where auth is already initialized
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If auth is already initialized, get the existing instance
  // Otherwise, try getAuth as fallback (though it won't have persistence)
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    // For other errors (like "not registered"), wait a bit and retry
    // This handles timing issues with module loading
    console.warn('Auth initialization error, retrying with getAuth:', error.message);
    auth = getAuth(app);
  }
}

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;

