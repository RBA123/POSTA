import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Delete Market Function
 * 
 * Allows admins to delete a market and all associated data
 * WARNING: This is a destructive operation and should be used with caution
 */
export const deleteMarket = functions.region('us-central1').https.onCall(async (data, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { marketId } = data;

  // Validate input
  if (!marketId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required field: marketId');
  }

  const db = admin.firestore();

  try {
    // Check if user is admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can delete markets');
    }

    // Check if market exists
    const marketRef = db.collection('markets').doc(marketId);
    const marketDoc = await marketRef.get();

    if (!marketDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Market not found');
    }

    const marketData = marketDoc.data();

    // Check if market has bets - if it does, we should be extra careful
    if (marketData?.totalBets && marketData.totalBets > 0) {
      console.warn(`Deleting market ${marketId} with ${marketData.totalBets} bets`);
    }

    // Delete the market document
    await marketRef.delete();

    // Note: You may want to delete associated subcollections (bets, etc.) 
    // or handle them separately depending on your data architecture
    // For now, we're just deleting the market document itself

    console.log(`Market ${marketId} deleted by admin ${context.auth.uid}`);

    return {
      success: true,
      message: 'Market deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting market:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to delete market', error);
  }
});
