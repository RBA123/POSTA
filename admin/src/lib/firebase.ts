import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Firebase configuration - must match the mobile app's project (porta-main)
const firebaseConfig = {
  apiKey: "AIzaSyCPRgZpboRyueW8cplGASUezTdZdL1Fx4c",
  authDomain: "porta-main.firebaseapp.com",
  projectId: "porta-main",
  storageBucket: "porta-main.firebasestorage.app",
  messagingSenderId: "354126583899",
  appId: "1:354126583899:web:29ade165020f9ff3e3877e",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "us-central1");

// Connect to local emulators when running in development
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);
  connectFunctionsEmulator(functions, "localhost", 5001);
}

export default app;
