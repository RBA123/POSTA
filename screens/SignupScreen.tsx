import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, Image, Pressable, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Storage } from "../lib/storage";
import libertaLogo from "../assets/liberta-logo.png";

const phoneCodes = [
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+55", country: "Brasil", flag: "🇧🇷" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+52", country: "México", flag: "🇲🇽" },
  { code: "+51", country: "Perú", flag: "🇵🇪" },
];

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - 18 - i);

const SignupScreen: React.FC = () => {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [day, setDay] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [phoneCode, setPhoneCode] = useState(phoneCodes[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [friendCode, setFriendCode] = useState("");
  const [showCodePicker, setShowCodePicker] = useState(false);
  const [ageError, setAgeError] = useState(false);

  const isAdult = useMemo(() => {
    if (!day || !month || !year) return true;
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      return age - 1 >= 18;
    }
    return age >= 18;
  }, [day, month, year]);

  const isFormValid = useMemo(() => {
    return (
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      day !== null &&
      month !== null &&
      year !== null &&
      phoneNumber.trim().length >= 8 &&
      isAdult
    );
  }, [firstName, lastName, day, month, year, phoneNumber, isAdult]);

  const handleContinue = async () => {
    if (!isAdult) {
      setAgeError(true);
      return;
    }

    await Storage.setObject("liberta_user", {
      firstName,
      lastName,
      dob: { day, month, year },
      phone: `${phoneCode.code}${phoneNumber}`,
      friendCode: friendCode || null,
    });

    navigation.navigate("Notifications" as never);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <View className="flex-1 bg-background px-6 py-8">
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-8">
          <Image source={libertaLogo} className="w-10 h-10 rounded-xl" />
          <Text className="text-xl font-bold text-foreground">LIBERTA</Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Text className="text-2xl font-bold text-foreground mb-2">
            Crear cuenta
          </Text>
          <Text className="text-muted-foreground mb-8">
            Ingresa tus datos para comenzar
          </Text>

          {/* Form */}
          <View className="gap-5">
            {/* Name fields */}
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Nombre"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder=""
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Apellido"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder=""
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Fecha de nacimiento
              </Text>
              <View className="flex-row gap-2">
                {/* Day picker - simplified for RN */}
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground mb-1">
                    Día
                  </Text>
                  <Input
                    value={day?.toString() || ""}
                    onChangeText={(text) => {
                      const num = parseInt(text) || null;
                      if (num && num >= 1 && num <= 31) setDay(num);
                      else if (text === "") setDay(null);
                    }}
                    placeholder="Día"
                    keyboardType="numeric"
                  />
                </View>

                {/* Month picker */}
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground mb-1">
                    Mes
                  </Text>
                  <Input
                    value={month?.toString() || ""}
                    onChangeText={(text) => {
                      const num = parseInt(text) || null;
                      if (num && num >= 1 && num <= 12) setMonth(num);
                      else if (text === "") setMonth(null);
                    }}
                    placeholder="Mes"
                    keyboardType="numeric"
                  />
                </View>

                {/* Year picker */}
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground mb-1">
                    Año
                  </Text>
                  <Input
                    value={year?.toString() || ""}
                    onChangeText={(text) => {
                      // Allow empty input
                      if (text === "") {
                        setYear(null);
                        return;
                      }

                      // Only allow numeric input
                      const num = parseInt(text);
                      if (isNaN(num)) return;

                      // Allow partial input (1-3 digits) - let user type freely
                      if (text.length < 4) {
                        setYear(num);
                      }
                      // For 4-digit input, validate it's a reasonable year
                      else if (text.length === 4) {
                        if (num >= 1900 && num <= currentYear) {
                          setYear(num);
                        }
                        // If invalid, don't update (prevents invalid years)
                      }
                      // Don't allow more than 4 digits
                    }}
                    placeholder="Año"
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>

              {/* Age error */}
              {!isAdult && day && month && year && (
                <View className="flex-row items-center gap-2 mt-3">
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text className="text-sm text-destructive">
                    Debes ser mayor de 18 años para usar LIBERTA
                  </Text>
                </View>
              )}
            </View>

            {/* Phone number */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Número de celular
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setShowCodePicker(true)}
                  className="h-12 px-3 rounded-[12px] border border-border bg-card flex-row items-center gap-2 min-w-[100px]"
                >
                  <Text>{phoneCode.flag}</Text>
                  <Text className="text-foreground font-medium">
                    {phoneCode.code}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#999" />
                </Pressable>

                <Input
                  value={phoneNumber}
                  onChangeText={(text) =>
                    setPhoneNumber(text.replace(/\D/g, ""))
                  }
                  placeholder=""
                  keyboardType="phone-pad"
                  className="flex-1"
                />
              </View>
            </View>

            {/* Friend code */}
            <View>
              <View className="mb-2">
                <Text className="text-sm font-medium text-foreground">
                  Código de amistad{" "}
                  <Text className="text-muted-foreground font-normal">
                    (opcional)
                  </Text>
                </Text>
              </View>
              <Input
                value={friendCode}
                onChangeText={(text) => setFriendCode(text.toUpperCase())}
                placeholder="DIEGO323"
              />
            </View>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View className="mt-8">
          <Button
            variant="default"
            size="lg"
            onPress={handleContinue}
            disabled={!isFormValid}
            className="w-full"
          >
            <Text className="text-white font-semibold">Continuar</Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </Button>

          <Text className="text-xs text-muted-foreground text-center mt-4">
            Al continuar, aceptas nuestros Términos de Servicio y Política de
            Privacidad
          </Text>
        </View>

        {/* Country Code Picker Modal */}
        <Modal
          visible={showCodePicker}
          transparent
          animationType="none"
          onRequestClose={() => setShowCodePicker(false)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setShowCodePicker(false)}
          >
            <View className="bg-card rounded-t-3xl p-4 max-h-96">
              <ScrollView showsVerticalScrollIndicator={false}>
                {phoneCodes.map((pc) => (
                  <Pressable
                    key={pc.code}
                    onPress={() => {
                      setPhoneCode(pc);
                      setShowCodePicker(false);
                    }}
                    className="flex-row items-center gap-3 p-4"
                  >
                    <Text className="text-xl">{pc.flag}</Text>
                    <Text className="flex-1 text-foreground">{pc.country}</Text>
                    <Text className="text-muted-foreground">{pc.code}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default SignupScreen;
