import React, { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import Colors from "../constants/Colors";

import { Market } from "../types";

interface MarketCardProps {
  market: Market;
  onBet: (market: Market, side: "si" | "no") => void;
  onCountryBet?: (market: Market) => void;
}

const MarketCard: React.FC<MarketCardProps> = ({
  market,
  onBet,
  onCountryBet,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const isMultiCountry = market.countryBets && market.countryBets.length > 0;

  useEffect(() => {
    if (market.isUrgent && market.endTime) {
      const updateTimer = () => {
        const remaining = Math.max(0, market.endTime! - Date.now());
        setTimeLeft(remaining);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [market.isUrgent, market.endTime]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <Card className={market.isUrgent ? "border-primary-100 border-2" : ""}>
      {/* Urgent Badge with Timer */}
      {market.isUrgent && (
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <View className="w-2 h-2 rounded-full bg-primary" />
            <Text className="text-xs font-semibold text-primary uppercase tracking-wide">
              EN VIVO
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary-100">
            <Ionicons name="time-outline" size={16} color={Colors.primary500} />
            <Text className="text-sm font-bold text-primary tabular-nums">
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>
      )}

      {/* Multi-Country Badge */}
      {isMultiCountry && (
        <View className="flex-row items-center gap-2 mb-3">
          <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <Ionicons name="earth" size={16} color="#3B82F6" />
            <Text className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
              {market.countryBets!.length} Países
            </Text>
          </View>
        </View>
      )}

      {/* Question */}
      <Text className="text-lg font-bold text-card-foreground mb-4 leading-tight">
        {market.question}
      </Text>

      {/* Probability Bar */}
      <View className="mb-4">
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-success font-semibold">
            Sí {market.siProbability}%
          </Text>
          <Text className="text-sm text-destructive font-semibold">
            No {market.noProbability}%
          </Text>
        </View>
        <View className="h-2 rounded-full bg-secondary overflow-hidden flex-row">
          <View
            className="h-full bg-success"
            style={{ width: `${market.siProbability}%` }}
          />
          <View
            className="h-full bg-destructive"
            style={{ width: `${market.noProbability}%` }}
          />
        </View>
      </View>

      {/* Bet Buttons */}
      {isMultiCountry ? (
        <Button
          variant="default"
          className="mb-3"
          onPress={() => onCountryBet?.(market)}
        >
          <View className="flex-row items-center justify-center gap-2">
            <Ionicons name="earth" size={20} color="white" />
            <Text className="text-white font-semibold">
              Ver países y apostar
            </Text>
          </View>
        </Button>
      ) : (
        <View className="flex-row gap-3 mb-3">
          <Button
            variant="si"
            className="flex-1"
            onPress={() => onBet(market, "si")}
          >
            <Text className="text-white font-semibold">Sí</Text>
          </Button>
          <Button
            variant="no"
            className="flex-1"
            onPress={() => onBet(market, "no")}
          >
            <Text className="text-white font-semibold">No</Text>
          </Button>
        </View>
      )}

      {/* Volume */}
      <Text className="text-center text-sm text-muted-foreground">
        Volumen: {market.volume}
      </Text>
    </Card>
  );
};

export default MarketCard;
