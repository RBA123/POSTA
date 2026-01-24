import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import type { Market } from "../types";

interface MarketCardProps {
  market: Market;
}

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

const statusVariants: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  draft: "default",
  open: "success",
  locked: "warning",
  settled: "info",
  cancelled: "danger",
};

export function MarketCard({ market }: MarketCardProps) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, "dd MMM yyyy, HH:mm", { locale: es });
    } catch {
      return "N/A";
    }
  };

  return (
    <Link to={`/markets/${market.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {market.question}
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default">{categoryLabels[market.category] || market.category}</Badge>
              <Badge variant={statusVariants[market.status] || "default"}>
                {statusLabels[market.status] || market.status}
              </Badge>
              {market.isUrgent && (
                <Badge variant="danger">Urgente</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Probabilidad Sí</p>
            <p className="text-lg font-semibold text-green-600">{market.siProbability}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Probabilidad No</p>
            <p className="text-lg font-semibold text-red-600">{market.noProbability}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-gray-500">Volumen Total</p>
            <p className="font-medium">${market.totalVolume.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Apuestas</p>
            <p className="font-medium">{market.totalBets}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
          <p>Abre: {formatDate(market.openAt)}</p>
          {market.lockAt && <p>Cierra: {formatDate(market.lockAt)}</p>}
          {market.settledAt && <p>Liquidado: {formatDate(market.settledAt)}</p>}
        </div>
      </Card>
    </Link>
  );
}
