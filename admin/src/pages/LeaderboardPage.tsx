import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../lib/firebase";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

interface LeaderboardUser {
  uid: string;
  username: string;
  firstName: string;
  lastName: string;
  totalWinnings: number;
  totalLosses: number;
  totalPositions: number;
  winRate: number;
  profit: number;
}

function formatCents(cents: number): string {
  const dollars = cents / 100;
  const formatted = Math.abs(dollars).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return dollars < 0 ? `-$${formatted}` : `$${formatted}`;
}

const resetLeaderboardFn = httpsCallable(functions, "resetLeaderboard");

export function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const q = query(collection(db, "users"), orderBy("totalWinnings", "desc"));
        const snapshot = await getDocs(q);

        const leaderboardData: LeaderboardUser[] = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const totalWinnings = data.totalWinnings || 0;
            const totalLosses = data.totalLosses || 0;
            return {
              uid: doc.id,
              username: data.username || "",
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              totalWinnings,
              totalLosses,
              totalPositions: data.totalPositions || 0,
              winRate: data.winRate || 0,
              profit: totalWinnings - totalLosses,
            };
          })
          .sort((a, b) => b.profit - a.profit);

        setUsers(leaderboardData);
      } catch (err: any) {
        setError(err.message || "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  const handleReset = async () => {
    const confirmed = window.confirm(
      "⚠️ Reset ALL user stats and balances to $100?\n\nThis will zero out winnings, losses, win rate, and positions for every user. This cannot be undone."
    );
    if (!confirmed) return;

    setResetting(true);
    setResetSuccess(null);
    setError(null);
    try {
      const result = await resetLeaderboardFn({}) as { data: { usersReset: number } };
      setResetSuccess(`Reset complete — ${result.data.usersReset} users updated.`);
      // Refresh the leaderboard
      const q = query(collection(db, "users"), orderBy("totalWinnings", "desc"));
      const snapshot = await getDocs(q);
      setUsers(
        snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              uid: doc.id,
              username: data.username || "",
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              totalWinnings: 0,
              totalLosses: 0,
              totalPositions: 0,
              winRate: 0,
              profit: 0,
            };
          })
          .sort((a, b) => b.profit - a.profit)
      );
    } catch (err: any) {
      setError(err.message || "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-500 mt-1">
            Users ranked by net profit (winnings minus losses)
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleReset}
          disabled={resetting}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          {resetting ? "Resetting..." : "Reset Leaderboard"}
        </Button>
      </div>

      {resetSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          ✅ {resetSuccess}
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-500">Loading leaderboard...</div>
      )}

      {error && (
        <div className="text-center py-12 text-red-500">{error}</div>
      )}

      {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Top Players</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 font-medium">
                  <th className="px-6 py-3 w-12">#</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3 text-right">Net Profit</th>
                  <th className="px-6 py-3 text-right">Winnings</th>
                  <th className="px-6 py-3 text-right">Losses</th>
                  <th className="px-6 py-3 text-right">Bets</th>
                  <th className="px-6 py-3 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user, index) => {
                  const rank = index + 1;
                  const medal = getMedalEmoji(rank);
                  const isPositive = user.profit > 0;
                  const isNegative = user.profit < 0;

                  return (
                    <tr
                      key={user.uid}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-400">
                        {medal ? (
                          <span className="text-lg">{medal}</span>
                        ) : (
                          rank
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          @{user.username}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {user.firstName} {user.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-bold text-base ${
                            isPositive
                              ? "text-green-600"
                              : isNegative
                              ? "text-red-500"
                              : "text-gray-400"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {formatCents(user.profit)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {formatCents(user.totalWinnings)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {formatCents(user.totalLosses)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        {user.totalPositions}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-medium ${
                            user.winRate >= 50 ? "text-green-600" : "text-gray-500"
                          }`}
                        >
                          {user.winRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
