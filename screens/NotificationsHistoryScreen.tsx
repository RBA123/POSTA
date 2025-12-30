import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/ui/Card';
import Colors from '../constants/Colors';

const notifications = [
  {
    id: 1,
    message:
      '🎟️ Sorteo LIBERTA: 2 entradas para la final de la Copa del Mundo. Activa al menos 3 posiciones y entra automáticamente.',
    time: 'Hace 2 horas',
    read: false,
  },
  {
    id: 2,
    message:
      '💸 Tu Código de Amistad vale dinero: compártelo y cuando un amigo cree su cuenta con tu código, ambos reciben $100 para usar en mercados.',
    time: 'Ayer',
    read: false,
  },
  {
    id: 3,
    message:
      '⚽ Bienvenido a LIBERTA: el fútbol no se vive solo mirando, se vive sintiéndolo, jugándolo, ganándolo. Por eso con LIBERTA date la oportunidad de ganar… pase lo que pase.',
    time: 'Hace 3 días',
    read: true,
  },
];

const NotificationsHistoryScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-background">
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
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={!notification.read ? 'border-primary border-2' : ''}
            >
              <Text className="text-sm text-foreground leading-relaxed mb-2">
                {notification.message}
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-muted-foreground">{notification.time}</Text>
                {!notification.read && (
                  <View className="w-2 h-2 rounded-full bg-primary" />
                )}
              </View>
            </Card>
          ))}

          {notifications.length === 0 && (
            <View className="items-center py-12">
              <Text className="text-muted-foreground">No tienes notificaciones</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default NotificationsHistoryScreen;

