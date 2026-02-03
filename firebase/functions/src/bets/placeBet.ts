import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Callable Cloud Function to place a bet
 *
 * ⚠️ IMPORTANT: All monetary values (amount, balance, potentialWin) are stored
 * as INTEGER CENTS to avoid floating-point precision errors.
 * Example: $10.00 = 1000 cents
 *
 * This function:
 * 1. Validates the bet (market exists, user has balance, market is open)
 * 2. Calculates potential win based on current odds (using integer arithmetic)
 * 3. Creates bet documents atomically (userBet + marketBet)
 * 4. Updates user balance and stats
 * 5. Updates market volume and odds
 * 6. Creates transaction record
 */
export const placeBet = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
      );
    }

    const userId = context.auth.uid;
    const { marketId, side, amount, countryCode } = data;

    // Validate input
    if (!marketId || !side || !amount) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: marketId, side, amount",
      );
    }

    if (side !== "si" && side !== "no") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        'Side must be "si" or "no"',
      );
    }

    if (
      typeof amount !== "number" ||
      amount <= 0 ||
      !Number.isInteger(amount)
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Amount must be a positive integer (in cents)",
      );
    }

    // Minimum bet: 100 cents ($1.00)
    if (amount < 100) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Minimum bet is $1.00 (100 cents)",
      );
    }

    const db = admin.firestore();
    const batch = db.batch();

    try {
      // Get user document
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found");
      }

      const userData = userDoc.data()!;
      const currentBalance = userData.virtualBalance || 0;

      // Check if user has sufficient balance
      if (currentBalance < amount) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Insufficient balance",
        );
      }

      // RATE LIMITING: Check if user placed a bet in the last 10 seconds
      const recentBetsSnapshot = await db
        .collection("userBets")
        .where("userId", "==", userId)
        .orderBy("placedAt", "desc")
        .limit(1)
        .get();

      if (!recentBetsSnapshot.empty) {
        const lastBet = recentBetsSnapshot.docs[0].data();
        const lastBetTime = lastBet.placedAt.toMillis();
        const timeSinceLastBet = Date.now() - lastBetTime;

        if (timeSinceLastBet < 10000) {
          // 10 seconds in milliseconds
          const secondsLeft = Math.ceil((10000 - timeSinceLastBet) / 1000);
          console.log(
            `⏱️ Rate limit hit for user ${userId}: last bet was ${timeSinceLastBet}ms ago`,
          );
          throw new functions.https.HttpsError(
            "resource-exhausted",
            `Por favor espera ${secondsLeft} segundo${secondsLeft > 1 ? "s" : ""} antes de apostar de nuevo`,
          );
        }
      }

      console.log(`✅ Rate limit passed for user ${userId}`);

      // Get market document
      const marketRef = db.collection("markets").doc(marketId);
      const marketDoc = await marketRef.get();

      if (!marketDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Market not found");
      }

      const marketData = marketDoc.data()!;

      // Check if market is open for betting
      if (marketData.status !== "open") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Market is not open for betting",
        );
      }

      // Check if market is locked (for EN VIVO markets)
      if (marketData.lockAt && marketData.lockAt.toMillis() < Date.now()) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Market betting has closed",
        );
      }

      // Calculate probability and potential win
      let probability: number;

      if (countryCode && marketData.countryBets) {
        // Country-specific bet
        const countryBet = marketData.countryBets.find(
          (cb: any) => cb.code === countryCode,
        );

        if (!countryBet) {
          throw new functions.https.HttpsError(
            "invalid-argument",
            `Country code ${countryCode} not found in market`,
          );
        }

        probability =
          side === "si" ? countryBet.siProbability : countryBet.noProbability;
      } else {
        // Regular bet
        probability =
          side === "si" ? marketData.siProbability : marketData.noProbability;
      }
      // Note: Probability should never be 0% due to minimum probability enforcement in odds calculation
      // This allows contrarian bets even when market consensus is heavily one-sided
      // Calculate payout using integer arithmetic to avoid floating-point errors
      // Formula: (amount * 100) / probability (all values in cents)
      const potentialWin = Math.floor((amount * 100) / probability);

      // Create bet documents
      const betId = db.collection("userBets").doc().id;
      const userBetRef = db.collection("userBets").doc(betId);
      const marketBetRef = marketRef.collection("bets").doc(betId);

      const now = admin.firestore.Timestamp.now();
      const username =
        userData.username || `${userData.firstName} ${userData.lastName}`;

      // Create userBet document
      batch.set(userBetRef, {
        id: betId,
        userId,
        marketId,
        marketQuestion: marketData.question,
        marketCategory: marketData.category,
        side,
        amount,
        probability,
        potentialWin,
        countryCode: countryCode || undefined,
        status: "pending",
        placedAt: now,
        createdAt: now,
      });

      // Create marketBet document
      batch.set(marketBetRef, {
        id: betId,
        userId,
        username,
        side,
        amount,
        probability,
        potentialWin,
        countryCode: countryCode || undefined,
        placedAt: now,
      });

      // Update user balance and stats
      const newBalance = currentBalance - amount;

      // Validate balance won't go negative (should be caught earlier, but double-check)
      if (newBalance < 0) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Insufficient balance for this bet",
        );
      }

      batch.update(userRef, {
        virtualBalance: newBalance,
        totalPositions: (userData.totalPositions || 0) + 1,
        activePositions: (userData.activePositions || 0) + 1,
        updatedAt: now,
      });

      // Update market volume
      const siVolume = marketData.siVolume || 0;
      const noVolume = marketData.noVolume || 0;
      const totalVolume = marketData.totalVolume || 0;
      const totalBets = marketData.totalBets || 0;

      const updateData: any = {
        totalVolume: totalVolume + amount,
        totalBets: totalBets + 1,
        updatedAt: now,
      };

      if (side === "si") {
        updateData.siVolume = siVolume + amount;
      } else {
        updateData.noVolume = noVolume + amount;
      }

      batch.update(marketRef, updateData);

      // Create transaction record
      const transactionRef = db.collection("transactions").doc();
      batch.set(transactionRef, {
        id: transactionRef.id,
        userId,
        type: "bet_placed",
        amount: -amount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: `Bet placed: ${side.toUpperCase()} on "${marketData.question}"`,
        betId,
        marketId,
        status: "completed",
        createdAt: now,
        completedAt: now,
      });

      // Commit all changes atomically
      await batch.commit();

      return {
        success: true,
        betId,
        newBalance,
        potentialWin,
      };
    } catch (error: any) {
      console.error("Error placing bet:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "Failed to place bet",
        error,
      );
    }
  });
