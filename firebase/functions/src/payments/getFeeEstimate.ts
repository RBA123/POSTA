import * as functions from "firebase-functions";

/**
 * getFeeEstimate — Callable Cloud Function
 *
 * Pure calculation: returns fee breakdown for a deposit or withdrawal.
 * Fee percentage is configurable (0% for MVP).
 */

const FEE_PERCENTAGE = 0; // 0% for MVP — vig is a separate task

export const getFeeEstimate = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Debes iniciar sesión",
      );
    }

    const { type, amountCents } = data;

    if (!type || !amountCents) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Faltan campos obligatorios: type, amountCents",
      );
    }

    if (type !== "deposit" && type !== "withdrawal") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Tipo inválido: debe ser 'deposit' o 'withdrawal'",
      );
    }

    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "El monto debe ser un entero positivo en centavos",
      );
    }

    const feeCents = Math.floor(amountCents * FEE_PERCENTAGE / 100);
    const netAmountCents = amountCents - feeCents;

    return {
      grossAmountCents: amountCents,
      feeCents,
      netAmountCents,
      feePercentage: FEE_PERCENTAGE,
      feeDescription: FEE_PERCENTAGE === 0
        ? "Sin comisión"
        : `${FEE_PERCENTAGE}% de comisión`,
    };
  });
