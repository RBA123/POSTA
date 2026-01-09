import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/ui/Card';
import { formatRelativeTime } from '../lib/firestore';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import Colors from '../constants/Colors';
import type { UserNotification } from '../firebase/types/firestore.types';

const NotificationsHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user: authUser } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, refreshNotifications } = useNotifications(
    authUser?.uid || null,
    true // real-time updates
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!authUser) {
      navigation.navigate("Welcome" as never);
    }
  }, [authUser, navigation]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  }, [refreshNotifications]);

  const handleNotificationPress = useCallback(async (notification: UserNotification) => {
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
      } catch (error: any) {
        Alert.alert('Error', 'No se pudo marcar la notificación como leída.');
      }
    }
  }, [markAsRead]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="bg-background border-b border-border px-4 py-4">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">Notificaciones</Text>
            {unreadCount > 0 && (
              <Text className="text-xs text-primary mt-1">
                {unreadCount} {unreadCount === 1 ? 'no leída' : 'no leídas'}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView
        className="px-4 py-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="gap-3">
          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={Colors.primary500} />
              <Text className="text-muted-foreground mt-4">
                Cargando notificaciones...
              </Text>
            </View>
          ) : (
            <>
              {notifications.map((notification) => (
                <Pressable
                  key={notification.id}
                  onPress={() => handleNotificationPress(notification)}
                >
                  <Card
                    className={!notification.read ? 'border-primary border-2' : ''}
                  >
                    <Text className="text-sm text-foreground leading-relaxed mb-2">
                      {notification.message}
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-muted-foreground">
                        {formatRelativeTime(notification.createdAt)}
                      </Text>
                      {!notification.read && (
                        <View className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </View>
                  </Card>
                </Pressable>
              ))}

              {notifications.length === 0 && (
                <View className="items-center py-12">
                  <Text className="text-muted-foreground">No tienes notificaciones</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsHistoryScreen;

