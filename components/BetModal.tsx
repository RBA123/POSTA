import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "./ui/Button";
import Colors from "../constants/Colors";

interface Market {
  id: string;
  question: string;
  siProbability: number;
  noProbability: number;
  volume: string;
  category: string;
}

interface BetModalProps {
  market: Market;
  side: "si" | "no";
  balance: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  isLoading?: boolean;
}

const presetAmounts = [5, 10, 25, 50];

const BetModal: React.FC<BetModalProps> = ({
  market,
  side,
  balance,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [amount, setAmount] = useState("10");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountNum = parseFloat(amount) || 0;
  const probability =
    side === "si" ? market.siProbability : market.noProbability;
  const potentialWin = (amountNum / (probability / 100)).toFixed(2);

  const handleConfirm = async () => {
    if (amountNum > 0 && amountNum <= balance && !isSubmitting && !isLoading) {
      setIsSubmitting(true);
      console.log('🎯 BetModal: Confirming bet, amount:', amountNum);
      onConfirm(amountNum);
      // Don't reset isSubmitting - let the parent component close the modal
    }
  };

  const isButtonDisabled = amountNum <= 0 || amountNum > balance || isLoading || isSubmitting;

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable className="bg-card rounded-t-3xl p-6 pb-8">
          <ScrollView>
            {/* Close Button */}
            <Pressable
              onPress={onClose}
              className="absolute top-4 right-4 p-2 z-10"
            >
              <Ionicons name="close" size={24} color={Colors.foregroundMuted} />
            </Pressable>

            {/* Header */}
            <View className="items-center mb-6">
              <View
                className={`px-4 py-1 rounded-full mb-3 ${
                  side === "si" ? "bg-success/10" : "bg-destructive/10"
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    side === "si" ? "text-success" : "text-destructive"
                  }`}
                >
                  {side === "si" ? "SÍ" : "NO"} • {probability}%
                </Text>
              </View>
              <Text className="text-lg font-bold text-card-foreground text-center">
                {market.question}
              </Text>
            </View>

            {/* Amount Input */}
            <View className="mb-6">
              <Text className="text-sm text-muted-foreground mb-2">
                ¿Cuánto quieres apostar?
              </Text>
              <View className="relative">
                <Text className="absolute left-4 top-1/2 text-xl font-bold text-muted-foreground">
                  $
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={(text) => {
                    const num = parseFloat(text) || 0;
                    const clamped = Math.max(0, Math.min(balance, num));
                    setAmount(clamped.toString());
                  }}
                  keyboardType="numeric"
                  className="w-full h-16 pl-10 pr-4 text-3xl font-bold text-center bg-secondary rounded-[12px] border-2 border-transparent"
                  style={{ borderRadius: 12 }}
                  placeholder="0"
                  placeholderTextColor={Colors.foregroundMuted}
                />
              </View>
            </View>

            {/* Preset Amounts */}
            <View className="flex-row gap-2 mb-6">
              {presetAmounts.map((preset) => (
                <Pressable
                  key={preset}
                  onPress={() => setAmount(preset.toString())}
                  className={`flex-1 py-3 rounded-[12px] font-semibold ${
                    amountNum === preset ? "bg-primary" : "bg-secondary"
                  }`}
                  style={{ borderRadius: 12 }}
                >
                  <Text
                    className={`text-center ${
                      amountNum === preset
                        ? "text-white"
                        : "text-secondary-foreground"
                    }`}
                  >
                    ${preset}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Potential Win */}
            <View
              className="bg-secondary/50 rounded-[12px] p-4 mb-6"
              style={{ borderRadius: 12 }}
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-muted-foreground">
                  Ganancia potencial
                </Text>
                <Text className="text-2xl font-bold text-success">
                  ${potentialWin}
                </Text>
              </View>
            </View>

            {/* Balance Info */}
            <Text className="text-center text-sm text-muted-foreground mb-4">
              Balance disponible:{" "}
              <Text className="font-semibold text-foreground">
                ${balance.toFixed(2)}
              </Text>
            </Text>

            {/* Confirm Button */}
            <Button
              variant={side === "si" ? "success" : "destructive"}
              size="lg"
              className="w-full"
              onPress={handleConfirm}
              disabled={isButtonDisabled}
              loading={isLoading || isSubmitting}
            >
              <Text className="text-white font-semibold">
                Confirmar apuesta
              </Text>
            </Button>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default BetModal;
