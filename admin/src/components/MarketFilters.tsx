import { useState } from "react";
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
          Buscar mercado
        </label>
        <Input
          type="text"
          placeholder="Buscar por pregunta..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as MarketCategory | "all")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todas</option>
            <option value="en_vivo">⚡ EN VIVO</option>
            <option value="partidos">⚽ Partidos</option>
            <option value="torneos">🏆 Torneos</option>
            <option value="fase_grupos">👥 Fase de Grupos</option>
            <option value="jugadores">👤 Jugadores</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as MarketStatus | "all")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todos</option>
            <option value="draft">Borrador</option>
            <option value="open">Abierto</option>
            <option value="locked">Cerrado</option>
            <option value="settled">Liquidado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>
    </div>
  );
}
