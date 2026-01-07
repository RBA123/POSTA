/**
 * useMarkets Hook
 * 
 * Fetches and subscribes to markets by category
 */

import { useState, useEffect, useCallback } from "react";
import {
  getMarkets,
  subscribeToMarkets,
} from "../lib/firestore";
import type { Market, MarketCategory } from "../firebase/types/firestore.types";

interface UseMarketsReturn {
  markets: Market[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useMarkets(
  category?: MarketCategory,
  realTime: boolean = true
): UseMarketsReturn {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch markets
  const fetchMarkets = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const fetchedMarkets = await getMarkets(category, "open", 50);
      setMarkets(fetchedMarkets);
      setLoading(false);
    } catch (err: any) {
      setError(err);
      setLoading(false);
      throw err;
    }
  }, [category]);

  // Subscribe to real-time updates or fetch once
  useEffect(() => {
    if (realTime) {
      setLoading(true);
      setError(null);

      // Subscribe to real-time updates
      const unsubscribe = subscribeToMarkets(category, (updatedMarkets) => {
        setMarkets(updatedMarkets);
        setLoading(false);
      });

      return unsubscribe;
    } else {
      // Fetch once
      fetchMarkets();
    }
  }, [category, realTime, fetchMarkets]);

  return {
    markets,
    loading,
    error,
    refetch: fetchMarkets,
  };
}

