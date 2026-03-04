/**
 * useTransactions Hook
 *
 * Real-time Firestore subscription to the transactions collection.
 * Supports optional type filter for deposit/withdrawal views.
 */

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebaseConfig";
import { useAuth } from "./useAuth";
import type {
  Transaction,
  TransactionType,
} from "../firebase/types/firestore.types";

interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: Error | null;
}

export function useTransactions(
  typeFilter?: TransactionType[],
): UseTransactionsReturn {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const constraints = [
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    ];

    if (typeFilter && typeFilter.length > 0) {
      constraints.push(where("type", "in", typeFilter));
    }

    const q = query(collection(db, "transactions"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const txns = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[];
        setTransactions(txns);
        setLoading(false);
      },
      (err) => {
        console.error("❌ useTransactions error:", err);
        setError(err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user?.uid, typeFilter?.join(",")]);

  return { transactions, loading, error };
}
