import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Screens
import WelcomeScreen from './screens/WelcomeScreen';
import SignupScreen from './screens/SignupScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import CountrySelection from './screens/CountrySelection';
import HomeScreen from './screens/HomeScreen';
import ActivityScreen from './screens/ActivityScreen';
import ProfileScreen from './screens/ProfileScreen';
import PaymentMethodsScreen from './screens/PaymentMethodsScreen';
import NotificationsHistoryScreen from './screens/NotificationsHistoryScreen';
import NotFound from './screens/NotFound';
import { Storage } from './lib/storage';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

// Bottom Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initialRouteName, setInitialRouteName] = useState<string>('Welcome');

  useEffect(() => {
    const user = Storage.getItem('liberta_user');
    const country = Storage.getItem('liberta_country');
    
    if (user && country) {
      setInitialRouteName('Main');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName={initialRouteName}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="CountrySelection" component={CountrySelection} />
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Activity" component={ActivityScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
          <Stack.Screen name="NotificationsHistory" component={NotificationsHistoryScreen} />
          <Stack.Screen name="NotFound" component={NotFound} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
