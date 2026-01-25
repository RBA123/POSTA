import { useMarkets } from "../hooks/useMarkets";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export function DashboardPage() {
  const { markets, loading } = useMarkets({});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  const stats = {
    total: markets.length,
    draft: markets.filter((m) => m.status === "draft").length,
    open: markets.filter((m) => m.status === "open").length,
    locked: markets.filter((m) => m.status === "locked").length,
    settled: markets.filter((m) => m.status === "settled").length,
    totalVolume: markets.reduce((sum, m) => sum + m.totalVolume, 0),
  };

  const recentMarkets = markets.slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Markets and activity overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Markets
            </CardTitle>
          </CardHeader>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Open Markets
            </CardTitle>
          </CardHeader>
          <p className="text-3xl font-bold text-green-600">{stats.open}</p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Settlement
            </CardTitle>
          </CardHeader>
          <p className="text-3xl font-bold text-yellow-600">{stats.locked}</p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Volume
            </CardTitle>
          </CardHeader>
          <p className="text-3xl font-bold text-primary-600">
            ${stats.totalVolume.toFixed(2)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Market Status</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Draft</span>
              <Badge>{stats.draft}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Open</span>
              <Badge variant="success">{stats.open}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Locked</span>
              <Badge variant="warning">{stats.locked}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Settled</span>
              <Badge variant="info">{stats.settled}</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-3">
            <Link to="/markets/create" className="block">
              <Button className="w-full" variant="primary">
                ➕ Create New Market
              </Button>
            </Link>
            <Link to="/markets" className="block">
              <Button className="w-full" variant="secondary">
                📈 View All Markets
              </Button>
            </Link>
            {stats.locked > 0 && (
              <Link to="/markets?status=locked" className="block">
                <Button className="w-full" variant="danger">
                  ⚠️ Settle Locked Markets ({stats.locked})
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Markets</CardTitle>
            <Link to="/markets">
              <Button variant="ghost" size="sm">
                View all →
              </Button>
            </Link>
          </div>
        </CardHeader>
        {recentMarkets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No markets yet
          </div>
        ) : (
          <div className="space-y-3">
            {recentMarkets.map((market) => (
              <Link
                key={market.id}
                to={`/markets/${market.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {market.question}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{market.category}</Badge>
                      <Badge>{market.status}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      ${market.totalVolume.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {market.totalBets} bets
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
