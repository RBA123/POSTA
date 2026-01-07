/**
 * Bet Service
 * 
 * Betting operations and Cloud Functions calls
 */

import { placeBet as placeBetFunction, PlaceBetResult } from "../lib/functions";
import {
  getUserBets,
  subscribeToUserBets,
  getMarket,
} from "../lib/firestore";
import type { UserBet, BetStatus, PlaceBetInput } from "../firebase/types/firestore.types";

// ============================================================================
// BET OPERATIONS
// ============================================================================

/**
 * Place a bet on a market
 * Calls Cloud Function which handles all validation and updates
 */
export async function placeBet(
  marketId: string,
  side: "si" | "no",
  amount: number
): Promise<PlaceBetResult> {
  try {
    // Validate inputs
    if (!marketId || !side || !amount) {
      throw new Error("Faltan datos requeridos para realizar la apuesta");
    }

    if (amount <= 0) {
      throw new Error("El monto debe ser mayor a cero");
    }

    if (side !== "si" && side !== "no") {
      throw new Error("El lado debe ser 'si' o 'no'");
    }

    // Verify market exists and is open
    const market = await getMarket(marketId);
    if (!market) {
      throw new Error("Mercado no encontrado");
    }

    if (market.status !== "open") {
      throw new Error("Este mercado no está abierto para apostar");
    }

    // Check if market is locked (for EN VIVO markets)
    if (market.lockAt && market.lockAt.toMillis() < Date.now()) {
      throw new Error("El tiempo para apostar en este mercado ha expirado");
    }

    // Call Cloud Function to place bet
    const result = await placeBetFunction({
      marketId,
      side,
      amount,
    });

    return result;
  } catch (error: any) {
    throw new Error(
      error.message ||
        "Error al realizar la apuesta. Por favor intenta de nuevo."
    );
  }
}

/**
 * Get user's bets
 * Optionally filter by status
 */
export async function getUserBetsList(
  userId: string,
  status?: BetStatus
): Promise<UserBet[]> {
  try {
    return await getUserBets(userId, status);
  } catch (error: any) {
    throw new Error("Error al obtener las apuestas del usuario.");
  }
}

/**
 * Subscribe to user's bets with real-time updates
 * Returns unsubscribe function
 */
export function subscribeToUserBetsList(
  userId: string,
  status: BetStatus | undefined,
  callback: (bets: UserBet[]) => void
) {
  try {
    return subscribeToUserBets(userId, status, callback);
  } catch (error: any) {
    throw new Error("Error al suscribirse a las apuestas del usuario.");
  }
}

/**
 * Get a single bet by ID
 * Note: This requires querying userBets collection
 */
export async function getBetById(betId: string): Promise<UserBet | null> {
  try {
    // Since bets are in userBets collection, we need userId
    // For now, we'll need to query - this is a limitation
    // In practice, you'd typically have the userId from context
    throw new Error(
      "getBetById requires userId. Use getUserBets and filter instead."
    );
  } catch (error: any) {
    throw new Error("Error al obtener la apuesta.");
  }
}

/**
 * Get user's pending bets count
 */
export async function getPendingBetsCount(userId: string): Promise<number> {
  try {
    const bets = await getUserBets(userId, "pending");
    return bets.length;
  } catch (error: any) {
    return 0;
  }
}

/**
 * Get user's total potential winnings from pending bets
 */
export async function getTotalPotentialWinnings(
  userId: string
): Promise<number> {
  try {
    const bets = await getUserBets(userId, "pending");
    return bets.reduce((total, bet) => total + bet.potentialWin, 0);
  } catch (error: any) {
    return 0;
  }
}

