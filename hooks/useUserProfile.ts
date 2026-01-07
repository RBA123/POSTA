/**
 * useUserProfile Hook
 * 
 * Manages user profile data with real-time updates
 */

import { useState, useEffect, useCallback } from "react";
import { subscribeToUser } from "../lib/firestore";
import { getUserProfile, updateUserProfile, getUserStats } from "../services/user.service";
import type { User, UpdateUserInput } from "../firebase/types/firestore.types";
import type { UserStats } from "../services/user.service";

interface UseUserProfileReturn {
  profile: User | null;
  stats: UserStats | null;
  loading: boolean;
  error: Error | null;
  updateProfile: (updates: Partial<UpdateUserInput>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useUserProfile(userId: string | null): UseUserProfileReturn {
  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to user profile changes
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToUser(userId, (user) => {
      setProfile(user);
      
      // Calculate stats from profile
      if (user) {
        setStats({
          virtualBalance: user.virtualBalance,
          totalPositions: user.totalPositions,
          activePositions: user.activePositions,
          winRate: user.winRate,
          totalWinnings: user.totalWinnings,
          totalLosses: user.totalLosses,
          overallTotal: user.totalWinnings - user.totalLosses,
        });
      } else {
        setStats(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  // Update profile
  const handleUpdateProfile = useCallback(
    async (updates: Partial<UpdateUserInput>) => {
      if (!userId) {
        throw new Error("Usuario no autenticado");
      }

      try {
        setError(null);
        await updateUserProfile(userId, updates);
        // Profile will update automatically via subscription
      } catch (err: any) {
        setError(err);
        throw err;
      }
    },
    [userId]
  );

  // Refresh profile manually
  const handleRefreshProfile = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const user = await getUserProfile(userId);
      setProfile(user);
      
      if (user) {
        const userStats = await getUserStats(userId);
        setStats(userStats);
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [userId]);

  return {
    profile,
    stats,
    loading,
    error,
    updateProfile: handleUpdateProfile,
    refreshProfile: handleRefreshProfile,
  };
}

