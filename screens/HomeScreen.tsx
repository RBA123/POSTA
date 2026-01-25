import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { BOTTOM_NAV_HEIGHT } from "../constants/Layout";
import { Button } from "../components/ui/Button";
import MarketCard from "../components/MarketCard";
import BetModal from "../components/BetModal";
import ConfettiAnimation from "../components/ConfettiAnimation";
import BottomNav from "../components/BottomNav";
import CountdownBanner from "../components/CountdownBanner";
import CategoryFilter from "../components/CategoryFilter";
import { Storage } from "../lib/storage";
import { formatVolume } from "../lib/firestore";
import { useAuth } from "../hooks/useAuth";
import { useUserProfile } from "../hooks/useUserProfile";
import { useMarkets } from "../hooks/useMarkets";
import { useBets } from "../hooks/useBets";
import libertaLogo from "../assets/liberta-logo.png";
import Colors from "../constants/Colors";

import { Market, Category } from "../types";
import type { Market as FirestoreMarket } from "../firebase/types/firestore.types";

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
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(authUser?.uid || null);
  const [countryCode, setCountryCode] = useState<string>("AR");
  const countryName = countryNames[countryCode] || "Argentina";
  const [activeCategory, setActiveCategory] = useState<Category>("en_vivo");
  
  // Use markets hook
  const { markets: firestoreMarkets, loading: marketsLoading, error: marketsError } = useMarkets(
    activeCategory as any,
    true // real-time updates
  );

  // Convert Firestore markets to UI format
  const markets = firestoreMarkets.map(convertMarket);
  const loading = marketsLoading || profileLoading;

  // Debug: Log markets when they change
  useEffect(() => {
    console.log(`🏠 HomeScreen: ${markets.length} markets loaded for category "${activeCategory}"`);
    if (markets.length > 0) {
      console.log('First market:', markets[0].question);
    }
  }, [markets, activeCategory]);

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

  // Redirect to welcome if not authenticated
  useEffect(() => {
    if (!authUser) {
      navigation.navigate("Welcome" as never);
    }
  }, [authUser, navigation]);

  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [selectedSide, setSelectedSide] = useState<"si" | "no">("si");
  const [showConfetti, setShowConfetti] = useState(false);

  // Use bets hook for placing bets
  const { placeBet: placeBetHook } = useBets(authUser?.uid || null);

  const balance = profile?.virtualBalance || 0;
  // Only show countdown if we're in "en_vivo" category AND there's an urgent market with time remaining
  const urgentMarket = markets.find((m) => m.isUrgent);
  const showCountdown = activeCategory === "en_vivo" && urgentMarket && urgentMarket.endTime && urgentMarket.endTime > Date.now();

  const handleBet = (market: Market, side: "si" | "no") => {
    if (!authUser) {
      Alert.alert("Error", "Debes iniciar sesión para apostar");
      navigation.navigate("Welcome" as never);
      return;
    }
    setSelectedMarket(market);
    setSelectedSide(side);
    setShowBetModal(true);
  };

  const handleConfirmBet = async (amount: number) => {
    if (!selectedMarket || !authUser) return;

    try {
      await placeBetHook(selectedMarket.id, selectedSide, amount);
      setShowBetModal(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (error: any) {
      Alert.alert("Error al apostar", error.message || "Por favor intenta de nuevo");
    }
  };

  // Show error if markets fail to load
  useEffect(() => {
    if (marketsError) {
      Alert.alert("Error", "No se pudieron cargar los mercados. Por favor intenta de nuevo.");
    }
  }, [marketsError]);

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
        {showCountdown && urgentMarket?.endTime && (
          <CountdownBanner
            endTime={urgentMarket.endTime}
          />
        )}

        {/* Category Filter */}
        <CategoryFilter
          options={categories}
          activeFilter={activeCategory}
          onFilterChange={setActiveCategory}
        />

        {/* Market Cards */}
        <View className="gap-4 pb-4 px-4">
          {loading ? (
            <View className="items-center justify-center flex-1 py-12">
              <ActivityIndicator size="large" color={Colors.primary500} />
              <Text className="text-muted-foreground mt-4">
                Cargando mercados...
              </Text>
            </View>
          ) : (
            <>
              {markets.map((market) => (
                <MarketCard key={market.id} market={market} onBet={handleBet} />
              ))}

              {markets.length === 0 && !loading && (
                <View className="items-center py-12">
                  <Text className="text-muted-foreground">
                    No hay mercados disponibles en esta categoría
                  </Text>
                  {marketsError && (
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => {
                        // Retry by refetching markets
                        // Markets will auto-refresh via real-time subscription
                      }}
                      className="mt-4"
                    >
                      <Text>Reintentar</Text>
                    </Button>
                  )}
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
