import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Colors from '../constants/Colors';

const navItems = [
  { icon: 'home' as const, label: 'Mercados', route: 'HomeTab' },
  { icon: 'stats-chart' as const, label: 'Actividad', route: 'ActivityTab' },
  { icon: 'person' as const, label: 'Perfil', route: 'ProfileTab' },
] as const;

const BottomNav: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  return (
    <View 
      className="absolute bottom-0 left-0 right-0 bg-card border-t border-border"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="flex-row justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = route.name === item.route;
          return (
            <Pressable
              key={item.route}
              onPress={() => navigation.navigate(item.route as never)}
              className="flex-col items-center gap-1 px-6 py-2"
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={isActive ? Colors.primary500 : Colors.foregroundMuted}
              />
              <Text
                className={`text-xs font-medium ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default BottomNav;

