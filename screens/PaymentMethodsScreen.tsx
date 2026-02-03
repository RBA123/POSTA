import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { PurchasesPackage } from "react-native-purchases";
import Colors from "../constants/Colors";
import { purchaseService } from "../services/purchase.service";
import {
  CreditPackDisplay,
  CREDIT_AMOUNTS,
  CreditPackageId,
} from "../types/purchase";
import { useAuth } from "../contexts/AuthContext";
import Toast from "react-native-toast-message";

const PaymentMethodsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [creditPacks, setCreditPacks] = useState<CreditPackDisplay[]>([]);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      setLoading(true);
      const { currentOffering } = await purchaseService.getOfferings();

      if (!currentOffering) {
        console.warn("⚠️ No offerings available");
        // Show default packs without RevenueCat packages
        setCreditPacks(getDefaultCreditPacks());
        return;
      }

      // Map RevenueCat packages to credit packs
      const packs: CreditPackDisplay[] = currentOffering.availablePackages.map(
        (pkg) => {
          const productId = pkg.product.identifier as CreditPackageId;
          const credits = CREDIT_AMOUNTS[productId] || 0;

          return {
            id: productId,
            credits,
            price: pkg.product.priceString,
            rcPackage: pkg,
            bonusPercentage: calculateBonusPercentage(
              credits,
              pkg.product.price,
            ),
            popularTag: credits === 500, // Mark 500 credits as popular
          };
        },
      );

      // Sort by credits amount
      packs.sort((a, b) => a.credits - b.credits);
      setCreditPacks(packs);
    } catch (error) {
      console.error("Error loading offerings:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudieron cargar los paquetes de créditos",
      });
      // Show default packs as fallback
      setCreditPacks(getDefaultCreditPacks());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultCreditPacks = (): CreditPackDisplay[] => {
    return [
      {
        id: CreditPackageId.CREDITS_100,
        credits: 100,
        price: "$4.99",
      },
      {
        id: CreditPackageId.CREDITS_500,
        credits: 500,
        price: "$19.99",
        bonusPercentage: 25,
        popularTag: true,
      },
      {
        id: CreditPackageId.CREDITS_1000,
        credits: 1000,
        price: "$34.99",
        bonusPercentage: 40,
      },
      {
        id: CreditPackageId.CREDITS_2500,
        credits: 2500,
        price: "$79.99",
        bonusPercentage: 50,
      },
    ];
  };

  const calculateBonusPercentage = (
    credits: number,
    priceUSD: number,
  ): number | undefined => {
    // Base rate: $4.99 for 100 credits = $0.0499 per credit
    const baseRate = 0.0499;
    const expectedPrice = credits * baseRate;
    const discount = ((expectedPrice - priceUSD) / expectedPrice) * 100;

    return discount > 5 ? Math.round(discount) : undefined;
  };

  const handlePurchase = async (pack: CreditPackDisplay) => {
    if (!pack.rcPackage) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Producto no disponible. Intenta nuevamente.",
      });
      return;
    }

    try {
      setPurchasing(pack.id);

      // Make the purchase
      const result = await purchaseService.purchasePackage(pack.rcPackage);

      if (result.success) {
        Toast.show({
          type: "success",
          text1: "¡Compra exitosa!",
          text2: `Se agregaron $${pack.credits} a tu balance`,
        });

        // Navigate back after successful purchase
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else if (result.error !== "Purchase cancelled") {
        Toast.show({
          type: "error",
          text1: "Error en la compra",
          text2: result.error || "No se pudo completar la compra",
        });
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Error al procesar la compra",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    try {
      Alert.alert(
        "Restaurar compras",
        "¿Deseas restaurar tus compras anteriores?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Restaurar",
            onPress: async () => {
              const result = await purchaseService.restorePurchases();
              if (result.success) {
                Toast.show({
                  type: "success",
                  text1: "Compras restauradas",
                  text2: "Tus compras han sido restauradas exitosamente",
                });
              } else {
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: result.error || "No se pudieron restaurar las compras",
                });
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error("Restore error:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="bg-background border-b border-border px-4 py-4">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
          </Pressable>
          <Text className="text-xl font-bold text-foreground">
            Comprar créditos
          </Text>
        </View>
      </View>

      {/* Loading State */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary500} />
          <Text className="text-muted-foreground mt-4">
            Cargando paquetes...
          </Text>
        </View>
      ) : (
        <ScrollView className="px-4 py-6" showsVerticalScrollIndicator={false}>
          {/* Info Banner */}
          <View className="bg-primary500/10 p-4 rounded-[12px] mb-6">
            <View className="flex-row items-start gap-3">
              <Ionicons
                name="information-circle"
                size={24}
                color={Colors.primary500}
              />
              <View className="flex-1">
                <Text className="font-semibold text-foreground mb-1">
                  Compra créditos para apostar
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Los créditos se agregan instantáneamente a tu balance y puedes
                  usarlos en cualquier mercado.
                </Text>
              </View>
            </View>
          </View>

          {/* Credit Packs */}
          <View className="gap-3 mb-6">
            {creditPacks.map((pack) => (
              <Pressable
                key={pack.id}
                onPress={() => handlePurchase(pack)}
                disabled={purchasing !== null}
                className="bg-card rounded-[12px] p-4 border-2"
                style={{
                  borderColor: pack.popularTag
                    ? Colors.primary500
                    : "transparent",
                  opacity: purchasing && purchasing !== pack.id ? 0.5 : 1,
                }}
              >
                {/* Popular Tag */}
                {pack.popularTag && (
                  <View className="absolute -top-2 right-4 bg-primary500 px-3 py-1 rounded-full">
                    <Text className="text-xs font-bold text-white">
                      MÁS POPULAR
                    </Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Ionicons
                        name="cash"
                        size={24}
                        color={Colors.primary500}
                      />
                      <Text className="text-2xl font-bold text-foreground">
                        ${pack.credits}
                      </Text>
                      {pack.bonusPercentage && (
                        <View className="bg-success/20 px-2 py-0.5 rounded-full">
                          <Text className="text-xs font-bold text-success">
                            +{pack.bonusPercentage}%
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm text-muted-foreground">
                      Créditos virtuales
                    </Text>
                  </View>

                  {/* Price & Button */}
                  <View className="items-end gap-2">
                    <Text className="text-2xl font-bold text-primary500">
                      {pack.price}
                    </Text>
                    {purchasing === pack.id ? (
                      <ActivityIndicator
                        size="small"
                        color={Colors.primary500}
                      />
                    ) : (
                      <View className="bg-primary500 px-4 py-2 rounded-full">
                        <Text className="text-white font-semibold">
                          Comprar
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Restore Purchases Button */}
          <Pressable onPress={handleRestore} className="py-3 items-center">
            <Text className="text-primary500 font-semibold">
              Restaurar compras anteriores
            </Text>
          </Pressable>

          {/* Terms */}
          <Text className="text-xs text-muted-foreground text-center mt-4">
            Los créditos son virtuales y no se pueden convertir a dinero real.
            Al comprar, aceptas nuestros términos y condiciones.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default PaymentMethodsScreen;
