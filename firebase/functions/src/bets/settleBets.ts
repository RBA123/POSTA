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

    // Send notifications to users (async, don't wait)
    userBetsSnapshot.docs.forEach(async (betDoc) => {
      const betData = betDoc.data();
      const userId = betData.userId;
      
      // Create notification
      const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();
      await notificationRef.set({
        id: notificationRef.id,
        type: 'bet_result',
        title: 'Resultado de tu apuesta',
        message: result === 'cancelled'
          ? `Tu apuesta en "${marketData.question}" fue reembolsada`
          : betData.side === result
          ? `¡Ganaste! Tu apuesta en "${marketData.question}" fue correcta`
          : `Tu apuesta en "${marketData.question}" no fue correcta`,
        read: false,
        marketId,
        betId: betDoc.id,
        createdAt: now,
      });
    });

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

