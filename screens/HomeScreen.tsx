import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { BOTTOM_NAV_HEIGHT } from "../constants/Layout";
import { Button } from "../components/ui/Button";
import MarketCard from "../components/MarketCard";
import BetModal from "../components/BetModal";
import ConfettiAnimation from "../components/ConfettiAnimation";
import BottomNav from "../components/BottomNav";
import CountdownBanner from "../components/CountdownBanner";
import { Storage } from "../lib/storage";
import libertaLogo from "../assets/liberta-logo.png";

import { Market, Category } from "../types";

const countryNames: Record<string, string> = {
  AR: "Argentina",
  MX: "México",
  BR: "Brasil",
  CO: "Colombia",
  CL: "Chile",
  PE: "Perú",
  EC: "Ecuador",
};

// EN VIVO markets
const enVivoMarkets: Market[] = [
  {
    id: "ev1",
    question: "¿Messi mete el penal?",
    siProbability: 72,
    noProbability: 28,
    volume: "$1.2M",
    category: "en_vivo",
    isUrgent: true,
    endTime: Date.now() + 120000,
  },
  {
    id: "ev2",
    question: "¿Mbappé mete el penal?",
    siProbability: 68,
    noProbability: 32,
    volume: "$890K",
    category: "en_vivo",
    isUrgent: true,
    endTime: Date.now() + 120000,
  },
  {
    id: "ev3",
    question: "¿Hay un gol en los próximos 5 minutos?",
    siProbability: 35,
    noProbability: 65,
    volume: "$450K",
    category: "en_vivo",
    isUrgent: true,
    endTime: Date.now() + 120000,
  },
];

// PARTIDOS markets
const partidosMarkets: Market[] = [
  {
    id: "p1",
    question: "México vs Sudáfrica: ¿Gana México?",
    siProbability: 55,
    noProbability: 45,
    volume: "$780K",
    category: "partidos",
  },
  {
    id: "p2",
    question: "Francia vs Senegal: ¿Gana Francia?",
    siProbability: 62,
    noProbability: 38,
    volume: "$1.1M",
    category: "partidos",
  },
  {
    id: "p3",
    question: "Inglaterra vs Croacia: ¿Gana Inglaterra?",
    siProbability: 48,
    noProbability: 52,
    volume: "$920K",
    category: "partidos",
  },
];

// TORNEOS markets
const torneosMarkets: Market[] = [
  {
    id: "t1",
    question: "¿Qué país gana la Copa del Mundo 2026?",
    siProbability: 18,
    noProbability: 82,
    volume: "$5.2M",
    category: "torneos",
  },
  {
    id: "t2",
    question: "¿Qué continente gana la Copa del Mundo 2026?",
    siProbability: 45,
    noProbability: 55,
    volume: "$2.8M",
    category: "torneos",
  },
  {
    id: "t3",
    question: "¿Argentina llega a la final del Mundial 2026?",
    siProbability: 42,
    noProbability: 58,
    volume: "$3.5M",
    category: "torneos",
  },
];

// FASE DE GRUPOS markets
const faseGruposMarkets: Market[] = [
  {
    id: "fg1",
    question: "¿Quién gana el Grupo A del Mundial 2026?",
    siProbability: 33,
    noProbability: 67,
    volume: "$1.4M",
    category: "fase_grupos",
  },
  {
    id: "fg2",
    question: "¿Argentina clasifica a octavos de final?",
    siProbability: 88,
    noProbability: 12,
    volume: "$2.1M",
    category: "fase_grupos",
  },
  {
    id: "fg3",
    question: "¿Brasil termina primero en su grupo?",
    siProbability: 65,
    noProbability: 35,
    volume: "$1.8M",
    category: "fase_grupos",
  },
];

// JUGADORES markets
const jugadoresMarkets: Market[] = [
  {
    id: "j1",
    question: "¿Lionel Messi juega el Mundial 2026?",
    siProbability: 78,
    noProbability: 22,
    volume: "$4.2M",
    category: "jugadores",
  },
  {
    id: "j2",
    question: "¿Mbappé es el goleador del Mundial 2026?",
    siProbability: 22,
    noProbability: 78,
    volume: "$1.9M",
    category: "jugadores",
  },
  {
    id: "j3",
    question: "¿Quién gana el Balón de Oro 2026?",
    siProbability: 30,
    noProbability: 70,
    volume: "$2.5M",
    category: "jugadores",
  },
];

const allMarkets: Record<Category, Market[]> = {
  en_vivo: enVivoMarkets,
  partidos: partidosMarkets,
  torneos: torneosMarkets,
  fase_grupos: faseGruposMarkets,
  jugadores: jugadoresMarkets,
};

const categories: { id: Category; label: string }[] = [
  { id: "en_vivo", label: "⚡ EN VIVO" },
  { id: "partidos", label: "⚽ Partidos" },
  { id: "torneos", label: "🏆 Torneos" },
  { id: "fase_grupos", label: "📊 Fase de Grupos" },
  { id: "jugadores", label: "👤 Jugadores" },
];

const HomeScreen: React.FC = () => {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [countryCode, setCountryCode] = useState<string>("AR");
  const countryName = countryNames[countryCode] || "Argentina";

  useEffect(() => {
    const loadCountry = async () => {
      const routeCountry = (route.params as any)?.country;
      if (routeCountry) {
        setCountryCode(routeCountry);
      } else {
        const savedCountry = await Storage.getItem("liberta_country");
        if (savedCountry) {
          setCountryCode(savedCountry);
        }
      }
    };
    loadCountry();
  }, [route.params]);

  const [activeCategory, setActiveCategory] = useState<Category>("en_vivo");
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [selectedSide, setSelectedSide] = useState<"si" | "no">("si");
  const [showConfetti, setShowConfetti] = useState(false);
  const [balance, setBalance] = useState(100);

  const markets = allMarkets[activeCategory] || [];
  const showCountdown = activeCategory === "en_vivo";

  const handleBet = (market: Market, side: "si" | "no") => {
    setSelectedMarket(market);
    setSelectedSide(side);
    setShowBetModal(true);
  };

  const handleConfirmBet = (amount: number) => {
    setShowBetModal(false);
    setBalance((prev) => prev - amount);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Confetti */}
      {showConfetti && <ConfettiAnimation />}

      {/* Header */}
      <View className="bg-background border-b border-border px-6 py-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Image source={libertaLogo} className="w-10 h-10 rounded-xl" />
            <View>
              <Text className="text-xl font-bold text-foreground">LIBERTA</Text>
              <Text className="text-xs text-muted-foreground">
                {countryName}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-xs text-muted-foreground">Tu balance</Text>
            <Text className="text-xl font-bold text-primary">
              ${balance.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Markets */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 20,
        }}
      >
        {/* Countdown Banner for EN VIVO */}
        {showCountdown && (
          <CountdownBanner
            endTime={markets.find((m) => m.isUrgent)?.endTime || Date.now()}
          />
        )}

        {/* Category Filter */}
        <View className="py-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 0 }}
          >
            <View className="flex-row gap-2">
              {categories.map((category) => {
                const isActive = activeCategory === category.id;
                return (
                  <Button
                    key={category.id}
                    variant={isActive ? "pillActive" : "pill"}
                    size="pill"
                    onPress={() => {
                      setActiveCategory(category.id);
                    }}
                  >
                    {category.label}
                  </Button>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Market Cards */}
        <View className="gap-4 pb-4 px-4">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} onBet={handleBet} />
          ))}

          {markets.length === 0 && (
            <View className="items-center py-12">
              <Text className="text-muted-foreground">
                No hay mercados disponibles en esta categoría
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bet Modal */}
      {showBetModal && selectedMarket && (
        <BetModal
          market={selectedMarket}
          side={selectedSide}
          balance={balance}
          onClose={() => setShowBetModal(false)}
          onConfirm={handleConfirmBet}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </SafeAreaView>
  );
};

export default HomeScreen;
