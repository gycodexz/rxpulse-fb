import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace the placeholder config below with your configuration from Firebase Console:
// Firebase Console -> Project Settings -> General -> Your Apps -> Web SDK configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMu_ZKuGa1FP4TFu5PSeqjdLyrnA6MO2k",
  authDomain: "rxpulse-4c043.firebaseapp.com",
  projectId: "rxpulse-4c043",
  storageBucket: "rxpulse-4c043.firebasestorage.app",
  messagingSenderId: "1032727047814",
  appId: "1:1032727047814:web:62f2cc77dd139b4b05ab07",
  measurementId: "G-YYHL6F0HJ7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
