import { Timestamp } from "firebase/firestore";

/**
 * Firestore TypeScript Interfaces for Liberta Betting Platform
 *
 * These interfaces define the structure of all documents in Firestore.
 * Use these types when reading/writing to Firestore for type safety.
 */

// ============================================================================
// USER COLLECTION
// ============================================================================

export interface User {
  uid: string; // Document ID (Firebase Auth UID)
  email: string;
  phoneNumber: string | null; // From signup (e.g., "+5491234567") - null if not provided
  phoneCode: string | null; // Country code (e.g., "+54") - null if not provided

  // Profile
  firstName: string;
  lastName: string;
  username: string; // Unique, lowercase
  dateOfBirth: Timestamp; // For age verification
  countryCode: string; // ISO 2-letter (e.g., "AR")
  friendCode: string; // Unique referral code (e.g., "DIEGO323")

  // Balance & Stats (denormalized for quick access)
  virtualBalance: number; // Current virtual balance
  totalPositions: number; // All-time bets count
  activePositions: number; // Current pending bets
  winRate: number; // Percentage (0-100)
  totalWinnings: number;
  totalLosses: number;

  // Settings
  notificationsEnabled: boolean;
  notificationPreferences: {
    liveMarkets: boolean;
    marketResults: boolean;
    promotions: boolean;
  };
  expoPushToken?: string; // Expo push notification token

  // Terms & Conditions
  termsAccepted: boolean;
  termsAcceptedAt?: Timestamp;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  referredBy: string | null; // UID of referrer - null if not referred
  isAdmin: boolean; // Admin role flag
}

// ============================================================================
// USER SUBCOLLECTIONS
// ============================================================================

export interface UserNotification {
  id: string; // Auto-generated
  type: "market_live" | "bet_result" | "promotion" | "system";
  title: string;
  message: string;
  read: boolean;

  // Optional context
  marketId?: string; // Reference to market
  betId?: string; // Reference to bet

  createdAt: Timestamp;
  readAt?: Timestamp;
}

export interface PaymentMethod {
  id: string; // Auto-generated
  type: "card" | "apple_pay" | "google_pay" | "mercadopago";

  // Card details (tokenized/encrypted)
  last4?: string;
  brand?: string; // 'visa', 'mastercard', etc.
  expiryMonth?: number;
  expiryYear?: number;

  // External provider
  providerId?: string; // Stripe/MercadoPago token

  isDefault: boolean;
  isConnected: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserSettings {
  id: "preferences"; // Fixed document ID
  theme: "light" | "dark" | "auto";
  language: "es" | "en" | "pt";
  currency: string;
  updatedAt: Timestamp;
}

// ============================================================================
// MARKET COLLECTION
// ============================================================================

export type MarketCategory =
  | "en_vivo"
  | "partidos"
  | "torneos"
  | "fase_grupos"
  | "jugadores";
export type MarketStatus =
  | "draft"
  | "open"
  | "locked"
  | "settled"
  | "cancelled";
export type MarketResult = "si" | "no" | "cancelled";

export interface Market {
  id: string; // Auto-generated

  // Market Details
  question: string;
  description?: string;
  category: MarketCategory;

  // Probabilities (updated dynamically)
  siProbability: number; // 0-100
  noProbability: number; // 0-100

  // Volume & Stats
  totalVolume: number; // Total USD bet
  totalBets: number; // Number of bets placed
  uniqueBettors: number; // Count of unique users
  siVolume: number; // Volume on "Sí" side
  noVolume: number; // Volume on "No" side

  // Status & Timing
  status: MarketStatus;
  isUrgent: boolean; // For EN VIVO markets

  openAt: Timestamp; // When market opens
  lockAt?: Timestamp; // When betting closes (for EN VIVO)
  settledAt?: Timestamp;

  // Resolution
  result?: MarketResult;
  resultVerifiedBy?: string; // Admin UID who settled

  // Metadata
  createdBy: string; // Admin UID
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Search & Display
  tags?: string[]; // For filtering
  imageUrl?: string; // Optional market image
}

// ============================================================================
// MARKET SUBCOLLECTIONS
// ============================================================================

export interface MarketBet {
  id: string; // Auto-generated
  userId: string; // Reference
  username: string; // Denormalized for leaderboards

  side: "si" | "no";
  amount: number;

  // Odds at time of bet
  probability: number; // Snapshot of si/noProbability
  potentialWin: number; // Calculated payout

  placedAt: Timestamp;
}

// ============================================================================
// USER BETS COLLECTION
// ============================================================================

export type BetStatus = "pending" | "won" | "lost" | "refunded";

export interface UserBet {
  id: string; // Auto-generated
  userId: string; // For querying
  marketId: string; // Reference

  // Denormalized Market Info (for display without extra reads)
  marketQuestion: string;
  marketCategory: string;

  // Bet Details
  side: "si" | "no";
  amount: number;
  probability: number;
  potentialWin: number;

  // Status
  status: BetStatus;

  // Resolution
  actualWin?: number; // Filled when settled
  settledAt?: Timestamp;

  // Metadata
  placedAt: Timestamp;
  createdAt: Timestamp;
}

// ============================================================================
// TRANSACTIONS COLLECTION
// ============================================================================

export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "bet_placed"
  | "bet_won"
  | "bet_refund"
  | "referral_bonus";

export type TransactionStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled";

export interface Transaction {
  id: string; // Auto-generated
  userId: string;

  type: TransactionType;

  amount: number; // Positive or negative
  balanceBefore: number;
  balanceAfter: number;

  // Context
  description: string;
  betId?: string; // Reference if bet-related
  marketId?: string;

  // Payment Provider (future)
  paymentMethodId?: string;
  providerId?: string;
  providerStatus?: string;

  status: TransactionStatus;

  createdAt: Timestamp;
  completedAt?: Timestamp;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Type for creating a new user (omits auto-generated fields)
 */
export type CreateUserInput = Omit<
  User,
  | "createdAt"
  | "updatedAt"
  | "virtualBalance"
  | "totalPositions"
  | "activePositions"
  | "winRate"
  | "totalWinnings"
  | "totalLosses"
> & {
  uid: string; // Required, provided by Firebase Auth
  virtualBalance: number; // Required for creation
  totalPositions: number; // Required for creation
  activePositions: number; // Required for creation
  winRate: number; // Required for creation
  totalWinnings: number; // Required for creation
  totalLosses: number; // Required for creation
  createdAt: Timestamp; // Required for creation
  updatedAt: Timestamp; // Required for creation
};

/**
 * Type for updating a user (all fields optional except uid)
 */
export type UpdateUserInput = Partial<Omit<User, "uid" | "createdAt">> & {
  updatedAt: Timestamp;
};

/**
 * Type for creating a new market (omits auto-generated fields)
 */
export type CreateMarketInput = Omit<
  Market,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "totalVolume"
  | "totalBets"
  | "uniqueBettors"
  | "siVolume"
  | "noVolume"
> & {
  createdBy: string;
};

/**
 * Type for updating market odds
 */
export type UpdateMarketOddsInput = {
  siProbability: number;
  noProbability: number;
  siVolume: number;
  noVolume: number;
  totalVolume: number;
  updatedAt: Timestamp;
};

/**
 * Type for placing a bet
 */
export type PlaceBetInput = {
  marketId: string;
  side: "si" | "no";
  amount: number;
};
