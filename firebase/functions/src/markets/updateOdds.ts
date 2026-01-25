import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Firestore Trigger: Updates market odds when bets are placed
 * 
 * This function:
 * 1. Triggers when a bet is added to markets/{marketId}/bets
 * 2. Recalculates probabilities based on volume distribution
 * 3. Updates market document with new odds
 * 
 * Probability calculation:
 * - Uses volume-weighted approach: siProbability = siVolume / totalVolume * 100
 * - Enforces minimum 1% probability on each side to prevent Infinity errors
 * - Ensures probabilities always sum to 100%
 */
export const updateMarketOdds = functions.region('us-central1').firestore
  .document('markets/{marketId}/bets/{betId}')
  .onCreate(async (snapshot, context) => {
    const marketId = context.params.marketId;
    const db = admin.firestore();

    try {
      const marketRef = db.collection('markets').doc(marketId);
      const marketDoc = await marketRef.get();

      if (!marketDoc.exists) {
        console.error(`Market ${marketId} not found`);
        return;
      }

      const marketData = marketDoc.data()!;

      // Skip if market is not open
      if (marketData.status !== 'open') {
        return;
      }

      // Get current volume
      const siVolume = marketData.siVolume || 0;
      const totalVolume = marketData.totalVolume || 0;

      // Minimum probability to prevent Infinity errors (allows contrarian bets)
      const MIN_PROBABILITY = 1; // 1% minimum

      // Calculate new probabilities based on volume
      let siProbability = 50; // Default 50/50
      let noProbability = 50;

      if (totalVolume > 0) {
        const rawSiProb = (siVolume / totalVolume) * 100;
        // Enforce minimum probability: clamp between MIN_PROBABILITY and (100 - MIN_PROBABILITY)
        siProbability = Math.max(
          MIN_PROBABILITY,
          Math.min(100 - MIN_PROBABILITY, Math.round(rawSiProb))
        );
        noProbability = 100 - siProbability;
      }

      // Ensure probabilities sum to 100
      if (siProbability + noProbability !== 100) {
        noProbability = 100 - siProbability;
      }

      // Update market with new odds
      await marketRef.update({
        siProbability,
        noProbability,
        updatedAt: admin.firestore.Timestamp.now(),
      });

      console.log(`Updated odds for market ${marketId}: Sí ${siProbability}%, No ${noProbability}%`);
    } catch (error) {
      console.error(`Error updating odds for market ${marketId}:`, error);
      // Don't throw - this is a background function
    }
  });

/**
 * Alternative: Recalculate odds for a specific market
 * Can be called manually or via scheduled function
 */
export const recalculateMarketOdds = functions.region('us-central1').https.onCall(async (data, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { marketId } = data;

  if (!marketId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing marketId');
  }

  const db = admin.firestore();

  try {
    const marketRef = db.collection('markets').doc(marketId);
    const marketDoc = await marketRef.get();

    if (!marketDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Market not found');
    }

    // Get all bets for this market
    const betsSnapshot = await marketRef.collection('bets').get();

    let siVolume = 0;
    let noVolume = 0;

    betsSnapshot.docs.forEach((betDoc) => {
      const betData = betDoc.data();
      if (betData.side === 'si') {
        siVolume += betData.amount || 0;
      } else {
        noVolume += betData.amount || 0;
      }
    });

    const totalVolume = siVolume + noVolume;

    // Minimum probability to prevent Infinity errors (allows contrarian bets)
    const MIN_PROBABILITY = 1; // 1% minimum

    // Calculate probabilities
    let siProbability = 50;
    let noProbability = 50;

    if (totalVolume > 0) {
      const rawSiProb = (siVolume / totalVolume) * 100;
      // Enforce minimum probability: clamp between MIN_PROBABILITY and (100 - MIN_PROBABILITY)
      siProbability = Math.max(
        MIN_PROBABILITY,
        Math.min(100 - MIN_PROBABILITY, Math.round(rawSiProb))
      );
      noProbability = 100 - siProbability;
    }

    // Update market
    await marketRef.update({
      siProbability,
      noProbability,
      siVolume,
      noVolume,
      totalVolume,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    return {
      success: true,
      siProbability,
      noProbability,
      siVolume,
      noVolume,
      totalVolume,
    };
  } catch (error: any) {
    console.error('Error recalculating odds:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to recalculate odds', error);
  }
});

