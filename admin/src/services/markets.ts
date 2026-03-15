import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase";

export interface CountryBet {
  code: string;
  name: string;
  flag: string;
  siProbability: number;
  noProbability: number;
}

export interface CreateMarketData {
  question: string;
  description?: string;
  category: "en_vivo" | "partidos" | "torneos" | "fase_grupos" | "jugadores";
  openAt?: string; // ISO string
  lockAt?: string; // ISO string
  isUrgent?: boolean;
  tags?: string[];
  imageUrl?: string;
  countryBets?: CountryBet[];
  marketMakerVolume?: number; // Integer cents — phantom 50/50 liquidity
}

export interface SettleMarketData {
  marketId: string;
  result: "si" | "no" | "cancelled";
}

export interface DeleteMarketData {
  marketId: string;
}

const createMarketFunction = httpsCallable(functions, "createMarket");
const settleMarketFunction = httpsCallable(functions, "settleMarket");
const deleteMarketFunction = httpsCallable(functions, "deleteMarket");

export async function createMarket(data: CreateMarketData) {
  try {
    const result = await createMarketFunction(data);
    return result.data as {
      success: boolean;
      marketId: string;
      status: string;
    };
  } catch (error: any) {
    throw new Error(
      error.message || "Error creating market. Please try again.",
    );
  }
}

export async function settleMarket(data: SettleMarketData) {
  try {
    const result = await settleMarketFunction(data);
    return result.data as {
      success: boolean;
      message: string;
      settledCount: number;
      result: string;
    };
  } catch (error: any) {
    throw new Error(
      error.message || "Error settling market. Please try again.",
    );
  }
}

export async function deleteMarket(data: DeleteMarketData) {
  try {
    const result = await deleteMarketFunction(data);
    return result.data as {
      success: boolean;
      message: string;
    };
  } catch (error: any) {
    throw new Error(
      error.message || "Error deleting market. Please try again.",
    );
  }
}
