/**
 * User Service
 *
 * Manages Firestore user documents (CRUD operations)
 */

import { doc, setDoc, updateDoc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebaseConfig";
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
} from "../firebase/types/firestore.types";

// ============================================================================
// USER PROFILE OPERATIONS
// ============================================================================

/**
 * Create a new user profile in Firestore
 * Called after Firebase Auth signup
 */
export async function createUserProfile(
  uid: string,
  userData: Omit<CreateUserInput, "uid">,
): Promise<void> {
  try {
    const userRef = doc(db, "users", uid);
    const now = Timestamp.now();

    // Check if user already exists
    const existingUser = await getDoc(userRef);
    if (existingUser.exists()) {
      throw new Error("User profile already exists");
    }

    // Generate friend code if not provided
    const friendCode =
      userData.friendCode || generateFriendCode(userData.firstName);

    // Calculate initial winRate (0% since no bets yet)
    const winRate = 0;

    // Build user object, excluding undefined values (Firestore doesn't support undefined)
    const newUser: CreateUserInput = {
      uid,
      email: userData.email,
      phoneNumber: userData.phoneNumber || null, // Convert undefined to null
      phoneCode: userData.phoneCode || null, // Convert undefined to null
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: userData.username.toLowerCase().trim(),
      dateOfBirth: Timestamp.fromDate(userData.dateOfBirth),
      countryCode: userData.countryCode,
      friendCode,
      virtualBalance: 10000, // Initial balance: 10000 cents = $100.00
      totalPositions: 0,
      activePositions: 0,
      winRate,
      totalWinnings: 0,
      totalLosses: 0,
      notificationsEnabled: userData.notificationsEnabled ?? true,
      notificationPreferences: {
        liveMarkets: userData.notificationPreferences?.liveMarkets ?? true,
        marketResults: userData.notificationPreferences?.marketResults ?? true,
        promotions: userData.notificationPreferences?.promotions ?? true,
      },
      termsAccepted: userData.termsAccepted ?? true, // Default to true if not specified
      termsAcceptedAt: userData.termsAcceptedAt || now,
      createdAt: now,
      updatedAt: now,
      referredBy: userData.referredBy || null, // Convert undefined to null
      isAdmin: false,
    };

    await setDoc(userRef, newUser);
  } catch (error: any) {
    throw new Error(
      error.code === "permission-denied"
        ? "Permiso denegado. Por favor verifica las reglas de Firestore."
        : error.message ||
            "Error al crear el perfil de usuario. Por favor intenta de nuevo.",
    );
  }
}

/**
 * Get user profile by UID
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    console.log("📥 [user.service] getUserProfile called", { uid });
    const userRef = doc(db, "users", uid);
    console.log("📤 [user.service] Fetching document from Firestore...");
    const userSnap = await getDoc(userRef);

    console.log("📥 [user.service] Document fetch result", {
      exists: userSnap.exists(),
      id: userSnap.id,
    });

    if (!userSnap.exists()) {
      console.log("❌ [user.service] Document does not exist");
      return null;
    }

    const userData = userSnap.data() as User;
    console.log("✅ [user.service] Profile fetched successfully", {
      email: userData.email,
      firstName: userData.firstName,
    });
    return userData;
  } catch (error: any) {
    console.error("❌ [user.service] Error fetching profile:", {
      code: error.code,
      message: error.message,
      fullError: error,
    });
    throw new Error("Error al obtener el perfil de usuario.");
  }
}

/**
 * Update user profile
 * Only updates provided fields
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<UpdateUserInput>,
): Promise<void> {
  try {
    const userRef = doc(db, "users", uid);

    // Ensure updatedAt is always set
    const updateData: Partial<UpdateUserInput> = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(userRef, updateData);
  } catch (error: any) {
    throw new Error(
      error.code === "permission-denied"
        ? "No tienes permiso para actualizar este perfil"
        : "Error al actualizar el perfil. Por favor intenta de nuevo.",
    );
  }
}

/**
 * Update terms acceptance status
 * Called when user accepts terms (syncs from AsyncStorage to Firestore)
 */
export async function updateTermsAcceptance(uid: string): Promise<void> {
  try {
    const userRef = doc(db, "users", uid);
    const now = Timestamp.now();

    await updateDoc(userRef, {
      termsAccepted: true,
      termsAcceptedAt: now,
      updatedAt: now,
    });
  } catch (error: any) {
    throw new Error(
      error.code === "permission-denied"
        ? "No tienes permiso para actualizar este perfil"
        : "Error al actualizar la aceptación de términos. Por favor intenta de nuevo.",
    );
  }
}

/**
 * Get user statistics
 * Returns a subset of user data focused on stats
 */
export interface UserStats {
  virtualBalance: number;
  totalPositions: number;
  activePositions: number;
  winRate: number;
  totalWinnings: number;
  totalLosses: number;
  overallTotal: number;
}

export async function getUserStats(uid: string): Promise<UserStats> {
  try {
    const user = await getUserProfile(uid);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      virtualBalance: user.virtualBalance,
      totalPositions: user.totalPositions,
      activePositions: user.activePositions,
      winRate: user.winRate,
      totalWinnings: user.totalWinnings,
      totalLosses: user.totalLosses,
      overallTotal: user.totalWinnings - user.totalLosses,
    };
  } catch (error: any) {
    throw new Error("Error al obtener las estadísticas del usuario.");
  }
}

// ============================================================================
// FRIEND CODE OPERATIONS
// ============================================================================

/**
 * Generate a unique friend code from firstName
 * Format: FIRSTNAME + 3 random digits (e.g., "DIEGO323")
 */
export function generateFriendCode(firstName: string): string {
  const namePart = firstName.toUpperCase().slice(0, 6).replace(/\s/g, "");
  const randomDigits = Math.floor(Math.random() * 900 + 100); // 100-999
  return `${namePart}${randomDigits}`;
}

/**
 * Validate if a friend code exists and is valid
 * Returns the user UID if found, null otherwise
 */
export async function validateFriendCode(
  friendCode: string,
): Promise<string | null> {
  try {
    // Friend codes are stored in user documents
    // We need to query users collection (requires index)
    // For now, we'll check if the format is valid
    // Full validation requires a query which we'll handle in the hook

    if (!friendCode || friendCode.length < 4) {
      return null;
    }

    // Note: Full validation requires querying users collection
    // This is a placeholder - actual validation will be done via query
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if username is available
 * Usernames must be unique
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    // This would require a query on users collection
    // For now, we'll do basic validation
    // Full check requires Firestore query with index

    if (!username || username.length < 3) {
      return false;
    }

    // Note: Full validation requires querying users collection
    // This is a placeholder - actual validation will be done via query
    return true;
  } catch (error) {
    return false;
  }
}
