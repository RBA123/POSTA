import React, { useState } from "react";
import { View, Text, ScrollView, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { Button } from "../components/ui/Button";
import { Storage } from "../lib/storage";
import { useAuth } from "../contexts/AuthContext";
import { updateUserProfile } from "../services/user.service";
import libertaLogo from "../assets/liberta-logo.png";
import Colors from "../constants/Colors";

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnable = async () => {
    setIsLoading(true);

    try {
      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === "granted";
      
      await Storage.setItem(
        "liberta_notifications",
        granted ? "enabled" : "disabled"
      );

      // If permissions granted and user is authenticated, get and store push token
      if (granted && user) {
        try {
          // Get Expo push token (projectId will be inferred from app config)
          const tokenData = await Notifications.getExpoPushTokenAsync();
          const expoPushToken = tokenData.data;

          // Update user profile with push token and enable notifications
          await updateUserProfile(user.uid, {
            expoPushToken,
            notificationsEnabled: true,
          });

          console.log("✅ Push token stored:", expoPushToken);
        } catch (tokenError) {
          console.error("Error getting push token:", tokenError);
          // Still enable notifications even if token fails
          if (user) {
            await updateUserProfile(user.uid, {
              notificationsEnabled: true,
            });
          }
        }
      }
    } catch (error) {
      console.error("Notification permission error:", error);
      await Storage.setItem("liberta_notifications", "disabled");
    }

    // Always navigate to Main after handling notification permission
    // (This screen should only be accessed manually from settings, not during onboarding)
    navigation.navigate("Main" as never);
  };

  const handleSkip = async () => {
    await Storage.setItem("liberta_notifications", "disabled");

    // Always navigate to Main after skipping
    navigation.navigate("Main" as never);
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-6 py-8">
      {/* Header with skip */}
      <View className="flex-row items-center justify-between mb-8">
        <View className="flex-row items-center gap-3">
          <Image source={libertaLogo} className="w-10 h-10 rounded-xl" />
          <Text className="text-xl font-bold text-foreground">LIBERTA</Text>
        </View>
        <Pressable onPress={handleSkip}>
          <Ionicons name="close" size={24} color={Colors.foregroundMuted} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          {/* Bell Icon */}
          <View className="relative mb-8">
            <View className="w-24 h-24 rounded-full items-center justify-center overflow-hidden">
              <LinearGradient
                colors={[Colors.primary400, Colors.primary500]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                }}
              />
              <Ionicons name="notifications" size={48} color="white" />
            </View>
            <View className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-destructive items-center justify-center">
              <Text className="text-white text-sm font-bold">!</Text>
            </View>
          </View>

          <Text className="text-2xl font-bold text-foreground mb-4 text-center">
            Activa las notificaciones
          </Text>

          <View className="mb-8 max-w-xs">
            <Text className="text-muted-foreground text-center">
              Los mercados EN VIVO de LIBERTA solo están activos por{" "}
              <Text className="font-bold text-foreground">2 minutos</Text>. No
              te pierdas ningún momento.
            </Text>
          </View>

          {/* Features */}
          <View className="w-full gap-4 mb-4">
            <View className="flex-row items-center gap-4 p-4 bg-card rounded-[12px] border border-border overflow-hidden">
              <View className="w-10 h-10 rounded-[6px] bg-primary items-center justify-center">
                <Ionicons name="time-outline" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">
                  Ventana de 2 minutos
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Cada mercado abre por tiempo limitado
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-4 p-4 bg-card rounded-[12px] border border-border overflow-hidden">
              <View className="w-10 h-10 rounded-[6px] bg-primary items-center justify-center">
                <Ionicons name="flash" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">
                  Alertas instantáneas
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Recibe una notificación cuando un mercado abre
                </Text>
              </View>
            </View>
          </View>

          {/* Example notification */}
          <View className="w-full p-4 bg-muted/50 rounded-[12px] border border-border mb-8 overflow-hidden">
            <View className="flex-row items-center gap-3">
              <Image source={libertaLogo} className="w-10 h-10 rounded-xl" />
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="font-semibold text-foreground text-sm">
                    LIBERTA
                  </Text>
                  <Text className="text-xs text-muted-foreground">ahora</Text>
                </View>
                <Text className="text-sm text-foreground">
                  ¡Momento LIBERTA! ⏱️ 2:00 — ¿Messi mete el penal? (Sí/No)
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Buttons */}
      <View className="gap-3">
        <Button
          variant="default"
          size="lg"
          onPress={handleEnable}
          disabled={isLoading}
          loading={isLoading}
          className="w-full"
        >
          <Ionicons name="notifications" size={20} color="white" />
          <Text className="text-white font-semibold">
            Activar notificaciones
          </Text>
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onPress={handleSkip}
          className="w-full"
        >
          <Text className="text-muted-foreground">Ahora no</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default NotificationsScreen;
