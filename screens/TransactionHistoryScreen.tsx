import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTransactions } from "../hooks/useTransactions";
import { formatCents } from "../lib/currency";
import type { Transaction, TransactionType } from "../firebase/types/firestore.types";
import Colors from "../constants/Colors";

type FilterTab = "all" | "deposits" | "withdrawals";

const DEPOSIT_TYPES: TransactionType[] = ["dlocal_deposit"];
const WITHDRAWAL_TYPES: TransactionType[] = [
  "dlocal_withdrawal",
  "dlocal_withdrawal_refund",
];

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "deposits", label: "Depósitos" },
  { key: "withdrawals", label: "Retiros" },
];

function getTypeFilter(tab: FilterTab): TransactionType[] | undefined {
  switch (tab) {
    case "deposits":
      return DEPOSIT_TYPES;
    case "withdrawals":
      return WITHDRAWAL_TYPES;
    default:
      return [...DEPOSIT_TYPES, ...WITHDRAWAL_TYPES];
  }
}

function getIcon(type: TransactionType): { name: string; color: string } {
  switch (type) {
    case "dlocal_deposit":
      return { name: "arrow-down-circle", color: Colors.success };
    case "dlocal_withdrawal":
      return { name: "arrow-up-circle", color: Colors.destructive };
    case "dlocal_withdrawal_refund":
      return { name: "refresh-circle", color: Colors.primary500 };
    default:
      return { name: "ellipse", color: Colors.foregroundMuted };
  }
}

function getStatusBadge(status: string): { label: string; color: string } {
  switch (status) {
    case "completed":
      return { label: "Completado", color: Colors.success };
    case "pending":
      return { label: "Pendiente", color: Colors.primary500 };
    case "failed":
      return { label: "Fallido", color: Colors.destructive };
    default:
      return { label: status, color: Colors.foregroundMuted };
  }
}

function formatDate(timestamp: any): string {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TransactionHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const typeFilter = useMemo(() => getTypeFilter(activeTab), [activeTab]);
  const { transactions, loading } = useTransactions(typeFilter);

  const renderItem = ({ item }: { item: Transaction }) => {
    const icon = getIcon(item.type);
    const badge = getStatusBadge(item.status);
    const isPositive = item.amount > 0;

    return (
      <View className="flex-row items-center p-4 bg-card rounded-xl mb-2">
        <Ionicons
          name={icon.name as any}
          size={28}
          color={icon.color}
        />
        <View className="flex-1 ml-3">
          <Text className="text-foreground font-medium" numberOfLines={1}>
            {item.description}
          </Text>
          <Text className="text-xs text-muted-foreground mt-1">
            {formatDate(item.createdAt)}
          </Text>
        </View>
        <View className="items-end">
          <Text
            className={`font-bold ${
              isPositive ? "text-success" : "text-destructive"
            }`}
          >
            {isPositive ? "+" : ""}
            {formatCents(Math.abs(item.amount))}
          </Text>
          <Text className="text-xs mt-1" style={{ color: badge.color }}>
            {badge.label}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </Pressable>
        <Text className="text-lg font-bold text-foreground ml-2">
          Historial de transacciones
        </Text>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row px-4 py-3 gap-2">
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full ${
              activeTab === tab.key ? "" : "bg-secondary"
            }`}
            style={
              activeTab === tab.key
                ? { backgroundColor: Colors.primary500 }
                : undefined
            }
          >
            <Text
              className={`font-medium text-sm ${
                activeTab === tab.key ? "text-white" : "text-foreground"
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Transaction List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary500} />
        </View>
      ) : transactions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons
            name="receipt-outline"
            size={48}
            color={Colors.foregroundMuted}
          />
          <Text className="text-muted-foreground mt-4 text-center">
            No hay transacciones todavía
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default TransactionHistoryScreen;
