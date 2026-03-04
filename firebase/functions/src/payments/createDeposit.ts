import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { dLocalPost } from "./dLocalClient";

/**
 * createDeposit — Callable Cloud Function
 *
 * Creates a card deposit via dLocal Secure Payments API.
 * Card data flows client → this function → dLocal in one request (no PCI storage).
 *
 * If dLocal returns PAID immediately, credits realBalance atomically.
 * Otherwise creates a pending deposit that the webhook will complete.
 */

const MIN_DEPOSIT_CENTS = 500; // $5.00
const MAX_DEPOSIT_CENTS = 50000; // $500.00
const FEE_PERCENTAGE = 0; // 0% for MVP

interface DLocalPaymentResponse {
  id: string;
  status: string;
  status_detail: string;
  amount: number;
  currency: string;
}

export const createDeposit = functions
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
    const { amountCents, cardNumber, cardExpiry, cardCvv, cardHolderName } =
      data;

    // Validate KYC
    const userRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Usuario no encontrado");
    }

    const userData = userDoc.data()!;

    if (userData.kycStatus !== "verified") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Debes completar la verificación de identidad antes de depositar",
      );
    }

    // Validate amount
    if (
      !Number.isInteger(amountCents) ||
      amountCents < MIN_DEPOSIT_CENTS ||
      amountCents > MAX_DEPOSIT_CENTS
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `El monto debe ser entre $${(MIN_DEPOSIT_CENTS / 100).toFixed(2)} y $${(MAX_DEPOSIT_CENTS / 100).toFixed(2)}`,
      );
    }

    // Validate card fields
    if (!cardNumber || !cardExpiry || !cardCvv || !cardHolderName) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Todos los datos de la tarjeta son obligatorios",
      );
    }

    // Calculate fee
    const feeCents = Math.floor(amountCents * FEE_PERCENTAGE / 100);
    const netAmountCents = amountCents - feeCents;
    const amountDollars = amountCents / 100;

    // Parse expiry
    const [expMonth, expYear] = cardExpiry.split("/").map((s: string) => s.trim());

    // Create deposit request doc first
    const depositRef = admin.firestore().collection("depositRequests").doc();

    await depositRef.set({
      id: depositRef.id,
      userId,
      amountCents,
      feeCents,
      netAmountCents,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      console.log("📤 Calling dLocal /secure_payments:", {
        amount: amountDollars,
        currency: "USD",
        country: "EC",
        userId,
        orderId: depositRef.id,
      });

      // Call dLocal Secure Payments
      const dLocalResponse = await dLocalPost<DLocalPaymentResponse>(
        "/secure_payments",
        {
          amount: amountDollars,
          currency: "USD",
          country: "EC",
          payment_method_id: "CARD",
          payment_method_flow: "DIRECT",
          payer: {
            name: userData.kycFullName || cardHolderName,
            email: userData.email,
            document: userData.kycDocumentNumber,
            document_type: userData.kycDocumentType,
            address: {
              state: "EC",
              city: "Quito",
              street: userData.kycAddress || "",
            },
          },
          card: {
            holder_name: cardHolderName,
            number: cardNumber.replace(/\s/g, ""),
            cvv: cardCvv,
            expiration_month: parseInt(expMonth, 10),
            expiration_year: parseInt(`20${expYear}`, 10),
          },
          order_id: depositRef.id,
          notification_url: `https://us-central1-posta-main.cloudfunctions.net/dLocalWebhook`,
        },
      );

      // Update deposit with dLocal payment ID
      await depositRef.update({
        dLocalPaymentId: dLocalResponse.id,
        dLocalStatus: dLocalResponse.status,
      });

      // If paid immediately, credit balance
      if (dLocalResponse.status === "PAID") {
        await admin.firestore().runTransaction(async (transaction) => {
          const freshUser = await transaction.get(userRef);
          const currentBalance = freshUser.data()?.realBalance || 0;
          const newBalance = currentBalance + netAmountCents;

          transaction.update(userRef, {
            realBalance: newBalance,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Create transaction record
          const txnRef = admin.firestore().collection("transactions").doc();
          transaction.set(txnRef, {
            id: txnRef.id,
            userId,
            type: "dlocal_deposit",
            amount: netAmountCents,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description: `Depósito de $${amountDollars.toFixed(2)}`,
            status: "completed",
            providerId: dLocalResponse.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          transaction.update(depositRef, {
            status: "completed",
            transactionId: txnRef.id,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });

        console.log("✅ Deposit completed immediately:", {
          userId,
          depositId: depositRef.id,
          netAmountCents,
        });
      } else {
        console.log("⏳ Deposit pending:", {
          userId,
          depositId: depositRef.id,
          dLocalStatus: dLocalResponse.status,
        });
      }

      return { success: true, depositId: depositRef.id };
    } catch (error: any) {
      // Mark deposit as failed
      await depositRef.update({
        status: "failed",
        dLocalStatus: error.message,
      });

      console.error("❌ Deposit failed:", {
        userId,
        error: error.message,
        stack: error.stack,
        fullError: JSON.stringify(error),
      });

      throw new functions.https.HttpsError(
        "internal",
        "Error al procesar el depósito. Por favor intenta de nuevo.",
      );
    }
  });
