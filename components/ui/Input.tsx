import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { cn } from '../../lib/utils';

export interface InputProps extends TextInputProps {
  label?: React.ReactNode;
  error?: string;
  className?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, className, containerClassName, ...props }, ref) => {
    return (
      <View className={cn('w-full', containerClassName)}>
        {label && (
          <View className="mb-2">
            {typeof label === 'string' ? (
              <Text className="text-sm font-medium text-foreground">{label}</Text>
            ) : (
              label
            )}
          </View>
        )}
        <TextInput
          ref={ref}
          className={cn(
            'h-12 px-4 rounded-xl border border-border bg-card text-foreground',
            error && 'border-destructive',
            className
          )}
          placeholderTextColor="#999"
          {...props}
        />
        {error && (
          <Text className="text-sm text-destructive mt-1">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

