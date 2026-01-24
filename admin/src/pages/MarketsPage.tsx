import { useState } from "react";
import { useMarkets } from "../hooks/useMarkets";
import { MarketFilters } from "../components/MarketFilters";
import { MarketCard } from "../components/MarketCard";
import { Button } from "../components/ui/Button";
import { Link } from "react-router-dom";
import type { MarketCategory, MarketStatus } from "../types";

export function MarketsPage() {
  const [category, setCategory] = useState<MarketCategory | "all">("all");
  const [status, setStatus] = useState<MarketStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { markets, loading } = useMarkets({ category, status, searchQuery });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando mercados...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mercados</h1>
        <Link to="/markets/create">
          <Button>Crear Mercado</Button>
        </Link>
      </div>

      <MarketFilters
        category={category}
        status={status}
        searchQuery={searchQuery}
        onCategoryChange={setCategory}
        onStatusChange={setStatus}
        onSearchChange={setSearchQuery}
      />

      {markets.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500 mb-4">No se encontraron mercados</p>
          <Link to="/markets/create">
            <Button>Crear Primer Mercado</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
