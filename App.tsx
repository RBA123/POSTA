import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
import Colors from './constants/Colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

// Bottom Tab Navigator - Main App Tabs
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary500,
        tabBarInactiveTintColor: Colors.foregroundMuted,
        tabBarStyle: {
          display: 'none', // Hide default tab bar since we use custom BottomNav
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Mercados',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ActivityTab"
        component={ActivityScreen}
        options={{
          tabBarLabel: 'Actividad',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const user = await Storage.getItem('liberta_user');
      const country = await Storage.getItem('liberta_country');
      
      if (user && country) {
        setInitialRouteName('Main');
      }
      setIsReady(true);
    };
    
    checkOnboarding();
  }, []);

  if (!isReady) {
    return null; // or a loading screen
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator
            initialRouteName={initialRouteName}
            screenOptions={{ headerShown: false }}
          >
            {/* Onboarding Flow */}
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="CountrySelection" component={CountrySelection} />
            
            {/* Main App with Tabs */}
            <Stack.Screen name="Main" component={TabNavigator} />
            
            {/* Modal/Detail Screens (outside tabs) */}
            <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
            <Stack.Screen name="NotificationsHistory" component={NotificationsHistoryScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
