import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { verifyDLocalWebhookSignature } from "./dLocalClient";

/**
 * dLocalWebhook — HTTP Cloud Function
 *
 * Handles payment and payout notifications from dLocal.
 * Follows the same pattern as revenuecatWebhook.ts.
 *
 * Payment statuses: PAID, REJECTED, CANCELLED, PENDING, AUTHORIZED
 * Payout statuses (numeric): 100=pending, 200=paid, 300=cancelled, 400=rejected
 */

export const dLocalWebhook = functions
  .runWith({
    secrets: [
      "DLOCAL_X_LOGIN",
      "DLOCAL_SECRET_KEY",
    ],
  })
  .https.onRequest(async (req, res) => {
    try {
      // Only accept POST
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      // Verify HMAC signature
      const rawBody = JSON.stringify(req.body);
      const authHeader = req.headers["authorization"] as string | undefined;

      if (!verifyDLocalWebhookSignature(rawBody, authHeader)) {
        console.error("❌ Invalid dLocal webhook signature");
        res.status(401).send({ error: "Invalid signature" });
        return;
      }

      const event = req.body;

      console.log("📱 dLocal webhook received:", {
        id: event.id,
        status: event.status,
        type: event.type,
      });

      // Determine if this is a payment or payout notification
      // Payments have string statuses (PAID, REJECTED, etc.)
      // Payouts have numeric statuses or a payout-specific structure
      const isPayment = typeof event.status === "string";
      const isPayout = typeof event.status === "number" || event.type === "payout";

      if (isPayment) {
        await handlePaymentNotification(event);
      } else if (isPayout) {
        await handlePayoutNotification(event);
      } else {
        console.log("⏭️ Unknown webhook event type, skipping");
      }

      res.status(200).send({ received: true });
    } catch (error: any) {
      console.error("❌ Error processing dLocal webhook:", error);
      res.status(500).send({ error: "Internal server error" });
    }
  });

async function handlePaymentNotification(event: any) {
  const paymentId = event.id;

  if (!paymentId) {
    console.error("❌ No payment ID in webhook event");
    return;
  }

  // Find deposit request by dLocalPaymentId
  const depositsQuery = await admin
    .firestore()
    .collection("depositRequests")
    .where("dLocalPaymentId", "==", paymentId)
    .limit(1)
    .get();

  if (depositsQuery.empty) {
    console.log("⏭️ No deposit found for payment:", paymentId);
    return;
  }

  const depositDoc = depositsQuery.docs[0];
  const deposit = depositDoc.data();

  // Idempotency: skip if already completed or failed
  if (deposit.status === "completed" || deposit.status === "failed") {
    console.log("⏭️ Deposit already processed:", depositDoc.id);
    return;
  }

  const status = event.status;

  if (status === "PAID") {
    // Credit realBalance
    const userRef = admin
      .firestore()
      .collection("users")
      .doc(deposit.userId);

    await admin.firestore().runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const currentBalance = userDoc.data()?.realBalance || 0;
      const newBalance = currentBalance + deposit.netAmountCents;

      transaction.update(userRef, {
        realBalance: newBalance,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create transaction record
      const txnRef = admin.firestore().collection("transactions").doc();
      transaction.set(txnRef, {
        id: txnRef.id,
        userId: deposit.userId,
        type: "dlocal_deposit",
        amount: deposit.netAmountCents,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: `Depósito de $${(deposit.amountCents / 100).toFixed(2)}`,
        status: "completed",
        providerId: paymentId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      transaction.update(depositDoc.ref, {
        status: "completed",
        dLocalStatus: status,
        transactionId: txnRef.id,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    console.log("✅ Deposit completed via webhook:", {
      depositId: depositDoc.id,
      userId: deposit.userId,
      netAmountCents: deposit.netAmountCents,
    });
  } else if (status === "REJECTED" || status === "CANCELLED") {
    await depositDoc.ref.update({
      status: "failed",
      dLocalStatus: status,
    });

    console.log("❌ Deposit failed via webhook:", {
      depositId: depositDoc.id,
      status,
    });
  }
}

async function handlePayoutNotification(event: any) {
  const payoutId = event.id;

  if (!payoutId) {
    console.error("❌ No payout ID in webhook event");
    return;
  }

  // Find withdrawal request by dLocalPayoutId
  const withdrawalsQuery = await admin
    .firestore()
    .collection("withdrawalRequests")
    .where("dLocalPayoutId", "==", String(payoutId))
    .limit(1)
    .get();

  if (withdrawalsQuery.empty) {
    console.log("⏭️ No withdrawal found for payout:", payoutId);
    return;
  }

  const withdrawalDoc = withdrawalsQuery.docs[0];
  const withdrawal = withdrawalDoc.data();

  // Idempotency: skip if already completed or refunded
  if (
    withdrawal.status === "completed" ||
    withdrawal.status === "refunded"
  ) {
    console.log("⏭️ Withdrawal already processed:", withdrawalDoc.id);
    return;
  }

  // dLocal payout statuses: 200=paid, 300=cancelled, 400=rejected
  const numericStatus =
    typeof event.status === "number"
      ? event.status
      : parseInt(event.status, 10);

  if (numericStatus === 200) {
    // Payout successful
    await withdrawalDoc.ref.update({
      status: "completed",
      dLocalStatus: String(numericStatus),
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update transaction status
    if (withdrawal.transactionId) {
      await admin
        .firestore()
        .collection("transactions")
        .doc(withdrawal.transactionId)
        .update({
          status: "completed",
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    console.log("✅ Withdrawal completed via webhook:", {
      withdrawalId: withdrawalDoc.id,
      userId: withdrawal.userId,
    });
  } else if (numericStatus === 300 || numericStatus === 400) {
    // Payout rejected/cancelled — refund realBalance
    const userRef = admin
      .firestore()
      .collection("users")
      .doc(withdrawal.userId);

    await admin.firestore().runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const currentBalance = userDoc.data()?.realBalance || 0;
      const newBalance = currentBalance + withdrawal.amountCents;

      transaction.update(userRef, {
        realBalance: newBalance,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create refund transaction record
      const txnRef = admin.firestore().collection("transactions").doc();
      transaction.set(txnRef, {
        id: txnRef.id,
        userId: withdrawal.userId,
        type: "dlocal_withdrawal_refund",
        amount: withdrawal.amountCents,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: `Reembolso de retiro — $${(withdrawal.amountCents / 100).toFixed(2)}`,
        status: "completed",
        providerId: String(payoutId),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      transaction.update(withdrawalDoc.ref, {
        status: "refunded",
        dLocalStatus: String(numericStatus),
      });

      // Update original transaction status
      if (withdrawal.transactionId) {
        transaction.update(
          admin
            .firestore()
            .collection("transactions")
            .doc(withdrawal.transactionId),
          { status: "failed" },
        );
      }
    });

    console.log("↩️ Withdrawal refunded via webhook:", {
      withdrawalId: withdrawalDoc.id,
      userId: withdrawal.userId,
      amountCents: withdrawal.amountCents,
    });
  }
}
