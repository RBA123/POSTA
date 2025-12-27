import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

interface ConfettiAnimationProps {
  onComplete?: () => void;
}

const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({ onComplete }) => {
  const confettiRef = useRef<ConfettiCannon>(null);

  useEffect(() => {
    confettiRef.current?.start();
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ConfettiCannon
        ref={confettiRef}
        count={50}
        origin={{ x: 0, y: 0 }}
        fadeOut
        autoStart={false}
      />
    </View>
  );
};

export default ConfettiAnimation;

