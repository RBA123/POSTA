import React, { useState, useEffect } from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoadingScreen } from "./components/LoadingScreen";
import { Storage } from "./lib/storage";
import { updateUserProfile } from "./services/user.service";
import { getExpoPushToken } from "./lib/expoPushToken";
import { TERMS_STORAGE_KEY } from "./screens/TermsAcceptanceScreen";

// Screens
import TermsAcceptanceScreen from "./screens/TermsAcceptanceScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import SignupScreen from "./screens/SignupScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import CountrySelection from "./screens/CountrySelection";
import HomeScreen from "./screens/HomeScreen";
import ActivityScreen from "./screens/ActivityScreen";
import ProfileScreen from "./screens/ProfileScreen";
import PaymentMethodsScreen from "./screens/PaymentMethodsScreen";
import NotificationsHistoryScreen from "./screens/NotificationsHistoryScreen";
import CountryBettingScreen from "./screens/CountryBettingScreen";
import Colors from "./constants/Colors";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

// Bottom Tab Navigator - Main App Tabs
function TabNavigator() {
  const { user, loading, profileExists } = useAuth();

  console.log("📱 [TabNavigator] Render state:", {
    loading,
    hasUser: !!user,
    profileExists,
  });

  // Safety checks - don't render tabs if not authenticated or no profile
  if (loading) {
    console.log("⏳ [TabNavigator] Loading - showing loading screen");
    return <LoadingScreen loadingText="Cargando..." />;
  }

  if (!user) {
    console.log("❌ [TabNavigator] No user - returning null");
    return null; // Don't render tabs if not authenticated
  }

  if (!profileExists) {
    console.log("❌ [TabNavigator] No profile - returning null");
    return null; // Don't render tabs if profile doesn't exist
  }

  console.log("✅ [TabNavigator] Rendering tabs");

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary500,
        tabBarInactiveTintColor: Colors.foregroundMuted,
        tabBarStyle: {
          display: "none", // Hide default tab bar since we use custom BottomNav
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: "Mercados",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ActivityTab"
        component={ActivityScreen}
        options={{
          tabBarLabel: "Actividad",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Content - handles auth state and routing
function AppContent() {
  const { user, loading, profileExists } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);
  const [checkingTerms, setCheckingTerms] = useState(true);

  // Check if terms have been accepted on app load
  useEffect(() => {
    const checkTermsAcceptance = async () => {
      try {
        const accepted = await Storage.getItem(TERMS_STORAGE_KEY);
        setTermsAccepted(accepted === "true");
      } catch (error) {
        console.error("Error checking terms acceptance:", error);
        setTermsAccepted(false);
      } finally {
        setCheckingTerms(false);
      }
    };
    checkTermsAcceptance();
  }, []);

  // Listen for push token changes and update Firestore
  useEffect(() => {
    if (!user) return;

    const updatePushToken = async (tokenData: Notifications.ExpoPushToken) => {
      try {
        const expoPushToken = tokenData.data;
        await updateUserProfile(user.uid, {
          expoPushToken,
        });
        console.log("✅ Push token refreshed:", expoPushToken);
      } catch (error) {
        console.error("Error updating push token:", error);
      }
    };

    // Get initial token (only if push notifications are supported)
    // Skip silently if not supported (e.g., Android Expo Go or without projectId)
    getExpoPushToken()
      .then(updatePushToken)
      .catch((error) => {
        // Only log unexpected errors (not Android Expo Go or missing projectId)
        const errorMessage = error?.message || String(error);
        if (
          !errorMessage.includes("not supported") &&
          !errorMessage.includes("No valid Expo project ID") &&
          !errorMessage.includes("Invalid uuid")
        ) {
          console.error("Error getting initial push token:", error);
        }
        // Silently skip if push notifications aren't supported or projectId is invalid
      });

    // Listen for token changes
    const subscription = Notifications.addPushTokenListener(updatePushToken);

    return () => {
      subscription.remove();
    };
  }, [user]);

  // Handle notification taps (when user taps a push notification)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        if (data?.type === "market_live" && data?.marketId) {
          const marketId = data.marketId;
          console.log("📱 Notification tapped for market:", marketId);

          // TODO: Navigate to market detail screen when it's implemented
          // For now, we'll just log it. When MarketDetailScreen is added to navigation:
          // navigation.navigate('MarketDetail', { marketId });
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const handleTermsAccept = () => {
    setTermsAccepted(true);
  };

  console.log("🎯 [AppContent] Render state:", {
    loading,
    hasUser: !!user,
    profileExists,
    termsAccepted,
    checkingTerms,
  });

  // Show loading while checking terms or auth state
  if (checkingTerms || loading) {
    console.log("⏳ [AppContent] Showing loading screen");
    return <LoadingScreen loadingText="Cargando..." />;
  }

  // Show Terms screen if not accepted yet
  if (termsAccepted === false) {
    console.log("📜 [AppContent] Showing terms acceptance screen");
    return <TermsAcceptanceScreen onAccept={handleTermsAccept} />;
  }

  // Determine which screen to show based on auth state
  const renderCurrentScreen = () => {
    if (!user) {
      // Not authenticated - show auth screens
      console.log("🔓 [AppContent] Not authenticated - showing auth screens");
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="CountrySelection" component={CountrySelection} />
        </Stack.Navigator>
      );
    } else if (!profileExists) {
      // Authenticated but no profile - show welcome screen so they can login or create profile
      console.log(
        "⚠️ [AppContent] Authenticated but no profile - showing welcome screen",
      );
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="CountrySelection" component={CountrySelection} />
        </Stack.Navigator>
      );
    } else {
      // Authenticated with profile - show main app
      console.log(
        "✅ [AppContent] Authenticated with profile - showing main app",
      );
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen
            name="PaymentMethods"
            component={PaymentMethodsScreen}
          />
          <Stack.Screen
            name="NotificationsHistory"
            component={NotificationsHistoryScreen}
          />
          <Stack.Screen
            name="CountryBetting"
            component={CountryBettingScreen}
          />
        </Stack.Navigator>
      );
    }
  };

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {renderCurrentScreen()}
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    // Initialize RevenueCat
    const initializeRevenueCat = async () => {
      try {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);

        const apiKey =
          Platform.OS === "ios"
            ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
            : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

        if (!apiKey) {
          console.error(
            "❌ RevenueCat API key not found in environment variables",
          );
          return;
        }

        await Purchases.configure({ apiKey });
        console.log("✅ RevenueCat initialized successfully for", Platform.OS);
      } catch (error: any) {
        // RevenueCat native modules are not available in Expo Go/simulators
        if (
          error?.message?.includes("Native module") ||
          error?.message?.includes("RNPurchases")
        ) {
          console.log(
            "ℹ️ RevenueCat only works on actual development builds, not in Expo Go or simulators",
          );
        } else {
          console.error(
            "❌ Error initializing RevenueCat:",
            error.message || error,
          );
        }
      }
    };

    initializeRevenueCat();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
