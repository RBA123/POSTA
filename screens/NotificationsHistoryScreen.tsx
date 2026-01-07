import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';
import { subscribeToUserNotifications, formatRelativeTime } from '../lib/firestore';
import { markNotificationRead } from '../lib/functions';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/ui/Card';
import Colors from '../constants/Colors';
import type { UserNotification } from '../firebase/types/firestore.types';

const NotificationsHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setNotifications([]);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const unsubscribe = subscribeToUserNotifications(userId, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const handleNotificationPress = async (notification: UserNotification) => {
    if (!notification.read && userId) {
      try {
        await markNotificationRead(notification.id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="bg-background border-b border-border px-4 py-4">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
          </Pressable>
          <Text className="text-xl font-bold text-foreground">Notificaciones</Text>
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView className="px-4 py-6" showsVerticalScrollIndicator={false}>
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

