/**
 * Authentication Service
 * 
 * Abstracts all Firebase Authentication operations
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  Unsubscribe,
} from "firebase/auth";
import { auth } from "../lib/firebaseConfig";

// ============================================================================
// TYPES
// ============================================================================

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  phoneNumber?: string;
  phoneCode?: string;
  countryCode: string;
  friendCode?: string; // Optional referral code from another user
}

// ============================================================================
// AUTHENTICATION OPERATIONS
// ============================================================================

/**
 * Sign up a new user with email and password
 * Returns the Firebase Auth user object
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<FirebaseUser> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error: any) {
    const errorCode = error?.code || "";
    const errorMessage = error?.message || "";
    
    throw new Error(
      errorCode === "auth/email-already-in-use"
        ? "Este correo electrónico ya está registrado"
        : errorCode === "auth/invalid-email"
        ? "Correo electrónico inválido"
        : errorCode === "auth/weak-password"
        ? "La contraseña debe tener al menos 6 caracteres"
        : errorCode === "auth/network-request-failed"
        ? "Error de conexión. Verifica tu conexión a internet."
        : errorCode === "auth/too-many-requests"
        ? "Demasiados intentos. Por favor intenta más tarde."
        : `Error al crear la cuenta: ${errorMessage || "Por favor intenta de nuevo."}`
    );
  }
}

/**
 * Sign in an existing user with email and password
 * Returns the Firebase Auth user object
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<FirebaseUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error: any) {
    throw new Error(
      error.code === "auth/user-not-found"
        ? "Usuario no encontrado"
        : error.code === "auth/wrong-password"
        ? "Contraseña incorrecta"
        : error.code === "auth/invalid-email"
        ? "Correo electrónico inválido"
        : error.code === "auth/user-disabled"
        ? "Esta cuenta ha sido deshabilitada"
        : "Error al iniciar sesión. Por favor intenta de nuevo."
    );
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error("Error al cerrar sesión. Por favor intenta de nuevo.");
  }
}

/**
 * Get the currently authenticated user
 * Returns null if no user is signed in
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Subscribe to authentication state changes
 * Returns an unsubscribe function
 */
export function onAuthStateChanged(
  callback: (user: FirebaseUser | null) => void
): Unsubscribe {
  return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(
      error.code === "auth/user-not-found"
        ? "No existe una cuenta con este correo electrónico"
        : error.code === "auth/invalid-email"
        ? "Correo electrónico inválido"
        : "Error al enviar el correo de recuperación. Por favor intenta de nuevo."
    );
  }
}

