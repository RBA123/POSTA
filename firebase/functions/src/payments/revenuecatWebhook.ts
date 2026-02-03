import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * RevenueCat Webhook Handler
 *
 * Handles purchase events from RevenueCat and updates user credits.
 * Configure this webhook URL in RevenueCat Dashboard -> Integrations -> Webhooks
 *
 * Webhook URL: https://your-region-your-project.cloudfunctions.net/revenueCatWebhook
 * Events to listen for: INITIAL_PURCHASE, RENEWAL, NON_RENEWING_PURCHASE
 */

interface RevenueCatWebhookEvent {
  event: {
    type: string;
    app_user_id: string;
    product_id: string;
    period_type?: string;
    purchased_at_ms: number;
    store: "app_store" | "play_store";
    transaction_id: string;
    price_in_purchased_currency: number;
    currency: string;
  };
  api_version: string;
}

/**
 * Credit amounts for each product ID (must match types/purchase.ts)
 */
const CREDIT_AMOUNTS: Record<string, number> = {
  credits_100: 100,
  credits_500: 500,
  credits_1000: 1000,
  credits_2500: 2500,
};

/**
 * Process RevenueCat webhook events
 */
export const revenueCatWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const event: RevenueCatWebhookEvent = req.body;

    console.log("📱 RevenueCat webhook received:", {
      type: event.event.type,
      userId: event.event.app_user_id,
      productId: event.event.product_id,
      store: event.event.store,
    });

    // Only process purchase events
    const purchaseEvents = ["INITIAL_PURCHASE", "NON_RENEWING_PURCHASE"];

    if (!purchaseEvents.includes(event.event.type)) {
      console.log("⏭️ Skipping non-purchase event:", event.event.type);
      res.status(200).send({ received: true, processed: false });
      return;
    }

    const {
      app_user_id: userId,
      product_id: productId,
      transaction_id: transactionId,
      purchased_at_ms: purchasedAtMs,
      price_in_purchased_currency: price,
      currency,
      store,
    } = event.event;

    // Validate user exists
    const userRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error("❌ User not found:", userId);
      res.status(404).send({ error: "User not found" });
      return;
    }

    // Get credit amount for product
    const creditsToAdd = CREDIT_AMOUNTS[productId];

    if (!creditsToAdd) {
      console.error("❌ Unknown product ID:", productId);
      res.status(400).send({ error: "Unknown product" });
      return;
    }

    // Check if transaction already processed (idempotency)
    const transactionRef = admin
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("transactions")
      .doc(transactionId);

    const existingTransaction = await transactionRef.get();

    if (existingTransaction.exists) {
      console.log("⏭️ Transaction already processed:", transactionId);
      res
        .status(200)
        .send({ received: true, processed: false, reason: "duplicate" });
      return;
    }

    // Update user's virtual balance atomically
    const currentBalance = userDoc.data()?.virtualBalance || 0;
    const newBalance = currentBalance + creditsToAdd;

    await admin.firestore().runTransaction(async (transaction) => {
      // Update user balance
      transaction.update(userRef, {
        virtualBalance: newBalance,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Record transaction
      transaction.set(transactionRef, {
        type: "deposit",
        amount: creditsToAdd,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        paymentProvider: "revenuecat",
        providerId: transactionId,
        productId,
        price,
        currency,
        store,
        status: "completed",
        createdAt: admin.firestore.Timestamp.fromMillis(purchasedAtMs),
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    console.log("✅ Credits added successfully:", {
      userId,
      credits: creditsToAdd,
      oldBalance: currentBalance,
      newBalance,
      transactionId,
    });

    res.status(200).send({
      received: true,
      processed: true,
      creditsAdded: creditsToAdd,
      newBalance,
    });
  } catch (error: any) {
    console.error("❌ Error processing RevenueCat webhook:", error);
    res.status(500).send({
      error: "Internal server error",
      message: error.message,
    });
  }
});
