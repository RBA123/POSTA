import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const NotFound: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View className="flex-1 items-center justify-center bg-muted">
      <View className="items-center">
        <Text className="mb-4 text-4xl font-bold">404</Text>
        <Text className="mb-4 text-xl text-muted-foreground">Oops! Page not found</Text>
        <Pressable onPress={() => navigation.navigate('Welcome' as never)}>
          <Text className="text-primary underline">Return to Home</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default NotFound;

