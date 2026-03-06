import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Callable function to update lastLoginAt timestamp.
 * Called from the client after successful sign-in.
 */
export const updateLastLogin = functions
  .region("us-central1")
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
    }

    const db = admin.firestore();
    const userRef = db.collection("users").doc(context.auth.uid);

    await userRef.update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  });
