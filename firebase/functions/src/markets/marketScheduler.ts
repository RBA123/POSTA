import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Scheduled Function: Updates market statuses based on time
 *
 * Runs every minute to:
 * 1. Lock EN VIVO markets that have passed their lockAt time
 * 2. Update market statuses based on timing
 */
export const scheduledMarketStatus = functions
  .region("us-central1")
  .pubsub.schedule("every 1 minutes")
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const nowMillis = Date.now();

    try {
      // Find markets that need to be locked (EN VIVO markets past lockAt)
      const openMarketsSnapshot = await db
        .collection("markets")
        .where("status", "==", "open")
        .where("isUrgent", "==", true)
        .get();

      const batch = db.batch();
      let updateCount = 0;

      for (const marketDoc of openMarketsSnapshot.docs) {
        const marketData = marketDoc.data();
        const lockAt = marketData.lockAt;

        // Check if market should be locked
        if (lockAt && lockAt.toMillis() < nowMillis) {
          const marketRef = db.collection("markets").doc(marketDoc.id);
          batch.update(marketRef, {
            status: "locked",
            updatedAt: now,
          });
          updateCount++;
        }
      }

      // Commit batch updates
      if (updateCount > 0) {
        await batch.commit();
        console.log(`Locked ${updateCount} markets`);
      }

      return { success: true, updated: updateCount };
    } catch (error) {
      console.error("Error in scheduled market status update:", error);
      return { success: false, error: String(error) };
    }
  });

/**
 * Helper function to create a market with proper timing
 * Can be called from admin panel or other functions
 */
export const createMarket = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
      );
    }

    const {
      question,
      description,
      category,
      openAt,
      lockAt,
      isUrgent,
      tags,
      imageUrl,
      countryBets,
      marketMakerVolume,
    } = data;

    // Validate input
    if (!question || !category) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: question, category",
      );
    }

    const validCategories = [
      "en_vivo",
      "partidos",
      "torneos",
      "fase_grupos",
      "jugadores",
    ];
    if (!validCategories.includes(category)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid category",
      );
    }

    const db = admin.firestore();

    try {
      // Check if user is admin
      const userDoc = await db.collection("users").doc(context.auth.uid).get();
      if (!userDoc.exists || !userDoc.data()?.isAdmin) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Only admins can create markets",
        );
      }

      const now = admin.firestore.Timestamp.now();
      const openAtTimestamp = openAt
        ? admin.firestore.Timestamp.fromDate(new Date(openAt))
        : now;
      const lockAtTimestamp = lockAt
        ? admin.firestore.Timestamp.fromDate(new Date(lockAt))
        : undefined;

      // Determine initial status
      let status: "draft" | "open" = "draft";
      if (openAtTimestamp.toMillis() <= Date.now()) {
        status = "open";
      }

      // Validate marketMakerVolume if provided
      const mmVolume = marketMakerVolume != null ? Math.floor(Number(marketMakerVolume)) : 0;
      if (mmVolume < 0) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "marketMakerVolume must be a non-negative integer (cents)",
        );
      }

      // Create market document
      const marketRef = db.collection("markets").doc();
      const marketData: any = {
        id: marketRef.id,
        question,
        description: description || null,
        category,
        siProbability: 50,
        noProbability: 50,
        totalVolume: 0,
        totalBets: 0,
        uniqueBettors: 0,
        siVolume: 0,
        noVolume: 0,
        marketMakerVolume: mmVolume,
        status,
        isUrgent: isUrgent || false,
        openAt: openAtTimestamp,
        lockAt: lockAtTimestamp || null,
        createdBy: context.auth.uid,
        createdAt: now,
        updatedAt: now,
        tags: tags || [],
        imageUrl: imageUrl || null,
      };

      // Add countryBets if provided
      if (countryBets && Array.isArray(countryBets) && countryBets.length > 0) {
        marketData.countryBets = countryBets;
      }

      await marketRef.set(marketData);

      return {
        success: true,
        marketId: marketRef.id,
        status,
      };
    } catch (error: any) {
      console.error("Error creating market:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "Failed to create market",
        error,
      );
    }
  });
