import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const INITIAL_BALANCE = 10000; // $100.00 in cents

/**
 * Admin-only: Reset all user stats and balances to starting state.
 * - totalWinnings, totalLosses → 0
 * - winRate, totalPositions, activePositions → 0
 * - virtualBalance → 10000 cents ($100.00)
 * Accounts are preserved; only stats are wiped.
 */
export const resetLeaderboard = functions
  .region("us-central1")
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const db = admin.firestore();

    const callerDoc = await db
      .collection("users")
      .doc(context.auth.uid)
      .get();
    if (!callerDoc.exists || !callerDoc.data()?.isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can reset the leaderboard"
      );
    }

    const usersSnapshot = await db.collection("users").get();
    const now = admin.firestore.Timestamp.now();

    // Firestore batches are capped at 500 ops
    const BATCH_SIZE = 499;
    let batch = db.batch();
    let opCount = 0;
    let totalReset = 0;

    for (const userDoc of usersSnapshot.docs) {
      batch.update(userDoc.ref, {
        totalWinnings: 0,
        totalLosses: 0,
        winRate: 0,
        totalPositions: 0,
        activePositions: 0,
        virtualBalance: INITIAL_BALANCE,
        updatedAt: now,
      });

      opCount++;
      totalReset++;

      if (opCount >= BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        opCount = 0;
      }
    }

    if (opCount > 0) {
      await batch.commit();
    }

    console.log(`✅ Leaderboard reset: ${totalReset} users updated`);
    return { success: true, usersReset: totalReset };
  });
