import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';

type SelectionHighlightProps = {
  active: boolean;
  color?: string;
  borderRadius?: number;
  style?: ViewStyle;
  triggerKey?: string | number;
};

const SelectionHighlight: React.FC<SelectionHighlightProps> = ({
  active,
  color = '#3B82F6',
  borderRadius = 12,
  style,
  triggerKey,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      scale.setValue(0.92);
      opacity.setValue(0.25);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.04,
          damping: 12,
          stiffness: 180,
          mass: 0.6,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();
    }
  }, [active, triggerKey, opacity, scale]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.overlay,
        style,
        {
          borderColor: color,
          borderRadius,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderWidth: 2,
    opacity: 0,
  },
});

export default SelectionHighlight;
