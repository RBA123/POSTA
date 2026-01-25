/**
 * Firestore Service Helpers
 * 
 * Provides typed helper functions for querying Firestore collections
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  Unsubscribe,
  QueryConstraint,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import type {
  User,
  Market,
  UserBet,
  Transaction,
  UserNotification,
  MarketCategory,
  MarketStatus,
  BetStatus,
} from '../firebase/types/firestore.types';

// ============================================================================
// USER QUERIES
// ============================================================================

export async function getUser(userId: string): Promise<User | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return null;
  }
  
  return userSnap.data() as User;
}

export function subscribeToUser(
  userId: string,
  callback: (user: User | null) => void
): Unsubscribe {
  const userRef = doc(db, 'users', userId);
  
  return onSnapshot(userRef, (snap) => {
    callback(snap.exists() ? (snap.data() as User) : null);
  });
}

// ============================================================================
// MARKET QUERIES
// ============================================================================

export async function getMarkets(
  category?: MarketCategory,
  status: MarketStatus = 'open',
  limitCount: number = 50
): Promise<Market[]> {
  const marketsRef = collection(db, 'markets');
  const constraints: QueryConstraint[] = [
    where('status', '==', status),
    orderBy('openAt', 'desc'),
    limit(limitCount),
  ];

  if (category) {
    constraints.unshift(where('category', '==', category));
  }

  const q = query(marketsRef, ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => doc.data() as Market);
}

export async function getMarket(marketId: string): Promise<Market | null> {
  const marketRef = doc(db, 'markets', marketId);
  const marketSnap = await getDoc(marketRef);
  
  if (!marketSnap.exists()) {
    return null;
  }
  
  return marketSnap.data() as Market;
}

export function subscribeToMarkets(
  category: MarketCategory | undefined,
  callback: (markets: Market[]) => void
): Unsubscribe {
  const marketsRef = collection(db, 'markets');
  const constraints: QueryConstraint[] = [
    where('status', '==', 'open'),
    orderBy('openAt', 'desc'),
  ];

  if (category) {
    constraints.unshift(where('category', '==', category));
  }

  const q = query(marketsRef, ...constraints);
  
  return onSnapshot(q, 
    (snapshot) => {
      const markets = snapshot.docs.map((doc) => {
        const data = doc.data() as Market;
        // Ensure the document has an id
        if (!data.id) {
          data.id = doc.id;
        }
        return data;
      });
      console.log(`📊 Markets updated: ${markets.length} markets in category "${category || 'all'}"`);
      callback(markets);
    },
    (error) => {
      console.error('Error in subscribeToMarkets:', error);
      // Call callback with empty array on error
      callback([]);
    }
  );
}

export function subscribeToMarket(
  marketId: string,
  callback: (market: Market | null) => void
): Unsubscribe {
  const marketRef = doc(db, 'markets', marketId);
  
  return onSnapshot(marketRef, (snap) => {
    callback(snap.exists() ? (snap.data() as Market) : null);
  });
}

// ============================================================================
// USER BET QUERIES
// ============================================================================

export async function getUserBets(
  userId: string,
  status?: BetStatus,
  limitCount: number = 50
): Promise<UserBet[]> {
  const betsRef = collection(db, 'userBets');
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    orderBy('placedAt', 'desc'),
    limit(limitCount),
  ];

  if (status) {
    constraints.splice(1, 0, where('status', '==', status));
  }

  const q = query(betsRef, ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => doc.data() as UserBet);
}

export function subscribeToUserBets(
  userId: string,
  status: BetStatus | undefined,
  callback: (bets: UserBet[]) => void
): Unsubscribe {
  const betsRef = collection(db, 'userBets');
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    orderBy('placedAt', 'desc'),
  ];

  if (status) {
    constraints.splice(1, 0, where('status', '==', status));
  }

  const q = query(betsRef, ...constraints);
  
  return onSnapshot(q, (snapshot) => {
    const bets = snapshot.docs.map((doc) => {
      const data = doc.data() as UserBet;
      // Ensure the document has an id
      if (!data.id) {
        data.id = doc.id;
      }
      return data;
    });
    console.log(`💰 User bets updated: ${bets.length} bets`, bets.map(b => ({ id: b.id, marketId: b.marketId })));
    callback(bets);
  });
}

// ============================================================================
// TRANSACTION QUERIES
// ============================================================================

export async function getTransactions(
  userId: string,
  limitCount: number = 50
): Promise<Transaction[]> {
  const transactionsRef = collection(db, 'transactions');
  const q = query(
    transactionsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Transaction);
}

// ============================================================================
// NOTIFICATION QUERIES
// ============================================================================

export async function getUserNotifications(
  userId: string,
  limitCount: number = 50
): Promise<UserNotification[]> {
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const q = query(
    notificationsRef,
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as UserNotification);
}

export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: UserNotification[]) => void
): Unsubscribe {
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const q = query(notificationsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => doc.data() as UserNotification);
    callback(notifications);
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format Firestore Timestamp to relative time string
 */
export function formatRelativeTime(timestamp: Timestamp): string {
  const now = Date.now();
  const time = timestamp.toMillis();
  const diff = now - time;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return 'Ahora';
  } else if (minutes < 60) {
    return `Hace ${minutes} min`;
  } else if (hours < 24) {
    return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  } else if (days === 1) {
    return 'Ayer';
  } else if (days < 7) {
    return `Hace ${days} días`;
  } else {
    return timestamp.toDate().toLocaleDateString('es-AR');
  }
}

/**
 * Format volume number to display string
 */
export function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(0)}K`;
  }
  return `$${volume.toFixed(0)}`;
}

