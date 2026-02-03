/**
 * Types for In-App Purchase (IAP) functionality using RevenueCat
 */

import {
  PurchasesPackage,
  PurchasesOffering,
  CustomerInfo,
} from "react-native-purchases";

/**
 * Credit pack product identifiers (must match App Store Connect & Google Play Console)
 */
export enum CreditPackageId {
  CREDITS_100 = "credits_100", // $4.99 - 100 credits
  CREDITS_500 = "credits_500", // $19.99 - 500 credits (25% bonus)
  CREDITS_1000 = "credits_1000", // $34.99 - 1000 credits (40% bonus)
  CREDITS_2500 = "credits_2500", // $79.99 - 2500 credits (50% bonus)
}

/**
 * Credit amount for each package
 */
export const CREDIT_AMOUNTS: Record<CreditPackageId, number> = {
  [CreditPackageId.CREDITS_100]: 100,
  [CreditPackageId.CREDITS_500]: 500,
  [CreditPackageId.CREDITS_1000]: 1000,
  [CreditPackageId.CREDITS_2500]: 2500,
};

/**
 * Purchase state for UI
 */
export interface PurchaseState {
  isLoading: boolean;
  error: string | null;
  isPurchasing: boolean;
  isRestoring: boolean;
}

/**
 * Credit pack display information
 */
export interface CreditPackDisplay {
  id: CreditPackageId;
  credits: number;
  price: string;
  bonusPercentage?: number;
  popularTag?: boolean;
  rcPackage?: PurchasesPackage;
}

/**
 * Purchase service response
 */
export interface PurchaseResult {
  success: boolean;
  creditsAdded?: number;
  customerInfo?: CustomerInfo;
  error?: string;
}

/**
 * Offerings response from RevenueCat
 */
export interface OfferingsResult {
  currentOffering: PurchasesOffering | null;
  allOfferings: Record<string, PurchasesOffering>;
}
