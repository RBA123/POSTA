import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { useMarket } from "../hooks/useMarkets";
import { SettlementModal } from "../components/SettlementModal";
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
  draft: "Borrador",
  open: "Abierto",
  locked: "Cerrado",
  settled: "Liquidado",
  cancelled: "Cancelado",
};

export function MarketDetailPage() {
  const { marketId } = useParams<{ marketId: string }>();
  const { data: market, isLoading, error } = useMarket(marketId || "");
  const [showSettlementModal, setShowSettlementModal] = useState(false);

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
        <div className="text-gray-500">Cargando mercado...</div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error al cargar el mercado</p>
        <Link to="/markets">
          <Button>Volver a Mercados</Button>
        </Link>
      </div>
    );
  }

  const canSettle = market.status === "open" || market.status === "locked";

  return (
    <div>
      <div className="mb-6">
        <Link to="/markets" className="text-primary-600 hover:text-primary-700 text-sm mb-4 inline-block">
          ← Volver a Mercados
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{market.question}</h1>
            <div className="flex items-center gap-2">
              <Badge>{categoryLabels[market.category] || market.category}</Badge>
              <Badge>{statusLabels[market.status] || market.status}</Badge>
              {market.isUrgent && <Badge variant="danger">Urgente</Badge>}
            </div>
          </div>
          {canSettle && (
            <Button
              variant="danger"
              onClick={() => setShowSettlementModal(true)}
            >
              Liquidar Mercado
            </Button>
          )}
        </div>
      </div>

      {market.description && (
        <Card className="mb-6">
          <p className="text-gray-700">{market.description}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Probabilidades</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Sí</span>
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
            <CardTitle>Estadísticas</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Volumen Total</span>
              <span className="font-semibold">${market.totalVolume.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Volumen Sí</span>
              <span className="font-semibold text-green-600">
                ${market.siVolume.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Volumen No</span>
              <span className="font-semibold text-red-600">
                ${market.noVolume.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total de Apuestas</span>
              <span className="font-semibold">{market.totalBets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Apostadores Únicos</span>
              <span className="font-semibold">{market.uniqueBettors}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Mercado</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Creado</span>
            <span className="font-medium">{formatDate(market.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Abre</span>
            <span className="font-medium">{formatDate(market.openAt)}</span>
          </div>
          {market.lockAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Cierra</span>
              <span className="font-medium">{formatDate(market.lockAt)}</span>
            </div>
          )}
          {market.settledAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Liquidado</span>
              <span className="font-medium">{formatDate(market.settledAt)}</span>
            </div>
          )}
          {market.result && (
            <div className="flex justify-between">
              <span className="text-gray-600">Resultado</span>
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
    </div>
  );
}
