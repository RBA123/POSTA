import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

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

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "us-central1");

export default app;
