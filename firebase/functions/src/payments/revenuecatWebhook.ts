import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

/**
 * RevenueCat Webhook Handler
 *
 * Handles purchase events from RevenueCat and updates user credits.
 * Configure this webhook URL in RevenueCat Dashboard -> Integrations -> Webhooks
 *
 * Webhook URL: https://your-region-your-project.cloudfunctions.net/revenueCatWebhook
 * Events to listen for: INITIAL_PURCHASE, RENEWAL, NON_RENEWING_PURCHASE
 *
 * SECURITY: Webhook signature verification enabled. Set REVENUECAT_WEBHOOK_SECRET
 * using: firebase functions:secrets:set REVENUECAT_WEBHOOK_SECRET
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
 * Stored in CENTS to avoid floating-point precision issues
 */
const CREDIT_AMOUNTS: Record<string, number> = {
  credits_100: 10000, // 100.00 credits = 10000 cents
  credits_500: 50000, // 500.00 credits = 50000 cents
  credits_1000: 100000, // 1000.00 credits = 100000 cents
  credits_2500: 250000, // 2500.00 credits = 250000 cents
};

/**
 * Verify RevenueCat webhook signature
 * @param body - Raw request body as string
 * @param signature - X-Revenuecat-Signature header value
 * @param secret - Webhook secret from RevenueCat dashboard
 * @returns true if signature is valid
 */
function verifyWebhookSignature(
  body: string,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature) {
    return false;
  }

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const expectedSignature = hmac.digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

/**
 * Process RevenueCat webhook events
 */
export const revenueCatWebhook = functions
  .runWith({
    secrets: ["REVENUECAT_WEBHOOK_SECRET"],
  })
  .https.onRequest(async (req, res) => {
    try {
      // Only accept POST requests
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      // Verify webhook signature for security
      const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("❌ REVENUECAT_WEBHOOK_SECRET not configured");
        res.status(500).send({ error: "Server configuration error" });
        return;
      }

      const signature = req.headers["x-revenuecat-signature"] as
        | string
        | undefined;
      const rawBody = JSON.stringify(req.body);

      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error("❌ Invalid webhook signature");
        res.status(401).send({ error: "Invalid signature" });
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

      // Update user's virtual balance atomically (using CENTS)
      const currentBalance = userDoc.data()?.virtualBalance || 0;
      const newBalance = currentBalance + creditsToAdd;

      // Validate balance doesn't exceed reasonable limits (10 million credits = 1 billion cents)
      const MAX_BALANCE = 1000000000; // 10,000,000.00 credits
      if (newBalance > MAX_BALANCE) {
        console.error("❌ Balance would exceed maximum limit:", newBalance);
        res.status(400).send({ error: "Balance limit exceeded" });
        return;
      }

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
