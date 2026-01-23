import React, { useState } from "react";
import { View, Text, ScrollView, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../components/ui/Button";
import { Storage } from "../lib/storage";
import libertaLogo from "../assets/liberta-logo.png";
import Colors from "../constants/Colors";

const TERMS_STORAGE_KEY = "liberta_terms_accepted";

interface TermsAcceptanceScreenProps {
  onAccept: () => void;
}

const TermsAcceptanceScreen: React.FC<TermsAcceptanceScreenProps> = ({
  onAccept,
}) => {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!accepted) return;

    try {
      setLoading(true);
      // Save acceptance to AsyncStorage
      await Storage.setItem(TERMS_STORAGE_KEY, "true");
      // Call the onAccept callback to proceed
      onAccept();
    } catch (error) {
      console.error("Error saving terms acceptance:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <View className="flex-1 bg-background px-6 py-8">
        {/* Header */}
        <View className="flex-row items-center justify-center gap-3 mb-8">
          <Image source={libertaLogo} className="w-12 h-12 rounded-xl" />
          <Text className="text-2xl font-bold text-foreground">LIBERTA</Text>
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-foreground mb-4 text-center">
          Términos y Condiciones
        </Text>
        <Text className="text-muted-foreground mb-8 text-center">
          Por favor lee y acepta nuestros términos y condiciones para continuar
        </Text>

        {/* Terms Content - Scrollable */}
        <ScrollView
          className="flex-1 mb-6"
          showsVerticalScrollIndicator={true}
          style={{
            backgroundColor: Colors.card,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Text className="text-foreground leading-6">
            {/* Placeholder text */}
            <Text className="font-bold text-lg mb-4 block">
              Términos y Condiciones de Uso
            </Text>
            {"\n"}
            <Text className="font-semibold mb-2 block">
              [Contenido de Términos y Condiciones]
            </Text>
            {"\n"}
            Los términos y condiciones completos se agregarán aquí. Este es un
            placeholder temporal para la funcionalidad de aceptación de términos.
            {"\n\n"}
            Al aceptar estos términos, confirmas que has leído y comprendido las
            condiciones de uso de LIBERTA y aceptas cumplir con todas las políticas
            y regulaciones aplicables.
            {"\n\n"}
            Por favor, revisa cuidadosamente todos los términos antes de continuar.
          </Text>
        </ScrollView>

        {/* Checkbox */}
        <Pressable
          onPress={() => setAccepted(!accepted)}
          className="flex-row items-center gap-3 mb-6"
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: accepted ? Colors.primary500 : Colors.border,
              backgroundColor: accepted ? Colors.primary500 : Colors.card,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {accepted && (
              <Ionicons name="checkmark" size={16} color={Colors.white} />
            )}
          </View>
          <Text className="text-foreground flex-1">
            Acepto los Términos y Condiciones
          </Text>
        </Pressable>

        {/* Continue Button */}
        <Button
          variant="default"
          size="lg"
          onPress={handleAccept}
          disabled={!accepted || loading}
          loading={loading}
          className="w-full"
        >
          <Text className="text-white font-semibold">Continuar</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default TermsAcceptanceScreen;
export { TERMS_STORAGE_KEY };
