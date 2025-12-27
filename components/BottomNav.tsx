import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const navItems = [
  { icon: 'home' as const, label: 'Mercados', route: 'Home' },
  { icon: 'stats-chart' as const, label: 'Actividad', route: 'Activity' },
  { icon: 'person' as const, label: 'Perfil', route: 'Profile' },
] as const;

const BottomNav: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border">
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
                color={isActive ? '#F97316' : '#999'}
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

