import React, { useState } from "react";
import { View, Text, Image, Pressable, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";
import libertaLogo from "../assets/liberta-logo.png";
import Colors from "../constants/Colors";

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { signIn, loading, clearError } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // No manual navigation needed - AppContent handles routing based on auth state

  const handleClaim = () => {
    navigation.navigate("Signup" as never);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    try {
      clearError();
      await signIn(email.trim(), password);
      // Navigation will happen automatically via auth state change
    } catch (err: any) {
      Alert.alert("Error al iniciar sesión", err.message || "Por favor intenta de nuevo");
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 items-center justify-center px-6 py-12">
        <View className="flex-col items-center w-full max-w-xs">
          {/* Logo */}
          <View className="mb-6">
            <Image source={libertaLogo} className="w-24 h-24 rounded-3xl" />
          </View>

          {/* Brand Name */}
          <Text className="text-5xl font-black tracking-tight text-foreground mb-4">
            LIBERTA
          </Text>

          {/* Tagline */}
          <Text className="text-lg text-muted-foreground text-center leading-relaxed mb-8">
            Porque pase lo que pase,{"\n"}
            date la oportunidad de ganar.
          </Text>

          {showLogin ? (
            /* Login Form */
            <View className="w-full gap-4 mb-6">
              <Input
                label="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <Input
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
              />
              <Button
                variant="default"
                size="lg"
                onPress={handleLogin}
                disabled={loading}
                loading={loading}
                className="w-full"
              >
                <Text className="text-white font-semibold">Iniciar sesión</Text>
              </Button>
              <Pressable onPress={() => setShowLogin(false)}>
                <Text className="text-center text-muted-foreground">
                  ¿No tienes cuenta?{" "}
                  <Text className="text-primary font-semibold">Crear cuenta</Text>
                </Text>
              </Pressable>
            </View>
          ) : (
            /* Signup CTA */
            <>
              {/* Decorative elements */}
              <View className="flex-row gap-3 mb-8">
                <View className="w-2 h-2 rounded-full bg-primary opacity-60" />
                <View className="w-2 h-2 rounded-full bg-primary opacity-80" />
                <View className="w-2 h-2 rounded-full bg-primary" />
              </View>

              <Button
                variant="hero"
                size="xl"
                onPress={handleClaim}
                className="w-full"
              >
                Reclamar mis $100
              </Button>

              <Pressable onPress={() => setShowLogin(true)} className="mt-4">
                <Text className="text-center text-muted-foreground">
                  ¿Ya tienes cuenta?{" "}
                  <Text className="text-primary font-semibold">Iniciar sesión</Text>
                </Text>
              </Pressable>
            </>
          )}

          {/* Secondary text */}
          <Text className="text-sm text-muted-foreground mt-6 text-center">
            Sin tarjeta de crédito • Gratis para empezar
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default WelcomeScreen;
