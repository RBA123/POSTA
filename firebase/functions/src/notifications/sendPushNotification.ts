import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Firestore Trigger: Sends push notification when a new market opens
 * 
 * This function:
 * 1. Triggers when a market status changes to 'open'
 * 2. Finds all users with notifications enabled
 * 3. Creates in-app notifications
 * 4. Sends push notifications via FCM (if tokens available)
 */
export const sendMarketOpenNotification = functions.region('us-central1').firestore
  .document('markets/{marketId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const marketId = context.params.marketId;

    // Only trigger when market status changes to 'open'
    if (before.status !== 'open' && after.status === 'open') {
      const db = admin.firestore();

      try {
        const marketData = after;

        // Find all users with notifications enabled
        const usersSnapshot = await db.collection('users')
          .where('notificationsEnabled', '==', true)
          .get();

        if (usersSnapshot.empty) {
          console.log('No users with notifications enabled');
          return;
        }

        const now = admin.firestore.Timestamp.now();
        const batch = db.batch();

        // Create in-app notifications for all users
        usersSnapshot.docs.forEach((userDoc) => {
          const userId = userDoc.id;
          const userData = userDoc.data();

          // Check if user wants live market notifications
          if (userData.notificationPreferences?.liveMarkets !== false) {
            const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();
            
            batch.set(notificationRef, {
              id: notificationRef.id,
              type: 'market_live',
              title: marketData.isUrgent ? '⚡ Mercado EN VIVO' : 'Nuevo mercado disponible',
              message: marketData.isUrgent
                ? `¡Momento LIBERTA! ⏱️ ${marketData.lockAt ? '2:00' : 'Ahora'} — ${marketData.question}`
                : `Nuevo mercado: ${marketData.question}`,
              read: false,
              marketId,
              createdAt: now,
            });
          }
        });

        await batch.commit();
        console.log(`Created notifications for ${usersSnapshot.size} users for market ${marketId}`);

        // TODO: Send push notifications via FCM
        // This requires storing FCM tokens in user documents
        // Example implementation:
        // const messaging = admin.messaging();
        // const tokens = usersSnapshot.docs
        //   .map(doc => doc.data().fcmToken)
        //   .filter(token => token);
        // 
        // if (tokens.length > 0) {
        //   await messaging.sendMulticast({
        //     tokens,
        //     notification: {
        //       title: marketData.isUrgent ? '⚡ Mercado EN VIVO' : 'Nuevo mercado',
        //       body: marketData.question,
        //     },
        //     data: {
        //       type: 'market_live',
        //       marketId,
        //     },
        //   });
        // }
      } catch (error) {
        console.error(`Error sending notifications for market ${marketId}:`, error);
        // Don't throw - this is a background function
      }
    }
  });

/**
 * Callable function to send a custom notification to a user
 * Can be used for promotions, system messages, etc.
 */
export const sendCustomNotification = functions.region('us-central1').https.onCall(async (data, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, type, title, message, marketId, betId } = data;

  // Validate input
  if (!userId || !type || !title || !message) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  const validTypes = ['market_live', 'bet_result', 'promotion', 'system'];
  if (!validTypes.includes(type)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid notification type');
  }

  const db = admin.firestore();

  try {
    // Check if user is admin (for sending to other users) or sending to self
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    const isAdmin = callerDoc.exists && callerDoc.data()?.isAdmin;

    if (userId !== context.auth.uid && !isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Can only send notifications to yourself');
    }

    // Verify target user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    // Create notification
    const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();
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
    console.error('Error sending custom notification:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to send notification', error);
  }
});

/**
 * Helper function to mark notification as read
 */
export const markNotificationRead = functions.region('us-central1').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { notificationId } = data;

  if (!notificationId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing notificationId');
  }

  const db = admin.firestore();

  try {
    // Find notification (it's in a subcollection, so we need to search)
    // This is a simplified approach - in production, you might want to store notification path
    const userId = context.auth.uid;
    const notificationRef = db.collection('users').doc(userId).collection('notifications').doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Notification not found');
    }

    await notificationRef.update({
      read: true,
      readAt: admin.firestore.Timestamp.now(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to mark notification as read', error);
  }
});

