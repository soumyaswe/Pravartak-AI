import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase configuration - always use hardcoded values with env var override
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyD8pa4S7Kbyq_r96L9fRXomLNlCSJA28LU',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'pravartak-15665.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'pravartak-15665',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'pravartak-15665.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '393621785566',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:393621785566:web:44c4f82cb61b6dbe73ab4f'
};

// Initialize Firebase (client-side only)
let app;
let auth;
let googleProvider;

if (typeof window !== 'undefined') {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    
    // Configure Google provider
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    auth = null;
    googleProvider = null;
  }
}

export { auth, googleProvider };
