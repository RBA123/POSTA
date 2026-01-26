import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Callable Cloud Function to settle a market and all associated bets
 * 
 * This function:
 * 1. Validates admin permissions
 * 2. Updates market status and result
 * 3. Finds all pending bets for the market
 * 4. Calculates winnings/losses for each bet
 * 5. Updates user balances and stats
 * 6. Creates transaction records
 * 7. Sends notifications to users
 */
export const settleMarket = functions.region('us-central1').https.onCall(async (data, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { marketId, result } = data;

  // Validate input
  if (!marketId || !result) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: marketId, result');
  }

  if (result !== 'si' && result !== 'no' && result !== 'cancelled') {
    throw new functions.https.HttpsError('invalid-argument', 'Result must be "si", "no", or "cancelled"');
  }

  const db = admin.firestore();

  try {
    // Check if user is admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can settle markets');
    }

    // Get market document
    const marketRef = db.collection('markets').doc(marketId);
    const marketDoc = await marketRef.get();

    if (!marketDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Market not found');
    }

    const marketData = marketDoc.data()!;

    // Check if market can be settled
    if (marketData.status === 'settled') {
      throw new functions.https.HttpsError('failed-precondition', 'Market is already settled');
    }

    const now = admin.firestore.Timestamp.now();

    // Update market status
    await marketRef.update({
      status: 'settled',
      result,
      resultVerifiedBy: context.auth.uid,
      settledAt: now,
      updatedAt: now,
    });

    // Get all pending bets for this market
    const userBetsSnapshot = await db.collection('userBets')
      .where('marketId', '==', marketId)
      .where('status', '==', 'pending')
      .get();

    if (userBetsSnapshot.empty) {
      return {
        success: true,
        message: 'Market settled with no pending bets',
        settledCount: 0,
      };
    }

    // Process bets in batches (Firestore batch limit is 500)
    const batches: admin.firestore.WriteBatch[] = [];
    let currentBatch = db.batch();
    let batchCount = 0;
    let settledCount = 0;

    for (const betDoc of userBetsSnapshot.docs) {
      const betData = betDoc.data();
      const userId = betData.userId;
      const betSide = betData.side;
      const betAmount = betData.amount;
      const potentialWin = betData.potentialWin;

      let betStatus: 'won' | 'lost' | 'refunded';
      let actualWin = 0;
      let balanceChange = 0;

      if (result === 'cancelled') {
        // Refund bet amount
        betStatus = 'refunded';
        balanceChange = betAmount;
        actualWin = 0;
        console.log(`💰 Bet ${betDoc.id} REFUNDED - Amount: $${betAmount}`);
      } else if (betSide === result) {
        // User won
        betStatus = 'won';
        actualWin = potentialWin;
        balanceChange = potentialWin; // Net win (potentialWin includes original bet)
        console.log(`🎉 Bet ${betDoc.id} WON - Payout: $${potentialWin}, User: ${userId}`);
      } else {
        // User lost (bet already deducted, no refund)
        betStatus = 'lost';
        actualWin = 0;
        balanceChange = 0;
        console.log(`❌ Bet ${betDoc.id} LOST - Amount: $${betAmount}, User: ${userId}`);
      }

      // Update bet document
      const betRef = db.collection('userBets').doc(betDoc.id);
      currentBatch.update(betRef, {
        status: betStatus,
        actualWin,
        settledAt: now,
      });

      if (balanceChange !== 0) {
        // Update user balance and stats
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
          const userData = userDoc.data()!;
          const currentBalance = userData.virtualBalance || 0;
          const newBalance = currentBalance + balanceChange;

          console.log(`💵 Updating balance for user ${userId}:`, {
            currentBalance,
            balanceChange,
            newBalance,
            betStatus,
          });

          currentBatch.update(userRef, {
            virtualBalance: newBalance,
            activePositions: Math.max(0, (userData.activePositions || 0) - 1),
            totalWinnings: betStatus === 'won' 
              ? (userData.totalWinnings || 0) + actualWin 
              : userData.totalWinnings || 0,
            totalLosses: betStatus === 'lost' 
              ? (userData.totalLosses || 0) + betAmount 
              : userData.totalLosses || 0,
            updatedAt: now,
          });

          console.log(`✅ Balance update queued for user ${userId}`);

          // Create transaction record
          const transactionRef = db.collection('transactions').doc();
          const transactionType = betStatus === 'won' 
            ? 'bet_won' 
            : betStatus === 'refunded' 
            ? 'bet_refund' 
            : 'bet_placed'; // Lost bets already have transaction

          if (betStatus !== 'lost') {
            currentBatch.set(transactionRef, {
              id: transactionRef.id,
              userId,
              type: transactionType,
              amount: balanceChange,
              balanceBefore: currentBalance,
              balanceAfter: newBalance,
              description: betStatus === 'won' 
                ? `Bet won: +$${actualWin.toFixed(2)}`
                : `Bet refunded: +$${betAmount.toFixed(2)}`,
              betId: betDoc.id,
              marketId,
              status: 'completed',
              createdAt: now,
              completedAt: now,
            });
            
            console.log(`📝 Transaction created: ${transactionType} - $${balanceChange}`);
          }
        }
      } else {
        console.log(`⚠️ No balance change for bet ${betDoc.id} (user lost)`);
      }

      batchCount++;
      settledCount++;

      // Firestore batch limit is 500 operations
      if (batchCount >= 450) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        batchCount = 0;
      }
    }

    // Add final batch if it has operations
    if (batchCount > 0) {
      batches.push(currentBatch);
    }

    // Execute all batches
    console.log(`🚀 Committing ${batches.length} batch(es) with ${settledCount} bet(s)`);
    for (const batch of batches) {
      await batch.commit();
    }
    console.log(`✅ All batches committed successfully`);

    // Collect bet data with settlement results for notifications
    const betResults = new Map<string, {
      userId: string;
      betSide: string;
      betAmount: number;
      actualWin: number;
      betStatus: 'won' | 'lost' | 'refunded';
    }>();

    // Re-process bets to collect settlement data
    for (const betDoc of userBetsSnapshot.docs) {
      const betData = betDoc.data();
      const userId = betData.userId;
      const betSide = betData.side;
      const betAmount = betData.amount;
      const potentialWin = betData.potentialWin;

      let betStatus: 'won' | 'lost' | 'refunded';
      let actualWin = 0;

      if (result === 'cancelled') {
        betStatus = 'refunded';
        actualWin = 0;
      } else if (betSide === result) {
        betStatus = 'won';
        actualWin = potentialWin;
      } else {
        betStatus = 'lost';
        actualWin = 0;
      }

      betResults.set(betDoc.id, {
        userId,
        betSide,
        betAmount,
        actualWin,
        betStatus,
      });
    }

    // Get unique user IDs
    const userIds = Array.from(new Set(Array.from(betResults.values()).map(b => b.userId)));

    // Fetch user documents to check preferences and get push tokens
    const userDocs = await Promise.all(
      userIds.map(userId => db.collection('users').doc(userId).get())
    );

    const userDataMap = new Map<string, any>();
    userDocs.forEach(doc => {
      if (doc.exists) {
        userDataMap.set(doc.id, doc.data());
      }
    });

    // Create in-app notifications
    const notificationBatch = db.batch();
    let notificationCount = 0;

    for (const [betId, betResult] of betResults.entries()) {
      const userData = userDataMap.get(betResult.userId);
      
      // Check if user wants market result notifications
      if (!userData || userData.notificationsEnabled !== true) {
        continue;
      }

      if (userData.notificationPreferences?.marketResults === false) {
        continue;
      }

      // Build notification message with amounts
      let notificationMessage: string;
      if (betResult.betStatus === 'refunded') {
        notificationMessage = `Tu apuesta de $${betResult.betAmount.toFixed(2)} en "${marketData.question}" fue reembolsada`;
      } else if (betResult.betStatus === 'won') {
        notificationMessage = `¡Ganaste $${betResult.actualWin.toFixed(2)}! Tu apuesta en "${marketData.question}" fue correcta`;
      } else {
        notificationMessage = `Perdiste $${betResult.betAmount.toFixed(2)}. Tu apuesta en "${marketData.question}" no fue correcta`;
      }

      // Create in-app notification
      const notificationRef = db.collection('users').doc(betResult.userId).collection('notifications').doc();
      notificationBatch.set(notificationRef, {
        id: notificationRef.id,
        type: 'bet_result',
        title: 'Resultado de tu apuesta',
        message: notificationMessage,
        read: false,
        marketId,
        betId,
        createdAt: now,
      });

      notificationCount++;
    }

    // Commit notification batch
    if (notificationCount > 0) {
      await notificationBatch.commit();
      console.log(`📬 Created ${notificationCount} in-app notifications for market settlement`);
    }

    // Build notification messages for push notifications
    const notificationTitle = 'Resultado de tu apuesta';
    const notificationMessages: Array<{
      userId: string;
      message: string;
      token: string;
    }> = [];

    for (const [betId, betResult] of betResults.entries()) {
      const userData = userDataMap.get(betResult.userId);
      
      if (!userData || !userData.expoPushToken) continue;
      if (userData.notificationsEnabled !== true) continue;
      if (userData.notificationPreferences?.marketResults === false) continue;

      let notificationBody: string;
      if (betResult.betStatus === 'refunded') {
        notificationBody = `Tu apuesta de $${betResult.betAmount.toFixed(2)} en "${marketData.question}" fue reembolsada`;
      } else if (betResult.betStatus === 'won') {
        notificationBody = `¡Ganaste $${betResult.actualWin.toFixed(2)}! Tu apuesta en "${marketData.question}" fue correcta`;
      } else {
        notificationBody = `Perdiste $${betResult.betAmount.toFixed(2)}. Tu apuesta en "${marketData.question}" no fue correcta`;
      }

      notificationMessages.push({
        userId: betResult.userId,
        message: notificationBody,
        token: userData.expoPushToken,
      });
    }

    // Send push notifications via Expo Push Notification service
    if (notificationMessages.length > 0) {
      // Expo allows up to 100 tokens per request, so we need to batch if needed
      const batchSize = 100;
      for (let i = 0; i < notificationMessages.length; i += batchSize) {
        const messageBatch = notificationMessages.slice(i, i + batchSize);
        
        const expoMessages = messageBatch.map(({ token, message }) => ({
          to: token,
          sound: 'default',
          title: notificationTitle,
          body: message,
          data: {
            type: 'bet_result',
            marketId,
          },
          priority: 'high',
        }));

        try {
          const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(expoMessages),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error sending push notifications (batch ${i / batchSize + 1}):`, errorText);
          } else {
            const result = await response.json();
            console.log(`✅ Sent push notifications to ${messageBatch.length} devices (batch ${i / batchSize + 1})`, result);
          }
        } catch (fetchError) {
          console.error(`Error fetching Expo push service (batch ${i / batchSize + 1}):`, fetchError);
        }
      }

      console.log(`📤 Sent push notifications to ${notificationMessages.length} users for market settlement ${marketId}`);
    } else {
      console.log(`No push tokens available for market settlement ${marketId}`);
    }

    console.log(`✅ Market ${marketId} settled with result: ${result}. Settled ${settledCount} bets.`);

    return {
      success: true,
      message: `Market settled successfully`,
      settledCount,
      result,
    };
  } catch (error: any) {
    console.error('❌ Error settling market:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to settle market', error);
  }
});

