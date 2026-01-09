import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Colors from '../constants/Colors';

interface LoadingScreenProps {
  loadingText?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  loadingText = "Cargando..." 
}) => {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" color={Colors.primary500} />
      <Text className="text-muted-foreground mt-4">{loadingText}</Text>
    </View>
  );
};
