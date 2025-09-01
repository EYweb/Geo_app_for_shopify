import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Database collections structure
export const COLLECTIONS = {
  USERS: 'users',
  ARTICLES: 'articles',
  TOKENS: 'tokens',
  SUBSCRIPTIONS: 'subscriptions',
  ANALYTICS: 'analytics'
} as const;

// Initialize database collections (Firebase creates collections automatically)
export async function initializeDatabase() {
  try {
    console.log('Firebase initialized successfully');
    console.log('Collections will be created automatically when first document is added');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}
