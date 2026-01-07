/**
 * useAuth Hook
 * 
 * Manages authentication state and provides auth operations
 */

import { useState, useEffect, useCallback } from "react";
import { User as FirebaseUser } from "firebase/auth";
import {
  signUpWithEmail,
  signInWithEmail,
  signOut,
  getCurrentUser,
  onAuthStateChanged,
  resetPassword,
} from "../services/auth.service";
import { createUserProfile } from "../services/user.service";
import type { SignUpData } from "../services/auth.service";
import { Timestamp } from "firebase/firestore";

interface UseAuthReturn {
  user: FirebaseUser | null;
  loading: boolean;
  error: Error | null;
  signUp: (email: string, password: string, userData: Omit<SignUpData, "email" | "password">) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize auth state
  useEffect(() => {
    setLoading(true);
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign up with email and create user profile
  const handleSignUp = useCallback(
    async (
      email: string,
      password: string,
      userData: Omit<SignUpData, "email" | "password">
    ) => {
      try {
        setError(null);
        setLoading(true);

        // Create Firebase Auth user
        const firebaseUser = await signUpWithEmail(email, password);

      // Generate username from first and last name
      const username = `${userData.firstName.toLowerCase().trim()}${userData.lastName.toLowerCase().trim()}`.slice(0, 20);

      // Create Firestore user profile
      await createUserProfile(firebaseUser.uid, {
        email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        dateOfBirth: userData.dateOfBirth,
        phoneNumber: userData.phoneNumber,
        phoneCode: userData.phoneCode,
        countryCode: userData.countryCode,
        friendCode: userData.friendCode,
        username,
        notificationsEnabled: true,
        notificationPreferences: {
          liveMarkets: true,
          marketResults: true,
          promotions: true,
        },
        referredBy: userData.friendCode ? undefined : undefined, // TODO: Lookup referrer by friendCode
      });

        setLoading(false);
      } catch (err: any) {
        setError(err);
        setLoading(false);
        throw err;
      }
    },
    []
  );

  // Sign in with email
  const handleSignIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await signInWithEmail(email, password);
      setLoading(false);
    } catch (err: any) {
      setError(err);
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

  return {
    user,
    loading,
    error,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    clearError,
  };
}

