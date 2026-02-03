import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Firestore Trigger: Sends push notification when a new market opens
 *
 * This function:
 * 1. Triggers when a market status changes to 'open'
 * 2. Only sends notifications for urgent (EN VIVO) markets
 * 3. Finds all users with notifications enabled
 * 4. Creates in-app notifications
 * 5. Sends push notifications via Expo Push Notification service
 */
export const sendMarketOpenNotification = functions
  .region("us-central1")
  .firestore.document("markets/{marketId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const marketId = context.params.marketId;

    // Only trigger when market status changes to 'open' AND market is urgent
    if (
      before.status !== "open" &&
      after.status === "open" &&
      after.isUrgent === true
    ) {
      const db = admin.firestore();

      try {
        const marketData = after;

        // Find all users with notifications enabled
        const usersSnapshot = await db
          .collection("users")
          .where("notificationsEnabled", "==", true)
          .get();

        if (usersSnapshot.empty) {
          console.log("No users with notifications enabled");
          return;
        }

        const now = admin.firestore.Timestamp.now();
        const batch = db.batch();
        const pushTokens: string[] = [];

        // Create in-app notifications and collect push tokens
        usersSnapshot.docs.forEach((userDoc) => {
          const userId = userDoc.id;
          const userData = userDoc.data();

          // Check if user wants live market notifications
          if (userData.notificationPreferences?.liveMarkets !== false) {
            const notificationRef = db
              .collection("users")
              .doc(userId)
              .collection("notifications")
              .doc();

            batch.set(notificationRef, {
              id: notificationRef.id,
              type: "market_live",
              title: "⚡ Mercado EN VIVO",
              message: `¡Momento POSTA! ⏱️ ${marketData.lockAt ? "2:00" : "Ahora"} — ${marketData.question}`,
              read: false,
              marketId,
              createdAt: now,
            });

            // Collect push token if available
            if (userData.expoPushToken) {
              pushTokens.push(userData.expoPushToken);
            }
          }
        });

        await batch.commit();
        console.log(
          `Created notifications for ${usersSnapshot.size} users for market ${marketId}`,
        );

        // Send push notifications via Expo Push Notification service
        if (pushTokens.length > 0) {
          const lockTimeText = marketData.lockAt ? "2:00" : "Ahora";
          const notificationTitle = "⚡ Mercado EN VIVO";
          const notificationBody = `¡Momento POSTA! ⏱️ ${lockTimeText} — ${marketData.question}`;

          // Expo allows up to 100 tokens per request, so we need to batch if needed
          const batchSize = 100;
          for (let i = 0; i < pushTokens.length; i += batchSize) {
            const tokenBatch = pushTokens.slice(i, i + batchSize);

            const messages = tokenBatch.map((token) => ({
              to: token,
              sound: "default",
              title: notificationTitle,
              body: notificationBody,
              data: {
                type: "market_live",
                marketId,
              },
              priority: "high",
            }));

            try {
              const response = await fetch(
                "https://exp.host/--/api/v2/push/send",
                {
                  method: "POST",
                  headers: {
                    Accept: "application/json",
                    "Accept-Encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(messages),
                },
              );

              if (!response.ok) {
                const errorText = await response.text();
                console.error(
                  `Error sending push notifications (batch ${i / batchSize + 1}):`,
                  errorText,
                );
              } else {
                const result = await response.json();
                console.log(
                  `✅ Sent push notifications to ${tokenBatch.length} devices (batch ${i / batchSize + 1})`,
                  result,
                );
              }
            } catch (fetchError) {
              console.error(
                `Error fetching Expo push service (batch ${i / batchSize + 1}):`,
                fetchError,
              );
            }
          }

          console.log(
            `📤 Sent push notifications to ${pushTokens.length} users for urgent market ${marketId}`,
          );
        } else {
          console.log(`No push tokens available for market ${marketId}`);
        }
      } catch (error) {
        console.error(
          `Error sending notifications for market ${marketId}:`,
          error,
        );
        // Don't throw - this is a background function
      }
    }
  });

/**
 * Callable function to send a custom notification to a user
 * Can be used for promotions, system messages, etc.
 */
export const sendCustomNotification = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
      );
    }

    const { userId, type, title, message, marketId, betId } = data;

    // Validate input
    if (!userId || !type || !title || !message) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields",
      );
    }

    const validTypes = ["market_live", "bet_result", "promotion", "system"];
    if (!validTypes.includes(type)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid notification type",
      );
    }

    const db = admin.firestore();

    try {
      // Check if user is admin (for sending to other users) or sending to self
      const callerDoc = await db
        .collection("users")
        .doc(context.auth.uid)
        .get();
      const isAdmin = callerDoc.exists && callerDoc.data()?.isAdmin;

      if (userId !== context.auth.uid && !isAdmin) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Can only send notifications to yourself",
        );
      }

      // Verify target user exists
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found");
      }

      // Create notification
      const notificationRef = db
        .collection("users")
        .doc(userId)
        .collection("notifications")
        .doc();
      await notificationRef.set({
        id: notificationRef.id,
        type,
        title,
        message,
        read: false,
        marketId: marketId || null,
        betId: betId || null,
        createdAt: admin.firestore.Timestamp.now(),
      });

      return {
        success: true,
        notificationId: notificationRef.id,
      };
    } catch (error: any) {
      console.error("Error sending custom notification:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "Failed to send notification",
        error,
      );
    }
  });

/**
 * Helper function to mark notification as read
 */
export const markNotificationRead = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
      );
    }

    const { notificationId } = data;

    if (!notificationId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing notificationId",
      );
    }

    const db = admin.firestore();

    try {
      // Find notification (it's in a subcollection, so we need to search)
      // This is a simplified approach - in production, you might want to store notification path
      const userId = context.auth.uid;
      const notificationRef = db
        .collection("users")
        .doc(userId)
        .collection("notifications")
        .doc(notificationId);
      const notificationDoc = await notificationRef.get();

      if (!notificationDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Notification not found",
        );
      }

      await notificationRef.update({
        read: true,
        readAt: admin.firestore.Timestamp.now(),
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error marking notification as read:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "Failed to mark notification as read",
        error,
      );
    }
  });
