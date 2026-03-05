import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const REFERRAL_BONUS_CENTS = 500; // $5.00

/**
 * Firestore trigger: when a new user is created with a referredBy field,
 * credit the referrer $5.00 (500 cents) and create a transaction record.
 */
export const processReferral = functions
  .region("us-central1")
  .firestore.document("users/{userId}")
  .onCreate(async (snapshot, context) => {
    const newUser = snapshot.data();
    const newUserId = context.params.userId;

    if (!newUser.referredBy) {
      return;
    }

    const referrerId = newUser.referredBy;
    const db = admin.firestore();

    // Don't allow self-referral
    if (referrerId === newUserId) {
      console.warn("Self-referral attempted by", newUserId);
      return;
    }

    const referrerRef = db.collection("users").doc(referrerId);

    try {
      await db.runTransaction(async (transaction) => {
        const referrerDoc = await transaction.get(referrerRef);

        if (!referrerDoc.exists) {
          console.error("Referrer not found:", referrerId);
          return;
        }

        const referrerData = referrerDoc.data()!;
        const balanceBefore = referrerData.virtualBalance || 0;
        const balanceAfter = balanceBefore + REFERRAL_BONUS_CENTS;

        // Credit the referrer
        transaction.update(referrerRef, {
          virtualBalance: balanceAfter,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Create transaction record
        const txRef = db.collection("transactions").doc();
        transaction.set(txRef, {
          id: txRef.id,
          userId: referrerId,
          type: "referral_bonus",
          amount: REFERRAL_BONUS_CENTS,
          balanceBefore,
          balanceAfter,
          description: `Bono de referido: ${newUser.firstName} ${newUser.lastName} se unió con tu código`,
          status: "completed",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      console.log(
        `Referral bonus of ${REFERRAL_BONUS_CENTS} cents credited to ${referrerId} for referring ${newUserId}`,
      );
    } catch (error) {
      console.error("Error processing referral:", error);
    }
  });