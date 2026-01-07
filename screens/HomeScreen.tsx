import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebaseConfig";
import { BOTTOM_NAV_HEIGHT } from "../constants/Layout";
import { Button } from "../components/ui/Button";
import MarketCard from "../components/MarketCard";
import BetModal from "../components/BetModal";
import ConfettiAnimation from "../components/ConfettiAnimation";
import BottomNav from "../components/BottomNav";
import CountdownBanner from "../components/CountdownBanner";
import { Storage } from "../lib/storage";
import { subscribeToMarkets, subscribeToUser, formatVolume } from "../lib/firestore";
import { placeBet } from "../lib/functions";
import libertaLogo from "../assets/liberta-logo.png";

import { Market, Category } from "../types";
import type { Market as FirestoreMarket, User } from "../firebase/types/firestore.types";

const countryNames: Record<string, string> = {
  AR: "Argentina",
  MX: "México",
  BR: "Brasil",
  CO: "Colombia",
  CL: "Chile",
  PE: "Perú",
  EC: "Ecuador",
};

// Convert Firestore Market to UI Market format
function convertMarket(fm: FirestoreMarket): Market {
  return {
    id: fm.id,
    question: fm.question,
    siProbability: fm.siProbability,
    noProbability: fm.noProbability,
    volume: formatVolume(fm.totalVolume),
    category: fm.category as Category,
    isUrgent: fm.isUrgent,
    endTime: fm.lockAt?.toMillis(),
  };
}

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
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  // Subscribe to user data
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUser(userId, (userData) => {
      setUser(userData);
    });

    return unsubscribe;
  }, [userId]);

  // Subscribe to markets based on active category
  const [activeCategory, setActiveCategory] = useState<Category>("en_vivo");
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToMarkets(
      activeCategory as any,
      (firestoreMarkets) => {
        const convertedMarkets = firestoreMarkets.map(convertMarket);
        setMarkets(convertedMarkets);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [activeCategory]);

  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [selectedSide, setSelectedSide] = useState<"si" | "no">("si");
  const [showConfetti, setShowConfetti] = useState(false);
  const [placingBet, setPlacingBet] = useState(false);

  const balance = user?.virtualBalance || 0;
  const showCountdown = activeCategory === "en_vivo";

  const handleBet = (market: Market, side: "si" | "no") => {
    setSelectedMarket(market);
    setSelectedSide(side);
    setShowBetModal(true);
  };

  const handleConfirmBet = async (amount: number) => {
    if (!selectedMarket || !userId) return;

    setPlacingBet(true);
    try {
      await placeBet({
        marketId: selectedMarket.id,
        side: selectedSide,
        amount,
      });
      
      setShowBetModal(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (error) {
      console.error("Error placing bet:", error);
      // TODO: Show error toast
    } finally {
      setPlacingBet(false);
    }
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
          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#007AFF" />
              <Text className="text-muted-foreground mt-4">
                Cargando mercados...
              </Text>
            </View>
          ) : (
            <>
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
            </>
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
