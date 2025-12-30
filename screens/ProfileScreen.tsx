import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Storage } from '../lib/storage';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState<any>({
    firstName: 'Usuario',
    lastName: '',
  });

  useEffect(() => {
    const loadUserData = async () => {
      const data = await Storage.getObject<any>('liberta_user');
      if (data) {
        setUserData(data);
      }
    };
    loadUserData();
  }, []);

  const initials = `${userData.firstName?.charAt(0) || 'U'}${userData.lastName?.charAt(0) || ''}`;
  const fullName = `${userData.firstName || 'Usuario'} ${userData.lastName || ''}`.trim();

  const friendCode =
    userData.friendCode ||
    `${userData.firstName?.toUpperCase() || 'USER'}${String(Math.floor(Math.random() * 900 + 100))}`;

  const stats = {
    totalPositions: 7,
    activePositions: 3,
    winRate: 71,
    totalWins: 145.23,
    totalLosses: 50.0,
    overallTotal: 95.23,
  };

  const handleLogout = async () => {
    await Storage.removeItem('liberta_user');
    await Storage.removeItem('liberta_country');
    await Storage.removeItem('liberta_notifications');
    navigation.navigate('Welcome' as never);
  };

  return (
    <View className="flex-1 bg-background pb-24">
      {/* Header */}
      <View className="bg-primary px-6 py-8 pb-16">
        <View className="flex-row items-center gap-4">
          <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
            <Text className="text-2xl font-bold text-white">{initials}</Text>
          </View>
          <View>
            <Text className="text-xl font-bold text-white">{fullName}</Text>
            <Text className="text-sm text-white/90">
              @{userData.firstName?.toLowerCase() || 'usuario'}
            </Text>
            <Text className="text-xs text-white/75 mt-1">
              Código de Amistad: {friendCode}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Card */}
      <View className="px-4 -mt-8">
        <Card>
          <View className="flex-row justify-between mb-4">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-foreground">
                {stats.totalPositions}
              </Text>
              <Text className="text-xs text-muted-foreground">Posiciones Totales</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-primary">{stats.activePositions}</Text>
              <Text className="text-xs text-muted-foreground">Posiciones Activas</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-success">{stats.winRate}%</Text>
              <Text className="text-xs text-muted-foreground">Win Rate</Text>
            </View>
          </View>
          <View className="border-t border-border pt-4">
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-lg font-bold text-success">
                  +${stats.totalWins.toFixed(2)}
                </Text>
                <Text className="text-xs text-muted-foreground">Ganancias</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-lg font-bold text-destructive">
                  -${stats.totalLosses.toFixed(2)}
                </Text>
                <Text className="text-xs text-muted-foreground">Pérdidas</Text>
              </View>
              <View className="items-center flex-1">
                <Text
                  className={`text-lg font-bold ${
                    stats.overallTotal >= 0 ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {stats.overallTotal >= 0 ? '+' : ''}${stats.overallTotal.toFixed(2)}
                </Text>
                <Text className="text-xs text-muted-foreground">Total</Text>
              </View>
            </View>
          </View>
        </Card>
      </View>

      {/* Menu Items */}
      <ScrollView className="px-4 py-6" showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <Pressable
            onPress={() => navigation.navigate('PaymentMethods' as never)}
            className="flex-row items-center gap-4 p-4 bg-card rounded-[12px]"
          >
            <Ionicons name="card-outline" size={20} color="#999" />
            <Text className="flex-1 font-medium text-foreground">Métodos de pago</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('NotificationsHistory' as never)}
            className="flex-row items-center gap-4 p-4 bg-card rounded-[12px]"
          >
            <Ionicons name="notifications-outline" size={20} color="#999" />
            <Text className="flex-1 font-medium text-foreground">Notificaciones</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Pressable>

          <Pressable className="flex-row items-center gap-4 p-4 bg-card rounded-xl">
            <Ionicons name="help-circle-outline" size={20} color="#999" />
            <Text className="flex-1 font-medium text-foreground">Ayuda y soporte</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Pressable>

          <View className="pt-4">
            <Button
              variant="outline"
              className="w-full border-destructive/30"
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text className="text-destructive font-semibold">Cerrar sesión</Text>
            </Button>
          </View>
        </View>

        {/* Version */}
        <Text className="text-center text-xs text-muted-foreground mt-8">
          LIBERTA v1.0.0
        </Text>
      </ScrollView>

      <BottomNav />
    </View>
  );
};

export default ProfileScreen;
