import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
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
import { createWithdrawal } from "../services/dlocal.service";
import { formatCents, dollarsToCents, centsToDollars } from "../lib/currency";
import {
  WITHDRAWAL_MIN_CENTS,
  ECUADOR_BANKS,
  ACCOUNT_TYPES,
} from "../constants/Ecuador";
import Colors from "../constants/Colors";

const WithdrawScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.uid || null);
  const { isVerified } = useKycStatus();

  const [amountText, setAmountText] = useState("");
  const [selectedBank, setSelectedBank] = useState<typeof ECUADOR_BANKS[0] | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState(ACCOUNT_TYPES[0]);
  const [beneficiaryName, setBeneficiaryName] = useState(
    profile?.kycFullName || "",
  );
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showAccountTypePicker, setShowAccountTypePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const realBalance = profile?.realBalance || 0;

  const amountCents = useMemo(() => {
    const parsed = parseFloat(amountText);
    return isNaN(parsed) ? 0 : dollarsToCents(parsed);
  }, [amountText]);

  const { estimate } = useFeeEstimate("withdrawal", amountCents);

  const amountError = useMemo(() => {
    if (!amountText) return undefined;
    if (amountCents < WITHDRAWAL_MIN_CENTS) {
      return `Mínimo ${formatCents(WITHDRAWAL_MIN_CENTS)}`;
    }
    if (amountCents > realBalance) {
      return "Saldo insuficiente";
    }
    return undefined;
  }, [amountText, amountCents, realBalance]);

  const isFormValid = useMemo(() => {
    return (
      amountCents >= WITHDRAWAL_MIN_CENTS &&
      amountCents <= realBalance &&
      selectedBank !== null &&
      accountNumber.trim().length >= 5 &&
      beneficiaryName.trim().length >= 2
    );
  }, [amountCents, realBalance, selectedBank, accountNumber, beneficiaryName]);

  const handleMax = useCallback(() => {
    setAmountText(centsToDollars(realBalance).toString());
  }, [realBalance]);

  const handleWithdraw = async () => {
    if (!isFormValid || !selectedBank) return;

    setLoading(true);
    try {
      await createWithdrawal({
        amountCents,
        bankCode: selectedBank.code,
        bankAccountNumber: accountNumber.trim(),
        bankAccountType: accountType.code,
        beneficiaryName: beneficiaryName.trim(),
      });
      Alert.alert(
        "Retiro solicitado",
        "Tu retiro está siendo procesado. Recibirás el dinero en tu cuenta bancaria.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudo procesar el retiro",
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
            Retirar
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="shield-checkmark-outline" size={64} color={Colors.foregroundMuted} />
          <Text className="text-lg font-bold text-foreground mt-4 text-center">
            Verificación requerida
          </Text>
          <Text className="text-muted-foreground text-center mt-2 mb-6">
            Debes verificar tu identidad antes de realizar retiros.
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
            Retirar
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-6 py-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Current Balance */}
          <View className="bg-card rounded-xl p-4 mb-6">
            <Text className="text-sm text-muted-foreground">Saldo disponible</Text>
            <Text className="text-2xl font-bold text-foreground">
              {formatCents(realBalance)}
            </Text>
          </View>

          <View className="gap-5">
            {/* Amount with Max button */}
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-medium text-foreground">
                  Monto (USD)
                </Text>
                <Pressable onPress={handleMax}>
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: Colors.primary500 }}
                  >
                    Máximo
                  </Text>
                </Pressable>
              </View>
              <Input
                value={amountText}
                onChangeText={setAmountText}
                placeholder="0.00"
                keyboardType="decimal-pad"
                error={amountError}
              />
            </View>

            {/* Bank Picker */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Banco
              </Text>
              <Pressable
                onPress={() => setShowBankPicker(true)}
                className="h-12 px-4 rounded-lg border border-border bg-card flex-row items-center justify-between"
              >
                <Text
                  className={
                    selectedBank ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  {selectedBank?.name || "Seleccionar banco"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={Colors.foregroundMuted}
                />
              </Pressable>
            </View>

            {/* Account Number */}
            <Input
              label="Número de cuenta"
              value={accountNumber}
              onChangeText={(t) => setAccountNumber(t.replace(/\D/g, ""))}
              placeholder="Número de cuenta bancaria"
              keyboardType="numeric"
            />

            {/* Account Type Picker */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Tipo de cuenta
              </Text>
              <Pressable
                onPress={() => setShowAccountTypePicker(true)}
                className="h-12 px-4 rounded-lg border border-border bg-card flex-row items-center justify-between"
              >
                <Text className="text-foreground">{accountType.label}</Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={Colors.foregroundMuted}
                />
              </Pressable>
            </View>

            {/* Beneficiary Name */}
            <Input
              label="Nombre del beneficiario"
              value={beneficiaryName}
              onChangeText={setBeneficiaryName}
              placeholder="Nombre completo"
              autoCapitalize="words"
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

            {/* Min withdrawal notice */}
            <Text className="text-xs text-muted-foreground text-center">
              Retiro mínimo: {formatCents(WITHDRAWAL_MIN_CENTS)}
            </Text>
          </View>

          {/* Submit */}
          <View className="mt-8 mb-4">
            <Button
              variant="default"
              size="lg"
              onPress={handleWithdraw}
              disabled={!isFormValid || loading}
              loading={loading}
              className="w-full"
            >
              <Text className="text-white font-semibold">Confirmar retiro</Text>
            </Button>
          </View>
        </ScrollView>

        {/* Bank Picker Modal */}
        <Modal
          visible={showBankPicker}
          transparent
          animationType="none"
          onRequestClose={() => setShowBankPicker(false)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setShowBankPicker(false)}
          >
            <View className="bg-card rounded-t-3xl p-4 max-h-96">
              <Text className="text-lg font-bold text-foreground mb-4 px-4">
                Seleccionar banco
              </Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {ECUADOR_BANKS.map((bank) => (
                  <Pressable
                    key={bank.code}
                    onPress={() => {
                      setSelectedBank(bank);
                      setShowBankPicker(false);
                    }}
                    className="flex-row items-center justify-between p-4"
                  >
                    <Text className="text-foreground">{bank.name}</Text>
                    {selectedBank?.code === bank.code && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={Colors.primary500}
                      />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

        {/* Account Type Picker Modal */}
        <Modal
          visible={showAccountTypePicker}
          transparent
          animationType="none"
          onRequestClose={() => setShowAccountTypePicker(false)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setShowAccountTypePicker(false)}
          >
            <View className="bg-card rounded-t-3xl p-4">
              <Text className="text-lg font-bold text-foreground mb-4 px-4">
                Tipo de cuenta
              </Text>
              {ACCOUNT_TYPES.map((at) => (
                <Pressable
                  key={at.code}
                  onPress={() => {
                    setAccountType(at);
                    setShowAccountTypePicker(false);
                  }}
                  className="flex-row items-center justify-between p-4"
                >
                  <Text className="text-foreground">{at.label}</Text>
                  {at.code === accountType.code && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={Colors.primary500}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default WithdrawScreen;
