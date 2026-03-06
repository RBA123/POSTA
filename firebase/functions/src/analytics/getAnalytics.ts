import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

interface AnalyticsResponse {
  signups: {
    total: number;
    today: number;
    last7Days: number;
    last30Days: number;
    byDay: { date: string; count: number }[];
  };
  bets: {
    totalPlaced: number;
    today: number;
    last7Days: number;
    last30Days: number;
    totalVolumeCents: number;
    byDay: { date: string; count: number; volumeCents: number }[];
  };
  retention: {
    nextDayReturnRate: number;
    nextDayReturns: number;
    eligibleUsers: number;
  };
  referrals: {
    totalReferrals: number;
    totalBonusPaidCents: number;
    topReferrers: { userId: string; username: string; referralCount: number }[];
  };
  users: {
    totalUsers: number;
    activeLastDay: number;
    activeLastWeek: number;
    activeLastMonth: number;
  };
}

export const getAnalytics = functions
  .region("us-central1")
  .https.onCall(async (_data, context) => {
    // Admin only
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
    }

    const db = admin.firestore();
    const callerDoc = await db.collection("users").doc(context.auth.uid).get();
    if (!callerDoc.exists || !callerDoc.data()?.isAdmin) {
      throw new functions.https.HttpsError("permission-denied", "Admin only");
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch users and transactions in parallel
    const [usersSnap, transactionsSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("transactions").get(),
    ]);

    // ---- SIGNUPS ----
    const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const signupsByDay = new Map<string, number>();
    let signupsToday = 0;
    let signups7d = 0;
    let signups30d = 0;

    for (const user of users) {
      const createdAt = (user as any).createdAt?.toDate?.();
      if (!createdAt) continue;

      const dateKey = createdAt.toISOString().slice(0, 10);
      signupsByDay.set(dateKey, (signupsByDay.get(dateKey) || 0) + 1);

      if (createdAt >= todayStart) signupsToday++;
      if (createdAt >= sevenDaysAgo) signups7d++;
      if (createdAt >= thirtyDaysAgo) signups30d++;
    }

    // Last 30 days of signup data
    const signupDays: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      signupDays.push({ date: key, count: signupsByDay.get(key) || 0 });
    }

    // ---- BETS ----
    const betTransactions = transactionsSnap.docs
      .map((d) => d.data())
      .filter((t) => t.type === "bet_placed");

    const betsByDay = new Map<string, { count: number; volumeCents: number }>();
    let betsToday = 0;
    let bets7d = 0;
    let bets30d = 0;
    let totalVolumeCents = 0;

    for (const bet of betTransactions) {
      const createdAt = bet.createdAt?.toDate?.();
      if (!createdAt) continue;

      const amount = Math.abs(bet.amount || 0);
      totalVolumeCents += amount;

      const dateKey = createdAt.toISOString().slice(0, 10);
      const existing = betsByDay.get(dateKey) || { count: 0, volumeCents: 0 };
      betsByDay.set(dateKey, {
        count: existing.count + 1,
        volumeCents: existing.volumeCents + amount,
      });

      if (createdAt >= todayStart) betsToday++;
      if (createdAt >= sevenDaysAgo) bets7d++;
      if (createdAt >= thirtyDaysAgo) bets30d++;
    }

    const betDays: { date: string; count: number; volumeCents: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const data = betsByDay.get(key) || { count: 0, volumeCents: 0 };
      betDays.push({ date: key, ...data });
    }

    // ---- RETENTION (next-day return) ----
    // Users who signed up at least 1 day ago AND have lastLoginAt > createdAt day
    let nextDayReturns = 0;
    let eligibleUsers = 0;

    for (const user of users) {
      const createdAt = (user as any).createdAt?.toDate?.();
      const lastLoginAt = (user as any).lastLoginAt?.toDate?.();
      if (!createdAt) continue;

      // Only count users who signed up at least 1 day ago
      const dayAfterSignup = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
      if (dayAfterSignup > now) continue;

      eligibleUsers++;

      if (lastLoginAt && lastLoginAt >= dayAfterSignup) {
        nextDayReturns++;
      }
    }

    const nextDayReturnRate =
      eligibleUsers > 0 ? Math.round((nextDayReturns / eligibleUsers) * 100) : 0;

    // ---- REFERRALS ----
    const referralTransactions = transactionsSnap.docs
      .map((d) => d.data())
      .filter((t) => t.type === "referral_bonus");

    const totalBonusPaidCents = referralTransactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0,
    );

    // Count referrals per user (referredBy field)
    const referralCounts = new Map<string, number>();
    for (const user of users) {
      const referredBy = (user as any).referredBy;
      if (referredBy) {
        referralCounts.set(referredBy, (referralCounts.get(referredBy) || 0) + 1);
      }
    }

    // Top referrers
    const topReferrers = Array.from(referralCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, referralCount]) => {
        const referrer = users.find((u) => u.id === userId);
        return {
          userId,
          username: (referrer as any)?.username || "Unknown",
          referralCount,
        };
      });

    // ---- ACTIVE USERS ----
    let activeLastDay = 0;
    let activeLastWeek = 0;
    let activeLastMonth = 0;

    for (const user of users) {
      const lastLogin = (user as any).lastLoginAt?.toDate?.();
      if (!lastLogin) continue;

      if (lastLogin >= todayStart) activeLastDay++;
      if (lastLogin >= sevenDaysAgo) activeLastWeek++;
      if (lastLogin >= thirtyDaysAgo) activeLastMonth++;
    }

    const response: AnalyticsResponse = {
      signups: {
        total: users.length,
        today: signupsToday,
        last7Days: signups7d,
        last30Days: signups30d,
        byDay: signupDays,
      },
      bets: {
        totalPlaced: betTransactions.length,
        today: betsToday,
        last7Days: bets7d,
        last30Days: bets30d,
        totalVolumeCents,
        byDay: betDays,
      },
      retention: {
        nextDayReturnRate,
        nextDayReturns,
        eligibleUsers,
      },
      referrals: {
        totalReferrals: referralCounts.size > 0
          ? Array.from(referralCounts.values()).reduce((a, b) => a + b, 0)
          : 0,
        totalBonusPaidCents,
        topReferrers,
      },
      users: {
        totalUsers: users.length,
        activeLastDay,
        activeLastWeek,
        activeLastMonth,
      },
    };

    return response;
  });