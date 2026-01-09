/**
 * useBets Hook
 * 
 * Manages user's bet history with real-time updates
 */

import { useState, useEffect, useCallback } from "react";
import {
  placeBet as placeBetService,
  getUserBetsList,
  subscribeToUserBetsList,
} from "../services/bet.service";
import type { UserBet, BetStatus } from "../firebase/types/firestore.types";
import type { PlaceBetResult } from "../lib/functions";

interface UseBetsReturn {
  bets: UserBet[];
  loading: boolean;
  error: Error | null;
  placeBet: (marketId: string, side: "si" | "no", amount: number) => Promise<PlaceBetResult>;
  refetch: () => Promise<void>;
}

export function useBets(
  userId: string | null,
  status?: BetStatus,
  realTime: boolean = true
): UseBetsReturn {
  const [bets, setBets] = useState<UserBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch bets
  const fetchBets = useCallback(async () => {
    if (!userId) {
      setBets([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const fetchedBets = await getUserBetsList(userId, status);
      setBets(fetchedBets);
      setLoading(false);
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [userId, status]);

  // Subscribe to real-time updates or fetch once
  useEffect(() => {
    if (!userId) {
      setBets([]);
      setLoading(false);
      return;
    }

    if (realTime) {
      setLoading(true);
      setError(null);

      // Subscribe to real-time updates
      const unsubscribe = subscribeToUserBetsList(
        userId,
        status,
        (updatedBets) => {
          setBets(updatedBets);
          setLoading(false);
        }
      );

      return unsubscribe;
    } else {
      // Fetch once
      fetchBets();
    }
  }, [userId, status, realTime, fetchBets]);

  // Place a bet
  const handlePlaceBet = useCallback(
    async (
      marketId: string,
      side: "si" | "no",
      amount: number
    ): Promise<PlaceBetResult> => {
      try {
        setError(null);
        const result = await placeBetService(marketId, side, amount);
        // Bets will update automatically via subscription
        return result;
      } catch (err: any) {
        setError(err);
        throw err;
      }
    },
    []
  );

  return {
    bets,
    loading,
    error,
    placeBet: handlePlaceBet,
    refetch: fetchBets,
  };
}

