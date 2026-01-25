import { Input } from "./ui/Input";
import type { MarketCategory, MarketStatus } from "../types";

interface MarketFiltersProps {
  category: MarketCategory | "all";
  status: MarketStatus | "all";
  searchQuery: string;
  onCategoryChange: (category: MarketCategory | "all") => void;
  onStatusChange: (status: MarketStatus | "all") => void;
  onSearchChange: (query: string) => void;
}

export function MarketFilters({
  category,
  status,
  searchQuery,
  onCategoryChange,
  onStatusChange,
  onSearchChange,
}: MarketFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search market
        </label>
        <Input
          type="text"
          placeholder="Search by question..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as MarketCategory | "all")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All</option>
            <option value="en_vivo">⚡ LIVE</option>
            <option value="partidos">⚽ Matches</option>
            <option value="torneos">🏆 Tournaments</option>
            <option value="fase_grupos">👥 Group Stage</option>
            <option value="jugadores">👤 Players</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as MarketStatus | "all")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="locked">Locked</option>
            <option value="settled">Settled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </div>
  );
}
