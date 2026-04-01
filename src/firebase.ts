import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

// Hardcoded Firebase config - no external JSON needed
const firebaseConfig = {
  projectId: "gen-lang-client-0326385388",
  appId: "1:122336191579:web:2de07c0acb51b8b24c8b7e",
  apiKey: "AIzaSyDSwhKXm7KqaHVO2kb2PQ6qmarySPcZyJ0",
  authDomain: "gen-lang-client-0326385388.firebaseapp.com",
  firestoreDatabaseId: "abcd",
  storageBucket: "gen-lang-client-0326385388.firebasestorage.app",
  messagingSenderId: "122336191579",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with non-default database ID
const db = initializeFirestore(app, {
  databaseId: firebaseConfig.firestoreDatabaseId
});

export const auth = getAuth(app);
export { db };

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
