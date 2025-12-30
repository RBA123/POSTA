import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface CountdownBannerProps {
  endTime: number;
}

const CountdownBanner: React.FC<CountdownBannerProps> = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (timeLeft <= 0) return null;

  return (
    <View className="mx-4 mt-4 bg-primary rounded-[12px] p-4">
      <View className="flex-row items-center justify-center gap-3">
        <Ionicons name="time-outline" size={20} color={Colors.white} />
        <Text className="font-semibold text-white">Mercado activo</Text>
        <View className="bg-white/20 px-3 py-1 rounded-lg">
          <Text className="font-mono font-bold text-lg text-white">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </Text>
        </View>
      </View>
      <Text className="text-center text-sm mt-2 text-primary-50">
        ¡Apuesta antes de que cierre!
      </Text>
    </View>
  );
};

export default CountdownBanner;

