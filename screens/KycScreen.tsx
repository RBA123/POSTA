import React, { useState, useMemo } from "react";
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
import { submitKyc } from "../services/dlocal.service";
import { ECUADOR_DOCUMENT_TYPES } from "../constants/Ecuador";
import Colors from "../constants/Colors";

const KycScreen: React.FC = () => {
  const navigation = useNavigation();
  const [documentType, setDocumentType] = useState(ECUADOR_DOCUMENT_TYPES[0]);
  const [documentNumber, setDocumentNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const documentError = useMemo(() => {
    if (!documentNumber) return undefined;
    const dt = documentType;
    if (dt.code === "CI" && !/^\d{10}$/.test(documentNumber)) {
      return "Debe tener 10 dígitos";
    }
    if (dt.code === "RUC" && !/^\d{13}$/.test(documentNumber)) {
      return "Debe tener 13 dígitos";
    }
    if (dt.code === "PASS" && !/^[A-Za-z0-9]{7,12}$/.test(documentNumber)) {
      return "Entre 7 y 12 caracteres alfanuméricos";
    }
    return undefined;
  }, [documentType, documentNumber]);

  const isFormValid = useMemo(() => {
    return (
      documentNumber.length > 0 &&
      !documentError &&
      fullName.trim().length >= 2 &&
      address.trim().length >= 5
    );
  }, [documentNumber, documentError, fullName, address]);

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setLoading(true);
    try {
      await submitKyc({
        documentType: documentType.code,
        documentNumber: documentNumber.trim(),
        fullName: fullName.trim(),
        address: address.trim(),
      });
      Alert.alert(
        "Verificación completada",
        "Tu identidad ha sido verificada exitosamente.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudo completar la verificación",
      );
    } finally {
      setLoading(false);
    }
  };

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
            Verificación de identidad
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-6 py-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-muted-foreground mb-6">
            Ingresa tus datos para habilitar depósitos y retiros.
          </Text>

          <View className="gap-5">
            {/* Document Type Picker */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Tipo de documento
              </Text>
              <Pressable
                onPress={() => setShowTypePicker(true)}
                className="h-12 px-4 rounded-lg border border-border bg-card flex-row items-center justify-between"
              >
                <Text className="text-foreground">{documentType.label}</Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={Colors.foregroundMuted}
                />
              </Pressable>
            </View>

            {/* Document Number */}
            <Input
              label="Número de documento"
              value={documentNumber}
              onChangeText={setDocumentNumber}
              placeholder={
                documentType.code === "CI"
                  ? "1234567890"
                  : documentType.code === "RUC"
                    ? "1234567890123"
                    : ""
              }
              keyboardType={
                documentType.code === "CI" || documentType.code === "RUC"
                  ? "numeric"
                  : "default"
              }
              error={documentError}
              maxLength={documentType.digits || 12}
            />

            {/* Full Name */}
            <Input
              label="Nombre completo"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Como aparece en tu documento"
              autoCapitalize="words"
            />

            {/* Address */}
            <Input
              label="Dirección"
              value={address}
              onChangeText={setAddress}
              placeholder="Dirección completa"
              autoCapitalize="sentences"
            />
          </View>

          {/* Submit */}
          <View className="mt-8 mb-4">
            <Button
              variant="default"
              size="lg"
              onPress={handleSubmit}
              disabled={!isFormValid || loading}
              loading={loading}
              className="w-full"
            >
              <Text className="text-white font-semibold">Verificar</Text>
            </Button>
          </View>
        </ScrollView>

        {/* Document Type Picker Modal */}
        <Modal
          visible={showTypePicker}
          transparent
          animationType="none"
          onRequestClose={() => setShowTypePicker(false)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setShowTypePicker(false)}
          >
            <View className="bg-card rounded-t-3xl p-4">
              <Text className="text-lg font-bold text-foreground mb-4 px-4">
                Tipo de documento
              </Text>
              {ECUADOR_DOCUMENT_TYPES.map((dt) => (
                <Pressable
                  key={dt.code}
                  onPress={() => {
                    setDocumentType(dt);
                    setDocumentNumber("");
                    setShowTypePicker(false);
                  }}
                  className="flex-row items-center justify-between p-4"
                >
                  <Text className="text-foreground">{dt.label}</Text>
                  {dt.code === documentType.code && (
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

export default KycScreen;
