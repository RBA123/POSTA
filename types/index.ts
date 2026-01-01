export type Category =
    | "en_vivo"
    | "partidos"
    | "torneos"
    | "fase_grupos"
    | "jugadores";

export interface Market {
    id: string;
    question: string;
    siProbability: number;
    noProbability: number;
    volume: string;
    category: Category | string; // Allow string to be compatible if needed, or strictly Category
    isUrgent?: boolean;
    endTime?: number;
}
