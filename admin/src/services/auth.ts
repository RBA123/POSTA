import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { User } from "../types";

export async function signIn(email: string, password: string): Promise<FirebaseUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(
      error.code === "auth/user-not-found"
        ? "Usuario no encontrado"
        : error.code === "auth/wrong-password"
        ? "Contraseña incorrecta"
        : error.code === "auth/invalid-email"
        ? "Correo electrónico inválido"
        : "Error al iniciar sesión. Por favor intenta de nuevo."
    );
  }
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error("Error al cerrar sesión. Por favor intenta de nuevo.");
  }
}

export async function checkAdminStatus(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return false;
    }
    const userData = userDoc.data() as User;
    return userData.isAdmin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}
