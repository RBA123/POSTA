import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Storage } from '../lib/storage';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import Colors from '../constants/Colors';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user: authUser, signOut } = useAuth();
  const { profile, stats, loading, updateProfile } = useUserProfile(authUser?.uid || null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authUser) {
      navigation.navigate('Welcome' as never);
    }
  }, [authUser, navigation]);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary500} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">No se pudo cargar el perfil</Text>
      </View>
    );
  }

  const initials = `${profile.firstName?.charAt(0) || 'U'}${profile.lastName?.charAt(0) || ''}`;
  const fullName = `${profile.firstName || 'Usuario'} ${profile.lastName || ''}`.trim();
  const friendCode = profile.friendCode || 'N/A';

  const displayStats = stats || {
    totalPositions: 0,
    activePositions: 0,
    winRate: 0,
    totalWinnings: 0,
    totalLosses: 0,
    overallTotal: 0,
  };

  const handleLogout = async () => {
    try {
      await signOut();
      await Storage.removeItem('liberta_user');
      await Storage.removeItem('liberta_country');
      await Storage.removeItem('liberta_notifications');
      navigation.navigate('Welcome' as never);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cerrar sesión. Por favor intenta de nuevo.');
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Gradient Background - extends to top */}
      <LinearGradient
        colors={[Colors.primary500, Colors.primary400]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 200,
        }}
      />
      
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-6 py-8 pb-16">
          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
              <Text className="text-2xl font-bold text-white">{initials}</Text>
            </View>
            <View>
              <Text className="text-xl font-bold text-white">{fullName}</Text>
              <Text className="text-sm text-white/90">
                @{profile.username || profile.firstName?.toLowerCase() || 'usuario'}
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
                {displayStats.totalPositions}
              </Text>
              <Text className="text-xs text-muted-foreground">Posiciones Totales</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-primary">{displayStats.activePositions}</Text>
              <Text className="text-xs text-muted-foreground">Posiciones Activas</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-success">{displayStats.winRate.toFixed(0)}%</Text>
              <Text className="text-xs text-muted-foreground">Win Rate</Text>
            </View>
          </View>
          <View className="border-t border-border pt-4">
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-lg font-bold text-success">
                  +${displayStats.totalWinnings.toFixed(2)}
                </Text>
                <Text className="text-xs text-muted-foreground">Ganancias</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-lg font-bold text-destructive">
                  -${displayStats.totalLosses.toFixed(2)}
                </Text>
                <Text className="text-xs text-muted-foreground">Pérdidas</Text>
              </View>
              <View className="items-center flex-1">
                <Text
                  className={`text-lg font-bold ${
                    displayStats.overallTotal >= 0 ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {displayStats.overallTotal >= 0 ? '+' : ''}${displayStats.overallTotal.toFixed(2)}
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
            <Ionicons name="card-outline" size={20} color={Colors.foregroundMuted} />
            <Text className="flex-1 font-medium text-foreground">Métodos de pago</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.foregroundMuted} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('NotificationsHistory' as never)}
            className="flex-row items-center gap-4 p-4 bg-card rounded-[12px]"
          >
            <Ionicons name="notifications-outline" size={20} color={Colors.foregroundMuted} />
            <Text className="flex-1 font-medium text-foreground">Notificaciones</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.foregroundMuted} />
          </Pressable>

          <Pressable className="flex-row items-center gap-4 p-4 bg-card rounded-xl">
            <Ionicons name="help-circle-outline" size={20} color={Colors.foregroundMuted} />
            <Text className="flex-1 font-medium text-foreground">Ayuda y soporte</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.foregroundMuted} />
          </Pressable>

          <View className="pt-4">
            <Button
              variant="outline"
              className="w-full border-destructive/30"
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color={Colors.destructive} />
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
      </SafeAreaView>
    </View>
  );
};

export default ProfileScreen;
