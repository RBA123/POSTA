import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { cn } from "../../lib/utils";

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = React.forwardRef<View, CardProps>(
  ({ children, className, style, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(
          "bg-card rounded-[12px] p-5 border border-border",
          className
        )}
        style={[
          {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 3,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  }
);

Card.displayName = "Card";
