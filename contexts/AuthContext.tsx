/**
 * AuthContext Provider
 *
 * Provides authentication state and operations to the entire app.
 * Uses a SINGLE Firebase auth listener to prevent infinite loops.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged } from "../services/auth.service";
import {
  signUpWithEmail,
  signInWithEmail,
  signOut,
  resetPassword,
} from "../services/auth.service";
import { createUserProfile, getUserProfile } from "../services/user.service";
import { validateFriendCode, updateLastLogin } from "../lib/functions";
import type { SignUpData } from "../services/auth.service";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  profileExists: boolean;
  error: Error | null;
  signUp: (
    email: string,
    password: string,
    userData: Omit<SignUpData, "email" | "password">,
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Prevent duplicate calls and race conditions
  const isProcessingRef = useRef(false);

  // Single auth state handler - memoized for stability
  const handleAuthStateChange = useCallback(
    async (authUser: FirebaseUser | null) => {
      console.log("🔐 [AuthContext] handleAuthStateChange called:", {
        hasUser: !!authUser,
        uid: authUser?.uid,
        isProcessing: isProcessingRef.current,
      });

      // Guard clause to prevent duplicate calls
      if (isProcessingRef.current) {
        console.log("⏭️ [AuthContext] Already processing, skipping");
        return;
      }
      isProcessingRef.current = true;

      try {
        setLoading(true);
        console.log("⏳ [AuthContext] Loading started");

        if (!authUser) {
          // No user authenticated
          console.log("❌ [AuthContext] No user authenticated");
          setUser(null);
          setProfileExists(false);
          setLoading(false);
          return;
        }

        // User is authenticated - check if profile exists in Firestore
        console.log("✅ [AuthContext] User authenticated, checking profile...");
        setUser(authUser);

        let profileExists = false;
        try {
          console.log(
            "📤 [AuthContext] Fetching profile for uid:",
            authUser.uid,
          );
          const profile = await getUserProfile(authUser.uid);
          console.log("📥 [AuthContext] Profile fetch result:", {
            exists: !!profile,
            firstName: profile?.firstName,
          });
          profileExists = !!profile;
          setProfileExists(profileExists);
        } catch (err) {
          // Profile doesn't exist or error loading it
          console.error("❌ [AuthContext] Error fetching profile:", err);
          setProfileExists(false);
        }

        // Track last login for retention metrics
        if (profileExists) {
          updateLastLogin().catch((err) =>
            console.warn("Failed to update lastLoginAt:", err),
          );
        }

        setLoading(false);
        console.log("✅ [AuthContext] Auth state updated:", {
          hasUser: !!authUser,
          profileExists,
          loading: false,
        });
      } catch (err: any) {
        console.error("❌ [AuthContext] Auth state change error:", err);
        setUser(null);
        setProfileExists(false);
        setLoading(false);
      } finally {
        isProcessingRef.current = false;
        console.log("🏁 [AuthContext] Processing complete");
      }
    },
    [],
  ); // Empty deps - callback should be stable

  // SINGLE listener - created once when provider mounts
  // Note: onAuthStateChanged fires immediately with current user when subscribed
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(handleAuthStateChange);

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [handleAuthStateChange]);

  // Sign up with email and create user profile
  const handleSignUp = useCallback(
    async (
      email: string,
      password: string,
      userData: Omit<SignUpData, "email" | "password">,
    ) => {
      try {
        console.log("🔐 [AuthContext] handleSignUp started");
        setError(null);
        setLoading(true);

        // Create Firebase Auth user
        console.log("📤 [AuthContext] Creating Firebase Auth user");
        const firebaseUser = await signUpWithEmail(email, password);
        console.log("✅ [AuthContext] Firebase Auth user created");

        // Generate username from first and last name
        const username =
          `${userData.firstName.toLowerCase().trim()}${userData.lastName.toLowerCase().trim()}`.slice(
            0,
            20,
          );

        // Look up referrer by friend code if provided
        let referredBy: string | undefined;
        if (userData.friendCode) {
          console.log("🔍 [AuthContext] Looking up referral code:", userData.friendCode);
          referredBy = (await validateFriendCode(userData.friendCode)) ?? undefined;
          console.log("🔍 [AuthContext] Referral lookup result:", referredBy || "not found");
        }

        const profileData = {
          email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          dateOfBirth: userData.dateOfBirth,
          phoneNumber: userData.phoneNumber,
          phoneCode: userData.phoneCode,
          countryCode: userData.countryCode,
          username,
          notificationsEnabled: true,
          notificationPreferences: {
            liveMarkets: true,
            marketResults: true,
            promotions: true,
          },
          termsAccepted: true, // Terms are accepted before reaching signup
          referredBy,
        };

        // Create Firestore user profile
        console.log("📤 [AuthContext] Creating Firestore profile");
        await createUserProfile(firebaseUser.uid, profileData);
        console.log("✅ [AuthContext] Firestore profile created");

        // Profile was just created, so it exists
        // Update both user and profileExists together to prevent intermediate state
        setUser(firebaseUser);
        setProfileExists(true);
        console.log("✅ [AuthContext] User and profile state updated");

        setLoading(false);
        console.log("✅ [AuthContext] Signup complete, loading false");
      } catch (err: any) {
        console.error("❌ [AuthContext] Signup error:", err);
        setError(err);
        setLoading(false);
        throw err;
      }
    },
    [],
  );

  // Sign in with email
  const handleSignIn = useCallback(async (email: string, password: string) => {
    try {
      console.log("🔐 [AuthContext] handleSignIn started", {
        email,
        passwordLength: password.length,
        hasPassword: !!password,
      });
      setError(null);
      setLoading(true);

      // Sign in - this will trigger onAuthStateChanged listener
      console.log("📤 [AuthContext] Calling signInWithEmail");
      const firebaseUser = await signInWithEmail(email, password);
      console.log("✅ [AuthContext] signInWithEmail successful", {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
      });

      // Don't set loading to false here - let onAuthStateChanged handle it
      // Don't set user or profileExists - let onAuthStateChanged handle it
      // This prevents race conditions
      console.log("⏳ [AuthContext] Waiting for onAuthStateChanged to fire...");
    } catch (err: any) {
      console.error("❌ [AuthContext] Sign in error:", {
        message: err.message,
        stack: err.stack,
        error: err,
      });
      setError(err.message || "Error al iniciar sesión");
      setLoading(false);
      throw err;
    }
  }, []);

  // Sign out
  const handleSignOut = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      await signOut();
      setUser(null);
      setProfileExists(false);
      setLoading(false);
    } catch (err: any) {
      setError(err);
      setLoading(false);
      throw err;
    }
  }, []);

  // Reset password
  const handleResetPassword = useCallback(async (email: string) => {
    try {
      setError(null);
      setLoading(true);
      await resetPassword(email);
      setLoading(false);
    } catch (err: any) {
      setError(err);
      setLoading(false);
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      user,
      loading,
      profileExists,
      error,
      signUp: handleSignUp,
      signIn: handleSignIn,
      signOut: handleSignOut,
      resetPassword: handleResetPassword,
      clearError,
    }),
    [
      user,
      loading,
      profileExists,
      error,
      handleSignUp,
      handleSignIn,
      handleSignOut,
      handleResetPassword,
      clearError,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Hook to consume auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
