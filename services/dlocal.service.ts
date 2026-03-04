/**
 * dLocal Payment Service
 *
 * Typed httpsCallable wrappers for dLocal Cloud Functions.
 * Follows the same pattern as lib/functions.ts.
 */

import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebaseConfig";
import type {
  KycSubmitInput,
  KycSubmitResult,
  DepositInput,
  DepositResult,
  WithdrawalInput,
  WithdrawalResult,
  FeeEstimateInput,
  FeeEstimate,
} from "../types/dlocal";

export async function submitKyc(data: KycSubmitInput): Promise<KycSubmitResult> {
  const fn = httpsCallable<KycSubmitInput, KycSubmitResult>(
    functions,
    "submitKyc",
  );
  const result = await fn(data);
  return result.data;
}

export async function createDeposit(data: DepositInput): Promise<DepositResult> {
  console.log("💳 [dlocal] createDeposit called:", {
    amountCents: data.amountCents,
    cardLast4: data.cardNumber.slice(-4),
    expiry: data.cardExpiry,
    holder: data.cardHolderName,
  });
  try {
    const fn = httpsCallable<DepositInput, DepositResult>(
      functions,
      "createDeposit",
      { timeout: 60000 },
    );
    const result = await fn(data);
    console.log("✅ [dlocal] createDeposit result:", result.data);
    return result.data;
  } catch (error: any) {
    console.error("❌ [dlocal] createDeposit error:", {
      code: error.code,
      message: error.message,
      details: error.details,
    });
    throw error;
  }
}

export async function createWithdrawal(
  data: WithdrawalInput,
): Promise<WithdrawalResult> {
  const fn = httpsCallable<WithdrawalInput, WithdrawalResult>(
    functions,
    "createWithdrawal",
    { timeout: 60000 },
  );
  const result = await fn(data);
  return result.data;
}

export async function getFeeEstimate(
  type: "deposit" | "withdrawal",
  amountCents: number,
): Promise<FeeEstimate> {
  const fn = httpsCallable<FeeEstimateInput, FeeEstimate>(
    functions,
    "getFeeEstimate",
  );
  const result = await fn({ type, amountCents });
  return result.data;
}
