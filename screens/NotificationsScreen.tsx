import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { Button } from '../components/ui/Button';
import { Storage } from '../lib/storage';
import libertaLogo from '../assets/liberta-logo.png';

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnable = async () => {
    setIsLoading(true);

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      await Storage.setItem(
        'liberta_notifications',
        status === 'granted' ? 'enabled' : 'disabled'
      );
    } catch (error) {
      console.error('Notification permission error:', error);
      await Storage.setItem('liberta_notifications', 'disabled');
    }

    const savedCountry = await Storage.getItem('liberta_country');
    if (savedCountry) {
      navigation.navigate('Home' as never, { country: savedCountry } as never);
    } else {
      navigation.navigate('CountrySelection' as never);
    }
  };

  const handleSkip = async () => {
    await Storage.setItem('liberta_notifications', 'disabled');

    const savedCountry = await Storage.getItem('liberta_country');
    if (savedCountry) {
      navigation.navigate('Home' as never, { country: savedCountry } as never);
    } else {
      navigation.navigate('CountrySelection' as never);
    }
  };

  return (
    <View className="flex-1 bg-background px-6 py-8">
      {/* Header with skip */}
      <View className="flex-row items-center justify-between mb-8">
        <View className="flex-row items-center gap-3">
          <Image source={libertaLogo} className="w-10 h-10 rounded-xl" />
          <Text className="text-xl font-bold text-foreground">LIBERTA</Text>
        </View>
        <Pressable onPress={handleSkip}>
          <Ionicons name="close" size={24} color="#999" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          {/* Bell Icon */}
          <View className="relative mb-8">
            <View className="w-24 h-24 rounded-full bg-primary items-center justify-center">
              <Ionicons name="notifications" size={48} color="white" />
            </View>
            <View className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-destructive items-center justify-center">
              <Text className="text-white text-sm font-bold">!</Text>
            </View>
          </View>

          <Text className="text-2xl font-bold text-foreground mb-4 text-center">
            Activa las notificaciones
          </Text>

          <Text className="text-muted-foreground mb-8 max-w-xs text-center">
            Los mercados EN VIVO de LIBERTA solo están activos por{' '}
            <Text className="font-bold text-foreground">2 minutos</Text>. No te pierdas ningún
            momento.
          </Text>

          {/* Features */}
          <View className="w-full gap-4 mb-8">
            <View className="flex-row items-center gap-4 p-4 bg-card rounded-2xl border border-border">
              <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center">
                <Ionicons name="time-outline" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">Ventana de 2 minutos</Text>
                <Text className="text-sm text-muted-foreground">
                  Cada mercado abre por tiempo limitado
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-4 p-4 bg-card rounded-2xl border border-border">
              <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center">
                <Ionicons name="flash" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">Alertas instantáneas</Text>
                <Text className="text-sm text-muted-foreground">
                  Recibe una notificación cuando un mercado abre
                </Text>
              </View>
            </View>
          </View>

          {/* Example notification */}
          <View className="w-full p-4 bg-muted/50 rounded-2xl border border-border mb-8">
            <View className="flex-row items-start gap-3">
              <Image source={libertaLogo} className="w-10 h-10 rounded-xl" />
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="font-semibold text-foreground text-sm">LIBERTA</Text>
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
          Activar notificaciones
        </Button>

        <Button variant="ghost" size="lg" onPress={handleSkip} className="w-full">
          <Text className="text-muted-foreground">Ahora no</Text>
        </Button>
      </View>
    </View>
  );
};

export default NotificationsScreen;

