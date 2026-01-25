import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBsqijOYbdAehqW282VjthfOR3CejkVH7A",
  authDomain: "liberta-main.firebaseapp.com",
  projectId: "liberta-main",
  storageBucket: "liberta-main.firebasestorage.app",
  messagingSenderId: "446575654136",
  appId: "1:446575654136:ios:2a1e270a388d6c1add370d",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");

// Log the functions configuration for debugging
console.log('🔧 Firebase Functions initialized:', {
  region: 'us-central1',
  customDomain: functions.customDomain,
  emulatorOrigin: functions.emulatorOrigin,
});

export default app;

