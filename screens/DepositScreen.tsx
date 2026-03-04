import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";
import { useUserProfile } from "../hooks/useUserProfile";
import { useKycStatus } from "../hooks/useKycStatus";
import { useFeeEstimate } from "../hooks/useFeeEstimate";
import { createDeposit } from "../services/dlocal.service";
import { formatCents, dollarsToCents } from "../lib/currency";
import {
  DEPOSIT_MIN_CENTS,
  DEPOSIT_MAX_CENTS,
} from "../constants/Ecuador";
import Colors from "../constants/Colors";

const QUICK_AMOUNTS = [500, 1000, 2500, 5000]; // $5, $10, $25, $50

const DepositScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.uid || null);
  const { isVerified } = useKycStatus();

  const [amountText, setAmountText] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [loading, setLoading] = useState(false);

  const amountCents = useMemo(() => {
    const parsed = parseFloat(amountText);
    return isNaN(parsed) ? 0 : dollarsToCents(parsed);
  }, [amountText]);

  const { estimate } = useFeeEstimate("deposit", amountCents);

  const amountError = useMemo(() => {
    if (!amountText) return undefined;
    if (amountCents < DEPOSIT_MIN_CENTS) {
      return `Mínimo ${formatCents(DEPOSIT_MIN_CENTS)}`;
    }
    if (amountCents > DEPOSIT_MAX_CENTS) {
      return `Máximo ${formatCents(DEPOSIT_MAX_CENTS)}`;
    }
    return undefined;
  }, [amountText, amountCents]);

  const isFormValid = useMemo(() => {
    return (
      amountCents >= DEPOSIT_MIN_CENTS &&
      amountCents <= DEPOSIT_MAX_CENTS &&
      cardNumber.replace(/\s/g, "").length >= 15 &&
      /^\d{2}\/\d{2}$/.test(cardExpiry) &&
      cardCvv.length >= 3 &&
      cardHolderName.trim().length >= 2
    );
  }, [amountCents, cardNumber, cardExpiry, cardCvv, cardHolderName]);

  const handleQuickAmount = useCallback((cents: number) => {
    setAmountText((cents / 100).toString());
  }, []);

  const formatCardNumber = useCallback((text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, "$1 ").trim();
    setCardNumber(formatted);
  }, []);

  const formatExpiry = useCallback((text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) {
      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setCardExpiry(digits);
    }
  }, []);

  const handleDeposit = async () => {
    if (!isFormValid) return;

    setLoading(true);
    try {
      await createDeposit({
        amountCents,
        cardNumber: cardNumber.replace(/\s/g, ""),
        cardExpiry,
        cardCvv,
        cardHolderName: cardHolderName.trim(),
      });
      Alert.alert(
        "Depósito exitoso",
        `Se acreditaron ${formatCents(estimate?.netAmountCents || amountCents)} a tu cuenta.`,
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudo procesar el depósito",
      );
    } finally {
      setLoading(false);
    }
  };

  // KYC gate
  if (!isVerified) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
          </Pressable>
          <Text className="text-lg font-bold text-foreground ml-2">
            Depositar
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="shield-checkmark-outline" size={64} color={Colors.foregroundMuted} />
          <Text className="text-lg font-bold text-foreground mt-4 text-center">
            Verificación requerida
          </Text>
          <Text className="text-muted-foreground text-center mt-2 mb-6">
            Debes verificar tu identidad antes de realizar depósitos.
          </Text>
          <Button
            variant="default"
            onPress={() => navigation.navigate("KYC" as never)}
          >
            <Text className="text-white font-semibold">Verificar identidad</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
          </Pressable>
          <Text className="text-lg font-bold text-foreground ml-2">
            Depositar
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-6 py-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Current Balance */}
          <View className="bg-card rounded-xl p-4 mb-6">
            <Text className="text-sm text-muted-foreground">Saldo real</Text>
            <Text className="text-2xl font-bold text-foreground">
              {formatCents(profile?.realBalance || 0)}
            </Text>
          </View>

          <View className="gap-5">
            {/* Amount */}
            <Input
              label="Monto (USD)"
              value={amountText}
              onChangeText={setAmountText}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={amountError}
            />

            {/* Quick Select */}
            <View className="flex-row gap-2">
              {QUICK_AMOUNTS.map((cents) => (
                <Pressable
                  key={cents}
                  onPress={() => handleQuickAmount(cents)}
                  className={`flex-1 py-2 rounded-lg items-center ${
                    amountCents === cents
                      ? "bg-primary500"
                      : "bg-secondary"
                  }`}
                  style={
                    amountCents === cents
                      ? { backgroundColor: Colors.primary500 }
                      : undefined
                  }
                >
                  <Text
                    className={`font-semibold ${
                      amountCents === cents
                        ? "text-white"
                        : "text-foreground"
                    }`}
                  >
                    {formatCents(cents)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Card Number */}
            <Input
              label="Número de tarjeta"
              value={cardNumber}
              onChangeText={formatCardNumber}
              placeholder="1234 5678 9012 3456"
              keyboardType="numeric"
              maxLength={19}
            />

            {/* Expiry + CVV */}
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Vencimiento"
                  value={cardExpiry}
                  onChangeText={formatExpiry}
                  placeholder="MM/YY"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="CVV"
                  value={cardCvv}
                  onChangeText={(t) => setCardCvv(t.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Cardholder Name */}
            <Input
              label="Nombre del titular"
              value={cardHolderName}
              onChangeText={setCardHolderName}
              placeholder="Como aparece en la tarjeta"
              autoCapitalize="characters"
            />

            {/* Fee Disclosure */}
            {estimate && amountCents > 0 && (
              <View className="bg-secondary rounded-xl p-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-muted-foreground">Monto</Text>
                  <Text className="text-foreground font-medium">
                    {formatCents(estimate.grossAmountCents)}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-muted-foreground">Comisión</Text>
                  <Text className="text-foreground font-medium">
                    {estimate.feeCents === 0
                      ? "Gratis"
                      : formatCents(estimate.feeCents)}
                  </Text>
                </View>
                <View className="border-t border-border pt-2 flex-row justify-between">
                  <Text className="text-foreground font-bold">
                    Total a recibir
                  </Text>
                  <Text className="text-foreground font-bold">
                    {formatCents(estimate.netAmountCents)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Submit */}
          <View className="mt-8 mb-4">
            <Button
              variant="default"
              size="lg"
              onPress={handleDeposit}
              disabled={!isFormValid || loading}
              loading={loading}
              className="w-full"
            >
              <Text className="text-white font-semibold">
                Confirmar depósito
              </Text>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default DepositScreen;
