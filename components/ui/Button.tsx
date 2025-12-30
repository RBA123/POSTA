import React from "react";
import { Pressable, Text, ActivityIndicator, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { cn } from "../../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "flex-row items-center justify-center gap-2 rounded-[12px] font-bold overflow-hidden",
  {
    variants: {
      variant: {
        default: "shadow-lg",
        destructive: "bg-destructive",
        outline: "border-2 border-primary bg-transparent",
        secondary: "bg-secondary",
        ghost: "bg-transparent",
        link: "bg-transparent",
        success: "bg-success",
        si: "bg-success shadow-lg",
        no: "bg-destructive shadow-lg",
        pill: "bg-secondary rounded-full",
        pillActive: "rounded-full shadow-lg",
        hero: "shadow-lg",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-10 px-4",
        lg: "h-14 px-8",
        xl: "h-16 px-10",
        icon: "h-12 w-12",
        pill: "h-9 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

export const Button = React.forwardRef<any, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      children,
      onPress,
      disabled,
      loading,
      textClassName,
      ...props
    },
    ref
  ) => {
    const isGradient =
      variant === "default" || variant === "pillActive" || variant === "hero";
    const textColor =
      variant === "outline" || variant === "ghost" || variant === "link"
        ? "text-primary"
        : variant === "si" || variant === "success"
        ? "text-white"
        : variant === "no" || variant === "destructive"
        ? "text-white"
        : variant === "secondary" || variant === "pill"
        ? "text-secondary-foreground"
        : "text-primary-foreground";

    const textSizeClass =
      size === "xl"
        ? "text-xl"
        : size === "lg"
        ? "text-lg"
        : size === "sm"
        ? "text-sm"
        : "text-base";

    const buttonContent = (
      <>
        {loading ? (
          <ActivityIndicator
            color={
              variant === "outline" || variant === "ghost"
                ? "#F97316"
                : "#FFFFFF"
            }
          />
        ) : (
          <>
            {typeof children === "string" ? (
              <Text
                className={cn(
                  "font-bold",
                  textSizeClass,
                  textColor,
                  textClassName
                )}
              >
                {children}
              </Text>
            ) : (
              <View className="flex-row items-center gap-2">
                {React.Children.map(children, (child) => {
                  if (typeof child === "string") {
                    return (
                      <Text
                        className={cn(
                          "font-bold",
                          textSizeClass,
                          textColor,
                          textClassName
                        )}
                      >
                        {child}
                      </Text>
                    );
                  }
                  if (React.isValidElement(child) && child.type === Text) {
                    const textChild = child as React.ReactElement<{
                      className?: string;
                    }>;
                    return React.cloneElement(textChild, {
                      className: cn(
                        textChild.props.className,
                        textSizeClass,
                        "font-bold"
                      ),
                    });
                  }
                  return child;
                })}
              </View>
            )}
          </>
        )}
      </>
    );

    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        disabled={disabled || loading}
        className={cn(
          buttonVariants({ variant, size }),
          disabled && "opacity-50",
          className
        )}
        style={{ borderRadius: 12 }}
        {...props}
      >
        {isGradient ? (
          <LinearGradient
            colors={["#FF9F5A", "#F97316"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              borderRadius: 12,
            }}
          />
        ) : null}
        {buttonContent}
      </Pressable>
    );
  }
);

Button.displayName = "Button";
