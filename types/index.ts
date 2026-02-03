export type Category =
  | "en_vivo"
  | "partidos"
  | "torneos"
  | "fase_grupos"
  | "jugadores";

export interface CountryBet {
  code: string;
  name: string;
  flag: string;
  siProbability: number;
  noProbability: number;
}

export interface Market {
  id: string;
  question: string;
  siProbability: number;
  noProbability: number;
  volume: string;
  category: Category | string; // Allow string to be compatible if needed, or strictly Category
  isUrgent?: boolean;
  endTime?: number;
  countryBets?: CountryBet[]; // For multi-country betting markets
}
