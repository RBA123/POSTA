import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Market, MarketCategory, MarketStatus } from "../types";

interface UseMarketsOptions {
  category?: MarketCategory | "all";
  status?: MarketStatus | "all";
  searchQuery?: string;
}

export function useMarkets(options: UseMarketsOptions = {}) {
  const { category = "all", status = "all", searchQuery = "" } = options;
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    let q = query(collection(db, "markets"), orderBy("createdAt", "desc"));

    if (category !== "all") {
      q = query(q, where("category", "==", category));
    }

    if (status !== "all") {
      q = query(q, where("status", "==", status));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let marketData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Market[];

        // Client-side search filter
        if (searchQuery) {
          const queryLower = searchQuery.toLowerCase();
          marketData = marketData.filter((market) =>
            market.question.toLowerCase().includes(queryLower)
          );
        }

        setMarkets(marketData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching markets:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [category, status, searchQuery]);

  return { markets, loading };
}

export function useMarket(marketId: string) {
  return useQuery({
    queryKey: ["market", marketId],
    queryFn: async () => {
      const { doc, getDoc } = await import("firebase/firestore");
      const marketDoc = await getDoc(doc(db, "markets", marketId));
      if (!marketDoc.exists()) {
        throw new Error("Market not found");
      }
      return { id: marketDoc.id, ...marketDoc.data() } as Market;
    },
    enabled: !!marketId,
  });
}
