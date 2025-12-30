import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui/Button';
import { Storage } from '../lib/storage';
import libertaLogo from '../assets/liberta-logo.png';

const countries = [
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
];

const CountrySelection: React.FC = () => {
  const navigation = useNavigation();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const handleContinue = async () => {
    if (selectedCountry) {
      await Storage.setItem('liberta_country', selectedCountry);
      navigation.navigate('Home' as never, { country: selectedCountry } as never);
    }
  };

  return (
    <View className="flex-1 bg-background px-6 py-8">
      {/* Header */}
      <View className="flex-row items-center gap-3 mb-8">
        <Image source={libertaLogo} className="w-10 h-10 rounded-xl" />
        <Text className="text-xl font-bold text-foreground">LIBERTA</Text>
      </View>

      <View className="items-center mb-8">
        <Text className="text-2xl font-bold text-foreground mb-2 text-center">
          Selecciona tu país
        </Text>
        <Text className="text-muted-foreground text-center">
          Personaliza tu experiencia con mercados locales
        </Text>
      </View>

      {/* Country List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          {countries.map((country) => (
            <Pressable
              key={country.code}
              onPress={() => setSelectedCountry(country.code)}
              className={`flex-row items-center gap-4 p-4 rounded-2xl border-2 ${
                selectedCountry === country.code
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              }`}
            >
              <Text className="text-4xl">{country.flag}</Text>
              <Text className="flex-1 font-semibold text-foreground">{country.name}</Text>
              {selectedCountry === country.code && (
                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                  <Ionicons name="checkmark" size={14} color="white" />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View className="mt-8">
        <Button
          variant="default"
          size="lg"
          onPress={handleContinue}
          disabled={!selectedCountry}
          className="w-full"
        >
          <Text className="text-white font-semibold">Continuar</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </Button>
      </View>
    </View>
  );
};

export default CountrySelection;

