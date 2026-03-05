import React from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors";

const PaymentMethodsScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="bg-background border-b border-border px-4 py-4">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
          </Pressable>
          <Text className="text-xl font-bold text-foreground">
            Métodos de pago
          </Text>
        </View>
      </View>

      {/* Placeholder */}
      <View className="flex-1 items-center justify-center px-8">
        <Ionicons name="card-outline" size={64} color={Colors.foregroundMuted} />
        <Text className="text-lg font-semibold text-foreground mt-4 text-center">
          Próximamente
        </Text>
        <Text className="text-muted-foreground mt-2 text-center">
          Los métodos de pago estarán disponibles pronto.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default PaymentMethodsScreen;
