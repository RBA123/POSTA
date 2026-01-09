/**
 * Cloud Functions Service
 * 
 * Provides typed wrappers for calling Firebase Cloud Functions
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebaseConfig';
import type { PlaceBetInput } from '../firebase/types/firestore.types';

// ============================================================================
// BET FUNCTIONS
// ============================================================================

export interface PlaceBetResult {
  success: boolean;
  betId: string;
  newBalance: number;
  potentialWin: number;
}

export async function placeBet(data: PlaceBetInput): Promise<PlaceBetResult> {
  const placeBetFunction = httpsCallable<PlaceBetInput, PlaceBetResult>(
    functions,
    'placeBet'
  );
  
  const result = await placeBetFunction(data);
  return result.data;
}

export interface SettleMarketResult {
  success: boolean;
  message: string;
  settledCount: number;
  result: 'si' | 'no' | 'cancelled';
}

export async function settleMarket(
  marketId: string,
  result: 'si' | 'no' | 'cancelled'
): Promise<SettleMarketResult> {
  const settleMarketFunction = httpsCallable<
    { marketId: string; result: 'si' | 'no' | 'cancelled' },
    SettleMarketResult
  >(functions, 'settleMarket');
  
  const functionResult = await settleMarketFunction({ marketId, result });
  return functionResult.data;
}

// ============================================================================
// MARKET FUNCTIONS
// ============================================================================

export interface RecalculateOddsResult {
  success: boolean;
  siProbability: number;
  noProbability: number;
  siVolume: number;
  noVolume: number;
  totalVolume: number;
}

export async function recalculateMarketOdds(
  marketId: string
): Promise<RecalculateOddsResult> {
  const recalculateFunction = httpsCallable<
    { marketId: string },
    RecalculateOddsResult
  >(functions, 'recalculateMarketOdds');
  
  const result = await recalculateFunction({ marketId });
  return result.data;
}

export interface CreateMarketInput {
  question: string;
  description?: string;
  category: 'en_vivo' | 'partidos' | 'torneos' | 'fase_grupos' | 'jugadores';
  openAt?: Date | string;
  lockAt?: Date | string;
  isUrgent?: boolean;
  tags?: string[];
  imageUrl?: string;
}

export interface CreateMarketResult {
  success: boolean;
  marketId: string;
  status: 'draft' | 'open';
}

export async function createMarket(
  data: CreateMarketInput
): Promise<CreateMarketResult> {
  const createMarketFunction = httpsCallable<
    CreateMarketInput,
    CreateMarketResult
  >(functions, 'createMarket');
  
  const result = await createMarketFunction(data);
  return result.data;
}

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

export interface SendNotificationInput {
  userId: string;
  type: 'market_live' | 'bet_result' | 'promotion' | 'system';
  title: string;
  message: string;
  marketId?: string;
  betId?: string;
}

export interface SendNotificationResult {
  success: boolean;
  notificationId: string;
}

export async function sendCustomNotification(
  data: SendNotificationInput
): Promise<SendNotificationResult> {
  const sendNotificationFunction = httpsCallable<
    SendNotificationInput,
    SendNotificationResult
  >(functions, 'sendCustomNotification');
  
  const result = await sendNotificationFunction(data);
  return result.data;
}

export async function markNotificationRead(
  notificationId: string
): Promise<{ success: boolean }> {
  const markReadFunction = httpsCallable<
    { notificationId: string },
    { success: boolean }
  >(functions, 'markNotificationRead');
  
  const result = await markReadFunction({ notificationId });
  return result.data;
}

