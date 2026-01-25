import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { useMarket } from "../hooks/useMarkets";
import { useDeleteMarket } from "../hooks/useDeleteMarket";
import { SettlementModal } from "../components/SettlementModal";
import { DeleteMarketModal } from "../components/DeleteMarketModal";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

const categoryLabels: Record<string, string> = {
  en_vivo: "⚡ EN VIVO",
  partidos: "⚽ Partidos",
  torneos: "🏆 Torneos",
  fase_grupos: "👥 Fase de Grupos",
  jugadores: "👤 Jugadores",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  locked: "Locked",
  settled: "Settled",
  cancelled: "Cancelled",
};

export function MarketDetailPage() {
  const { marketId } = useParams<{ marketId: string }>();
  const { data: market, isLoading, error } = useMarket(marketId || "");
  const { mutate: deleteMarket, isPending: isDeleting, error: deleteError } = useDeleteMarket();
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, "dd MMM yyyy, HH:mm", { locale: es });
    } catch {
      return "N/A";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading market...</div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error loading market</p>
        <Link to="/markets">
          <Button>Back to Markets</Button>
        </Link>
      </div>
    );
  }

  const canSettle = market.status === "open" || market.status === "locked";

  const handleDeleteMarket = (marketId: string) => {
    deleteMarket({ marketId });
  };

  return (
    <div>
      <div className="mb-6">
        <Link to="/markets" className="text-primary-600 hover:text-primary-700 text-sm mb-4 inline-block">
          ← Back to Markets
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{market.question}</h1>
            <div className="flex items-center gap-2">
              <Badge>{categoryLabels[market.category] || market.category}</Badge>
              <Badge>{statusLabels[market.status] || market.status}</Badge>
              {market.isUrgent && <Badge variant="danger">Urgent</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            {canSettle && (
              <Button
                variant="success"
                onClick={() => setShowSettlementModal(true)}
              >
                Settle Market
              </Button>
            )}
            <Button
              variant="danger"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {(deleteError as Error).message}
        </div>
      )}

      {market.description && (
        <Card className="mb-6">
          <p className="text-gray-700">{market.description}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Probabilities</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Yes</span>
                <span className="text-lg font-semibold text-green-600">
                  {market.siProbability}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${market.siProbability}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">No</span>
                <span className="text-lg font-semibold text-red-600">
                  {market.noProbability}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{ width: `${market.noProbability}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Volume</span>
              <span className="font-semibold">${market.totalVolume.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Yes Volume</span>
              <span className="font-semibold text-green-600">
                ${market.siVolume.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">No Volume</span>
              <span className="font-semibold text-red-600">
                ${market.noVolume.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Bets</span>
              <span className="font-semibold">{market.totalBets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Unique Bettors</span>
              <span className="font-semibold">{market.uniqueBettors}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Market Information</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Created</span>
            <span className="font-medium">{formatDate(market.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Opens</span>
            <span className="font-medium">{formatDate(market.openAt)}</span>
          </div>
          {market.lockAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Closes</span>
              <span className="font-medium">{formatDate(market.lockAt)}</span>
            </div>
          )}
          {market.settledAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Settled</span>
              <span className="font-medium">{formatDate(market.settledAt)}</span>
            </div>
          )}
          {market.result && (
            <div className="flex justify-between">
              <span className="text-gray-600">Result</span>
              <Badge variant="info">{market.result.toUpperCase()}</Badge>
            </div>
          )}
        </div>
      </Card>

      {showSettlementModal && market && (
        <SettlementModal
          market={market}
          onClose={() => setShowSettlementModal(false)}
        />
      )}

      {showDeleteModal && market && (
        <DeleteMarketModal
          marketId={market.id}
          marketQuestion={market.question}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteMarket}
        />
      )}
    </div>
  );
}
