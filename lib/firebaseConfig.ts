import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCPRgZpboRyueW8cplGASUezTdZdL1Fx4c",
  authDomain: "porta-main.firebaseapp.com",
  projectId: "porta-main",
  storageBucket: "porta-main.firebasestorage.app",
  messagingSenderId: "354126583899",
  appId: "1:354126583899:web:29ade165020f9ff3e3877e",
  measurementId: "G-ZNGXYNQBPC",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth - Firebase v11+ handles React Native persistence automatically
export const auth = getAuth(app);

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");

console.log("🔧 Firebase initialized successfully");

export default app;
