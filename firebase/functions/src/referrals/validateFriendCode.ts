import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * validateFriendCode — Callable Cloud Function
 *
 * Looks up a friend code in the users collection and returns the referrer's UID.
 * Must run server-side because Firestore rules restrict client reads to own profile.
 */
export const validateFriendCode = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    const friendCode = data?.friendCode;

    if (!friendCode || typeof friendCode !== "string" || friendCode.length < 4) {
      return { referrerId: null };
    }

    const db = admin.firestore();
    const snapshot = await db
      .collection("users")
      .where("friendCode", "==", friendCode.toUpperCase().trim())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { referrerId: null };
    }

    return { referrerId: snapshot.docs[0].id };
  });
