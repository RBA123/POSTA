import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

interface AnalyticsData {
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
  referralAdoptionRate: number;
  predictionRate: number;
  topMarkets: { marketId: string; question: string; totalBets: number; totalVolumeCents: number }[];
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function MiniBarChart({ data, dataKey, color }: { data: { date: string; [key: string]: any }[]; dataKey: string; color: string }) {
  const values = data.map((d) => d[dataKey] as number);
  const max = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-[2px] h-20 mt-2">
      {data.map((d, i) => {
        const height = (values[i] / max) * 100;
        const dateStr = d.date.slice(5); // MM-DD
        return (
          <div key={i} className="flex-1 flex flex-col items-center group relative">
            <div
              className="w-full rounded-sm transition-all hover:opacity-80"
              style={{ height: `${Math.max(height, 2)}%`, backgroundColor: color }}
            />
            <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
              {dateStr}: {values[i]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const getAnalytics = httpsCallable<void, AnalyticsData>(functions, "getAnalytics");
        const result = await getAnalytics();
        setData(result.data);
      } catch (err: any) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error || "No data"}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Engagement metrics and user activity</p>
      </div>

      {/* Top-level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
          </CardHeader>
          <p className="text-3xl font-bold text-gray-900">{data.users.totalUsers}</p>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Bets</CardTitle>
          </CardHeader>
          <p className="text-3xl font-bold text-gray-900">{data.bets.totalPlaced}</p>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Volume</CardTitle>
          </CardHeader>
          <p className="text-3xl font-bold text-orange-600">{formatCents(data.bets.totalVolumeCents)}</p>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Next-Day Retention</CardTitle>
          </CardHeader>
          <p className="text-3xl font-bold text-blue-600">{data.retention.nextDayReturnRate}%</p>
        </Card>
      </div>

      {/* Signups Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Signups</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">Today</p>
              <p className="text-xl font-bold">{data.signups.today}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last 7 days</p>
              <p className="text-xl font-bold">{data.signups.last7Days}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last 30 days</p>
              <p className="text-xl font-bold">{data.signups.last30Days}</p>
            </div>
          </div>
          <MiniBarChart data={data.signups.byDay} dataKey="count" color="#F97316" />
          <p className="text-xs text-gray-400 mt-1 text-right">Last 30 days</p>
        </Card>

        {/* Bets Section */}
        <Card>
          <CardHeader>
            <CardTitle>Bets Placed</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">Today</p>
              <p className="text-xl font-bold">{data.bets.today}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last 7 days</p>
              <p className="text-xl font-bold">{data.bets.last7Days}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last 30 days</p>
              <p className="text-xl font-bold">{data.bets.last30Days}</p>
            </div>
          </div>
          <MiniBarChart data={data.bets.byDay} dataKey="count" color="#3B82F6" />
          <p className="text-xs text-gray-400 mt-1 text-right">Last 30 days</p>
        </Card>
      </div>

      {/* Active Users & Retention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Daily Active (DAU)</span>
              <span className="text-lg font-bold">{data.users.activeLastDay}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Weekly Active (WAU)</span>
              <span className="text-lg font-bold">{data.users.activeLastWeek}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Monthly Active (MAU)</span>
              <span className="text-lg font-bold">{data.users.activeLastMonth}</span>
            </div>
            {data.users.activeLastMonth > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">DAU/MAU Ratio</span>
                  <span className="text-sm font-medium">
                    {Math.round((data.users.activeLastDay / data.users.activeLastMonth) * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next-Day Retention</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Return rate</span>
              <Badge variant={data.retention.nextDayReturnRate > 30 ? "success" : "warning"}>
                {data.retention.nextDayReturnRate}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Users who returned</span>
              <span className="text-lg font-bold">{data.retention.nextDayReturns}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Eligible users</span>
              <span className="text-sm text-gray-500">{data.retention.eligibleUsers}</span>
            </div>
            <p className="text-xs text-gray-400">
              Users who signed up 1+ days ago and logged in again the next day or later.
            </p>
          </div>
        </Card>
      </div>

      {/* New Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Referral Adoption Rate</CardTitle>
          </CardHeader>
          <p className="text-4xl font-bold text-orange-600 mb-2">{data.referralAdoptionRate}%</p>
          <p className="text-sm text-gray-500">of users signed up using a friend referral code</p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prediction Rate</CardTitle>
          </CardHeader>
          <p className="text-4xl font-bold text-blue-600 mb-2">{data.predictionRate}%</p>
          <p className="text-sm text-gray-500">of users have placed at least one bet</p>
        </Card>
      </div>

      {/* Top Markets */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Top Markets by Bets</CardTitle>
        </CardHeader>
        {data.topMarkets.length === 0 ? (
          <div className="text-center py-6 text-gray-500">No markets yet</div>
        ) : (
          <div className="space-y-3">
            {data.topMarkets.map((market, i) => (
              <div key={market.marketId} className="flex items-center gap-4">
                <span className="text-2xl font-black text-gray-300 w-8">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{market.question}</p>
                  <p className="text-xs text-gray-400">{formatCents(market.totalVolumeCents)} volume</p>
                </div>
                <Badge variant="default">{market.totalBets} bets</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Referrals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Referrals (Friend Codes)</CardTitle>
            <div className="flex gap-4 text-sm">
              <span className="text-gray-500">
                Total: <strong>{data.referrals.totalReferrals}</strong>
              </span>
              <span className="text-gray-500">
                Bonus paid: <strong>{formatCents(data.referrals.totalBonusPaidCents)}</strong>
              </span>
            </div>
          </div>
        </CardHeader>
        {data.referrals.topReferrers.length === 0 ? (
          <div className="text-center py-6 text-gray-500">No referrals yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Username</th>
                  <th className="pb-2 font-medium text-right">Referrals</th>
                  <th className="pb-2 font-medium text-right">Bonus Earned</th>
                </tr>
              </thead>
              <tbody>
                {data.referrals.topReferrers.map((r, i) => (
                  <tr key={r.userId} className="border-b last:border-0">
                    <td className="py-2 text-gray-500">{i + 1}</td>
                    <td className="py-2 font-medium">{r.username}</td>
                    <td className="py-2 text-right">{r.referralCount}</td>
                    <td className="py-2 text-right text-green-600">
                      {formatCents(r.referralCount * 500)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
