import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { dLocalPost } from "./dLocalClient";

/**
 * createWithdrawal — Callable Cloud Function
 *
 * Creates a bank transfer withdrawal via dLocal Payouts API.
 * Debits realBalance atomically before calling dLocal.
 * If dLocal call fails, refunds the balance immediately.
 */

const MIN_WITHDRAWAL_CENTS = 500; // $5.00
const FEE_PERCENTAGE = 0; // 0% for MVP

interface DLocalPayoutResponse {
  id: string;
  status: number; // 100=pending, 200=paid, etc.
  status_detail: string;
  amount: number;
  currency: string;
}

export const createWithdrawal = functions
  .runWith({
    secrets: [
      "DLOCAL_X_LOGIN",
      "DLOCAL_X_TRANS_KEY",
      "DLOCAL_SECRET_KEY",
    ],
  })
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Debes iniciar sesión",
      );
    }

    const userId = context.auth.uid;
    const {
      amountCents,
      bankCode,
      bankAccountNumber,
      bankAccountType,
      beneficiaryName,
    } = data;

    // Validate required fields
    if (
      !amountCents ||
      !bankCode ||
      !bankAccountNumber ||
      !bankAccountType ||
      !beneficiaryName
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Todos los campos son obligatorios",
      );
    }

    // Validate KYC and balance
    const userRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Usuario no encontrado");
    }

    const userData = userDoc.data()!;

    if (userData.kycStatus !== "verified") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Debes completar la verificación de identidad antes de retirar",
      );
    }

    // Validate amount
    if (!Number.isInteger(amountCents) || amountCents < MIN_WITHDRAWAL_CENTS) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `El monto mínimo de retiro es $${(MIN_WITHDRAWAL_CENTS / 100).toFixed(2)}`,
      );
    }

    if (amountCents > (userData.realBalance || 0)) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Saldo insuficiente",
      );
    }

    // Validate account type
    if (bankAccountType !== "checking" && bankAccountType !== "savings") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Tipo de cuenta inválido",
      );
    }

    // Calculate fee
    const feeCents = Math.floor(amountCents * FEE_PERCENTAGE / 100);
    const netAmountCents = amountCents - feeCents;
    const amountDollars = netAmountCents / 100;

    // Create withdrawal request and debit balance atomically
    const withdrawalRef = admin
      .firestore()
      .collection("withdrawalRequests")
      .doc();
    const txnRef = admin.firestore().collection("transactions").doc();

    let currentBalance: number;

    await admin.firestore().runTransaction(async (transaction) => {
      const freshUser = await transaction.get(userRef);
      currentBalance = freshUser.data()?.realBalance || 0;

      if (amountCents > currentBalance) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Saldo insuficiente",
        );
      }

      const newBalance = currentBalance - amountCents;

      transaction.update(userRef, {
        realBalance: newBalance,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      transaction.set(withdrawalRef, {
        id: withdrawalRef.id,
        userId,
        amountCents,
        feeCents,
        netAmountCents,
        bankCode,
        bankAccountNumber,
        bankAccountType,
        beneficiaryName,
        status: "pending",
        transactionId: txnRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      transaction.set(txnRef, {
        id: txnRef.id,
        userId,
        type: "dlocal_withdrawal",
        amount: -amountCents, // Negative = debit
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: `Retiro de $${(amountCents / 100).toFixed(2)}`,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    try {
      // Call dLocal Payouts API
      const dLocalResponse = await dLocalPost<DLocalPayoutResponse>(
        "/payouts",
        {
          amount: amountDollars,
          currency: "USD",
          country: "EC",
          payment_method_id: "BT",
          payment_method_flow: "DIRECT",
          payer: {
            name: userData.kycFullName || beneficiaryName,
            email: userData.email,
            document: userData.kycDocumentNumber,
            document_type: userData.kycDocumentType,
          },
          beneficiary: {
            name: beneficiaryName,
            account: bankAccountNumber,
            type: bankAccountType === "checking" ? "C" : "S",
            bank_code: bankCode,
          },
          external_id: withdrawalRef.id,
          notification_url: `https://us-central1-posta-main.cloudfunctions.net/dLocalWebhook`,
        },
      );

      // Update withdrawal with dLocal payout ID
      await withdrawalRef.update({
        dLocalPayoutId: dLocalResponse.id,
        dLocalStatus: String(dLocalResponse.status),
        status: "processing",
      });

      await txnRef.update({
        providerId: dLocalResponse.id,
      });

      console.log("✅ Withdrawal submitted:", {
        userId,
        withdrawalId: withdrawalRef.id,
        dLocalStatus: dLocalResponse.status,
      });

      return { success: true, withdrawalId: withdrawalRef.id };
    } catch (error: any) {
      // Refund balance on failure
      await admin.firestore().runTransaction(async (transaction) => {
        const freshUser = await transaction.get(userRef);
        const balance = freshUser.data()?.realBalance || 0;

        transaction.update(userRef, {
          realBalance: balance + amountCents,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        transaction.update(withdrawalRef, {
          status: "failed",
          dLocalStatus: error.message,
        });

        transaction.update(txnRef, {
          status: "failed",
        });
      });

      console.error("❌ Withdrawal failed, balance refunded:", {
        userId,
        error: error.message,
      });

      throw new functions.https.HttpsError(
        "internal",
        "Error al procesar el retiro. Tu saldo ha sido restaurado.",
      );
    }
  });
