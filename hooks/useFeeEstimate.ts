/**
 * useFeeEstimate Hook
 *
 * Debounced fee estimation for deposit/withdrawal screens.
 */

import { useState, useEffect, useRef } from "react";
import { getFeeEstimate } from "../services/dlocal.service";
import type { FeeEstimate } from "../types/dlocal";

interface UseFeeEstimateReturn {
  estimate: FeeEstimate | null;
  loading: boolean;
}

export function useFeeEstimate(
  type: "deposit" | "withdrawal",
  amountCents: number,
): UseFeeEstimateReturn {
  const [estimate, setEstimate] = useState<FeeEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!amountCents || amountCents <= 0) {
      setEstimate(null);
      return;
    }

    setLoading(true);

    // Debounce 400ms
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        const result = await getFeeEstimate(type, amountCents);
        setEstimate(result);
      } catch {
        setEstimate(null);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [type, amountCents]);

  return { estimate, loading };
}
