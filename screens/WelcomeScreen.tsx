import React, { useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/ui/Button';
import libertaLogo from '../assets/liberta-logo.png';

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClaim = () => {
    setIsAnimating(true);
    setTimeout(() => {
      navigation.navigate('Signup' as never);
    }, 300);
  };

  return (
    <View className="flex-1 bg-background items-center justify-center px-6 py-12">
      <View className={`flex-col items-center ${isAnimating ? 'opacity-0' : ''}`}>
        {/* Logo */}
        <View className="mb-6">
          <Image source={libertaLogo} className="w-24 h-24 rounded-3xl" />
        </View>

        {/* Brand Name */}
        <Text className="text-5xl font-black tracking-tight text-foreground mb-4">
          LIBERTA
        </Text>

        {/* Tagline */}
        <Text className="text-lg text-muted-foreground max-w-xs text-center leading-relaxed mb-12">
          Porque pase lo que pase,{'\n'}
          date la oportunidad de ganar.
        </Text>

        {/* Decorative elements */}
        <View className="flex-row gap-3 mb-12">
          <View className="w-2 h-2 rounded-full bg-primary opacity-60" />
          <View className="w-2 h-2 rounded-full bg-primary opacity-80" />
          <View className="w-2 h-2 rounded-full bg-primary" />
        </View>

        {/* CTA Button */}
        <Button
          variant="hero"
          size="xl"
          onPress={handleClaim}
          className="w-full max-w-xs"
        >
          Reclamar mis $100
        </Button>

        {/* Secondary text */}
        <Text className="text-sm text-muted-foreground mt-6 text-center">
          Sin tarjeta de crédito • Gratis para empezar
        </Text>
      </View>
    </View>
  );
};

export default WelcomeScreen;

