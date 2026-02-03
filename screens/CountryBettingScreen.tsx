import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../types/navigation";
import { CountryBet } from "../types";
import { useBets } from "../hooks/useBets";
import { useUserProfile } from "../hooks/useUserProfile";
import { useAuth } from "../hooks/useAuth";
import Colors from "../constants/Colors";

type CountryBettingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CountryBetting"
>;

type CountryBettingScreenRouteProp = RouteProp<
  RootStackParamList,
  "CountryBetting"
>;

interface Props {
  navigation: CountryBettingScreenNavigationProp;
  route: CountryBettingScreenRouteProp;
}

const CountryBettingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { market } = route.params;
  const { user: authUser } = useAuth();
  const { placeBet } = useBets(authUser?.uid || null);
  const { profile } = useUserProfile(authUser?.uid || null);
  const [loadingBet, setLoadingBet] = useState<string | null>(null);

  const balance = profile?.virtualBalance || 0;

  const handleBet = async (
    country: CountryBet,
    side: "si" | "no",
    amount: number,
  ) => {
    if (amount > balance) {
      Alert.alert(
        "Saldo insuficiente",
        "No tienes suficiente saldo para hacer esta apuesta.",
      );
      return;
    }

    const betKey = `${country.code}-${side}`;
    setLoadingBet(betKey);

    try {
      const result = await placeBet(market.id, side, amount);

      if (result.success) {
        Alert.alert(
          "¡Apuesta confirmada!",
          `Has apostado ${amount}¢ en ${country.name} - ${side === "si" ? "Sí" : "No"}`,
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        Alert.alert("Error", "No se pudo procesar la apuesta");
      }
    } catch (error) {
      Alert.alert("Error", "Hubo un problema al procesar tu apuesta");
    } finally {
      setLoadingBet(null);
    }
  };

  const calculatePotentialWin = (
    amount: number,
    probability: number,
  ): number => {
    return Math.round(amount / (probability / 100));
  };

  const renderCountryRow = (country: CountryBet) => {
    const defaultBetAmount = 10;
    const siPotentialWin = calculatePotentialWin(
      defaultBetAmount,
      country.siProbability,
    );
    const noPotentialWin = calculatePotentialWin(
      defaultBetAmount,
      country.noProbability,
    );

    const siLoadingKey = `${country.code}-si`;
    const noLoadingKey = `${country.code}-no`;

    return (
      <View
        key={country.code}
        className="flex-row items-center justify-between py-4 border-b border-border"
      >
        {/* Country Info */}
        <View className="flex-row items-center flex-1">
          <Text className="text-3xl mr-3">{country.flag}</Text>
          <View className="flex-1">
            <Text className="text-white font-semibold text-base">
              {country.name}
            </Text>
            <Text className="text-text-secondary text-sm">
              {country.siProbability}%
            </Text>
          </View>
        </View>

        {/* Bet Buttons */}
        <View className="flex-row gap-2">
          {/* Yes Button */}
          <Pressable
            onPress={() => handleBet(country, "si", defaultBetAmount)}
            disabled={loadingBet !== null}
            className="bg-blue-500/20 rounded-lg px-4 py-3 min-w-[80px]"
            style={({ pressed }) => ({
              opacity: pressed || loadingBet !== null ? 0.7 : 1,
            })}
          >
            {loadingBet === siLoadingKey ? (
              <ActivityIndicator size="small" color={Colors.primary500} />
            ) : (
              <View>
                <Text className="text-blue-400 font-bold text-center text-sm">
                  Yes {defaultBetAmount}¢
                </Text>
                <Text className="text-blue-300 text-center text-xs mt-1">
                  +{siPotentialWin}¢
                </Text>
              </View>
            )}
          </Pressable>

          {/* No Button */}
          <Pressable
            onPress={() => handleBet(country, "no", defaultBetAmount)}
            disabled={loadingBet !== null}
            className="bg-purple-500/20 rounded-lg px-4 py-3 min-w-[80px]"
            style={({ pressed }) => ({
              opacity: pressed || loadingBet !== null ? 0.7 : 1,
            })}
          >
            {loadingBet === noLoadingKey ? (
              <ActivityIndicator size="small" color="#A855F7" />
            ) : (
              <View>
                <Text className="text-purple-400 font-bold text-center text-sm">
                  No {defaultBetAmount}¢
                </Text>
                <Text className="text-purple-300 text-center text-xs mt-1">
                  +{noPotentialWin}¢
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  if (!market.countryBets || market.countryBets.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <View className="px-4 py-3 border-b border-border">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={Colors.foreground} />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-text-primary text-center">
            No hay países disponibles para este mercado
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 py-3 border-b border-border">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={Colors.foreground} />
          </Pressable>
          <View className="bg-card px-3 py-1 rounded-full">
            <Text className="text-text-secondary text-sm">
              Balance: {balance}¢
            </Text>
          </View>
        </View>
        <Text className="text-white text-lg font-bold mb-2">
          {market.question}
        </Text>
        <Text className="text-text-secondary text-sm">
          Selecciona un país y elige tu apuesta
        </Text>
      </View>

      {/* Country List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4">
          {market.countryBets.map((country) => renderCountryRow(country))}
        </View>

        {/* Bottom spacing */}
        <View className="h-6" />
      </ScrollView>
    </View>
  );
};

export default CountryBettingScreen;
