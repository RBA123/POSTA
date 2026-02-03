import React from "react";
import { View, ScrollView } from "react-native";
import { Button } from "./ui/Button";

interface FilterOption<T> {
  id: T;
  label: string;
}

interface CategoryFilterProps<T> {
  options: FilterOption<T>[];
  activeFilter: T;
  onFilterChange: (filter: T) => void;
}

function CategoryFilter<T extends string | undefined>({
  options,
  activeFilter,
  onFilterChange,
}: CategoryFilterProps<T>) {
  return (
    <View className="py-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={true}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 0 }}
      >
        <View className="flex-row gap-2">
          {options.map((option) => {
            const isActive = activeFilter === option.id;
            return (
              <Button
                key={String(option.id)}
                variant={isActive ? "pillActive" : "pill"}
                size="pill"
                onPress={() => onFilterChange(option.id)}
              >
                {option.label}
              </Button>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default CategoryFilter;
