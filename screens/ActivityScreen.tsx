import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "../components/BottomNav";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { formatRelativeTime } from "../lib/firestore";
import { useAuth } from "../hooks/useAuth";
import { useBets } from "../hooks/useBets";
import Colors from "../constants/Colors";
import type { BetStatus } from "../firebase/types/firestore.types";

const ActivityScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user: authUser } = useAuth();
  const [filterStatus, setFilterStatus] = useState<BetStatus | undefined>(undefined);
  const { bets, loading, refetch } = useBets(authUser?.uid || null, filterStatus, true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authUser) {
      navigation.navigate("Welcome" as never);
    }
  }, [authUser, navigation]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="bg-background border-b border-border px-6 py-4">
        <Text className="text-3xl font-bold text-foreground">Actividad</Text>
        <Text className="text-base text-muted-foreground">
          Tus posiciones {filterStatus === "pending" ? "pendientes" : filterStatus === "won" ? "ganadas" : filterStatus === "lost" ? "perdidas" : "activas"}
        </Text>
      </View>

      {/* Filter Buttons */}
      <View className="px-4 py-3 border-b border-border">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            <Button
              variant={filterStatus === undefined ? "pillActive" : "pill"}
              size="pill"
              onPress={() => setFilterStatus(undefined)}
            >
              <Text>Todas</Text>
            </Button>
            <Button
              variant={filterStatus === "pending" ? "pillActive" : "pill"}
              size="pill"
              onPress={() => setFilterStatus("pending")}
            >
              <Text>Pendientes</Text>
            </Button>
            <Button
              variant={filterStatus === "won" ? "pillActive" : "pill"}
              size="pill"
              onPress={() => setFilterStatus("won")}
            >
              <Text>Ganadas</Text>
            </Button>
            <Button
              variant={filterStatus === "lost" ? "pillActive" : "pill"}
              size="pill"
              onPress={() => setFilterStatus("lost")}
            >
              <Text>Perdidas</Text>
            </Button>
          </View>
        </ScrollView>
      </View>

      {/* Activity List */}
      <ScrollView
        className="px-4 py-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="gap-3">
          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={Colors.primary500} />
              <Text className="text-muted-foreground mt-4">
                Cargando actividad...
              </Text>
            </View>
          ) : (
            <>
              {bets.map((bet) => (
                <Card key={bet.id}>
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="font-semibold text-card-foreground text-base leading-tight">
                        {bet.marketQuestion}
                      </Text>
                    </View>
                    <View className="items-end">
                      {bet.status === "pending" && (
                        <View className="flex-row items-center gap-1">
                          <Ionicons
                            name="time-outline"
                            size={18}
                            color={Colors.primary500}
                          />
                          <Text className="text-base font-medium text-primary">
                            Pendiente
                          </Text>
                        </View>
                      )}
                      {bet.status === "won" && (
                        <View className="flex-row items-center gap-1">
                          <Ionicons
                            name="trending-up"
                            size={18}
                            color={Colors.success}
                          />
                          <Text className="text-base font-bold text-success">
                            +${bet.actualWin?.toFixed(2) || "0.00"}
                          </Text>
                        </View>
                      )}
                      {bet.status === "lost" && (
                        <View className="flex-row items-center gap-1">
                          <Ionicons
                            name="trending-down"
                            size={18}
                            color={Colors.destructive}
                          />
                          <Text className="text-base font-medium text-destructive">
                            Perdido
                          </Text>
                        </View>
                      )}
                      {bet.status === "refunded" && (
                        <View className="flex-row items-center gap-1">
                          <Ionicons
                            name="refresh-outline"
                            size={18}
                            color={Colors.foregroundMuted}
                          />
                          <Text className="text-base font-medium text-muted-foreground">
                            Reembolsado
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View
                        className={`px-2 py-0.5 rounded-full ${
                          bet.side === "si"
                            ? "bg-success/10"
                            : "bg-destructive/10"
                        }`}
                      >
                        <Text
                          className={`text-sm font-bold ${
                            bet.side === "si"
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {bet.side === "si" ? "Sí" : "No"}
                        </Text>
                      </View>
                      <Text className="text-sm text-muted-foreground">
                        ${bet.amount.toFixed(2)}
                      </Text>
                    </View>
                    <Text className="text-sm text-muted-foreground">
                      {formatRelativeTime(bet.placedAt)}
                    </Text>
                  </View>
                </Card>
              ))}

              {bets.length === 0 && (
                <View className="items-center py-12">
                  <Text className="text-base text-muted-foreground">
                    No tienes posiciones activas
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
};

export default ActivityScreen;
