import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '../../lib/utils';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = React.forwardRef<View, CardProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn('bg-card rounded-[12px] p-5 shadow-lg border border-border', className)}
        {...props}
      >
        {children}
      </View>
    );
  }
);

Card.displayName = 'Card';

