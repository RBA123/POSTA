import { useState, useEffect } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChange, checkAdminStatus } from "../services/auth";

interface AuthState {
  user: FirebaseUser | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        const isAdmin = await checkAdminStatus(user.uid);
        setAuthState({ user, isAdmin, loading: false });
      } else {
        setAuthState({ user: null, isAdmin: false, loading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  return authState;
}
