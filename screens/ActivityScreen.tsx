import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "../components/BottomNav";
import { Card } from "../components/ui/Card";
import Colors from "../constants/Colors";

const activities = [
  {
    id: 1,
    question: "¿Messi mete el penal?",
    side: "Sí",
    amount: 25,
    status: "pending",
    time: "Hace 5 min",
    potential: 37.31,
  },
  {
    id: 2,
    question: "México vs Sudáfrica: ¿Gana México?",
    side: "No",
    amount: 10,
    status: "won",
    time: "Ayer",
    winnings: 45.23,
  },
  {
    id: 3,
    question: "¿Argentina gana la Copa del Mundo 2026?",
    side: "Sí",
    amount: 15,
    status: "lost",
    time: "Hace 3 días",
  },
];

const ActivityScreen: React.FC = () => {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="bg-background border-b border-border px-6 py-4">
        <Text className="text-3xl font-bold text-foreground">Actividad</Text>
        <Text className="text-base text-muted-foreground">
          Tus posiciones activas
        </Text>
      </View>

      {/* Activity List */}
      <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          {activities.map((activity) => (
            <Card key={activity.id}>
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1">
                  <Text className="font-semibold text-card-foreground text-base leading-tight">
                    {activity.question}
                  </Text>
                </View>
                <View className="items-end">
                  {activity.status === "pending" && (
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
                  {activity.status === "won" && (
                    <View className="flex-row items-center gap-1">
                      <Ionicons
                        name="trending-up"
                        size={18}
                        color={Colors.success}
                      />
                      <Text className="text-base font-bold text-success">
                        +${activity.winnings?.toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {activity.status === "lost" && (
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
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View
                    className={`px-2 py-0.5 rounded-full ${
                      activity.side === "Sí"
                        ? "bg-success/10"
                        : "bg-destructive/10"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        activity.side === "Sí"
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {activity.side}
                    </Text>
                  </View>
                  <Text className="text-sm text-muted-foreground">
                    ${activity.amount}
                  </Text>
                </View>
                <Text className="text-sm text-muted-foreground">
                  {activity.time}
                </Text>
              </View>
            </Card>
          ))}

          {activities.length === 0 && (
            <View className="items-center py-12">
              <Text className="text-base text-muted-foreground">
                No tienes posiciones activas
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
};

export default ActivityScreen;
