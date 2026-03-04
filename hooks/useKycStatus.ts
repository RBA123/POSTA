/**
 * useKycStatus Hook
 *
 * Derives KYC status from user profile.
 */

import { useUserProfile } from "./useUserProfile";
import { useAuth } from "./useAuth";

interface UseKycStatusReturn {
  kycStatus: "not_started" | "pending" | "verified" | "rejected";
  isVerified: boolean;
  loading: boolean;
}

export function useKycStatus(): UseKycStatusReturn {
  const { user } = useAuth();
  const { profile, loading } = useUserProfile(user?.uid || null);

  const kycStatus = profile?.kycStatus || "not_started";

  return {
    kycStatus,
    isVerified: kycStatus === "verified",
    loading,
  };
}
