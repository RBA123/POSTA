/**
 * Cloud Functions Service
 *
 * Provides typed wrappers for calling Firebase Cloud Functions
 */

import { httpsCallable } from "firebase/functions";
import { functions, auth } from "./firebaseConfig";
import type { PlaceBetInput } from "../firebase/types/firestore.types";

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
  try {
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    console.log("🔐 Current auth user:", {
      hasUser: !!currentUser,
      uid: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      providerId: currentUser?.providerId,
    });

    if (!currentUser) {
      console.error("❌ No authenticated user found");
      throw new Error("Debes iniciar sesión para apostar");
    }

    // Force refresh the ID token to ensure it's valid
    console.log("🔄 Refreshing auth token...");
    const token = await currentUser.getIdToken(true);
    console.log("✅ Token refreshed:", {
      length: token?.length,
      firstChars: token?.substring(0, 20) + "...",
      lastChars: "..." + token?.substring(token.length - 20),
    });

    // Decode token to see claims (for debugging)
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log("🔍 Token payload (decoded):", {
          sub: payload.sub,
          email: payload.email,
          email_verified: payload.email_verified,
          iat: new Date(payload.iat * 1000).toISOString(),
          exp: new Date(payload.exp * 1000).toISOString(),
          aud: payload.aud,
        });
      }
    } catch (decodeError) {
      console.error("Could not decode token:", decodeError);
    }

    // Log the functions instance details
    console.log("🔧 Functions instance:", {
      region: "us-central1",
      customDomain: functions.customDomain,
      emulatorOrigin: functions.emulatorOrigin,
      app: functions.app?.name,
    });

    const placeBetFunction = httpsCallable<PlaceBetInput, PlaceBetResult>(
      functions,
      "placeBet",
      {
        timeout: 60000, // 60 second timeout
      }
    );

    console.log("📤 Calling placeBet function with data:", data);
    console.log(
      "📤 Function URL would be:",
      `https://us-central1-liberta-main.cloudfunctions.net/placeBet`,
    );

    const result = await placeBetFunction(data);
    console.log("✅ placeBet function returned:", result.data);

    return result.data;
  } catch (error: any) {
    console.error("❌ Place bet function error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error details:", error.details);
    console.error("Error name:", error.name);
    console.error("Error stack:", error.stack);
    console.error("Full error:", JSON.stringify(error, null, 2));

    // Re-throw with more specific error messages
    if (error.code === "functions/unauthenticated") {
      throw new Error(
        "Tu sesión ha expirado. Por favor inicia sesión de nuevo.",
      );
    }

    if (error.code === "functions/failed-precondition") {
      throw new Error(
        error.message || "No puedes apostar en este mercado en este momento.",
      );
    }

    if (error.code === "functions/resource-exhausted") {
      // Rate limit error - use the server's message
      throw new Error(error.message || "Por favor espera antes de apostar de nuevo.");
    }

    throw new Error(
      error.message ||
        "Error al realizar la apuesta. Por favor intenta de nuevo.",
    );
  }
}

export interface SettleMarketResult {
  success: boolean;
  message: string;
  settledCount: number;
  result: "si" | "no" | "cancelled";
}

export async function settleMarket(
  marketId: string,
  result: "si" | "no" | "cancelled",
): Promise<SettleMarketResult> {
  const settleMarketFunction = httpsCallable<
    { marketId: string; result: "si" | "no" | "cancelled" },
    SettleMarketResult
  >(functions, "settleMarket");

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
  marketId: string,
): Promise<RecalculateOddsResult> {
  const recalculateFunction = httpsCallable<
    { marketId: string },
    RecalculateOddsResult
  >(functions, "recalculateMarketOdds");

  const result = await recalculateFunction({ marketId });
  return result.data;
}

export interface CreateMarketInput {
  question: string;
  description?: string;
  category: "en_vivo" | "partidos" | "torneos" | "fase_grupos" | "jugadores";
  openAt?: Date | string;
  lockAt?: Date | string;
  isUrgent?: boolean;
  tags?: string[];
  imageUrl?: string;
}

export interface CreateMarketResult {
  success: boolean;
  marketId: string;
  status: "draft" | "open";
}

export async function createMarket(
  data: CreateMarketInput,
): Promise<CreateMarketResult> {
  const createMarketFunction = httpsCallable<
    CreateMarketInput,
    CreateMarketResult
  >(functions, "createMarket");

  const result = await createMarketFunction(data);
  return result.data;
}

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

export interface SendNotificationInput {
  userId: string;
  type: "market_live" | "bet_result" | "promotion" | "system";
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
  data: SendNotificationInput,
): Promise<SendNotificationResult> {
  const sendNotificationFunction = httpsCallable<
    SendNotificationInput,
    SendNotificationResult
  >(functions, "sendCustomNotification");

  const result = await sendNotificationFunction(data);
  return result.data;
}

export async function markNotificationRead(
  notificationId: string,
): Promise<{ success: boolean }> {
  const markReadFunction = httpsCallable<
    { notificationId: string },
    { success: boolean }
  >(functions, "markNotificationRead");

  const result = await markReadFunction({ notificationId });
  return result.data;
}
