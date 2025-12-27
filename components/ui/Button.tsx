import React from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { cn } from '../../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'flex-row items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary shadow-lg',
        destructive: 'bg-destructive',
        outline: 'border-2 border-primary bg-transparent',
        secondary: 'bg-secondary',
        ghost: 'bg-transparent',
        link: 'bg-transparent',
        success: 'bg-success',
        si: 'bg-success shadow-lg',
        no: 'bg-destructive shadow-lg',
        pill: 'bg-secondary rounded-full',
        pillActive: 'bg-primary rounded-full shadow-lg',
        hero: 'bg-primary shadow-lg',
      },
      size: {
        default: 'h-12 px-6',
        sm: 'h-10 px-4',
        lg: 'h-14 px-8',
        xl: 'h-16 px-10',
        icon: 'h-12 w-12',
        pill: 'h-9 px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
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
  ({ className, variant, size, children, onPress, disabled, loading, textClassName, ...props }, ref) => {
    const isGradient = variant === 'default' || variant === 'pillActive' || variant === 'hero';
    const textColor = variant === 'outline' || variant === 'ghost' || variant === 'link'
      ? 'text-primary'
      : variant === 'si' || variant === 'success'
      ? 'text-white'
      : variant === 'no' || variant === 'destructive'
      ? 'text-white'
      : variant === 'secondary' || variant === 'pill'
      ? 'text-secondary-foreground'
      : 'text-primary-foreground';

    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), disabled && 'opacity-50', className)}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#F97316' : '#FFFFFF'} />
        ) : (
          <>
            {typeof children === 'string' ? (
              <Text className={cn('font-semibold', textColor, textClassName)}>{children}</Text>
            ) : (
              <View className="flex-row items-center">{children}</View>
            )}
          </>
        )}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';

