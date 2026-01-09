/**
 * useAuth Hook
 * 
 * Consumes authentication context from AuthProvider.
 * All auth state and operations are managed by the AuthProvider.
 */

import { useAuth as useAuthContext } from "../contexts/AuthContext";

/**
 * Hook to access authentication state and operations.
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  return useAuthContext();
}

