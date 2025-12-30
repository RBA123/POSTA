import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

const paymentMethods = [
  {
    id: 'cards',
    name: 'Credit/Debit Cards',
    description: 'Visa, Mastercard, AMEX',
    icon: 'card-outline' as const,
    connected: false,
  },
  {
    id: 'apple_pay',
    name: 'Apple Pay',
    description: 'Paga con tu iPhone o Apple Watch',
    icon: 'logo-apple' as const,
    connected: false,
  },
  {
    id: 'google_pay',
    name: 'Google Pay',
    description: 'Paga con tu cuenta de Google',
    icon: 'phone-portrait-outline' as const,
    connected: false,
  },
  {
    id: 'mercadopago',
    name: 'MercadoPago',
    description: 'Tu billetera digital',
    icon: 'card-outline' as const,
    connected: true,
  },
];

const PaymentMethodsScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-background border-b border-border px-4 py-4">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => navigation.goBack()}
            className="p-2 -ml-2"
          >
            <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
          </Pressable>
          <Text className="text-xl font-bold text-foreground">Métodos de pago</Text>
        </View>
      </View>

      {/* Payment Methods List */}
      <ScrollView className="px-4 py-6" showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          {paymentMethods.map((method) => (
            <Pressable
              key={method.id}
              className="flex-row items-center gap-4 p-4 bg-card rounded-[12px]"
            >
              <View className="w-12 h-12 rounded-xl bg-secondary items-center justify-center">
                <Ionicons name={method.icon} size={24} color={Colors.foreground} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">{method.name}</Text>
                <Text className="text-sm text-muted-foreground">{method.description}</Text>
              </View>
              {method.connected ? (
                <View className="bg-success/10 px-2 py-1 rounded-full">
                  <Text className="text-xs font-medium text-success">Conectado</Text>
                </View>
              ) : (
                <Text className="text-xs font-medium text-muted-foreground">Agregar</Text>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default PaymentMethodsScreen;

